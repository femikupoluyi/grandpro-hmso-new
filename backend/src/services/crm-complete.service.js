// Complete CRM & Relationship Management Service
const { pool } = require('../config/database');
const crypto = require('crypto');
const { format, addDays, startOfMonth, endOfMonth } = require('date-fns');

class CRMCompleteService {
  // ==================== OWNER CRM ====================
  
  // Create or update owner profile
  async upsertOwnerProfile(ownerData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if owner exists
      const checkQuery = `
        SELECT id FROM hospital_owners 
        WHERE email = $1 OR (first_name = $2 AND last_name = $3)
      `;
      const checkResult = await client.query(checkQuery, [
        ownerData.email,
        ownerData.first_name,
        ownerData.last_name
      ]);
      
      let ownerId;
      
      if (checkResult.rows.length > 0) {
        // Update existing owner
        ownerId = checkResult.rows[0].id;
        const updateQuery = `
          UPDATE hospital_owners SET
            phone = $1,
            hospital_ids = $2,
            contract_ids = $3,
            total_revenue = COALESCE(total_revenue, 0) + $4,
            updated_at = NOW()
          WHERE id = $5
          RETURNING *
        `;
        
        const result = await client.query(updateQuery, [
          ownerData.phone,
          JSON.stringify(ownerData.hospital_ids || []),
          JSON.stringify(ownerData.contract_ids || []),
          ownerData.revenue_addition || 0,
          ownerId
        ]);
        
        await client.query('COMMIT');
        return { success: true, data: result.rows[0], action: 'updated' };
      } else {
        // Create new owner
        const insertQuery = `
          INSERT INTO hospital_owners (
            first_name, last_name, email, phone,
            hospital_ids, contract_ids, total_revenue,
            status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          RETURNING *
        `;
        
        const result = await client.query(insertQuery, [
          ownerData.first_name,
          ownerData.last_name,
          ownerData.email,
          ownerData.phone,
          JSON.stringify(ownerData.hospital_ids || []),
          JSON.stringify(ownerData.contract_ids || []),
          ownerData.total_revenue || 0,
          'active'
        ]);
        
        await client.query('COMMIT');
        return { success: true, data: result.rows[0], action: 'created' };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Track owner payouts
  async recordPayout(payoutData) {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO owner_payouts (
          owner_id, hospital_id, amount, currency,
          payment_method, reference_number, period_start,
          period_end, status, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;
      
      const values = [
        payoutData.owner_id,
        payoutData.hospital_id,
        payoutData.amount,
        payoutData.currency || 'NGN',
        payoutData.payment_method || 'bank_transfer',
        `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        payoutData.period_start,
        payoutData.period_end,
        payoutData.status || 'pending',
        payoutData.status === 'completed' ? new Date() : null
      ];
      
      const result = await client.query(query, values);
      
      // Update owner's total payouts
      await client.query(
        `UPDATE hospital_owners 
         SET total_payouts = COALESCE(total_payouts, 0) + $1,
             last_payout_date = NOW()
         WHERE id = $2`,
        [payoutData.amount, payoutData.owner_id]
      );
      
      return { success: true, data: result.rows[0] };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Get owner analytics
  async getOwnerAnalytics(ownerId, period = '30days') {
    const client = await pool.connect();
    
    try {
      // Calculate date range
      let startDate, endDate = new Date();
      switch(period) {
        case '7days':
          startDate = addDays(endDate, -7);
          break;
        case '30days':
          startDate = addDays(endDate, -30);
          break;
        case 'month':
          startDate = startOfMonth(endDate);
          endDate = endOfMonth(endDate);
          break;
        case '90days':
          startDate = addDays(endDate, -90);
          break;
        default:
          startDate = addDays(endDate, -30);
      }
      
      // Get payout analytics
      const payoutQuery = `
        SELECT 
          COUNT(*) as total_payouts,
          SUM(amount) as total_amount,
          AVG(amount) as average_payout,
          MAX(amount) as highest_payout,
          MIN(amount) as lowest_payout
        FROM owner_payouts
        WHERE owner_id = $1 
          AND processed_at BETWEEN $2 AND $3
          AND status = 'completed'
      `;
      
      const payoutResult = await client.query(payoutQuery, [ownerId, startDate, endDate]);
      
      // Get contract performance
      const contractQuery = `
        SELECT 
          COUNT(*) as total_contracts,
          SUM(value) as total_contract_value,
          AVG(commission_rate) as avg_commission_rate
        FROM contracts
        WHERE JSON_CONTAINS(
          (SELECT contract_ids FROM hospital_owners WHERE id = $1),
          CAST(contract_id AS JSON)
        )
      `;
      
      // For PostgreSQL, we need a different approach
      const contractQueryPg = `
        SELECT 
          COUNT(*) as total_contracts,
          SUM(value) as total_contract_value,
          AVG(commission_rate) as avg_commission_rate
        FROM contracts c
        WHERE EXISTS (
          SELECT 1 FROM hospital_owners ho
          WHERE ho.id = $1
          AND c.contract_id = ANY(
            SELECT jsonb_array_elements_text(ho.contract_ids::jsonb)
          )
        )
      `;
      
      const contractResult = await client.query(contractQueryPg, [ownerId]);
      
      // Get hospital performance
      const hospitalQuery = `
        SELECT 
          h.name as hospital_name,
          h.bed_capacity,
          h.staff_count,
          h.status,
          COUNT(p.id) as total_patients
        FROM hospitals h
        LEFT JOIN patients p ON p.hospital_id = h.id
        WHERE EXISTS (
          SELECT 1 FROM hospital_owners ho
          WHERE ho.id = $1
          AND h.id::text = ANY(
            SELECT jsonb_array_elements_text(ho.hospital_ids::jsonb)
          )
        )
        GROUP BY h.id, h.name, h.bed_capacity, h.staff_count, h.status
      `;
      
      const hospitalResult = await client.query(hospitalQuery, [ownerId]);
      
      return {
        success: true,
        data: {
          period,
          dateRange: { start: startDate, end: endDate },
          payouts: payoutResult.rows[0],
          contracts: contractResult.rows[0],
          hospitals: hospitalResult.rows,
          summary: {
            totalRevenue: payoutResult.rows[0].total_amount || 0,
            activeHospitals: hospitalResult.rows.filter(h => h.status === 'active').length,
            totalPatients: hospitalResult.rows.reduce((sum, h) => sum + parseInt(h.total_patients), 0)
          }
        }
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ==================== PATIENT CRM ====================
  
  // Register or update patient
  async upsertPatient(patientData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate patient ID if not provided
      const patientId = patientData.patient_id || `PAT${new Date().getFullYear()}${String(Date.now()).slice(-6)}`;
      
      // Check if patient exists
      const checkQuery = `
        SELECT id FROM patients 
        WHERE patient_id = $1 OR (email = $2 AND email IS NOT NULL)
      `;
      const checkResult = await client.query(checkQuery, [patientId, patientData.email]);
      
      let result;
      
      if (checkResult.rows.length > 0) {
        // Update existing patient
        const updateQuery = `
          UPDATE patients SET
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            phone = COALESCE($3, phone),
            date_of_birth = COALESCE($4, date_of_birth),
            gender = COALESCE($5, gender),
            blood_group = COALESCE($6, blood_group),
            address = COALESCE($7, address),
            emergency_contact = COALESCE($8, emergency_contact),
            medical_history = COALESCE($9, medical_history),
            updated_at = NOW()
          WHERE id = $10
          RETURNING *
        `;
        
        result = await client.query(updateQuery, [
          patientData.first_name,
          patientData.last_name,
          patientData.phone,
          patientData.date_of_birth,
          patientData.gender,
          patientData.blood_group,
          patientData.address,
          JSON.stringify(patientData.emergency_contact || {}),
          JSON.stringify(patientData.medical_history || []),
          checkResult.rows[0].id
        ]);
      } else {
        // Create new patient
        const insertQuery = `
          INSERT INTO patients (
            patient_id, hospital_id, first_name, last_name,
            email, phone, date_of_birth, gender, blood_group,
            address, emergency_contact, medical_history,
            loyalty_points, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
          RETURNING *
        `;
        
        result = await client.query(insertQuery, [
          patientId,
          patientData.hospital_id,
          patientData.first_name,
          patientData.last_name,
          patientData.email,
          patientData.phone,
          patientData.date_of_birth,
          patientData.gender,
          patientData.blood_group,
          patientData.address,
          JSON.stringify(patientData.emergency_contact || {}),
          JSON.stringify(patientData.medical_history || []),
          0, // Initial loyalty points
          'active'
        ]);
      }
      
      await client.query('COMMIT');
      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Schedule appointment
  async scheduleAppointment(appointmentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const appointmentId = `APT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      const query = `
        INSERT INTO appointments (
          appointment_id, patient_id, doctor_id, hospital_id,
          appointment_date, appointment_time, department,
          reason, status, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *
      `;
      
      const values = [
        appointmentId,
        appointmentData.patient_id,
        appointmentData.doctor_id,
        appointmentData.hospital_id,
        appointmentData.appointment_date,
        appointmentData.appointment_time,
        appointmentData.department,
        appointmentData.reason,
        appointmentData.status || 'scheduled',
        appointmentData.notes
      ];
      
      const result = await client.query(query, values);
      
      // Send reminder (would integrate with SMS/Email service)
      await this.createReminder({
        patient_id: appointmentData.patient_id,
        appointment_id: appointmentId,
        reminder_date: addDays(new Date(appointmentData.appointment_date), -1),
        type: 'appointment'
      }, client);
      
      await client.query('COMMIT');
      return { success: true, data: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Create reminder
  async createReminder(reminderData, client = null) {
    const shouldRelease = !client;
    if (!client) client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO reminders (
          patient_id, appointment_id, reminder_date,
          reminder_time, type, message, status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;
      
      const values = [
        reminderData.patient_id,
        reminderData.appointment_id,
        reminderData.reminder_date,
        reminderData.reminder_time || '09:00',
        reminderData.type,
        reminderData.message || this.generateReminderMessage(reminderData.type),
        'pending'
      ];
      
      const result = await client.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      throw error;
    } finally {
      if (shouldRelease) client.release();
    }
  }
  
  // Submit patient feedback
  async submitFeedback(feedbackData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const feedbackId = `FB-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      const query = `
        INSERT INTO feedback (
          feedback_id, patient_id, hospital_id,
          appointment_id, rating, category,
          comments, suggestions, would_recommend,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;
      
      const values = [
        feedbackId,
        feedbackData.patient_id,
        feedbackData.hospital_id,
        feedbackData.appointment_id,
        feedbackData.rating,
        feedbackData.category || 'general',
        feedbackData.comments,
        feedbackData.suggestions,
        feedbackData.would_recommend !== false
      ];
      
      const result = await client.query(query, values);
      
      // Award loyalty points for feedback
      const pointsToAward = feedbackData.rating >= 4 ? 50 : 25;
      await this.awardLoyaltyPoints(
        feedbackData.patient_id,
        pointsToAward,
        'feedback_submission',
        client
      );
      
      // Update hospital rating
      await this.updateHospitalRating(feedbackData.hospital_id, client);
      
      await client.query('COMMIT');
      return { 
        success: true, 
        data: result.rows[0],
        loyaltyPointsAwarded: pointsToAward
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Manage loyalty program
  async awardLoyaltyPoints(patientId, points, reason, client = null) {
    const shouldRelease = !client;
    if (!client) client = await pool.connect();
    
    try {
      // Update patient points
      await client.query(
        `UPDATE patients 
         SET loyalty_points = COALESCE(loyalty_points, 0) + $1
         WHERE id = $2`,
        [points, patientId]
      );
      
      // Record transaction
      const transactionQuery = `
        INSERT INTO loyalty_transactions (
          patient_id, points, transaction_type,
          reason, created_at
        ) VALUES ($1, $2, $3, $4, NOW())
      `;
      
      await client.query(transactionQuery, [
        patientId,
        points,
        'earned',
        reason
      ]);
      
      return { success: true, pointsAwarded: points };
    } catch (error) {
      throw error;
    } finally {
      if (shouldRelease) client.release();
    }
  }
  
  // Redeem loyalty points
  async redeemLoyaltyPoints(patientId, rewardId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get reward details
      const rewardQuery = `
        SELECT * FROM loyalty_rewards WHERE id = $1 AND is_active = true
      `;
      const rewardResult = await client.query(rewardQuery, [rewardId]);
      
      if (rewardResult.rows.length === 0) {
        throw new Error('Reward not found or inactive');
      }
      
      const reward = rewardResult.rows[0];
      
      // Check patient points
      const patientQuery = `
        SELECT loyalty_points FROM patients WHERE id = $1
      `;
      const patientResult = await client.query(patientQuery, [patientId]);
      
      if (patientResult.rows[0].loyalty_points < reward.points_required) {
        throw new Error('Insufficient loyalty points');
      }
      
      // Deduct points
      await client.query(
        `UPDATE patients 
         SET loyalty_points = loyalty_points - $1
         WHERE id = $2`,
        [reward.points_required, patientId]
      );
      
      // Record redemption
      const redemptionQuery = `
        INSERT INTO loyalty_transactions (
          patient_id, points, transaction_type,
          reason, reward_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      
      const result = await client.query(redemptionQuery, [
        patientId,
        -reward.points_required,
        'redeemed',
        `Redeemed: ${reward.name}`,
        rewardId
      ]);
      
      await client.query('COMMIT');
      return { 
        success: true, 
        data: result.rows[0],
        reward: reward
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // ==================== COMMUNICATION CAMPAIGNS ====================
  
  // Create communication campaign
  async createCampaign(campaignData) {
    const client = await pool.connect();
    
    try {
      const campaignId = `CAMP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      const query = `
        INSERT INTO communication_campaigns (
          campaign_id, name, type, target_audience,
          message_template, channels, schedule_type,
          scheduled_date, status, created_by,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *
      `;
      
      const values = [
        campaignId,
        campaignData.name,
        campaignData.type, // 'promotional', 'health_tips', 'appointment_reminder', 'follow_up'
        JSON.stringify(campaignData.target_audience || {}),
        campaignData.message_template,
        JSON.stringify(campaignData.channels || ['sms']), // ['sms', 'email', 'whatsapp']
        campaignData.schedule_type || 'immediate',
        campaignData.scheduled_date,
        'draft',
        campaignData.created_by
      ];
      
      const result = await client.query(query, values);
      return { success: true, data: result.rows[0] };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Send campaign
  async sendCampaign(campaignId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get campaign details
      const campaignQuery = `
        SELECT * FROM communication_campaigns WHERE campaign_id = $1
      `;
      const campaignResult = await client.query(campaignQuery, [campaignId]);
      
      if (campaignResult.rows.length === 0) {
        throw new Error('Campaign not found');
      }
      
      const campaign = campaignResult.rows[0];
      const targetAudience = JSON.parse(campaign.target_audience);
      
      // Get recipients based on target audience
      let recipientQuery = `SELECT id, first_name, last_name, email, phone FROM `;
      let recipients = [];
      
      if (targetAudience.type === 'patients') {
        recipientQuery += `patients WHERE status = 'active'`;
        if (targetAudience.filters) {
          // Add filters (age, gender, location, etc.)
          if (targetAudience.filters.minAge) {
            recipientQuery += ` AND DATE_PART('year', AGE(date_of_birth)) >= ${targetAudience.filters.minAge}`;
          }
          if (targetAudience.filters.gender) {
            recipientQuery += ` AND gender = '${targetAudience.filters.gender}'`;
          }
        }
      } else if (targetAudience.type === 'owners') {
        recipientQuery += `hospital_owners WHERE status = 'active'`;
      }
      
      const recipientResult = await client.query(recipientQuery);
      recipients = recipientResult.rows;
      
      // Queue messages for each recipient
      const channels = JSON.parse(campaign.channels);
      let sentCount = 0;
      let failedCount = 0;
      
      for (const recipient of recipients) {
        for (const channel of channels) {
          try {
            const messageData = {
              campaign_id: campaignId,
              recipient_id: recipient.id,
              recipient_type: targetAudience.type,
              channel,
              message: this.personalizeMessage(campaign.message_template, recipient),
              status: 'queued'
            };
            
            await this.queueMessage(messageData, client);
            sentCount++;
          } catch (error) {
            failedCount++;
            console.error(`Failed to queue message for ${recipient.id}:`, error);
          }
        }
      }
      
      // Update campaign status
      await client.query(
        `UPDATE communication_campaigns 
         SET status = 'sent', 
             sent_at = NOW(),
             recipients_count = $1,
             sent_count = $2,
             failed_count = $3
         WHERE campaign_id = $4`,
        [recipients.length, sentCount, failedCount, campaignId]
      );
      
      await client.query('COMMIT');
      return { 
        success: true, 
        recipientsCount: recipients.length,
        sentCount,
        failedCount
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Queue message for sending
  async queueMessage(messageData, client = null) {
    const shouldRelease = !client;
    if (!client) client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO message_queue (
          campaign_id, recipient_id, recipient_type,
          channel, message, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *
      `;
      
      const values = [
        messageData.campaign_id,
        messageData.recipient_id,
        messageData.recipient_type,
        messageData.channel,
        messageData.message,
        messageData.status || 'queued'
      ];
      
      const result = await client.query(query, values);
      
      // In production, this would trigger actual sending via SMS/Email/WhatsApp API
      // For now, we'll just mark it as sent after a delay
      setTimeout(async () => {
        try {
          await pool.query(
            `UPDATE message_queue SET status = 'sent', sent_at = NOW() WHERE id = $1`,
            [result.rows[0].id]
          );
        } catch (error) {
          console.error('Error updating message status:', error);
        }
      }, 1000);
      
      return result.rows[0];
    } catch (error) {
      throw error;
    } finally {
      if (shouldRelease) client.release();
    }
  }
  
  // ==================== HELPER METHODS ====================
  
  generateReminderMessage(type) {
    const messages = {
      appointment: 'You have an appointment tomorrow. Please arrive 15 minutes early.',
      medication: 'Remember to take your medication as prescribed.',
      follow_up: 'It\'s time for your follow-up visit. Please schedule an appointment.',
      test_results: 'Your test results are ready. Please visit the hospital to collect them.'
    };
    return messages[type] || 'You have a reminder from your healthcare provider.';
  }
  
  personalizeMessage(template, recipient) {
    let message = template;
    message = message.replace('{first_name}', recipient.first_name || '');
    message = message.replace('{last_name}', recipient.last_name || '');
    message = message.replace('{full_name}', `${recipient.first_name} ${recipient.last_name}`.trim());
    return message;
  }
  
  async updateHospitalRating(hospitalId, client) {
    try {
      const ratingQuery = `
        SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
        FROM feedback
        WHERE hospital_id = $1
      `;
      const result = await client.query(ratingQuery, [hospitalId]);
      
      await client.query(
        `UPDATE hospitals 
         SET average_rating = $1, total_reviews = $2
         WHERE id = $3`,
        [
          result.rows[0].avg_rating,
          result.rows[0].total_reviews,
          hospitalId
        ]
      );
    } catch (error) {
      console.error('Error updating hospital rating:', error);
    }
  }
  
  // Get CRM Dashboard Statistics
  async getCRMDashboard() {
    const client = await pool.connect();
    
    try {
      // Owner statistics
      const ownerStats = await client.query(`
        SELECT 
          COUNT(*) as total_owners,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_owners,
          SUM(total_revenue) as total_revenue,
          SUM(total_payouts) as total_payouts
        FROM hospital_owners
      `);
      
      // Patient statistics
      const patientStats = await client.query(`
        SELECT 
          COUNT(*) as total_patients,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
          AVG(loyalty_points) as avg_loyalty_points
        FROM patients
      `);
      
      // Appointment statistics
      const appointmentStats = await client.query(`
        SELECT 
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled
        FROM appointments
        WHERE appointment_date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      
      // Campaign statistics
      const campaignStats = await client.query(`
        SELECT 
          COUNT(*) as total_campaigns,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_campaigns,
          SUM(recipients_count) as total_recipients,
          SUM(sent_count) as total_messages_sent
        FROM communication_campaigns
      `);
      
      // Feedback statistics
      const feedbackStats = await client.query(`
        SELECT 
          COUNT(*) as total_feedback,
          AVG(rating) as avg_rating,
          COUNT(CASE WHEN rating >= 4 THEN 1 END) as positive_feedback,
          COUNT(CASE WHEN would_recommend = true THEN 1 END) as would_recommend
        FROM feedback
      `);
      
      return {
        success: true,
        data: {
          owners: ownerStats.rows[0],
          patients: patientStats.rows[0],
          appointments: appointmentStats.rows[0],
          campaigns: campaignStats.rows[0],
          feedback: feedbackStats.rows[0],
          summary: {
            totalEngagement: parseInt(appointmentStats.rows[0].total_appointments) + 
                           parseInt(feedbackStats.rows[0].total_feedback),
            satisfactionScore: parseFloat(feedbackStats.rows[0].avg_rating || 0).toFixed(2),
            revenueGenerated: ownerStats.rows[0].total_revenue || 0,
            activeUsers: parseInt(ownerStats.rows[0].active_owners) + 
                        parseInt(patientStats.rows[0].active_patients)
          }
        }
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new CRMCompleteService();

const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, subDays, startOfWeek, endOfWeek } = require('date-fns');
const communicationService = require('./communication.service');

class EnhancedCRMService {
  /**
   * Owner CRM - Contract Management
   */
  async createOwnerContract(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const contractId = uuidv4();
      const {
        hospitalId,
        ownerId,
        contractType,
        startDate,
        endDate,
        terms,
        revenueShare,
        minimumGuarantee,
        paymentTerms,
        performanceMetrics
      } = data;

      // Create contract
      const contractResult = await client.query(
        `INSERT INTO owner_contracts (
          id, hospital_id, owner_id, contract_type,
          start_date, end_date, terms, revenue_share_percentage,
          minimum_guarantee_amount, payment_terms,
          performance_metrics, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          contractId, hospitalId, ownerId, contractType,
          startDate, endDate, terms, revenueShare,
          minimumGuarantee, paymentTerms,
          JSON.stringify(performanceMetrics), 'active'
        ]
      );

      // Create contract milestones
      const milestones = [
        { name: 'Contract Signed', dueDate: startDate, status: 'completed' },
        { name: 'First Quarter Review', dueDate: addDays(new Date(startDate), 90), status: 'pending' },
        { name: 'Mid-Term Review', dueDate: addDays(new Date(startDate), 180), status: 'pending' },
        { name: 'Annual Review', dueDate: addDays(new Date(startDate), 365), status: 'pending' }
      ];

      for (const milestone of milestones) {
        await client.query(
          `INSERT INTO contract_milestones (
            contract_id, milestone_name, due_date, status
          ) VALUES ($1, $2, $3, $4)`,
          [contractId, milestone.name, milestone.dueDate, milestone.status]
        );
      }

      await client.query('COMMIT');
      return contractResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Owner CRM - Payout Management
   */
  async processOwnerPayout(ownerId, period) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calculate revenue for the period
      const revenueResult = await client.query(
        `SELECT 
          SUM(amount) as total_revenue,
          COUNT(DISTINCT patient_id) as patient_count,
          COUNT(*) as transaction_count
        FROM billing_transactions
        WHERE hospital_id = (
          SELECT hospital_id FROM hospital_owners WHERE id = $1
        )
        AND created_at >= $2
        AND created_at <= $3
        AND status = 'completed'`,
        [ownerId, period.start, period.end]
      );

      const revenue = revenueResult.rows[0];

      // Get contract terms
      const contractResult = await client.query(
        `SELECT revenue_share_percentage, minimum_guarantee_amount
        FROM owner_contracts
        WHERE owner_id = $1 AND status = 'active'
        ORDER BY created_at DESC LIMIT 1`,
        [ownerId]
      );

      if (contractResult.rows.length === 0) {
        throw new Error('No active contract found');
      }

      const contract = contractResult.rows[0];
      
      // Calculate payout
      const grossRevenue = parseFloat(revenue.total_revenue || 0);
      const sharePercentage = parseFloat(contract.revenue_share_percentage);
      const calculatedPayout = grossRevenue * (sharePercentage / 100);
      const minimumGuarantee = parseFloat(contract.minimum_guarantee_amount || 0);
      const finalPayout = Math.max(calculatedPayout, minimumGuarantee);

      // Create payout record
      const payoutId = uuidv4();
      const payoutResult = await client.query(
        `INSERT INTO owner_payouts (
          id, owner_id, period_start, period_end,
          gross_revenue, revenue_share_percentage, calculated_amount,
          minimum_guarantee, final_amount, patient_count,
          transaction_count, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          payoutId, ownerId, period.start, period.end,
          grossRevenue, sharePercentage, calculatedPayout,
          minimumGuarantee, finalPayout, revenue.patient_count,
          revenue.transaction_count, 'pending'
        ]
      );

      // Create payout approval workflow
      await client.query(
        `INSERT INTO payout_approvals (
          payout_id, approver_role, status, created_at
        ) VALUES ($1, $2, $3, NOW())`,
        [payoutId, 'finance_manager', 'pending']
      );

      await client.query('COMMIT');
      return payoutResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Owner CRM - Communication Tracking
   */
  async logOwnerCommunication(data) {
    const {
      ownerId,
      communicationType,
      subject,
      message,
      channel,
      attachments
    } = data;

    try {
      const result = await pool.query(
        `INSERT INTO owner_communications (
          id, owner_id, communication_type, subject,
          message, channel, attachments, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *`,
        [
          uuidv4(), ownerId, communicationType, subject,
          message, channel, JSON.stringify(attachments), 'sent'
        ]
      );

      // Send actual communication
      if (channel === 'email') {
        await communicationService.sendEmail({
          to: data.ownerEmail,
          subject,
          body: message,
          attachments
        });
      } else if (channel === 'whatsapp') {
        await communicationService.sendWhatsApp({
          to: data.ownerPhone,
          message
        });
      }

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Owner CRM - Satisfaction Tracking
   */
  async recordOwnerSatisfaction(ownerId, data) {
    const {
      rating,
      category,
      feedback,
      improvements,
      wouldRecommend
    } = data;

    try {
      const result = await pool.query(
        `INSERT INTO owner_satisfaction (
          id, owner_id, rating, category, feedback,
          improvements, would_recommend, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *`,
        [
          uuidv4(), ownerId, rating, category,
          feedback, improvements, wouldRecommend
        ]
      );

      // Update average satisfaction score
      await pool.query(
        `UPDATE hospital_owners 
        SET satisfaction_score = (
          SELECT AVG(rating) FROM owner_satisfaction 
          WHERE owner_id = $1
        )
        WHERE id = $1`,
        [ownerId]
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Patient CRM - Appointment Management Enhanced
   */
  async scheduleAppointment(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const appointmentId = uuidv4();
      const {
        patientId,
        hospitalId,
        departmentId,
        doctorId,
        appointmentDate,
        appointmentTime,
        appointmentType,
        reason,
        notes
      } = data;

      // Check doctor availability
      const availabilityCheck = await client.query(
        `SELECT COUNT(*) as conflicts
        FROM patient_appointments
        WHERE doctor_id = $1
        AND appointment_date = $2
        AND appointment_time = $3
        AND status NOT IN ('cancelled', 'no_show')`,
        [doctorId, appointmentDate, appointmentTime]
      );

      if (availabilityCheck.rows[0].conflicts > 0) {
        throw new Error('Doctor not available at this time');
      }

      // Create appointment
      const appointmentResult = await client.query(
        `INSERT INTO patient_appointments (
          id, patient_id, hospital_id, department_id,
          doctor_id, appointment_date, appointment_time,
          appointment_type, reason, notes, status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *`,
        [
          appointmentId, patientId, hospitalId, departmentId,
          doctorId, appointmentDate, appointmentTime,
          appointmentType, reason, notes, 'scheduled'
        ]
      );

      // Create reminder schedule
      const reminderTimes = [
        { days: 7, type: 'week_before' },
        { days: 1, type: 'day_before' },
        { hours: 2, type: 'two_hours_before' }
      ];

      for (const reminder of reminderTimes) {
        let reminderDate;
        if (reminder.days) {
          reminderDate = subDays(new Date(`${appointmentDate} ${appointmentTime}`), reminder.days);
        } else {
          reminderDate = new Date(`${appointmentDate} ${appointmentTime}`);
          reminderDate.setHours(reminderDate.getHours() - reminder.hours);
        }

        await client.query(
          `INSERT INTO appointment_reminders (
            appointment_id, reminder_type, scheduled_time, status
          ) VALUES ($1, $2, $3, $4)`,
          [appointmentId, reminder.type, reminderDate, 'pending']
        );
      }

      await client.query('COMMIT');
      return appointmentResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Patient CRM - Feedback Management
   */
  async collectPatientFeedback(data) {
    const {
      patientId,
      hospitalId,
      visitId,
      rating,
      categories,
      feedback,
      wouldRecommend,
      improvements
    } = data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const feedbackId = uuidv4();

      // Store feedback
      const feedbackResult = await client.query(
        `INSERT INTO patient_feedback (
          id, patient_id, hospital_id, visit_id,
          overall_rating, category_ratings, feedback_text,
          would_recommend, suggested_improvements,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *`,
        [
          feedbackId, patientId, hospitalId, visitId,
          rating, JSON.stringify(categories), feedback,
          wouldRecommend, improvements, 'new'
        ]
      );

      // Calculate NPS score
      await this.updateNPSScore(hospitalId);

      // Award loyalty points for feedback
      const pointsAwarded = 50;
      await this.awardLoyaltyPoints(patientId, pointsAwarded, 'feedback_submitted');

      // If rating is low, create alert
      if (rating <= 2) {
        await client.query(
          `INSERT INTO feedback_alerts (
            feedback_id, alert_type, priority, assigned_to, status
          ) VALUES ($1, $2, $3, $4, $5)`,
          [feedbackId, 'low_rating', 'high', 'service_manager', 'open']
        );
      }

      await client.query('COMMIT');
      return feedbackResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Patient CRM - Loyalty Program
   */
  async awardLoyaltyPoints(patientId, points, reason) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Add points transaction
      await client.query(
        `INSERT INTO loyalty_transactions (
          id, patient_id, points, transaction_type,
          reason, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [uuidv4(), patientId, points, 'earned', reason]
      );

      // Update patient's total points
      await client.query(
        `UPDATE patient_profiles
        SET loyalty_points = loyalty_points + $1,
            lifetime_points = lifetime_points + $1
        WHERE patient_id = $2`,
        [points, patientId]
      );

      // Check for tier upgrade
      const patientResult = await client.query(
        `SELECT loyalty_points, loyalty_tier FROM patient_profiles
        WHERE patient_id = $1`,
        [patientId]
      );

      const patient = patientResult.rows[0];
      const newTier = this.calculateLoyaltyTier(patient.loyalty_points);

      if (newTier !== patient.loyalty_tier) {
        await client.query(
          `UPDATE patient_profiles
          SET loyalty_tier = $1
          WHERE patient_id = $2`,
          [newTier, patientId]
        );

        // Send tier upgrade notification
        await this.sendTierUpgradeNotification(patientId, newTier);
      }

      await client.query('COMMIT');
      return { points, newTier };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Patient CRM - Loyalty Rewards Redemption
   */
  async redeemLoyaltyReward(patientId, rewardId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get reward details
      const rewardResult = await client.query(
        `SELECT * FROM loyalty_rewards WHERE id = $1`,
        [rewardId]
      );

      if (rewardResult.rows.length === 0) {
        throw new Error('Reward not found');
      }

      const reward = rewardResult.rows[0];

      // Check patient points
      const patientResult = await client.query(
        `SELECT loyalty_points, loyalty_tier FROM patient_profiles
        WHERE patient_id = $1`,
        [patientId]
      );

      const patient = patientResult.rows[0];

      if (patient.loyalty_points < reward.points_required) {
        throw new Error('Insufficient loyalty points');
      }

      // Check tier requirement
      if (reward.tier_required && patient.loyalty_tier < reward.tier_required) {
        throw new Error('Higher tier required for this reward');
      }

      // Process redemption
      const redemptionId = uuidv4();
      await client.query(
        `INSERT INTO loyalty_redemptions (
          id, patient_id, reward_id, points_used,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [redemptionId, patientId, rewardId, reward.points_required, 'processing']
      );

      // Deduct points
      await client.query(
        `UPDATE patient_profiles
        SET loyalty_points = loyalty_points - $1
        WHERE patient_id = $2`,
        [reward.points_required, patientId]
      );

      // Add points transaction
      await client.query(
        `INSERT INTO loyalty_transactions (
          id, patient_id, points, transaction_type,
          reason, reference_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          uuidv4(), patientId, -reward.points_required,
          'redeemed', `Redeemed: ${reward.reward_name}`, redemptionId
        ]
      );

      await client.query('COMMIT');
      return { redemptionId, reward };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Communication Campaign Management
   */
  async createCommunicationCampaign(data) {
    const {
      name,
      targetAudience,
      channels,
      message,
      scheduledDate,
      recurrence
    } = data;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const campaignId = uuidv4();

      // Create campaign
      const campaignResult = await client.query(
        `INSERT INTO communication_campaigns (
          id, name, target_audience, channels,
          message_template, scheduled_date, recurrence,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *`,
        [
          campaignId, name, targetAudience, JSON.stringify(channels),
          message, scheduledDate, recurrence, 'draft'
        ]
      );

      // Build recipient list based on target audience
      let recipientQuery = '';
      let recipientParams = [];

      switch (targetAudience) {
        case 'all_patients':
          recipientQuery = `
            SELECT patient_id, email, phone, communication_preferences
            FROM patient_profiles
            WHERE is_active = true`;
          break;
        
        case 'high_value_patients':
          recipientQuery = `
            SELECT patient_id, email, phone, communication_preferences
            FROM patient_profiles
            WHERE loyalty_tier IN ('gold', 'platinum')
            AND is_active = true`;
          break;
        
        case 'inactive_patients':
          recipientQuery = `
            SELECT p.patient_id, p.email, p.phone, p.communication_preferences
            FROM patient_profiles p
            WHERE NOT EXISTS (
              SELECT 1 FROM patient_appointments a
              WHERE a.patient_id = p.patient_id
              AND a.appointment_date > NOW() - INTERVAL '90 days'
            )
            AND p.is_active = true`;
          break;
        
        case 'all_owners':
          recipientQuery = `
            SELECT owner_id, email, phone, communication_preferences
            FROM hospital_owners
            WHERE is_active = true`;
          break;
      }

      const recipientsResult = await client.query(recipientQuery, recipientParams);

      // Add recipients to campaign
      for (const recipient of recipientsResult.rows) {
        await client.query(
          `INSERT INTO campaign_recipients (
            campaign_id, recipient_id, recipient_type,
            channel, status
          ) VALUES ($1, $2, $3, $4, $5)`,
          [
            campaignId,
            recipient.patient_id || recipient.owner_id,
            targetAudience.includes('patient') ? 'patient' : 'owner',
            channels[0], // Primary channel
            'pending'
          ]
        );
      }

      await client.query('COMMIT');
      return {
        campaign: campaignResult.rows[0],
        recipientCount: recipientsResult.rows.length
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute Communication Campaign
   */
  async executeCampaign(campaignId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get campaign details
      const campaignResult = await client.query(
        `SELECT * FROM communication_campaigns WHERE id = $1`,
        [campaignId]
      );

      if (campaignResult.rows.length === 0) {
        throw new Error('Campaign not found');
      }

      const campaign = campaignResult.rows[0];

      // Get recipients
      const recipientsResult = await client.query(
        `SELECT * FROM campaign_recipients
        WHERE campaign_id = $1 AND status = 'pending'`,
        [campaignId]
      );

      let successCount = 0;
      let failureCount = 0;

      // Send to each recipient
      for (const recipient of recipientsResult.rows) {
        try {
          // Personalize message
          const personalizedMessage = await this.personalizeMessage(
            campaign.message_template,
            recipient.recipient_id,
            recipient.recipient_type
          );

          // Send via appropriate channel
          if (recipient.channel === 'email') {
            await communicationService.sendEmail({
              to: recipient.email,
              subject: campaign.name,
              body: personalizedMessage
            });
          } else if (recipient.channel === 'sms') {
            await communicationService.sendSMS({
              to: recipient.phone,
              message: personalizedMessage
            });
          } else if (recipient.channel === 'whatsapp') {
            await communicationService.sendWhatsApp({
              to: recipient.phone,
              message: personalizedMessage
            });
          }

          // Update recipient status
          await client.query(
            `UPDATE campaign_recipients
            SET status = 'sent', sent_at = NOW()
            WHERE campaign_id = $1 AND recipient_id = $2`,
            [campaignId, recipient.recipient_id]
          );

          successCount++;
        } catch (error) {
          // Log failure
          await client.query(
            `UPDATE campaign_recipients
            SET status = 'failed', error_message = $1
            WHERE campaign_id = $2 AND recipient_id = $3`,
            [error.message, campaignId, recipient.recipient_id]
          );
          
          failureCount++;
        }
      }

      // Update campaign status
      await client.query(
        `UPDATE communication_campaigns
        SET status = 'completed',
            executed_at = NOW(),
            success_count = $1,
            failure_count = $2
        WHERE id = $3`,
        [successCount, failureCount, campaignId]
      );

      await client.query('COMMIT');
      return { successCount, failureCount };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper Functions
   */
  calculateLoyaltyTier(points) {
    if (points >= 10000) return 'platinum';
    if (points >= 5000) return 'gold';
    if (points >= 2000) return 'silver';
    return 'bronze';
  }

  async personalizeMessage(template, recipientId, recipientType) {
    // Get recipient details
    let recipientData;
    if (recipientType === 'patient') {
      const result = await pool.query(
        `SELECT p.*, u.first_name, u.last_name
        FROM patient_profiles p
        JOIN users u ON p.patient_id = u.id
        WHERE p.patient_id = $1`,
        [recipientId]
      );
      recipientData = result.rows[0];
    } else {
      const result = await pool.query(
        `SELECT o.*, u.first_name, u.last_name
        FROM hospital_owners o
        JOIN users u ON o.user_id = u.id
        WHERE o.owner_id = $1`,
        [recipientId]
      );
      recipientData = result.rows[0];
    }

    // Replace template variables
    let message = template;
    message = message.replace('{{first_name}}', recipientData.first_name || '');
    message = message.replace('{{last_name}}', recipientData.last_name || '');
    message = message.replace('{{full_name}}', `${recipientData.first_name} ${recipientData.last_name}`);
    message = message.replace('{{loyalty_points}}', recipientData.loyalty_points || 0);
    message = message.replace('{{loyalty_tier}}', recipientData.loyalty_tier || '');

    return message;
  }

  async sendTierUpgradeNotification(patientId, newTier) {
    // Implementation for sending tier upgrade notification
    const message = `Congratulations! You've been upgraded to ${newTier} tier. Enjoy exclusive benefits!`;
    
    await communicationService.sendNotification({
      recipientId: patientId,
      type: 'tier_upgrade',
      title: 'Loyalty Tier Upgrade',
      message,
      priority: 'high'
    });
  }

  async updateNPSScore(hospitalId) {
    // Calculate Net Promoter Score
    const result = await pool.query(
      `SELECT 
        COUNT(CASE WHEN would_recommend >= 9 THEN 1 END) as promoters,
        COUNT(CASE WHEN would_recommend <= 6 THEN 1 END) as detractors,
        COUNT(*) as total
      FROM patient_feedback
      WHERE hospital_id = $1
      AND created_at > NOW() - INTERVAL '90 days'`,
      [hospitalId]
    );

    const { promoters, detractors, total } = result.rows[0];
    const npsScore = total > 0 ? ((promoters - detractors) / total) * 100 : 0;

    await pool.query(
      `UPDATE hospitals
      SET nps_score = $1, nps_updated_at = NOW()
      WHERE id = $2`,
      [npsScore, hospitalId]
    );

    return npsScore;
  }
}

module.exports = new EnhancedCRMService();

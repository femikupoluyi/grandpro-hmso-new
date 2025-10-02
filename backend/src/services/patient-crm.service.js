const { neon } = require('@neondatabase/serverless');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, addHours, isBefore, isAfter } = require('date-fns');

const sql = neon(process.env.DATABASE_URL);

class PatientCRMService {
  /**
   * Register patient profile
   */
  async registerPatientProfile(data) {
    const {
      patient_id,
      hospital_id,
      nin,
      blood_group,
      genotype,
      allergies,
      chronic_conditions,
      emergency_contact,
      insurance_info,
      communication_preferences
    } = data;

    try {
      // Generate registration number
      const registrationNumber = this.generateRegistrationNumber();

      const result = await sql.query(`
        INSERT INTO patient_profiles (
          patient_id,
          hospital_id,
          registration_number,
          nin,
          blood_group,
          genotype,
          allergies,
          chronic_conditions,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          communication_preferences,
          insurance_provider,
          insurance_number,
          hmo_provider,
          hmo_number,
          nhis_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `, [
        patient_id,
        hospital_id,
        registrationNumber,
        nin || null,
        blood_group || null,
        genotype || null,
        allergies || [],
        chronic_conditions || [],
        emergency_contact?.name || null,
        emergency_contact?.phone || null,
        emergency_contact?.relationship || null,
        JSON.stringify(communication_preferences || { sms: true, email: true, whatsapp: true }),
        insurance_info?.provider || null,
        insurance_info?.number || null,
        insurance_info?.hmo_provider || null,
        insurance_info?.hmo_number || null,
        insurance_info?.nhis_number || null
      ]);

      // Initialize loyalty points
      await this.initializeLoyaltyPoints(patient_id, hospital_id);

      return result[0];
    } catch (error) {
      console.error('Error registering patient profile:', error);
      throw error;
    }
  }

  /**
   * Get patient profile with appointments and loyalty
   */
  async getPatientProfile(patientId) {
    try {
      // Get patient basic info
      const patientResult = await sql.query(`
        SELECT 
          p.*,
          u.email,
          u."phoneNumber" as phone,
          u."firstName",
          u."lastName",
          pp.registration_number,
          pp.blood_group,
          pp.genotype,
          pp.allergies,
          pp.chronic_conditions,
          pp.emergency_contact_name,
          pp.emergency_contact_phone,
          pp.communication_preferences,
          pp.insurance_provider,
          pp.hmo_provider,
          pp.nhis_number
        FROM "Patient" p
        JOIN "User" u ON p."userId" = u.id
        LEFT JOIN patient_profiles pp ON p.id = pp.patient_id
        WHERE p.id = $1
      `, [patientId]);

      if (patientResult.length === 0) {
        throw new Error('Patient not found');
      }

      const patient = patientResult[0];

      // Get upcoming appointments
      const appointments = await sql.query(`
        SELECT 
          a.*,
          u."firstName" || ' ' || u."lastName" as doctor_name,
          a.department as department_name
        FROM "Appointment" a
        LEFT JOIN "User" u ON a."doctorId" = u.id
        WHERE a."patientId" = $1
        AND a."appointmentDate" >= CURRENT_DATE
        ORDER BY a."appointmentDate", a."appointmentTime"
        LIMIT 5
      `, [patientId]);

      // Get loyalty points
      const loyalty = await sql.query(`
        SELECT *
        FROM loyalty_points
        WHERE patient_id = $1
      `, [patientId]);

      // Get recent feedback
      const feedback = await sql.query(`
        SELECT *
        FROM patient_feedback
        WHERE patient_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [patientId]);

      return {
        ...patient,
        appointments,
        loyalty: loyalty[0] || null,
        recentFeedback: feedback
      };
    } catch (error) {
      console.error('Error getting patient profile:', error);
      throw error;
    }
  }

  /**
   * Schedule appointment with auto-reminder setup
   */
  async scheduleAppointment(data) {
    const {
      patient_id,
      hospital_id,
      doctor_id,
      department_id,
      date,
      time,
      type,
      reason,
      notes,
      enable_reminders = true
    } = data;

    try {
      // Create appointment
      const appointmentResult = await sql.query(`
        INSERT INTO "Appointment" (
          id,
          "patientId",
          "hospitalId",
          "doctorId",
          department,
          date,
          time,
          type,
          reason,
          notes,
          status,
          "createdAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING *
      `, [
        uuidv4(),
        patient_id,
        hospital_id,
        doctor_id,
        department_id,
        date,
        time,
        type || 'CONSULTATION',
        reason,
        notes,
        'SCHEDULED'
      ]);

      const appointment = appointmentResult[0];

      // Setup reminders if enabled
      if (enable_reminders) {
        await this.setupAppointmentReminders(appointment.id, patient_id, date, time);
      }

      // Award loyalty points for booking
      await this.awardLoyaltyPoints(patient_id, hospital_id, 10, 'APPOINTMENT', appointment.id, 'Points for booking appointment');

      return appointment;
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      throw error;
    }
  }

  /**
   * Setup appointment reminders
   */
  async setupAppointmentReminders(appointmentId, patientId, date, time) {
    try {
      // Parse appointment datetime
      const appointmentDateTime = new Date(`${date} ${time}`);
      
      // Create reminders at different intervals
      const reminders = [
        { type: '24_HOUR', scheduledTime: addHours(appointmentDateTime, -24) },
        { type: '3_HOUR', scheduledTime: addHours(appointmentDateTime, -3) },
        { type: '1_HOUR', scheduledTime: addHours(appointmentDateTime, -1) }
      ];

      for (const reminder of reminders) {
        // Only create reminder if scheduled time is in the future
        if (isAfter(reminder.scheduledTime, new Date())) {
          await sql.query(`
            INSERT INTO appointment_reminders (
              appointment_id,
              patient_id,
              reminder_type,
              communication_channel,
              scheduled_time,
              status
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `, [
            appointmentId,
            patientId,
            reminder.type,
            'ALL',
            reminder.scheduledTime,
            'PENDING'
          ]);
        }
      }
    } catch (error) {
      console.error('Error setting up appointment reminders:', error);
      // Don't throw - reminder setup failure shouldn't fail appointment creation
    }
  }

  /**
   * Process pending appointment reminders
   */
  async processAppointmentReminders() {
    try {
      // Get pending reminders that are due
      const reminders = await sql.query(`
        SELECT 
          ar.*,
          a.date,
          a.time,
          a."hospitalId",
          u."firstName",
          u."lastName",
          u."phoneNumber" as phone,
          u.email,
          pp.communication_preferences,
          h.name as hospital_name
        FROM appointment_reminders ar
        JOIN "Appointment" a ON ar.appointment_id = a.id
        JOIN "Patient" p ON ar.patient_id = p.id
        JOIN "User" u ON p."userId" = u.id
        LEFT JOIN patient_profiles pp ON p.id = pp.patient_id
        JOIN "Hospital" h ON a."hospitalId" = h.id
        WHERE ar.status = 'PENDING'
        AND ar.scheduled_time <= NOW()
        LIMIT 50
      `);

      const results = [];
      const communicationService = require('./communication.service');

      for (const reminder of reminders) {
        try {
          const message = this.formatReminderMessage(reminder);
          const prefs = reminder.communication_preferences ? 
            JSON.parse(reminder.communication_preferences) : 
            { sms: true, email: true, whatsapp: true };

          // Send via preferred channels
          const sendPromises = [];
          
          if (prefs.sms && reminder.phone) {
            sendPromises.push(communicationService.sendSMS(reminder.phone, message.sms));
          }
          
          if (prefs.whatsapp && reminder.phone) {
            sendPromises.push(communicationService.sendWhatsApp(reminder.phone, message.whatsapp));
          }
          
          if (prefs.email && reminder.email) {
            sendPromises.push(communicationService.sendEmail(
              reminder.email,
              message.email.subject,
              message.email.body
            ));
          }

          await Promise.allSettled(sendPromises);

          // Update reminder status
          await sql.query(`
            UPDATE appointment_reminders
            SET status = 'SENT', sent_at = NOW()
            WHERE id = $1
          `, [reminder.id]);

          results.push({ id: reminder.id, success: true });
        } catch (error) {
          // Update status to failed
          await sql.query(`
            UPDATE appointment_reminders
            SET status = 'FAILED'
            WHERE id = $1
          `, [reminder.id]);

          results.push({ id: reminder.id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing appointment reminders:', error);
      throw error;
    }
  }

  /**
   * Submit patient feedback
   */
  async submitFeedback(data) {
    const {
      patient_id,
      hospital_id,
      appointment_id,
      feedback_type,
      ratings,
      feedback_text,
      improvement_suggestions,
      would_recommend,
      anonymous = false
    } = data;

    try {
      const result = await sql.query(`
        INSERT INTO patient_feedback (
          patient_id,
          hospital_id,
          appointment_id,
          feedback_type,
          rating,
          doctor_rating,
          nurse_rating,
          facility_rating,
          waiting_time_rating,
          feedback_text,
          improvement_suggestions,
          would_recommend,
          anonymous,
          status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        patient_id,
        hospital_id,
        appointment_id || null,
        feedback_type || 'GENERAL',
        ratings?.overall || null,
        ratings?.doctor || null,
        ratings?.nurse || null,
        ratings?.facility || null,
        ratings?.waiting_time || null,
        feedback_text,
        improvement_suggestions,
        would_recommend,
        anonymous,
        'NEW'
      ]);

      // Award loyalty points for feedback
      await this.awardLoyaltyPoints(
        patient_id,
        hospital_id,
        20,
        'FEEDBACK',
        result[0].id,
        'Points for providing feedback'
      );

      return result[0];
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback summary
   */
  async getFeedbackSummary(hospitalId, period = '30 days') {
    try {
      const result = await sql.query(`
        SELECT 
          COUNT(*) as total_feedback,
          AVG(rating) as avg_rating,
          AVG(doctor_rating) as avg_doctor_rating,
          AVG(nurse_rating) as avg_nurse_rating,
          AVG(facility_rating) as avg_facility_rating,
          AVG(waiting_time_rating) as avg_waiting_time,
          COUNT(CASE WHEN would_recommend = true THEN 1 END) as would_recommend_count,
          COUNT(CASE WHEN feedback_type = 'COMPLAINT' THEN 1 END) as complaints_count
        FROM patient_feedback
        WHERE hospital_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${period}'
      `, [hospitalId]);

      const feedbackByType = await sql.query(`
        SELECT 
          feedback_type,
          COUNT(*) as count,
          AVG(rating) as avg_rating
        FROM patient_feedback
        WHERE hospital_id = $1
        AND created_at >= CURRENT_DATE - INTERVAL '${period}'
        GROUP BY feedback_type
      `, [hospitalId]);

      return {
        summary: result[0],
        byType: feedbackByType
      };
    } catch (error) {
      console.error('Error getting feedback summary:', error);
      throw error;
    }
  }

  /**
   * Initialize loyalty points for new patient
   */
  async initializeLoyaltyPoints(patientId, hospitalId) {
    try {
      await sql.query(`
        INSERT INTO loyalty_points (
          patient_id,
          hospital_id,
          points_balance,
          lifetime_points,
          tier,
          last_activity_date
        ) VALUES ($1, $2, 0, 0, 'BRONZE', CURRENT_DATE)
        ON CONFLICT (patient_id, hospital_id) DO NOTHING
      `, [patientId, hospitalId]);
    } catch (error) {
      console.error('Error initializing loyalty points:', error);
    }
  }

  /**
   * Award loyalty points
   */
  async awardLoyaltyPoints(patientId, hospitalId, points, referenceType, referenceId, description) {
    try {
      // Add transaction
      await sql.query(`
        INSERT INTO loyalty_transactions (
          patient_id,
          hospital_id,
          transaction_type,
          points,
          description,
          reference_type,
          reference_id
        ) VALUES ($1, $2, 'EARNED', $3, $4, $5, $6)
      `, [patientId, hospitalId, points, description, referenceType, referenceId]);

      // Update balance
      const result = await sql.query(`
        UPDATE loyalty_points
        SET 
          points_balance = points_balance + $1,
          lifetime_points = lifetime_points + $1,
          last_activity_date = CURRENT_DATE,
          tier = CASE
            WHEN lifetime_points + $1 >= 10000 THEN 'PLATINUM'
            WHEN lifetime_points + $1 >= 5000 THEN 'GOLD'
            WHEN lifetime_points + $1 >= 2000 THEN 'SILVER'
            ELSE 'BRONZE'
          END
        WHERE patient_id = $2 AND hospital_id = $3
        RETURNING *
      `, [points, patientId, hospitalId]);

      return result[0];
    } catch (error) {
      console.error('Error awarding loyalty points:', error);
      throw error;
    }
  }

  /**
   * Redeem loyalty points
   */
  async redeemPoints(patientId, rewardId, hospitalId) {
    try {
      // Get reward details
      const rewardResult = await sql.query(`
        SELECT *
        FROM loyalty_rewards
        WHERE id = $1 AND hospital_id = $2 AND active = true
      `, [rewardId, hospitalId]);

      if (rewardResult.length === 0) {
        throw new Error('Reward not found or inactive');
      }

      const reward = rewardResult[0];

      // Check patient points
      const pointsResult = await sql.query(`
        SELECT points_balance
        FROM loyalty_points
        WHERE patient_id = $1 AND hospital_id = $2
      `, [patientId, hospitalId]);

      if (pointsResult.length === 0 || pointsResult[0].points_balance < reward.points_required) {
        throw new Error('Insufficient points');
      }

      // Generate redemption code
      const redemptionCode = this.generateRedemptionCode();

      // Create redemption record
      const redemption = await sql.query(`
        INSERT INTO reward_redemptions (
          patient_id,
          reward_id,
          points_used,
          redemption_code,
          status,
          expiry_date
        ) VALUES ($1, $2, $3, $4, 'APPROVED', CURRENT_DATE + INTERVAL '30 days')
        RETURNING *
      `, [patientId, rewardId, reward.points_required, redemptionCode]);

      // Deduct points
      await sql.query(`
        INSERT INTO loyalty_transactions (
          patient_id,
          hospital_id,
          transaction_type,
          points,
          description,
          reference_type,
          reference_id
        ) VALUES ($1, $2, 'REDEEMED', $3, $4, 'REDEMPTION', $5)
      `, [patientId, hospitalId, -reward.points_required, `Redeemed: ${reward.reward_name}`, redemption[0].id]);

      await sql.query(`
        UPDATE loyalty_points
        SET points_balance = points_balance - $1
        WHERE patient_id = $2 AND hospital_id = $3
      `, [reward.points_required, patientId, hospitalId]);

      // Update reward redemption count
      await sql.query(`
        UPDATE loyalty_rewards
        SET total_redeemed = total_redeemed + 1
        WHERE id = $1
      `, [rewardId]);

      return {
        redemption: redemption[0],
        reward
      };
    } catch (error) {
      console.error('Error redeeming points:', error);
      throw error;
    }
  }

  /**
   * Get available rewards
   */
  async getAvailableRewards(hospitalId, patientId = null) {
    try {
      let query = `
        SELECT *
        FROM loyalty_rewards
        WHERE hospital_id = $1
        AND active = true
        AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
        AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
        AND (total_available IS NULL OR total_redeemed < total_available)
      `;
      
      const params = [hospitalId];

      if (patientId) {
        // Get patient points to filter affordable rewards
        const pointsResult = await sql.query(`
          SELECT points_balance
          FROM loyalty_points
          WHERE patient_id = $1 AND hospital_id = $2
        `, [patientId, hospitalId]);

        if (pointsResult.length > 0) {
          query += ' AND points_required <= $2';
          params.push(pointsResult[0].points_balance);
        }
      }

      query += ' ORDER BY points_required ASC';
      
      const rewards = await sql.query(query, params);
      return rewards;
    } catch (error) {
      console.error('Error getting available rewards:', error);
      throw error;
    }
  }

  /**
   * Helper: Generate registration number
   */
  generateRegistrationNumber() {
    const prefix = 'GP';
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}${year}${random}`;
  }

  /**
   * Helper: Generate redemption code
   */
  generateRedemptionCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'RWD';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Helper: Format reminder message
   */
  formatReminderMessage(reminder) {
    const appointmentDate = format(new Date(reminder.date), 'EEEE, MMMM d, yyyy');
    const appointmentTime = reminder.time;
    const hospitalName = reminder.hospital_name;
    const patientName = `${reminder.firstName} ${reminder.lastName}`;

    return {
      sms: `Dear ${patientName}, reminder for your appointment at ${hospitalName} on ${appointmentDate} at ${appointmentTime}. Reply STOP to opt out.`,
      whatsapp: `Hello ${patientName}! 👋\n\n📅 Appointment Reminder\nDate: ${appointmentDate}\nTime: ${appointmentTime}\nLocation: ${hospitalName}\n\nPlease arrive 15 minutes early.\n\nReply YES to confirm or NO to reschedule.`,
      email: {
        subject: `Appointment Reminder - ${hospitalName}`,
        body: `
          <h2>Appointment Reminder</h2>
          <p>Dear ${patientName},</p>
          <p>This is a reminder for your upcoming appointment:</p>
          <ul>
            <li><strong>Date:</strong> ${appointmentDate}</li>
            <li><strong>Time:</strong> ${appointmentTime}</li>
            <li><strong>Location:</strong> ${hospitalName}</li>
          </ul>
          <p>Please arrive 15 minutes early for check-in.</p>
          <p>If you need to reschedule, please contact us as soon as possible.</p>
          <p>Best regards,<br>${hospitalName} Team</p>
        `
      }
    };
  }
}

module.exports = new PatientCRMService();

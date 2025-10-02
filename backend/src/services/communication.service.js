const pool = require('../config/database');

class CommunicationService {
  // Send communication via multiple channels
  async sendCommunication(data) {
    const { recipientId, recipientType, channels, message, type, priority } = data;
    
    const results = {
      sms: null,
      whatsapp: null,
      email: null
    };

    try {
      // Store communication record
      const query = `
        INSERT INTO communication_logs (
          recipient_id, recipient_type, message_type, 
          message_content, channels, priority, status, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;
      
      const values = [
        recipientId,
        recipientType,
        type,
        message.content,
        JSON.stringify(channels),
        priority || 'NORMAL',
        'PENDING'
      ];

      const result = await pool.query(query, values);
      const communicationId = result.rows[0].id;

      // Send via each channel
      if (channels.includes('SMS')) {
        results.sms = await this.sendSMS({
          recipientId,
          message: message.content,
          communicationId
        });
      }

      if (channels.includes('WHATSAPP')) {
        results.whatsapp = await this.sendWhatsApp({
          recipientId,
          message: message.content,
          template: message.template,
          communicationId
        });
      }

      if (channels.includes('EMAIL')) {
        results.email = await this.sendEmail({
          recipientId,
          subject: message.subject,
          content: message.content,
          template: message.template,
          communicationId
        });
      }

      // Update communication status
      const successChannels = Object.keys(results).filter(channel => results[channel]?.success);
      await pool.query(
        `UPDATE communication_logs 
         SET status = $1, delivered_channels = $2, updated_at = NOW() 
         WHERE id = $3`,
        [
          successChannels.length > 0 ? 'DELIVERED' : 'FAILED',
          JSON.stringify(successChannels),
          communicationId
        ]
      );

      return {
        success: true,
        communicationId,
        results
      };
    } catch (error) {
      console.error('Communication error:', error);
      throw error;
    }
  }

  // Send SMS (Nigerian providers: Termii, BulkSMS Nigeria, etc.)
  async sendSMS({ recipientId, message, communicationId }) {
    try {
      // Get recipient phone number
      const recipientQuery = await pool.query(
        'SELECT phone_number FROM users WHERE id = $1',
        [recipientId]
      );
      
      if (!recipientQuery.rows[0]?.phone_number) {
        return { success: false, error: 'No phone number found' };
      }

      const phoneNumber = recipientQuery.rows[0].phone_number;

      // Mock SMS sending (replace with actual SMS provider API)
      // For production, integrate with Nigerian SMS providers like:
      // - Termii (https://termii.com)
      // - BulkSMS Nigeria (https://www.bulksms.com.ng)
      // - SMS.ng (https://sms.ng)
      
      const mockSMSResponse = {
        success: true,
        messageId: `SMS_${Date.now()}`,
        provider: 'Termii',
        cost: 4.50, // Cost in Naira
        recipient: phoneNumber,
        deliveredAt: new Date().toISOString()
      };

      // Log SMS delivery
      await pool.query(
        `INSERT INTO sms_logs (
          communication_id, recipient_phone, message, 
          provider, status, cost_naira, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          communicationId,
          phoneNumber,
          message,
          'Termii',
          'DELIVERED',
          4.50
        ]
      );

      return mockSMSResponse;
    } catch (error) {
      console.error('SMS sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send WhatsApp message
  async sendWhatsApp({ recipientId, message, template, communicationId }) {
    try {
      // Get recipient phone number
      const recipientQuery = await pool.query(
        'SELECT phone_number, first_name FROM users WHERE id = $1',
        [recipientId]
      );
      
      if (!recipientQuery.rows[0]?.phone_number) {
        return { success: false, error: 'No phone number found' };
      }

      const { phone_number, first_name } = recipientQuery.rows[0];

      // Mock WhatsApp Business API (replace with actual WhatsApp Business API)
      // For production, use:
      // - WhatsApp Business API
      // - Twilio WhatsApp API
      // - Meta Business Platform
      
      const mockWhatsAppResponse = {
        success: true,
        messageId: `WA_${Date.now()}`,
        provider: 'WhatsApp Business',
        recipient: phone_number,
        template: template || 'default',
        deliveredAt: new Date().toISOString(),
        read: false
      };

      // Log WhatsApp delivery
      await pool.query(
        `INSERT INTO whatsapp_logs (
          communication_id, recipient_phone, message, 
          template_used, status, sent_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          communicationId,
          phone_number,
          message,
          template || 'default',
          'DELIVERED'
        ]
      );

      return mockWhatsAppResponse;
    } catch (error) {
      console.error('WhatsApp sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send Email
  async sendEmail({ recipientId, subject, content, template, communicationId }) {
    try {
      // Get recipient email
      const recipientQuery = await pool.query(
        'SELECT email, first_name, last_name FROM users WHERE id = $1',
        [recipientId]
      );
      
      if (!recipientQuery.rows[0]?.email) {
        return { success: false, error: 'No email found' };
      }

      const { email, first_name, last_name } = recipientQuery.rows[0];

      // Mock Email sending (replace with actual email provider)
      // For production, use:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - Nigerian providers like SMTPLab
      
      const mockEmailResponse = {
        success: true,
        messageId: `EMAIL_${Date.now()}`,
        provider: 'SendGrid',
        recipient: email,
        subject: subject,
        template: template || 'default',
        deliveredAt: new Date().toISOString(),
        opened: false
      };

      // Log Email delivery
      await pool.query(
        `INSERT INTO email_logs (
          communication_id, recipient_email, subject, 
          content, template_used, status, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          communicationId,
          email,
          subject,
          content,
          template || 'default',
          'DELIVERED'
        ]
      );

      return mockEmailResponse;
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  // Send appointment reminder
  async sendAppointmentReminder(appointmentId) {
    try {
      const query = `
        SELECT 
          a.*, 
          p.first_name, p.last_name, p.phone_number, p.email,
          d.name as doctor_name,
          dept.name as department_name,
          h.name as hospital_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        LEFT JOIN staff d ON a.doctor_id = d.id
        LEFT JOIN departments dept ON a.department_id = dept.id
        LEFT JOIN hospitals h ON a.hospital_id = h.id
        WHERE a.id = $1
      `;
      
      const result = await pool.query(query, [appointmentId]);
      const appointment = result.rows[0];

      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Prepare message
      const message = {
        content: `Dear ${appointment.first_name}, this is a reminder for your appointment with ${appointment.doctor_name} at ${appointment.hospital_name} on ${appointment.appointment_date} at ${appointment.appointment_time}. Please arrive 15 minutes early.`,
        subject: 'Appointment Reminder - GrandPro HMSO',
        template: 'appointment_reminder'
      };

      // Send via multiple channels
      return await this.sendCommunication({
        recipientId: appointment.patient_id,
        recipientType: 'PATIENT',
        channels: ['SMS', 'WHATSAPP', 'EMAIL'],
        message,
        type: 'APPOINTMENT_REMINDER',
        priority: 'HIGH'
      });
    } catch (error) {
      console.error('Appointment reminder error:', error);
      throw error;
    }
  }

  // Send feedback request
  async sendFeedbackRequest(encounterId) {
    try {
      const query = `
        SELECT 
          e.*, 
          p.first_name, p.last_name, p.phone_number, p.email,
          h.name as hospital_name
        FROM encounters e
        JOIN patients p ON e.patient_id = p.id
        JOIN hospitals h ON e.hospital_id = h.id
        WHERE e.id = $1
      `;
      
      const result = await pool.query(query, [encounterId]);
      const encounter = result.rows[0];

      if (!encounter) {
        throw new Error('Encounter not found');
      }

      // Prepare message
      const message = {
        content: `Dear ${encounter.first_name}, thank you for visiting ${encounter.hospital_name}. Please share your feedback to help us serve you better: https://grandpro.ng/feedback/${encounterId}`,
        subject: 'How was your experience? - GrandPro HMSO',
        template: 'feedback_request'
      };

      // Send via preferred channels
      return await this.sendCommunication({
        recipientId: encounter.patient_id,
        recipientType: 'PATIENT',
        channels: ['SMS', 'EMAIL'],
        message,
        type: 'FEEDBACK_REQUEST',
        priority: 'NORMAL'
      });
    } catch (error) {
      console.error('Feedback request error:', error);
      throw error;
    }
  }

  // Send loyalty points notification
  async sendLoyaltyNotification(patientId, points, reason) {
    try {
      const query = `
        SELECT 
          p.*, 
          lp.points_balance, lp.tier
        FROM patients p
        JOIN loyalty_programs lp ON p.id = lp.patient_id
        WHERE p.id = $1
      `;
      
      const result = await pool.query(query, [patientId]);
      const patient = result.rows[0];

      if (!patient) {
        throw new Error('Patient not found');
      }

      // Prepare message
      const message = {
        content: `Congratulations ${patient.first_name}! You've earned ${points} loyalty points for ${reason}. Your new balance is ${patient.points_balance + points} points. Keep earning to unlock exclusive rewards!`,
        subject: `You've earned ${points} loyalty points!`,
        template: 'loyalty_notification'
      };

      // Send via preferred channels
      return await this.sendCommunication({
        recipientId: patientId,
        recipientType: 'PATIENT',
        channels: ['SMS', 'WHATSAPP'],
        message,
        type: 'LOYALTY_NOTIFICATION',
        priority: 'LOW'
      });
    } catch (error) {
      console.error('Loyalty notification error:', error);
      throw error;
    }
  }

  // Send campaign
  async sendCampaign(campaignData) {
    const { name, audienceType, filters, channels, message } = campaignData;
    
    try {
      // Get target audience based on filters
      let query = '';
      let values = [];
      
      if (audienceType === 'PATIENTS') {
        query = `
          SELECT id, first_name, last_name, phone_number, email 
          FROM patients 
          WHERE 1=1
        `;
        
        if (filters.ageGroup) {
          // Add age filter
        }
        if (filters.location) {
          // Add location filter
        }
        if (filters.loyaltyTier) {
          // Add loyalty tier filter
        }
      } else if (audienceType === 'OWNERS') {
        query = `
          SELECT id, first_name, last_name, phone_number, email 
          FROM hospital_owners 
          WHERE 1=1
        `;
      }

      const audienceResult = await pool.query(query, values);
      const recipients = audienceResult.rows;

      // Create campaign record
      const campaignQuery = `
        INSERT INTO campaigns (
          name, audience_type, audience_count, 
          channels, message, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING id
      `;
      
      const campaignResult = await pool.query(campaignQuery, [
        name,
        audienceType,
        recipients.length,
        JSON.stringify(channels),
        JSON.stringify(message),
        'IN_PROGRESS'
      ]);
      
      const campaignId = campaignResult.rows[0].id;

      // Send to each recipient
      const results = [];
      for (const recipient of recipients) {
        const communicationResult = await this.sendCommunication({
          recipientId: recipient.id,
          recipientType: audienceType === 'PATIENTS' ? 'PATIENT' : 'OWNER',
          channels,
          message,
          type: 'CAMPAIGN',
          priority: 'LOW'
        });
        
        results.push({
          recipientId: recipient.id,
          success: communicationResult.success
        });
      }

      // Update campaign status
      const successCount = results.filter(r => r.success).length;
      await pool.query(
        `UPDATE campaigns 
         SET status = $1, success_count = $2, completed_at = NOW() 
         WHERE id = $3`,
        ['COMPLETED', successCount, campaignId]
      );

      return {
        success: true,
        campaignId,
        totalRecipients: recipients.length,
        successfulDeliveries: successCount
      };
    } catch (error) {
      console.error('Campaign error:', error);
      throw error;
    }
  }

  // Get communication history
  async getCommunicationHistory(recipientId, recipientType) {
    try {
      const query = `
        SELECT 
          cl.*,
          COUNT(sl.id) as sms_count,
          COUNT(wl.id) as whatsapp_count,
          COUNT(el.id) as email_count
        FROM communication_logs cl
        LEFT JOIN sms_logs sl ON cl.id = sl.communication_id
        LEFT JOIN whatsapp_logs wl ON cl.id = wl.communication_id
        LEFT JOIN email_logs el ON cl.id = el.communication_id
        WHERE cl.recipient_id = $1 AND cl.recipient_type = $2
        GROUP BY cl.id
        ORDER BY cl.sent_at DESC
        LIMIT 100
      `;
      
      const result = await pool.query(query, [recipientId, recipientType]);
      
      return {
        success: true,
        communications: result.rows
      };
    } catch (error) {
      console.error('Communication history error:', error);
      throw error;
    }
  }
}

module.exports = new CommunicationService();

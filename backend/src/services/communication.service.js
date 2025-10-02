const twilio = require('twilio');
const sgMail = require('@sendgrid/mail');
const { neon } = require('@neondatabase/serverless');

// Initialize services
const sql = neon(process.env.DATABASE_URL);

// Twilio configuration (for SMS and WhatsApp)
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

// SendGrid configuration (for Email)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

class CommunicationService {
  /**
   * Send SMS message
   */
  async sendSMS(to, message, metadata = {}) {
    try {
      // Format Nigerian phone number
      const formattedPhone = this.formatNigerianPhone(to);
      
      if (twilioClient) {
        const result = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER || '+1234567890',
          to: formattedPhone
        });

        return {
          success: true,
          messageId: result.sid,
          status: result.status,
          to: formattedPhone
        };
      }

      // Fallback for development/testing
      console.log(`[SMS Mock] To: ${formattedPhone}, Message: ${message}`);
      return {
        success: true,
        messageId: `mock-sms-${Date.now()}`,
        status: 'sent',
        to: formattedPhone,
        mock: true
      };
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(to, message, templateId = null, metadata = {}) {
    try {
      const formattedPhone = this.formatNigerianPhone(to);
      const whatsappNumber = `whatsapp:${formattedPhone}`;

      if (twilioClient) {
        const messageOptions = {
          from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886'}`,
          to: whatsappNumber
        };

        if (templateId) {
          // Use WhatsApp template message
          messageOptions.contentSid = templateId;
          messageOptions.contentVariables = JSON.stringify(metadata);
        } else {
          messageOptions.body = message;
        }

        const result = await twilioClient.messages.create(messageOptions);

        return {
          success: true,
          messageId: result.sid,
          status: result.status,
          to: whatsappNumber
        };
      }

      // Fallback for development/testing
      console.log(`[WhatsApp Mock] To: ${whatsappNumber}, Message: ${message}`);
      return {
        success: true,
        messageId: `mock-whatsapp-${Date.now()}`,
        status: 'sent',
        to: whatsappNumber,
        mock: true
      };
    } catch (error) {
      console.error('WhatsApp sending error:', error);
      throw new Error(`Failed to send WhatsApp message: ${error.message}`);
    }
  }

  /**
   * Send Email
   */
  async sendEmail(to, subject, htmlContent, textContent = null, metadata = {}) {
    try {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@grandprohmso.ng',
        subject,
        html: htmlContent,
        text: textContent || this.stripHtml(htmlContent),
        ...metadata
      };

      if (process.env.SENDGRID_API_KEY) {
        const result = await sgMail.send(msg);
        return {
          success: true,
          messageId: result[0].headers['x-message-id'],
          status: 'sent',
          to
        };
      }

      // Fallback for development/testing
      console.log(`[Email Mock] To: ${to}, Subject: ${subject}`);
      return {
        success: true,
        messageId: `mock-email-${Date.now()}`,
        status: 'sent',
        to,
        mock: true
      };
    } catch (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send bulk communications
   */
  async sendBulk(recipients, channel, message, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 50;
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(recipient => this.sendToChannel(recipient, channel, message, options))
      );
      
      results.push(...batchResults);
      
      // Rate limiting
      if (i + batchSize < recipients.length) {
        await this.sleep(options.delayMs || 1000);
      }
    }

    return {
      total: recipients.length,
      successful: results.filter(r => r.status === 'fulfilled').length,
      failed: results.filter(r => r.status === 'rejected').length,
      results
    };
  }

  /**
   * Send to specific channel
   */
  async sendToChannel(recipient, channel, message, options = {}) {
    switch (channel.toUpperCase()) {
      case 'SMS':
        return await this.sendSMS(recipient.phone, message, options);
      case 'WHATSAPP':
        return await this.sendWhatsApp(recipient.phone, message, options.templateId, options);
      case 'EMAIL':
        return await this.sendEmail(recipient.email, options.subject || 'Notification', message, null, options);
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  /**
   * Log communication to database
   */
  async logCommunication(type, data) {
    const { recipient_id, recipient_type, channel, message, status, metadata } = data;
    
    const table = recipient_type === 'owner' ? 'owner_communications' : 'patient_communications';
    const idField = recipient_type === 'owner' ? 'owner_id' : 'patient_id';
    
    try {
      const result = await sql.query(`
        INSERT INTO ${table} (
          ${idField}, 
          hospital_id,
          communication_type, 
          direction,
          subject,
          message, 
          status,
          metadata,
          sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING id
      `, [
        recipient_id,
        data.hospital_id,
        channel,
        'OUTBOUND',
        data.subject || null,
        message,
        status,
        JSON.stringify(metadata || {})
      ]);

      return result[0].id;
    } catch (error) {
      console.error('Error logging communication:', error);
      // Don't throw - logging failure shouldn't stop the communication
      return null;
    }
  }

  /**
   * Schedule communication for later
   */
  async scheduleCommunication(data) {
    const { recipient_id, recipient_type, channel, message, scheduled_at, metadata } = data;
    
    const table = recipient_type === 'owner' ? 'owner_communications' : 'patient_communications';
    const idField = recipient_type === 'owner' ? 'owner_id' : 'patient_id';
    
    try {
      const result = await sql.query(`
        INSERT INTO ${table} (
          ${idField},
          hospital_id,
          communication_type,
          direction,
          subject,
          message,
          status,
          metadata,
          scheduled_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id
      `, [
        recipient_id,
        data.hospital_id,
        channel,
        'OUTBOUND',
        data.subject || null,
        message,
        'PENDING',
        JSON.stringify(metadata || {}),
        scheduled_at
      ]);

      return result[0].id;
    } catch (error) {
      console.error('Error scheduling communication:', error);
      throw error;
    }
  }

  /**
   * Process scheduled communications
   */
  async processScheduledCommunications() {
    try {
      // Get pending communications that are due
      const pending = await sql.query(`
        SELECT * FROM (
          SELECT 'owner' as type, id, owner_id as recipient_id, hospital_id, 
                 communication_type, message, metadata
          FROM owner_communications
          WHERE status = 'PENDING' AND scheduled_at <= NOW()
          UNION ALL
          SELECT 'patient' as type, id, patient_id as recipient_id, hospital_id,
                 communication_type, message, metadata
          FROM patient_communications
          WHERE status = 'PENDING' AND scheduled_at <= NOW()
        ) AS pending_comms
        LIMIT 100
      `);

      const results = [];
      for (const comm of pending) {
        try {
          // Get recipient details
          const recipientData = await this.getRecipientDetails(comm.recipient_id, comm.type);
          
          // Send the communication
          const result = await this.sendToChannel(
            recipientData,
            comm.communication_type,
            comm.message,
            comm.metadata ? JSON.parse(comm.metadata) : {}
          );

          // Update status
          await this.updateCommunicationStatus(comm.id, comm.type, 'SENT', result);
          results.push({ id: comm.id, success: true, result });
        } catch (error) {
          // Update status to failed
          await this.updateCommunicationStatus(comm.id, comm.type, 'FAILED', { error: error.message });
          results.push({ id: comm.id, success: false, error: error.message });
        }
      }

      return results;
    } catch (error) {
      console.error('Error processing scheduled communications:', error);
      throw error;
    }
  }

  /**
   * Update communication status
   */
  async updateCommunicationStatus(id, type, status, metadata = {}) {
    const table = type === 'owner' ? 'owner_communications' : 'patient_communications';
    
    try {
      await sql.query(`
        UPDATE ${table}
        SET status = $1, 
            ${status === 'SENT' ? 'sent_at = NOW(),' : ''}
            ${status === 'DELIVERED' ? 'delivered_at = NOW(),' : ''}
            ${status === 'READ' ? 'read_at = NOW(),' : ''}
            metadata = metadata || $2,
            updated_at = NOW()
        WHERE id = $3
      `, [status, JSON.stringify(metadata), id]);
    } catch (error) {
      console.error('Error updating communication status:', error);
    }
  }

  /**
   * Get recipient details
   */
  async getRecipientDetails(recipientId, type) {
    try {
      if (type === 'owner') {
        const result = await sql.query(`
          SELECT ho.id, u.email, u."phoneNumber" as phone, u."firstName", u."lastName"
          FROM "HospitalOwner" ho
          JOIN "User" u ON ho."userId" = u.id
          WHERE ho.id = $1
        `, [recipientId]);
        return result[0];
      } else {
        const result = await sql.query(`
          SELECT p.id, u.email, u."phoneNumber" as phone, u."firstName", u."lastName"
          FROM "Patient" p
          JOIN "User" u ON p."userId" = u.id
          WHERE p.id = $1
        `, [recipientId]);
        return result[0];
      }
    } catch (error) {
      console.error('Error getting recipient details:', error);
      throw error;
    }
  }

  /**
   * Helper: Format Nigerian phone number
   */
  formatNigerianPhone(phone) {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, replace with 234
    if (cleaned.startsWith('0')) {
      cleaned = '234' + cleaned.substring(1);
    }
    
    // If doesn't start with 234, add it
    if (!cleaned.startsWith('234')) {
      cleaned = '234' + cleaned;
    }
    
    // Add + prefix
    return '+' + cleaned;
  }

  /**
   * Helper: Strip HTML tags
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Helper: Sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get communication templates
   */
  async getTemplates(type = null) {
    const templates = {
      appointment_reminder: {
        sms: 'Dear {patientName}, this is a reminder for your appointment at {hospitalName} on {date} at {time}. Please arrive 15 minutes early.',
        whatsapp: 'Hello {patientName}! 👋\n\nThis is a friendly reminder about your upcoming appointment:\n📅 Date: {date}\n⏰ Time: {time}\n🏥 Location: {hospitalName}\n\nPlease arrive 15 minutes early for check-in.\n\nReply YES to confirm or NO to reschedule.',
        email: {
          subject: 'Appointment Reminder - {hospitalName}',
          body: '<h2>Appointment Reminder</h2><p>Dear {patientName},</p><p>This is a reminder for your upcoming appointment:</p><ul><li>Date: {date}</li><li>Time: {time}</li><li>Location: {hospitalName}</li></ul><p>Please arrive 15 minutes early for check-in.</p>'
        }
      },
      payment_confirmation: {
        sms: 'Payment of ₦{amount} received for {service} at {hospitalName}. Receipt #{receiptNumber}',
        whatsapp: 'Payment Confirmation ✅\n\nAmount: ₦{amount}\nService: {service}\nReceipt: #{receiptNumber}\n\nThank you for choosing {hospitalName}!',
        email: {
          subject: 'Payment Confirmation - {hospitalName}',
          body: '<h2>Payment Confirmation</h2><p>We have received your payment of <strong>₦{amount}</strong> for {service}.</p><p>Receipt Number: {receiptNumber}</p>'
        }
      },
      health_tip: {
        sms: 'Health Tip from {hospitalName}: {tip}',
        whatsapp: '💡 Health Tip of the Day\n\n{tip}\n\nStay healthy with {hospitalName}! 🏥',
        email: {
          subject: 'Health Tip from {hospitalName}',
          body: '<h2>Health Tip of the Day</h2><p>{tip}</p><p>Best regards,<br>{hospitalName} Team</p>'
        }
      }
    };

    return type ? templates[type] : templates;
  }

  /**
   * Replace template variables
   */
  replaceTemplateVars(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }
}

module.exports = new CommunicationService();

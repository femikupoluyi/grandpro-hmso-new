const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { format, addMonths, startOfMonth, endOfMonth } = require('date-fns');

class OwnerCRMService {
  /**
   * Get owner profile with contracts and payouts
   */
  async getOwnerProfile(ownerId) {
    try {
      // Get owner basic info
      const ownerResult = await pool.query(`
        SELECT 
          ho.*,
          u.email,
          u."phoneNumber" as phone,
          u."firstName",
          u."lastName",
          h.name as hospital_name,
          h.type as hospital_type
        FROM "HospitalOwner" ho
        JOIN "User" u ON ho."userId" = u.id
        JOIN "Hospital" h ON ho."hospitalId" = h.id
        WHERE ho.id = $1
      `, [ownerId]);

      if (ownerResult.length === 0) {
        throw new Error('Owner not found');
      }

      const owner = ownerResult[0];

      // Get contracts
      const contracts = await pool.query(`
        SELECT 
          c.*
        FROM "Contract" c
        WHERE c."hospitalId" = $1
        ORDER BY c."createdAt" DESC
      `, [owner.hospitalId]);

      // Get recent payouts
      const payouts = await pool.query(`
        SELECT *
        FROM owner_payouts
        WHERE owner_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `, [ownerId]);

      // Get satisfaction scores
      const satisfaction = await pool.query(`
        SELECT 
          AVG(overall_rating) as avg_overall,
          AVG(communication_rating) as avg_communication,
          AVG(support_rating) as avg_support,
          AVG(payment_rating) as avg_payment,
          COUNT(*) as total_surveys
        FROM owner_satisfaction
        WHERE owner_id = $1
      `, [ownerId]);

      return {
        ...owner,
        contracts,
        recentPayouts: payouts,
        satisfaction: satisfaction[0]
      };
    } catch (error) {
      console.error('Error getting owner profile:', error);
      throw error;
    }
  }

  /**
   * Create a payout record
   */
  async createPayout(data) {
    const {
      owner_id,
      hospital_id,
      contract_id,
      payout_period,
      amount_naira,
      revenue_share_amount,
      fixed_fee_amount,
      deductions,
      payment_method,
      bank_details,
      notes,
      created_by
    } = data;

    try {
      // Generate payout number
      const payoutNumber = this.generatePayoutNumber();
      
      // Calculate net amount
      const netAmount = amount_naira - (deductions || 0);

      const result = await pool.query(`
        INSERT INTO owner_payouts (
          payout_number,
          owner_id,
          hospital_id,
          contract_id,
          payout_period,
          amount_naira,
          revenue_share_amount,
          fixed_fee_amount,
          deductions,
          net_amount,
          payment_method,
          bank_name,
          account_number,
          account_name,
          status,
          scheduled_date,
          notes,
          created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `, [
        payoutNumber,
        owner_id,
        hospital_id,
        contract_id,
        payout_period,
        amount_naira,
        revenue_share_amount || null,
        fixed_fee_amount || null,
        deductions || 0,
        netAmount,
        payment_method || 'BANK_TRANSFER',
        bank_details?.bank_name || null,
        bank_details?.account_number || null,
        bank_details?.account_name || null,
        'PENDING',
        data.scheduled_date || new Date(),
        notes || null,
        created_by
      ]);

      return result[0];
    } catch (error) {
      console.error('Error creating payout:', error);
      throw error;
    }
  }

  /**
   * Process monthly payouts for all owners
   */
  async processMonthlyPayouts(period = null) {
    const payoutPeriod = period || format(new Date(), 'yyyy-MM');
    const startDate = startOfMonth(new Date(payoutPeriod + '-01'));
    const endDate = endOfMonth(startDate);

    try {
      // Get all active owners with contracts
      const owners = await pool.query(`
        SELECT DISTINCT
          ho.id as owner_id,
          ho."hospitalId" as hospital_id,
          c.id as contract_id,
          c."contractValue"::numeric as monthly_fee,
          c."revenueShareRate" as revenue_share
        FROM "HospitalOwner" ho
        JOIN "Contract" c ON ho."hospitalId" = c."hospitalId"
        WHERE ho."isActive" = true
        AND c.status = 'ACTIVE'
        AND c."startDate" <= $1
        AND c."endDate" >= $2
      `, [endDate, startDate]);

      const payouts = [];
      
      for (const owner of owners) {
        // Check if payout already exists for this period
        const existing = await pool.query(`
          SELECT id FROM owner_payouts
          WHERE owner_id = $1 AND payout_period = $2
        `, [owner.owner_id, payoutPeriod]);

        if (existing.length > 0) {
          console.log(`Payout already exists for owner ${owner.owner_id} in period ${payoutPeriod}`);
          continue;
        }

        // Calculate revenue for the period
        const revenue = await this.calculateHospitalRevenue(owner.hospital_id, startDate, endDate);
        
        // Calculate payout amounts
        const fixedFee = owner.monthly_fee || 0;
        const revenueShare = revenue * (owner.revenue_share || 0) / 100;
        const totalAmount = fixedFee + revenueShare;

        if (totalAmount > 0) {
          const payout = await this.createPayout({
            owner_id: owner.owner_id,
            hospital_id: owner.hospital_id,
            contract_id: owner.contract_id,
            payout_period: payoutPeriod,
            amount_naira: totalAmount,
            revenue_share_amount: revenueShare,
            fixed_fee_amount: fixedFee,
            deductions: 0,
            payment_method: 'BANK_TRANSFER',
            notes: `Monthly payout for ${payoutPeriod}`,
            created_by: 'system'
          });
          
          payouts.push(payout);
        }
      }

      return {
        period: payoutPeriod,
        totalPayouts: payouts.length,
        payouts
      };
    } catch (error) {
      console.error('Error processing monthly payouts:', error);
      throw error;
    }
  }

  /**
   * Update payout status
   */
  async updatePayoutStatus(payoutId, status, details = {}) {
    const validStatuses = ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    try {
      const updateFields = ['status = $1', 'updated_at = NOW()'];
      const values = [status, payoutId];
      let paramIndex = 2;

      if (status === 'COMPLETED' && details.transaction_reference) {
        updateFields.push(`transaction_reference = $${++paramIndex}`);
        updateFields.push('paid_date = NOW()');
        values.splice(-1, 0, details.transaction_reference);
      }

      if (details.approved_by) {
        updateFields.push(`approved_by = $${++paramIndex}`);
        values.splice(-1, 0, details.approved_by);
      }

      if (details.notes) {
        updateFields.push(`notes = notes || '\n' || $${++paramIndex}`);
        values.splice(-1, 0, details.notes);
      }

      const result = await pool.query(`
        UPDATE owner_payouts
        SET ${updateFields.join(', ')}
        WHERE id = $${values.length}
        RETURNING *
      `, values);

      return result[0];
    } catch (error) {
      console.error('Error updating payout status:', error);
      throw error;
    }
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(filters = {}) {
    const { owner_id, hospital_id, status, period, limit = 50, offset = 0 } = filters;
    
    let query = 'SELECT * FROM owner_payouts WHERE 1=1';
    const params = [];
    let paramIndex = 0;

    if (owner_id) {
      query += ` AND owner_id = $${++paramIndex}`;
      params.push(owner_id);
    }

    if (hospital_id) {
      query += ` AND hospital_id = $${++paramIndex}`;
      params.push(hospital_id);
    }

    if (status) {
      query += ` AND status = $${++paramIndex}`;
      params.push(status);
    }

    if (period) {
      query += ` AND payout_period = $${++paramIndex}`;
      params.push(period);
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramIndex} OFFSET $${++paramIndex}`;
    params.push(limit, offset);

    try {
      const results = await pool.query(query, params);
      
      // Get total count
      let countQuery = 'SELECT COUNT(*) as total FROM owner_payouts WHERE 1=1';
      if (owner_id) countQuery += ' AND owner_id = $1';
      if (hospital_id) countQuery += ' AND hospital_id = $2';
      if (status) countQuery += ' AND status = $3';
      if (period) countQuery += ' AND payout_period = $4';
      
      const countParams = params.slice(0, -2);
      const countResult = await pool.query(countQuery, countParams);

      return {
        data: results,
        pagination: {
          total: parseInt(countResult[0].total),
          limit,
          offset,
          pages: Math.ceil(countResult[0].total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting payout history:', error);
      throw error;
    }
  }

  /**
   * Log owner communication
   */
  async logCommunication(data) {
    const {
      owner_id,
      hospital_id,
      communication_type,
      direction,
      subject,
      message,
      sent_by,
      metadata
    } = data;

    try {
      const result = await pool.query(`
        INSERT INTO owner_communications (
          owner_id,
          hospital_id,
          communication_type,
          direction,
          subject,
          message,
          status,
          sent_by,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `, [
        owner_id,
        hospital_id,
        communication_type,
        direction || 'OUTBOUND',
        subject,
        message,
        'SENT',
        sent_by,
        metadata ? JSON.stringify(metadata) : null
      ]);

      return result[0];
    } catch (error) {
      console.error('Error logging communication:', error);
      throw error;
    }
  }

  /**
   * Get communication history
   */
  async getCommunicationHistory(ownerId, limit = 50) {
    try {
      const results = await pool.query(`
        SELECT 
          oc.*,
          u."firstName" || ' ' || u."lastName" as sent_by_name
        FROM owner_communications oc
        LEFT JOIN "User" u ON oc.sent_by = u.id
        WHERE oc.owner_id = $1
        ORDER BY oc.created_at DESC
        LIMIT $2
      `, [ownerId, limit]);

      return results;
    } catch (error) {
      console.error('Error getting communication history:', error);
      throw error;
    }
  }

  /**
   * Create satisfaction survey
   */
  async createSatisfactionSurvey(data) {
    const {
      owner_id,
      hospital_id,
      survey_type,
      ratings,
      feedback,
      improvements_suggested
    } = data;

    try {
      const result = await pool.query(`
        INSERT INTO owner_satisfaction (
          owner_id,
          hospital_id,
          survey_type,
          overall_rating,
          communication_rating,
          support_rating,
          payment_rating,
          feedback,
          improvements_suggested,
          responded_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `, [
        owner_id,
        hospital_id,
        survey_type || 'QUARTERLY',
        ratings.overall,
        ratings.communication,
        ratings.support,
        ratings.payment,
        feedback,
        improvements_suggested
      ]);

      return result[0];
    } catch (error) {
      console.error('Error creating satisfaction survey:', error);
      throw error;
    }
  }

  /**
   * Get satisfaction metrics
   */
  async getSatisfactionMetrics(hospitalId = null) {
    try {
      let query = `
        SELECT 
          AVG(overall_rating) as avg_overall,
          AVG(communication_rating) as avg_communication,
          AVG(support_rating) as avg_support,
          AVG(payment_rating) as avg_payment,
          COUNT(*) as total_surveys,
          COUNT(DISTINCT owner_id) as total_respondents
        FROM owner_satisfaction
        WHERE 1=1
      `;
      
      const params = [];
      if (hospitalId) {
        query += ' AND hospital_id = $1';
        params.push(hospitalId);
      }

      const result = await pool.query(query, params);

      // Get trend data
      const trendQuery = `
        SELECT 
          DATE_TRUNC('month', survey_date) as month,
          AVG(overall_rating) as avg_rating,
          COUNT(*) as survey_count
        FROM owner_satisfaction
        WHERE survey_date >= CURRENT_DATE - INTERVAL '12 months'
        ${hospitalId ? 'AND hospital_id = $1' : ''}
        GROUP BY month
        ORDER BY month DESC
      `;

      const trends = await pool.query(trendQuery, params);

      return {
        metrics: result[0],
        trends
      };
    } catch (error) {
      console.error('Error getting satisfaction metrics:', error);
      throw error;
    }
  }

  /**
   * Helper: Generate payout number
   */
  generatePayoutNumber() {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `PAY${year}${month}${random}`;
  }

  /**
   * Helper: Calculate hospital revenue
   */
  async calculateHospitalRevenue(hospitalId, startDate, endDate) {
    try {
      const result = await pool.query(`
        SELECT COALESCE(SUM(amount), 0) as total_revenue
        FROM "Payment"
        WHERE "hospitalId" = $1
        AND "createdAt" BETWEEN $2 AND $3
        AND status = 'COMPLETED'
      `, [hospitalId, startDate, endDate]);

      return parseFloat(result[0].total_revenue);
    } catch (error) {
      console.error('Error calculating hospital revenue:', error);
      return 0;
    }
  }
}

module.exports = new OwnerCRMService();

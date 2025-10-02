/**
 * Enhanced Billing and Revenue Management Service
 * Supports Cash, Insurance, NHIS, and HMO payments
 */

const { pool } = require('../config/database');

class BillingEnhancedService {
  /**
   * Create invoice with multiple payment methods support
   */
  async createInvoice(invoiceData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate invoice number
      const invoiceNumber = `INV${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Calculate totals
      let subtotal = 0;
      let taxAmount = 0;
      let discountAmount = 0;

      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        invoiceData.items.forEach(item => {
          subtotal += (item.quantity * item.unitPrice);
        });
      }

      // Apply tax (VAT 7.5% in Nigeria)
      const taxRate = invoiceData.taxRate || 0.075;
      taxAmount = subtotal * taxRate;

      // Apply discount
      if (invoiceData.discountPercentage) {
        discountAmount = subtotal * (invoiceData.discountPercentage / 100);
      }

      const totalAmount = subtotal + taxAmount - discountAmount;

      // Determine payment split (insurance/patient)
      let insuranceAmount = 0;
      let patientAmount = totalAmount;

      if (invoiceData.insuranceProvider) {
        const coveragePercentage = invoiceData.insuranceCoverage || 0;
        insuranceAmount = totalAmount * (coveragePercentage / 100);
        patientAmount = totalAmount - insuranceAmount;
      }

      // Insert invoice
      const invoiceQuery = `
        INSERT INTO invoices (
          invoice_number, patient_id, patient_name, 
          visit_id, department, doctor_name,
          subtotal, tax_amount, tax_rate, discount_amount, discount_percentage,
          total_amount, patient_amount, insurance_amount,
          payment_method, insurance_provider, insurance_policy_number,
          hmo_id, nhis_number, status, 
          due_date, notes, hospital_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW())
        RETURNING *
      `;

      const values = [
        invoiceNumber,
        invoiceData.patientId,
        invoiceData.patientName,
        invoiceData.visitId || null,
        invoiceData.department || null,
        invoiceData.doctorName || null,
        subtotal,
        taxAmount,
        taxRate,
        discountAmount,
        invoiceData.discountPercentage || 0,
        totalAmount,
        patientAmount,
        insuranceAmount,
        invoiceData.paymentMethod || 'cash',
        invoiceData.insuranceProvider || null,
        invoiceData.insurancePolicyNumber || null,
        invoiceData.hmoId || null,
        invoiceData.nhisNumber || null,
        'pending',
        invoiceData.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invoiceData.notes || null,
        invoiceData.hospitalId
      ];

      const invoiceResult = await client.query(invoiceQuery, values);
      const invoice = invoiceResult.rows[0];

      // Insert invoice items
      if (invoiceData.items && Array.isArray(invoiceData.items)) {
        for (const item of invoiceData.items) {
          await this.addInvoiceItem(client, invoice.id, item);
        }
      }

      // Create insurance claim if applicable
      if (insuranceAmount > 0) {
        await this.createInsuranceClaim(client, {
          invoiceId: invoice.id,
          patientId: invoiceData.patientId,
          provider: invoiceData.insuranceProvider,
          amount: insuranceAmount,
          policyNumber: invoiceData.insurancePolicyNumber
        });
      }

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Add invoice item
   */
  async addInvoiceItem(client, invoiceId, item) {
    const query = `
      INSERT INTO invoice_items (
        invoice_id, description, category, quantity, 
        unit_price, total_price, service_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      invoiceId,
      item.description,
      item.category || 'service',
      item.quantity || 1,
      item.unitPrice,
      (item.quantity || 1) * item.unitPrice,
      item.serviceCode || null
    ];

    return await client.query(query, values);
  }

  /**
   * Process payment
   */
  async processPayment(paymentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate payment reference
      const paymentReference = `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Insert payment record
      const paymentQuery = `
        INSERT INTO payments (
          invoice_id, payment_reference, amount, 
          payment_method, payment_date, 
          received_by, transaction_id, 
          bank_name, cheque_number, card_last4,
          status, notes, created_at
        ) VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, 'completed', $10, NOW())
        RETURNING *
      `;

      const values = [
        paymentData.invoiceId,
        paymentReference,
        paymentData.amount,
        paymentData.paymentMethod || 'cash',
        paymentData.receivedBy,
        paymentData.transactionId || null,
        paymentData.bankName || null,
        paymentData.chequeNumber || null,
        paymentData.cardLast4 || null,
        paymentData.notes || null
      ];

      const paymentResult = await client.query(paymentQuery, values);

      // Update invoice status
      const invoiceQuery = `
        UPDATE invoices 
        SET 
          status = CASE 
            WHEN (SELECT SUM(amount) FROM payments WHERE invoice_id = $1) >= total_amount 
            THEN 'paid' 
            ELSE 'partial' 
          END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      await client.query(invoiceQuery, [paymentData.invoiceId]);

      // Generate receipt
      await this.generateReceipt(client, paymentResult.rows[0].id);

      await client.query('COMMIT');
      return paymentResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create insurance claim
   */
  async createInsuranceClaim(client, claimData) {
    const claimNumber = `CLM${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const query = `
      INSERT INTO insurance_claims (
        claim_number, invoice_id, patient_id,
        provider_name, provider_type, policy_number,
        claim_amount, diagnosis_codes, procedure_codes,
        status, submission_date, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'submitted', NOW(), NOW())
      RETURNING *
    `;

    const values = [
      claimNumber,
      claimData.invoiceId,
      claimData.patientId,
      claimData.provider,
      claimData.providerType || 'insurance',
      claimData.policyNumber,
      claimData.amount,
      JSON.stringify(claimData.diagnosisCodes || []),
      JSON.stringify(claimData.procedureCodes || [])
    ];

    return await client.query(query, values);
  }

  /**
   * Process insurance claim payment
   */
  async processClaimPayment(claimId, paymentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update claim status
      const claimQuery = `
        UPDATE insurance_claims
        SET 
          status = 'paid',
          approved_amount = $1,
          payment_date = NOW(),
          payment_reference = $2,
          notes = $3,
          updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `;

      const claimResult = await client.query(claimQuery, [
        paymentData.amount,
        paymentData.reference,
        paymentData.notes,
        claimId
      ]);

      // Create payment record
      await this.processPayment({
        invoiceId: claimResult.rows[0].invoice_id,
        amount: paymentData.amount,
        paymentMethod: 'insurance',
        receivedBy: 'Insurance Claim',
        transactionId: paymentData.reference,
        notes: `Insurance claim payment: ${claimResult.rows[0].claim_number}`
      });

      await client.query('COMMIT');
      return claimResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Generate receipt
   */
  async generateReceipt(client, paymentId) {
    const receiptNumber = `RCP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const query = `
      INSERT INTO receipts (
        receipt_number, payment_id, generated_date, status
      ) VALUES ($1, $2, NOW(), 'generated')
      RETURNING *
    `;

    return await client.query(query, [receiptNumber, paymentId]);
  }

  /**
   * Get billing summary for patient
   */
  async getPatientBillingSummary(patientId) {
    const query = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(total_amount) as total_billed,
        SUM(CASE WHEN status = 'paid' THEN total_amount ELSE 0 END) as total_paid,
        SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END) as total_pending,
        COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue_count
      FROM invoices
      WHERE patient_id = $1
    `;

    const result = await pool.query(query, [patientId]);
    return result.rows[0];
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(hospitalId, startDate, endDate) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        payment_method,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      WHERE i.hospital_id = $1
      AND p.payment_date BETWEEN $2 AND $3
      GROUP BY DATE(created_at), payment_method
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [hospitalId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Handle NHIS billing
   */
  async processNHISBilling(billingData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // NHIS typically covers 90% for enrolled patients
      const nhisData = {
        ...billingData,
        insuranceProvider: 'NHIS',
        insuranceCoverage: 90,
        nhisNumber: billingData.nhisNumber,
        paymentMethod: 'nhis'
      };

      const invoice = await this.createInvoice(nhisData);

      // Auto-submit NHIS claim
      await this.createInsuranceClaim(client, {
        invoiceId: invoice.id,
        patientId: billingData.patientId,
        provider: 'NHIS',
        providerType: 'nhis',
        amount: invoice.insurance_amount,
        policyNumber: billingData.nhisNumber
      });

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Handle HMO billing
   */
  async processHMOBilling(billingData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get HMO coverage details
      const hmoQuery = `
        SELECT coverage_percentage, authorization_required
        FROM hmo_providers
        WHERE id = $1
      `;
      
      const hmoResult = await pool.query(hmoQuery, [billingData.hmoId]);
      const hmo = hmoResult.rows[0];

      const hmoData = {
        ...billingData,
        insuranceProvider: billingData.hmoName,
        insuranceCoverage: hmo?.coverage_percentage || 80,
        hmoId: billingData.hmoId,
        paymentMethod: 'hmo'
      };

      const invoice = await this.createInvoice(hmoData);

      // Create HMO claim
      await this.createInsuranceClaim(client, {
        invoiceId: invoice.id,
        patientId: billingData.patientId,
        provider: billingData.hmoName,
        providerType: 'hmo',
        amount: invoice.insurance_amount,
        policyNumber: billingData.hmoPolicyNumber
      });

      await client.query('COMMIT');
      return invoice;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get outstanding invoices
   */
  async getOutstandingInvoices(hospitalId) {
    const query = `
      SELECT 
        i.*,
        COALESCE(SUM(p.amount), 0) as amount_paid,
        i.total_amount - COALESCE(SUM(p.amount), 0) as balance_due
      FROM invoices i
      LEFT JOIN payments p ON i.id = p.invoice_id
      WHERE i.hospital_id = $1
      AND i.status IN ('pending', 'partial')
      GROUP BY i.id
      ORDER BY i.due_date ASC
    `;

    const result = await pool.query(query, [hospitalId]);
    return result.rows;
  }

  /**
   * Generate billing report
   */
  async generateBillingReport(hospitalId, reportType, startDate, endDate) {
    let query;
    
    switch(reportType) {
      case 'daily':
        query = `
          SELECT 
            DATE(payment_date) as date,
            COUNT(DISTINCT p.id) as transactions,
            SUM(p.amount) as total_revenue,
            COUNT(DISTINCT i.patient_id) as unique_patients,
            json_agg(DISTINCT payment_method) as payment_methods
          FROM payments p
          JOIN invoices i ON p.invoice_id = i.id
          WHERE i.hospital_id = $1
          AND p.payment_date BETWEEN $2 AND $3
          GROUP BY DATE(payment_date)
          ORDER BY date DESC
        `;
        break;
      
      case 'insurance':
        query = `
          SELECT 
            insurance_provider,
            COUNT(*) as claim_count,
            SUM(claim_amount) as total_claimed,
            SUM(approved_amount) as total_approved,
            AVG(EXTRACT(day FROM payment_date - submission_date)) as avg_processing_days
          FROM insurance_claims ic
          JOIN invoices i ON ic.invoice_id = i.id
          WHERE i.hospital_id = $1
          AND ic.submission_date BETWEEN $2 AND $3
          GROUP BY insurance_provider
          ORDER BY total_claimed DESC
        `;
        break;
      
      default:
        query = `
          SELECT 
            COUNT(DISTINCT i.id) as total_invoices,
            COUNT(DISTINCT p.id) as total_payments,
            SUM(i.total_amount) as total_billed,
            SUM(p.amount) as total_collected,
            AVG(i.total_amount) as average_invoice
          FROM invoices i
          LEFT JOIN payments p ON i.id = p.invoice_id
          WHERE i.hospital_id = $1
          AND i.created_at BETWEEN $2 AND $3
        `;
    }

    const result = await pool.query(query, [hospitalId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get invoices list
   */
  async getInvoices(params = {}) {
    try {
      const { hospital_id, patient_id, status, limit = 20, offset = 0 } = params;
      
      let query = 'SELECT * FROM invoices WHERE 1=1';
      const queryParams = [];
      let paramCount = 0;

      if (hospital_id) {
        queryParams.push(hospital_id);
        query += ` AND hospital_id = $${++paramCount}`;
      }
      
      if (patient_id) {
        queryParams.push(patient_id);
        query += ` AND patient_id = $${++paramCount}`;
      }
      
      if (status) {
        queryParams.push(status);
        query += ` AND status = $${++paramCount}`;
      }

      query += ' ORDER BY created_at DESC';
      
      queryParams.push(limit);
      query += ` LIMIT $${++paramCount}`;
      
      queryParams.push(offset);
      query += ` OFFSET $${++paramCount}`;

      const result = await pool.query(query, queryParams);
      
      return {
        data: result.rows,
        total: result.rowCount,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error getting invoices:', error);
      return { data: [], total: 0, error: 'Failed to fetch invoices' };
    }
  }

  /**
   * Get payments list
   */
  async getPayments(params = {}) {
    try {
      const { invoice_id, limit = 20, offset = 0 } = params;
      
      let query = 'SELECT * FROM payments WHERE 1=1';
      const queryParams = [];
      let paramCount = 0;

      if (invoice_id) {
        queryParams.push(invoice_id);
        query += ` AND invoice_id = $${++paramCount}`;
      }

      query += ' ORDER BY payment_date DESC';
      
      queryParams.push(limit);
      query += ` LIMIT $${++paramCount}`;
      
      queryParams.push(offset);
      query += ` OFFSET $${++paramCount}`;

      const result = await pool.query(query, queryParams);
      
      return {
        data: result.rows,
        total: result.rowCount,
        limit,
        offset
      };
    } catch (error) {
      console.error('Error getting payments:', error);
      return { data: [], total: 0, error: 'Failed to fetch payments' };
    }
  }

  /**
   * Create billing account
   */
  async createBillingAccount(accountData) {
    try {
      const { patient_id, hospital_id, credit_limit = 0, payment_terms = 'immediate' } = accountData;
      
      const query = `
        INSERT INTO billing_accounts (patient_id, hospital_id, credit_limit, payment_terms, balance, status, created_at)
        VALUES ($1, $2, $3, $4, 0, 'active', NOW())
        RETURNING *
      `;
      
      const result = await pool.query(query, [patient_id, hospital_id, credit_limit, payment_terms]);
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Error creating billing account:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Submit insurance claim
   */
  async submitInsuranceClaim(claimData) {
    try {
      const { invoice_id, insurance_provider, policy_number, claim_amount, diagnosis_codes = [] } = claimData;
      
      const query = `
        INSERT INTO insurance_claims (
          invoice_id, insurance_provider, policy_number, 
          claim_amount, diagnosis_codes, submission_date, status
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), 'pending')
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        invoice_id, 
        insurance_provider, 
        policy_number, 
        claim_amount, 
        JSON.stringify(diagnosis_codes)
      ]);
      
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Error submitting insurance claim:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(patientId) {
    try {
      const query = `
        SELECT 
          p.*,
          i.invoice_number,
          i.total_amount as invoice_amount
        FROM payments p
        JOIN invoices i ON p.invoice_id = i.id
        WHERE i.patient_id = $1
        ORDER BY p.payment_date DESC
        LIMIT 50
      `;
      
      const result = await pool.query(query, [patientId]);
      
      return {
        success: true,
        data: result.rows
      };
    } catch (error) {
      console.error('Error getting payment history:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  }
}

module.exports = new BillingEnhancedService();

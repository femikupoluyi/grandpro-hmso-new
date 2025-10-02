const express = require('express');
const router = express.Router();
const pool = require('../../../config/database');

// ============================================
// SERVICE PRICING
// ============================================

// Get all service prices
router.get('/services', async (req, res) => {
  try {
    const { hospital_id, category, active = true } = req.query;
    
    let query = `
      SELECT * FROM service_prices 
      WHERE is_active = $1`;
    
    const values = [active];
    let valueIndex = 2;

    if (hospital_id) {
      query += ` AND hospital_id = $${valueIndex}`;
      values.push(hospital_id);
      valueIndex++;
    }

    if (category) {
      query += ` AND service_category = $${valueIndex}`;
      values.push(category);
      valueIndex++;
    }

    query += ` ORDER BY service_category, service_name`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
      error: error.message
    });
  }
});

// Add new service price
router.post('/services', async (req, res) => {
  try {
    const {
      service_code, service_name, service_category, department,
      unit_price, nhis_price, hmo_price, vat_applicable,
      effective_date, expiry_date, hospital_id
    } = req.body;

    const query = `
      INSERT INTO service_prices (
        service_code, service_name, service_category, department,
        unit_price, nhis_price, hmo_price, vat_applicable,
        effective_date, expiry_date, hospital_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`;

    const values = [
      service_code, service_name, service_category, department,
      unit_price, nhis_price, hmo_price, vat_applicable !== false,
      effective_date, expiry_date, hospital_id
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Service price added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add service',
      error: error.message
    });
  }
});

// ============================================
// BILL GENERATION
// ============================================

// Generate bill for encounter
router.post('/bills', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      patient_id, encounter_id, items, discount_amount = 0,
      payment_method, hospital_id
    } = req.body;

    // Get patient billing account
    const accountResult = await client.query(
      'SELECT * FROM billing_accounts WHERE patient_id = $1',
      [patient_id]
    );

    if (accountResult.rows.length === 0) {
      throw new Error('Billing account not found for patient');
    }

    const billingAccount = accountResult.rows[0];
    
    // Generate bill number
    const billNumber = `BILL${Date.now().toString().slice(-10)}`;

    // Calculate bill amounts
    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const serviceResult = await client.query(
        'SELECT * FROM service_prices WHERE service_code = $1',
        [item.service_code]
      );

      if (serviceResult.rows.length === 0) {
        throw new Error(`Service not found: ${item.service_code}`);
      }

      const service = serviceResult.rows[0];
      
      // Determine price based on payer type
      let unitPrice = service.unit_price;
      if (billingAccount.account_type === 'NHIS' && service.nhis_price) {
        unitPrice = service.nhis_price;
      } else if (billingAccount.account_type === 'HMO' && service.hmo_price) {
        unitPrice = service.hmo_price;
      }

      const quantity = item.quantity || 1;
      const itemTotal = unitPrice * quantity;
      subtotal += itemTotal;

      processedItems.push({
        service_id: service.id,
        service_code: service.service_code,
        service_name: service.service_name,
        quantity: quantity,
        unit_price: unitPrice,
        discount_percent: item.discount_percent || 0,
        tax_percent: service.vat_applicable ? 7.5 : 0,
        total_price: itemTotal
      });
    }

    // Calculate tax (7.5% VAT in Nigeria)
    const taxAmount = subtotal * 0.075;
    const totalAmount = subtotal + taxAmount - discount_amount;

    // Create bill
    const billQuery = `
      INSERT INTO bills (
        bill_number, patient_id, encounter_id, billing_account_id,
        bill_date, due_date, subtotal, discount_amount, tax_amount,
        total_amount, balance_amount, payment_method, payment_status,
        hospital_id, created_by
      ) VALUES (
        $1, $2, $3, $4, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days',
        $5, $6, $7, $8, $9, $10, $11, $12, $13
      ) RETURNING *`;

    const billValues = [
      billNumber, patient_id, encounter_id, billingAccount.id,
      subtotal, discount_amount, taxAmount, totalAmount, totalAmount,
      payment_method, 'UNPAID', hospital_id, req.user?.id
    ];

    const billResult = await client.query(billQuery, billValues);
    const bill = billResult.rows[0];

    // Insert bill items
    for (const item of processedItems) {
      await client.query(`
        INSERT INTO bill_items (
          bill_id, service_id, service_code, service_name, quantity,
          unit_price, discount_percent, tax_percent, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          bill.id, item.service_id, item.service_code, item.service_name,
          item.quantity, item.unit_price, item.discount_percent,
          item.tax_percent, item.total_price
        ]
      );
    }

    // Update billing account balance
    await client.query(`
      UPDATE billing_accounts 
      SET current_balance = current_balance + $1,
          total_billed = total_billed + $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [totalAmount, billingAccount.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Bill generated successfully',
      data: {
        ...bill,
        items: processedItems
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generating bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate bill',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get bill details
router.get('/bills/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const billQuery = `
      SELECT b.*, 
        p.first_name, p.last_name, p.patient_number,
        ba.account_type, ba.primary_payer
      FROM bills b
      JOIN patients p ON p.id = b.patient_id
      JOIN billing_accounts ba ON ba.id = b.billing_account_id
      WHERE b.id = $1`;

    const billResult = await pool.query(billQuery, [id]);

    if (billResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bill not found'
      });
    }

    // Get bill items
    const itemsResult = await pool.query(
      'SELECT * FROM bill_items WHERE bill_id = $1',
      [id]
    );

    // Get payments
    const paymentsResult = await pool.query(
      'SELECT * FROM payments WHERE bill_id = $1 ORDER BY payment_date DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...billResult.rows[0],
        items: itemsResult.rows,
        payments: paymentsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching bill:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error.message
    });
  }
});

// Get patient bills
router.get('/patients/:patient_id/bills', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.*, 
        (SELECT COUNT(*) FROM bill_items WHERE bill_id = b.id) as item_count,
        (SELECT SUM(amount) FROM payments WHERE bill_id = b.id) as total_paid
      FROM bills b
      WHERE b.patient_id = $1`;

    const values = [patient_id];
    let valueIndex = 2;

    if (status) {
      query += ` AND b.payment_status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    query += ` ORDER BY b.bill_date DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM bills WHERE patient_id = $1';
    const countValues = [patient_id];
    
    if (status) {
      countQuery += ' AND payment_status = $2';
      countValues.push(status);
    }

    const countResult = await pool.query(countQuery, countValues);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patient bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient bills',
      error: error.message
    });
  }
});

// ============================================
// PAYMENT PROCESSING
// ============================================

// Process payment
router.post('/payments', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      bill_id, amount, payment_method, reference_number,
      bank_name, card_last_four, notes, hospital_id
    } = req.body;

    // Get bill details
    const billResult = await client.query(
      'SELECT * FROM bills WHERE id = $1',
      [bill_id]
    );

    if (billResult.rows.length === 0) {
      throw new Error('Bill not found');
    }

    const bill = billResult.rows[0];

    // Generate payment number
    const paymentNumber = `PAY${Date.now().toString().slice(-10)}`;

    // Generate receipt number
    const receiptNumber = `RCP${Date.now().toString().slice(-10)}`;

    // Create payment record
    const paymentQuery = `
      INSERT INTO payments (
        payment_number, bill_id, patient_id, payment_date, amount,
        payment_method, reference_number, bank_name, card_last_four,
        receipt_number, notes, hospital_id, collected_by
      ) VALUES (
        $1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING *`;

    const paymentValues = [
      paymentNumber, bill_id, bill.patient_id, amount, payment_method,
      reference_number, bank_name, card_last_four, receiptNumber,
      notes, hospital_id, req.user?.id
    ];

    const paymentResult = await client.query(paymentQuery, paymentValues);

    // Update bill paid amount and status
    const newPaidAmount = parseFloat(bill.paid_amount) + parseFloat(amount);
    const newBalance = parseFloat(bill.total_amount) - newPaidAmount;
    const paymentStatus = newBalance <= 0 ? 'PAID' : 'PARTIAL';

    await client.query(`
      UPDATE bills 
      SET paid_amount = $1, balance_amount = $2, payment_status = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4`,
      [newPaidAmount, newBalance, paymentStatus, bill_id]
    );

    // Update billing account
    await client.query(`
      UPDATE billing_accounts 
      SET current_balance = current_balance - $1,
          total_paid = total_paid + $1,
          last_payment_date = CURRENT_DATE,
          updated_at = CURRENT_TIMESTAMP
      WHERE patient_id = $2`,
      [amount, bill.patient_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: paymentResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get payment receipt
router.get('/payments/:id/receipt', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT pay.*, 
        p.first_name, p.last_name, p.patient_number,
        b.bill_number, b.total_amount, b.balance_amount,
        h.name as hospital_name, h.address as hospital_address,
        h.phone as hospital_phone
      FROM payments pay
      JOIN patients p ON p.id = pay.patient_id
      JOIN bills b ON b.id = pay.bill_id
      JOIN hospitals h ON h.id = pay.hospital_id
      WHERE pay.id = $1`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching receipt:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch receipt',
      error: error.message
    });
  }
});

// ============================================
// INSURANCE CLAIMS
// ============================================

// Submit insurance claim
router.post('/bills/:bill_id/claim', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { bill_id } = req.params;
    const { claim_amount, authorization_code, documents } = req.body;

    // Get bill and patient details
    const billResult = await client.query(`
      SELECT b.*, ba.account_type, ba.primary_payer, p.insurance_policy_number
      FROM bills b
      JOIN billing_accounts ba ON ba.id = b.billing_account_id
      JOIN patients p ON p.id = b.patient_id
      WHERE b.id = $1`,
      [bill_id]
    );

    if (billResult.rows.length === 0) {
      throw new Error('Bill not found');
    }

    const bill = billResult.rows[0];

    if (bill.account_type === 'CASH') {
      throw new Error('Cannot submit insurance claim for cash account');
    }

    // Generate claim number
    const claimNumber = `CLM${Date.now().toString().slice(-10)}`;

    // Update bill with claim information
    await client.query(`
      UPDATE bills 
      SET insurance_claim_number = $1,
          insurance_approved_amount = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
      [claimNumber, claim_amount, bill_id]
    );

    // TODO: Integrate with actual insurance provider API
    // For now, we'll just record the claim

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Insurance claim submitted successfully',
      data: {
        claim_number: claimNumber,
        claim_amount: claim_amount,
        status: 'SUBMITTED'
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting claim:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit insurance claim',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ============================================
// BILLING REPORTS
// ============================================

// Get billing summary
router.get('/reports/summary', async (req, res) => {
  try {
    const { hospital_id, start_date, end_date } = req.query;

    const today = new Date().toISOString().split('T')[0];
    const startDate = start_date || today;
    const endDate = end_date || today;

    let conditions = ['b.bill_date BETWEEN $1 AND $2'];
    const values = [startDate, endDate];
    let valueIndex = 3;

    if (hospital_id) {
      conditions.push(`b.hospital_id = $${valueIndex}`);
      values.push(hospital_id);
    }

    const whereClause = conditions.join(' AND ');

    // Get summary statistics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_bills,
        SUM(total_amount) as total_billed,
        SUM(paid_amount) as total_collected,
        SUM(balance_amount) as total_outstanding,
        COUNT(CASE WHEN payment_status = 'PAID' THEN 1 END) as paid_bills,
        COUNT(CASE WHEN payment_status = 'PARTIAL' THEN 1 END) as partial_bills,
        COUNT(CASE WHEN payment_status = 'UNPAID' THEN 1 END) as unpaid_bills
      FROM bills b
      WHERE ${whereClause}`;

    const summaryResult = await pool.query(summaryQuery, values);

    // Get payment method breakdown
    const paymentQuery = `
      SELECT payment_method, COUNT(*) as count, SUM(amount) as total
      FROM payments p
      JOIN bills b ON b.id = p.bill_id
      WHERE ${whereClause}
      GROUP BY payment_method`;

    const paymentResult = await pool.query(paymentQuery, values);

    // Get department revenue
    const deptQuery = `
      SELECT e.department, COUNT(b.*) as bills, SUM(b.total_amount) as revenue
      FROM bills b
      LEFT JOIN encounters e ON e.id = b.encounter_id
      WHERE ${whereClause}
      GROUP BY e.department
      ORDER BY revenue DESC`;

    const deptResult = await pool.query(deptQuery, values);

    res.json({
      success: true,
      data: {
        summary: summaryResult.rows[0],
        payment_methods: paymentResult.rows,
        department_revenue: deptResult.rows,
        period: {
          start_date: startDate,
          end_date: endDate
        }
      }
    });
  } catch (error) {
    console.error('Error generating billing summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate billing summary',
      error: error.message
    });
  }
});

// Get outstanding bills
router.get('/reports/outstanding', async (req, res) => {
  try {
    const { hospital_id, min_days = 30 } = req.query;

    let query = `
      SELECT b.*, 
        p.first_name, p.last_name, p.patient_number, p.phone_primary,
        CURRENT_DATE - b.bill_date as days_outstanding
      FROM bills b
      JOIN patients p ON p.id = b.patient_id
      WHERE b.payment_status IN ('UNPAID', 'PARTIAL')
        AND b.balance_amount > 0
        AND CURRENT_DATE - b.bill_date >= $1`;

    const values = [min_days];
    let valueIndex = 2;

    if (hospital_id) {
      query += ` AND b.hospital_id = $${valueIndex}`;
      values.push(hospital_id);
    }

    query += ` ORDER BY b.bill_date ASC`;

    const result = await pool.query(query, values);

    const totalOutstanding = result.rows.reduce((sum, bill) => 
      sum + parseFloat(bill.balance_amount), 0
    );

    res.json({
      success: true,
      data: {
        bills: result.rows,
        summary: {
          total_bills: result.rows.length,
          total_outstanding: totalOutstanding,
          average_days: Math.round(
            result.rows.reduce((sum, bill) => sum + bill.days_outstanding, 0) / 
            result.rows.length
          )
        }
      }
    });
  } catch (error) {
    console.error('Error fetching outstanding bills:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch outstanding bills',
      error: error.message
    });
  }
});

module.exports = router;

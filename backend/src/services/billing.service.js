const pool = require('../config/database');

class BillingService {
  // Generate bill for encounter
  async generateBill(billData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate bill number
      const billNumber = `BILL${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

      // Create main bill
      const billQuery = `
        INSERT INTO bills (
          bill_number, patient_id, encounter_id, bill_date,
          payment_method, insurance_provider, insurance_number,
          nhis_number, hmo_provider, total_amount, insurance_coverage,
          patient_amount, discount_amount, tax_amount, status,
          due_date, created_by, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW())
        RETURNING *
      `;

      // Calculate amounts based on payment method
      let insuranceCoverage = 0;
      let patientAmount = billData.totalAmount;
      let discountAmount = billData.discountAmount || 0;

      if (billData.paymentMethod === 'INSURANCE' || billData.paymentMethod === 'NHIS') {
        // NHIS typically covers 70% for enrolled patients
        insuranceCoverage = billData.totalAmount * 0.7;
        patientAmount = billData.totalAmount * 0.3;
      } else if (billData.paymentMethod === 'HMO') {
        // HMO coverage varies, default to 80%
        insuranceCoverage = billData.totalAmount * 0.8;
        patientAmount = billData.totalAmount * 0.2;
      }

      // Apply discount if cash payment
      if (billData.paymentMethod === 'CASH' && billData.cashDiscount) {
        discountAmount = billData.totalAmount * 0.05; // 5% cash discount
        patientAmount = billData.totalAmount - discountAmount;
      }

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms

      const values = [
        billNumber,
        billData.patientId,
        billData.encounterId,
        new Date(),
        billData.paymentMethod,
        billData.insuranceProvider,
        billData.insuranceNumber,
        billData.nhisNumber,
        billData.hmoProvider,
        billData.totalAmount,
        insuranceCoverage,
        patientAmount,
        discountAmount,
        billData.taxAmount || 0,
        'PENDING',
        dueDate,
        billData.createdBy
      ];

      const billResult = await client.query(billQuery, values);
      const bill = billResult.rows[0];

      // Add bill items
      if (billData.items && billData.items.length > 0) {
        for (const item of billData.items) {
          const itemQuery = `
            INSERT INTO bill_items (
              bill_id, item_type, item_code, description,
              quantity, unit_price, total_price, 
              insurance_covered, patient_pays
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          `;

          const itemInsuranceCovered = item.totalPrice * (insuranceCoverage / billData.totalAmount);
          const itemPatientPays = item.totalPrice - itemInsuranceCovered;

          await client.query(itemQuery, [
            bill.id,
            item.itemType, // CONSULTATION, MEDICATION, LAB_TEST, PROCEDURE, etc.
            item.itemCode,
            item.description,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
            itemInsuranceCovered,
            itemPatientPays
          ]);
        }
      }

      // If insurance/NHIS/HMO, create claim
      if (insuranceCoverage > 0) {
        const claimQuery = `
          INSERT INTO insurance_claims (
            bill_id, claim_number, provider_type, provider_name,
            policy_number, claim_amount, status, submitted_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;

        const claimNumber = `CLM${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

        await client.query(claimQuery, [
          bill.id,
          claimNumber,
          billData.paymentMethod, // INSURANCE, NHIS, HMO
          billData.insuranceProvider || billData.hmoProvider,
          billData.insuranceNumber || billData.nhisNumber,
          insuranceCoverage,
          'SUBMITTED'
        ]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        bill: {
          ...bill,
          billNumber,
          insuranceCoverage,
          patientAmount
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Process payment
  async processPayment(paymentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record payment
      const paymentQuery = `
        INSERT INTO payments (
          bill_id, payment_date, payment_method, amount_paid,
          reference_number, received_by, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;

      const referenceNumber = `PAY${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

      const values = [
        paymentData.billId,
        new Date(),
        paymentData.paymentMethod, // CASH, CARD, BANK_TRANSFER, MOBILE_MONEY
        paymentData.amountPaid,
        referenceNumber,
        paymentData.receivedBy,
        paymentData.notes,
        'COMPLETED'
      ];

      const paymentResult = await client.query(paymentQuery, values);
      const payment = paymentResult.rows[0];

      // Update bill status
      const billQuery = `
        SELECT 
          total_amount, patient_amount, 
          COALESCE(SUM(p.amount_paid), 0) as total_paid
        FROM bills b
        LEFT JOIN payments p ON b.id = p.bill_id
        WHERE b.id = $1
        GROUP BY b.id, b.total_amount, b.patient_amount
      `;

      const billResult = await client.query(billQuery, [paymentData.billId]);
      const billInfo = billResult.rows[0];

      const totalPaid = parseFloat(billInfo.total_paid);
      const patientAmount = parseFloat(billInfo.patient_amount);

      let billStatus = 'PARTIAL';
      if (totalPaid >= patientAmount) {
        billStatus = 'PAID';
      }

      await client.query(
        'UPDATE bills SET status = $1, last_payment_date = NOW() WHERE id = $2',
        [billStatus, paymentData.billId]
      );

      // Update daily revenue
      await client.query(`
        INSERT INTO daily_revenue (
          date, hospital_id, cash_amount, card_amount, 
          transfer_amount, insurance_amount, total_amount
        ) VALUES (
          CURRENT_DATE, $1, 
          CASE WHEN $2 = 'CASH' THEN $3 ELSE 0 END,
          CASE WHEN $2 = 'CARD' THEN $3 ELSE 0 END,
          CASE WHEN $2 = 'BANK_TRANSFER' THEN $3 ELSE 0 END,
          CASE WHEN $2 IN ('INSURANCE', 'NHIS', 'HMO') THEN $3 ELSE 0 END,
          $3
        )
        ON CONFLICT (date, hospital_id) DO UPDATE
        SET 
          cash_amount = daily_revenue.cash_amount + CASE WHEN $2 = 'CASH' THEN $3 ELSE 0 END,
          card_amount = daily_revenue.card_amount + CASE WHEN $2 = 'CARD' THEN $3 ELSE 0 END,
          transfer_amount = daily_revenue.transfer_amount + CASE WHEN $2 = 'BANK_TRANSFER' THEN $3 ELSE 0 END,
          insurance_amount = daily_revenue.insurance_amount + CASE WHEN $2 IN ('INSURANCE', 'NHIS', 'HMO') THEN $3 ELSE 0 END,
          total_amount = daily_revenue.total_amount + $3
      `, [paymentData.hospitalId || 1, paymentData.paymentMethod, paymentData.amountPaid]);

      await client.query('COMMIT');

      return {
        success: true,
        payment,
        referenceNumber,
        billStatus
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get pending bills
  async getPendingBills(filters = {}) {
    try {
      let query = `
        SELECT 
          b.*,
          p.first_name, p.last_name, p.registration_number,
          COALESCE(SUM(pay.amount_paid), 0) as amount_paid,
          (b.patient_amount - COALESCE(SUM(pay.amount_paid), 0)) as balance_due
        FROM bills b
        JOIN patients p ON b.patient_id = p.id
        LEFT JOIN payments pay ON b.id = pay.bill_id
        WHERE b.status IN ('PENDING', 'PARTIAL')
      `;

      const values = [];
      let paramCount = 0;

      if (filters.hospitalId) {
        paramCount++;
        query += ` AND b.hospital_id = $${paramCount}`;
        values.push(filters.hospitalId);
      }

      if (filters.paymentMethod) {
        paramCount++;
        query += ` AND b.payment_method = $${paramCount}`;
        values.push(filters.paymentMethod);
      }

      if (filters.overdueDays) {
        query += ` AND b.due_date < CURRENT_DATE - INTERVAL '${filters.overdueDays} days'`;
      }

      query += `
        GROUP BY b.id, p.id, p.first_name, p.last_name, p.registration_number
        ORDER BY b.due_date ASC
        LIMIT 100
      `;

      const result = await pool.query(query, values);

      return {
        success: true,
        bills: result.rows,
        summary: {
          totalBills: result.rows.length,
          totalAmount: result.rows.reduce((sum, bill) => sum + parseFloat(bill.patient_amount), 0),
          totalBalance: result.rows.reduce((sum, bill) => sum + parseFloat(bill.balance_due), 0)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Process insurance claim
  async processInsuranceClaim(claimData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update claim status
      const updateQuery = `
        UPDATE insurance_claims
        SET 
          status = $1,
          approved_amount = $2,
          denial_reason = $3,
          processed_date = NOW(),
          processed_by = $4
        WHERE id = $5
        RETURNING *
      `;

      const values = [
        claimData.status, // APPROVED, DENIED, PARTIAL
        claimData.approvedAmount,
        claimData.denialReason,
        claimData.processedBy,
        claimData.claimId
      ];

      const result = await client.query(updateQuery, values);
      const claim = result.rows[0];

      // If approved, create payment record
      if (claimData.status === 'APPROVED' && claimData.approvedAmount > 0) {
        const paymentQuery = `
          INSERT INTO payments (
            bill_id, payment_date, payment_method, amount_paid,
            reference_number, notes, status
          ) VALUES ($1, NOW(), $2, $3, $4, $5, 'COMPLETED')
        `;

        const referenceNumber = `INS${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;

        await client.query(paymentQuery, [
          claim.bill_id,
          'INSURANCE_CLAIM',
          claimData.approvedAmount,
          referenceNumber,
          `Insurance claim ${claim.claim_number} approved`
        ]);

        // Update bill status
        await client.query(
          'UPDATE bills SET insurance_payment_received = $1 WHERE id = $2',
          [claimData.approvedAmount, claim.bill_id]
        );
      }

      await client.query('COMMIT');

      return {
        success: true,
        claim
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Generate revenue report
  async getRevenueReport(startDate, endDate, hospitalId) {
    try {
      const query = `
        SELECT 
          DATE(b.bill_date) as date,
          COUNT(DISTINCT b.id) as total_bills,
          COUNT(DISTINCT b.patient_id) as unique_patients,
          SUM(b.total_amount) as gross_revenue,
          SUM(b.discount_amount) as total_discounts,
          SUM(b.patient_amount) as net_revenue,
          SUM(CASE WHEN b.payment_method = 'CASH' THEN b.patient_amount ELSE 0 END) as cash_revenue,
          SUM(CASE WHEN b.payment_method = 'CARD' THEN b.patient_amount ELSE 0 END) as card_revenue,
          SUM(CASE WHEN b.payment_method = 'BANK_TRANSFER' THEN b.patient_amount ELSE 0 END) as transfer_revenue,
          SUM(CASE WHEN b.payment_method = 'NHIS' THEN b.insurance_coverage ELSE 0 END) as nhis_revenue,
          SUM(CASE WHEN b.payment_method = 'HMO' THEN b.insurance_coverage ELSE 0 END) as hmo_revenue,
          SUM(CASE WHEN b.payment_method = 'INSURANCE' THEN b.insurance_coverage ELSE 0 END) as insurance_revenue,
          SUM(COALESCE(p.amount_paid, 0)) as collected_amount,
          SUM(b.patient_amount - COALESCE(p.amount_paid, 0)) as outstanding_amount
        FROM bills b
        LEFT JOIN (
          SELECT bill_id, SUM(amount_paid) as amount_paid
          FROM payments
          GROUP BY bill_id
        ) p ON b.id = p.bill_id
        WHERE b.bill_date BETWEEN $1 AND $2
        ${hospitalId ? 'AND b.hospital_id = $3' : ''}
        GROUP BY DATE(b.bill_date)
        ORDER BY date DESC
      `;

      const values = hospitalId ? [startDate, endDate, hospitalId] : [startDate, endDate];
      const result = await pool.query(query, values);

      // Calculate summary
      const summary = result.rows.reduce((acc, row) => ({
        totalBills: acc.totalBills + parseInt(row.total_bills),
        uniquePatients: acc.uniquePatients + parseInt(row.unique_patients),
        grossRevenue: acc.grossRevenue + parseFloat(row.gross_revenue),
        netRevenue: acc.netRevenue + parseFloat(row.net_revenue),
        collectedAmount: acc.collectedAmount + parseFloat(row.collected_amount),
        outstandingAmount: acc.outstandingAmount + parseFloat(row.outstanding_amount),
        cashRevenue: acc.cashRevenue + parseFloat(row.cash_revenue),
        cardRevenue: acc.cardRevenue + parseFloat(row.card_revenue),
        transferRevenue: acc.transferRevenue + parseFloat(row.transfer_revenue),
        nhisRevenue: acc.nhisRevenue + parseFloat(row.nhis_revenue),
        hmoRevenue: acc.hmoRevenue + parseFloat(row.hmo_revenue),
        insuranceRevenue: acc.insuranceRevenue + parseFloat(row.insurance_revenue)
      }), {
        totalBills: 0,
        uniquePatients: 0,
        grossRevenue: 0,
        netRevenue: 0,
        collectedAmount: 0,
        outstandingAmount: 0,
        cashRevenue: 0,
        cardRevenue: 0,
        transferRevenue: 0,
        nhisRevenue: 0,
        hmoRevenue: 0,
        insuranceRevenue: 0
      });

      return {
        success: true,
        daily: result.rows,
        summary,
        collectionRate: summary.netRevenue > 0 ? 
          ((summary.collectedAmount / summary.netRevenue) * 100).toFixed(2) : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Get department revenue
  async getDepartmentRevenue(departmentId, period = '30days') {
    try {
      const intervalMap = {
        '7days': '7 days',
        '30days': '30 days',
        '90days': '90 days',
        '1year': '1 year'
      };

      const query = `
        SELECT 
          d.name as department_name,
          COUNT(DISTINCT b.id) as total_bills,
          COUNT(DISTINCT b.patient_id) as unique_patients,
          SUM(b.total_amount) as gross_revenue,
          SUM(b.patient_amount) as net_revenue,
          SUM(COALESCE(p.amount_paid, 0)) as collected_amount,
          AVG(b.patient_amount) as avg_bill_amount,
          COUNT(DISTINCT e.doctor_id) as active_doctors
        FROM bills b
        JOIN encounters e ON b.encounter_id = e.id
        JOIN departments d ON e.department_id = d.id
        LEFT JOIN (
          SELECT bill_id, SUM(amount_paid) as amount_paid
          FROM payments
          GROUP BY bill_id
        ) p ON b.id = p.bill_id
        WHERE e.department_id = $1
        AND b.bill_date >= CURRENT_DATE - INTERVAL '${intervalMap[period] || '30 days'}'
        GROUP BY d.id, d.name
      `;

      const result = await pool.query(query, [departmentId]);

      return {
        success: true,
        revenue: result.rows[0] || {
          department_name: 'Unknown',
          total_bills: 0,
          unique_patients: 0,
          gross_revenue: 0,
          net_revenue: 0,
          collected_amount: 0,
          avg_bill_amount: 0,
          active_doctors: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BillingService();

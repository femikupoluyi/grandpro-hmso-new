const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { format, addDays, startOfDay, endOfDay } = require('date-fns');

class HospitalManagementService {
  /**
   * Electronic Medical Records (EMR) Management
   */
  async createPatientRecord(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const recordId = uuidv4();
      const {
        patientId,
        hospitalId,
        departmentId,
        doctorId,
        visitType,
        chiefComplaint,
        presentIllness,
        pastMedicalHistory,
        familyHistory,
        socialHistory,
        allergies,
        currentMedications,
        vitalSigns,
        physicalExamination,
        diagnosis,
        treatmentPlan,
        prescriptions,
        labOrders,
        imagingOrders,
        followUpDate
      } = data;

      // Create main medical record
      const recordResult = await client.query(
        `INSERT INTO medical_records (
          id, patient_id, hospital_id, department_id, doctor_id,
          visit_type, visit_date, chief_complaint, present_illness,
          past_medical_history, family_history, social_history,
          allergies, current_medications, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *`,
        [
          recordId, patientId, hospitalId, departmentId, doctorId,
          visitType, chiefComplaint, presentIllness, pastMedicalHistory,
          familyHistory, socialHistory, JSON.stringify(allergies),
          JSON.stringify(currentMedications), 'active'
        ]
      );

      // Store vital signs
      if (vitalSigns) {
        await client.query(
          `INSERT INTO vital_signs (
            medical_record_id, blood_pressure, pulse_rate, temperature,
            respiratory_rate, oxygen_saturation, weight, height, bmi,
            recorded_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            recordId, vitalSigns.bloodPressure, vitalSigns.pulseRate,
            vitalSigns.temperature, vitalSigns.respiratoryRate,
            vitalSigns.oxygenSaturation, vitalSigns.weight,
            vitalSigns.height, vitalSigns.bmi
          ]
        );
      }

      // Store diagnosis
      if (diagnosis && diagnosis.length > 0) {
        for (const diag of diagnosis) {
          await client.query(
            `INSERT INTO diagnoses (
              medical_record_id, icd_code, diagnosis_description,
              diagnosis_type, created_at
            ) VALUES ($1, $2, $3, $4, NOW())`,
            [recordId, diag.icdCode, diag.description, diag.type || 'primary']
          );
        }
      }

      // Store prescriptions
      if (prescriptions && prescriptions.length > 0) {
        for (const prescription of prescriptions) {
          await client.query(
            `INSERT INTO prescriptions (
              id, medical_record_id, medication_name, dosage,
              frequency, duration, route, instructions,
              prescribed_by, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
            [
              uuidv4(), recordId, prescription.medication,
              prescription.dosage, prescription.frequency,
              prescription.duration, prescription.route,
              prescription.instructions, doctorId, 'active'
            ]
          );
        }
      }

      // Store lab orders
      if (labOrders && labOrders.length > 0) {
        for (const labOrder of labOrders) {
          await client.query(
            `INSERT INTO lab_orders (
              id, medical_record_id, test_name, test_code,
              priority, clinical_notes, ordered_by,
              status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [
              uuidv4(), recordId, labOrder.testName,
              labOrder.testCode, labOrder.priority || 'routine',
              labOrder.clinicalNotes, doctorId, 'pending'
            ]
          );
        }
      }

      await client.query('COMMIT');
      return recordResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Billing and Revenue Management
   */
  async createInvoice(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const invoiceId = uuidv4();
      const {
        patientId,
        hospitalId,
        visitId,
        items,
        paymentMethod,
        insuranceId,
        discounts
      } = data;

      // Calculate totals
      let subtotal = 0;
      let totalDiscount = 0;

      for (const item of items) {
        subtotal += item.quantity * item.unitPrice;
      }

      if (discounts) {
        for (const discount of discounts) {
          if (discount.type === 'percentage') {
            totalDiscount += subtotal * (discount.value / 100);
          } else {
            totalDiscount += discount.value;
          }
        }
      }

      const totalAmount = subtotal - totalDiscount;
      const taxAmount = totalAmount * 0.075; // 7.5% VAT in Nigeria
      const finalAmount = totalAmount + taxAmount;

      // Create invoice
      const invoiceResult = await client.query(
        `INSERT INTO invoices (
          id, patient_id, hospital_id, visit_id, invoice_number,
          invoice_date, due_date, subtotal, discount_amount,
          tax_amount, total_amount, payment_method, payment_status,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *`,
        [
          invoiceId, patientId, hospitalId, visitId,
          `INV-${Date.now()}`, addDays(new Date(), 30),
          subtotal, totalDiscount, taxAmount, finalAmount,
          paymentMethod, 'pending'
        ]
      );

      // Create invoice items
      for (const item of items) {
        await client.query(
          `INSERT INTO invoice_items (
            invoice_id, item_code, item_description,
            quantity, unit_price, amount, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            invoiceId, item.code, item.description,
            item.quantity, item.unitPrice,
            item.quantity * item.unitPrice
          ]
        );
      }

      // Handle insurance claim if applicable
      if (insuranceId) {
        const claimId = uuidv4();
        await client.query(
          `INSERT INTO insurance_claims (
            id, invoice_id, insurance_id, claim_amount,
            status, submitted_date
          ) VALUES ($1, $2, $3, $4, $5, NOW())`,
          [claimId, invoiceId, insuranceId, finalAmount, 'submitted']
        );
      }

      await client.query('COMMIT');
      return invoiceResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process Payment
   */
  async processPayment(invoiceId, paymentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const paymentId = uuidv4();
      const { amount, method, reference, notes } = paymentData;

      // Get invoice details
      const invoiceResult = await client.query(
        'SELECT * FROM invoices WHERE id = $1',
        [invoiceId]
      );

      if (invoiceResult.rows.length === 0) {
        throw new Error('Invoice not found');
      }

      const invoice = invoiceResult.rows[0];

      // Record payment
      await client.query(
        `INSERT INTO payments (
          id, invoice_id, amount, payment_method,
          payment_reference, payment_date, notes,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, NOW())`,
        [
          paymentId, invoiceId, amount, method,
          reference, notes, 'completed'
        ]
      );

      // Update invoice payment status
      const totalPaidResult = await client.query(
        `SELECT SUM(amount) as total_paid
        FROM payments
        WHERE invoice_id = $1 AND status = 'completed'`,
        [invoiceId]
      );

      const totalPaid = parseFloat(totalPaidResult.rows[0].total_paid || 0);
      const paymentStatus = totalPaid >= invoice.total_amount ? 'paid' : 'partial';

      await client.query(
        `UPDATE invoices
        SET payment_status = $1, updated_at = NOW()
        WHERE id = $2`,
        [paymentStatus, invoiceId]
      );

      // Update revenue tracking
      await client.query(
        `INSERT INTO revenue_tracking (
          hospital_id, department_id, amount, payment_method,
          transaction_date, created_at
        ) VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [invoice.hospital_id, invoice.department_id, amount, method]
      );

      await client.query('COMMIT');
      return { paymentId, status: paymentStatus };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Inventory Management
   */
  async updateInventory(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        itemId,
        hospitalId,
        transactionType,
        quantity,
        unitCost,
        supplier,
        batchNumber,
        expiryDate,
        notes
      } = data;

      // Get current stock
      const stockResult = await client.query(
        `SELECT * FROM inventory WHERE item_id = $1 AND hospital_id = $2`,
        [itemId, hospitalId]
      );

      let currentStock = 0;
      let inventoryId;

      if (stockResult.rows.length > 0) {
        currentStock = stockResult.rows[0].current_stock;
        inventoryId = stockResult.rows[0].id;
      } else {
        // Create new inventory record
        inventoryId = uuidv4();
        await client.query(
          `INSERT INTO inventory (
            id, item_id, hospital_id, current_stock,
            reorder_level, created_at
          ) VALUES ($1, $2, $3, 0, 10, NOW())`,
          [inventoryId, itemId, hospitalId]
        );
      }

      // Calculate new stock
      let newStock = currentStock;
      if (transactionType === 'receipt') {
        newStock += quantity;
      } else if (transactionType === 'issue') {
        newStock -= quantity;
        if (newStock < 0) {
          throw new Error('Insufficient stock');
        }
      }

      // Update inventory
      await client.query(
        `UPDATE inventory
        SET current_stock = $1, last_updated = NOW()
        WHERE id = $2`,
        [newStock, inventoryId]
      );

      // Record transaction
      await client.query(
        `INSERT INTO inventory_transactions (
          id, inventory_id, transaction_type, quantity,
          unit_cost, total_cost, supplier, batch_number,
          expiry_date, notes, transaction_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
        [
          uuidv4(), inventoryId, transactionType, quantity,
          unitCost, quantity * unitCost, supplier,
          batchNumber, expiryDate, notes
        ]
      );

      // Check reorder level
      const inventory = await client.query(
        `SELECT * FROM inventory WHERE id = $1`,
        [inventoryId]
      );

      if (inventory.rows[0].current_stock <= inventory.rows[0].reorder_level) {
        // Create reorder alert
        await client.query(
          `INSERT INTO inventory_alerts (
            inventory_id, alert_type, message, status, created_at
          ) VALUES ($1, $2, $3, $4, NOW())`,
          [
            inventoryId, 'low_stock',
            `Stock level low for item ${itemId}. Current: ${newStock}, Reorder level: ${inventory.rows[0].reorder_level}`,
            'active'
          ]
        );
      }

      await client.query('COMMIT');
      return { inventoryId, newStock };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * HR and Rostering
   */
  async createStaffSchedule(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        staffId,
        departmentId,
        scheduleDate,
        shiftType,
        startTime,
        endTime,
        role
      } = data;

      // Check for conflicts
      const conflictCheck = await client.query(
        `SELECT COUNT(*) as conflicts
        FROM staff_schedules
        WHERE staff_id = $1 AND schedule_date = $2
        AND status = 'scheduled'`,
        [staffId, scheduleDate]
      );

      if (conflictCheck.rows[0].conflicts > 0) {
        throw new Error('Staff member already scheduled for this date');
      }

      // Create schedule
      const scheduleId = uuidv4();
      const scheduleResult = await client.query(
        `INSERT INTO staff_schedules (
          id, staff_id, department_id, schedule_date,
          shift_type, start_time, end_time, role,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          scheduleId, staffId, departmentId, scheduleDate,
          shiftType, startTime, endTime, role, 'scheduled'
        ]
      );

      // Calculate work hours for payroll
      const startDateTime = new Date(`${scheduleDate} ${startTime}`);
      const endDateTime = new Date(`${scheduleDate} ${endTime}`);
      const hoursWorked = (endDateTime - startDateTime) / (1000 * 60 * 60);

      await client.query(
        `INSERT INTO work_hours (
          staff_id, schedule_id, date, hours_worked,
          shift_type, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [staffId, scheduleId, scheduleDate, hoursWorked, shiftType, 'pending']
      );

      await client.query('COMMIT');
      return scheduleResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process Payroll
   */
  async processPayroll(hospitalId, payrollPeriod) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get all staff work hours for the period
      const workHoursResult = await client.query(
        `SELECT 
          s.id as staff_id,
          s.first_name,
          s.last_name,
          s.basic_salary,
          s.allowances,
          SUM(wh.hours_worked) as total_hours,
          COUNT(DISTINCT wh.date) as days_worked
        FROM staff s
        JOIN work_hours wh ON s.id = wh.staff_id
        WHERE s.hospital_id = $1
        AND wh.date >= $2 AND wh.date <= $3
        AND wh.status = 'approved'
        GROUP BY s.id`,
        [hospitalId, payrollPeriod.start, payrollPeriod.end]
      );

      const payrollBatchId = uuidv4();
      let totalPayroll = 0;

      for (const staff of workHoursResult.rows) {
        // Calculate gross salary
        const monthlySalary = parseFloat(staff.basic_salary);
        const allowances = parseFloat(staff.allowances || 0);
        const grossSalary = monthlySalary + allowances;

        // Calculate deductions (Nigerian context)
        const pension = grossSalary * 0.08; // 8% pension
        const nhf = 2500; // National Housing Fund (fixed)
        const tax = this.calculatePAYE(grossSalary); // PAYE tax
        const totalDeductions = pension + nhf + tax;

        const netSalary = grossSalary - totalDeductions;
        totalPayroll += netSalary;

        // Create payroll record
        await client.query(
          `INSERT INTO payroll (
            id, staff_id, payroll_batch_id, period_start,
            period_end, basic_salary, allowances, gross_salary,
            pension, nhf, tax, total_deductions, net_salary,
            payment_status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())`,
          [
            uuidv4(), staff.staff_id, payrollBatchId,
            payrollPeriod.start, payrollPeriod.end,
            monthlySalary, allowances, grossSalary,
            pension, nhf, tax, totalDeductions,
            netSalary, 'pending'
          ]
        );
      }

      // Create payroll batch record
      await client.query(
        `INSERT INTO payroll_batches (
          id, hospital_id, period_start, period_end,
          total_amount, staff_count, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          payrollBatchId, hospitalId, payrollPeriod.start,
          payrollPeriod.end, totalPayroll,
          workHoursResult.rows.length, 'processed'
        ]
      );

      await client.query('COMMIT');
      return {
        batchId: payrollBatchId,
        staffCount: workHoursResult.rows.length,
        totalAmount: totalPayroll
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Real-time Analytics
   */
  async getHospitalAnalytics(hospitalId, dateRange) {
    try {
      // Patient Flow Analytics
      const patientFlowResult = await pool.query(
        `SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_patients,
          COUNT(CASE WHEN visit_type = 'emergency' THEN 1 END) as emergency,
          COUNT(CASE WHEN visit_type = 'outpatient' THEN 1 END) as outpatient,
          COUNT(CASE WHEN visit_type = 'inpatient' THEN 1 END) as inpatient
        FROM medical_records
        WHERE hospital_id = $1
        AND created_at >= $2 AND created_at <= $3
        GROUP BY DATE(created_at)
        ORDER BY date`,
        [hospitalId, dateRange.start, dateRange.end]
      );

      // Revenue Analytics
      const revenueResult = await pool.query(
        `SELECT 
          DATE(invoice_date) as date,
          SUM(total_amount) as total_revenue,
          SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as collected,
          SUM(CASE WHEN payment_status = 'pending' THEN total_amount ELSE 0 END) as pending,
          COUNT(*) as invoice_count
        FROM invoices
        WHERE hospital_id = $1
        AND invoice_date >= $2 AND invoice_date <= $3
        GROUP BY DATE(invoice_date)
        ORDER BY date`,
        [hospitalId, dateRange.start, dateRange.end]
      );

      // Occupancy Analytics
      const occupancyResult = await pool.query(
        `SELECT 
          b.ward_type,
          COUNT(b.id) as total_beds,
          COUNT(CASE WHEN b.status = 'occupied' THEN 1 END) as occupied_beds,
          ROUND(COUNT(CASE WHEN b.status = 'occupied' THEN 1 END)::decimal / COUNT(b.id) * 100, 2) as occupancy_rate
        FROM beds b
        WHERE b.hospital_id = $1
        GROUP BY b.ward_type`,
        [hospitalId]
      );

      // Staff Performance
      const staffPerformanceResult = await pool.query(
        `SELECT 
          s.department_id,
          d.name as department_name,
          COUNT(DISTINCT s.id) as staff_count,
          AVG(sp.performance_score) as avg_performance,
          COUNT(DISTINCT mr.id) as patients_served
        FROM staff s
        JOIN departments d ON s.department_id = d.id
        LEFT JOIN staff_performance sp ON s.id = sp.staff_id
        LEFT JOIN medical_records mr ON s.id = mr.doctor_id
        WHERE s.hospital_id = $1
        AND (mr.created_at >= $2 AND mr.created_at <= $3 OR mr.created_at IS NULL)
        GROUP BY s.department_id, d.name`,
        [hospitalId, dateRange.start, dateRange.end]
      );

      // Inventory Status
      const inventoryStatusResult = await pool.query(
        `SELECT 
          COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END) as low_stock_items,
          COUNT(CASE WHEN current_stock = 0 THEN 1 END) as out_of_stock,
          SUM(current_stock * unit_cost) as inventory_value
        FROM inventory
        WHERE hospital_id = $1`,
        [hospitalId]
      );

      return {
        patientFlow: patientFlowResult.rows,
        revenue: revenueResult.rows,
        occupancy: occupancyResult.rows,
        staffPerformance: staffPerformanceResult.rows,
        inventory: inventoryStatusResult.rows[0],
        summary: {
          totalPatients: patientFlowResult.rows.reduce((sum, row) => sum + parseInt(row.total_patients), 0),
          totalRevenue: revenueResult.rows.reduce((sum, row) => sum + parseFloat(row.total_revenue || 0), 0),
          avgOccupancy: occupancyResult.rows.reduce((sum, row) => sum + parseFloat(row.occupancy_rate), 0) / occupancyResult.rows.length,
          activeStaff: staffPerformanceResult.rows.reduce((sum, row) => sum + parseInt(row.staff_count), 0)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Helper function to calculate PAYE tax (Nigerian context)
   */
  calculatePAYE(annualIncome) {
    const monthlyIncome = annualIncome;
    const annualizedIncome = monthlyIncome * 12;
    let tax = 0;

    // Nigerian PAYE tax brackets (2024)
    if (annualizedIncome <= 300000) {
      tax = annualizedIncome * 0.07;
    } else if (annualizedIncome <= 600000) {
      tax = 21000 + (annualizedIncome - 300000) * 0.11;
    } else if (annualizedIncome <= 1100000) {
      tax = 54000 + (annualizedIncome - 600000) * 0.15;
    } else if (annualizedIncome <= 1600000) {
      tax = 129000 + (annualizedIncome - 1100000) * 0.19;
    } else if (annualizedIncome <= 3200000) {
      tax = 224000 + (annualizedIncome - 1600000) * 0.21;
    } else {
      tax = 560000 + (annualizedIncome - 3200000) * 0.24;
    }

    return tax / 12; // Return monthly tax
  }

  /**
   * Bed Management
   */
  async manageBedOccupancy(data) {
    const {
      bedId,
      patientId,
      action, // 'admit' or 'discharge'
      admissionDate,
      expectedDischargeDate,
      notes
    } = data;

    try {
      if (action === 'admit') {
        // Check bed availability
        const bedCheck = await pool.query(
          'SELECT * FROM beds WHERE id = $1 AND status = $2',
          [bedId, 'available']
        );

        if (bedCheck.rows.length === 0) {
          throw new Error('Bed not available');
        }

        // Admit patient
        await pool.query(
          `INSERT INTO bed_occupancy (
            id, bed_id, patient_id, admission_date,
            expected_discharge_date, status, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [
            uuidv4(), bedId, patientId, admissionDate,
            expectedDischargeDate, 'occupied', notes
          ]
        );

        // Update bed status
        await pool.query(
          'UPDATE beds SET status = $1 WHERE id = $2',
          ['occupied', bedId]
        );

        return { status: 'admitted', bedId };
      } else if (action === 'discharge') {
        // Discharge patient
        await pool.query(
          `UPDATE bed_occupancy
          SET status = $1, actual_discharge_date = NOW()
          WHERE bed_id = $2 AND patient_id = $3 AND status = $4`,
          ['discharged', bedId, patientId, 'occupied']
        );

        // Update bed status
        await pool.query(
          'UPDATE beds SET status = $1 WHERE id = $2',
          ['available', bedId]
        );

        return { status: 'discharged', bedId };
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new HospitalManagementService();

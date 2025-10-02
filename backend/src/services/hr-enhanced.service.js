/**
 * Enhanced HR and Rostering Service
 * Manages staff, schedules, attendance, and payroll
 */

const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class HREnhancedService {
  /**
   * Register new staff member
   */
  async registerStaff(staffData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate employee ID
      const employeeId = `EMP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Hash password if provided
      let hashedPassword = null;
      if (staffData.password) {
        hashedPassword = await bcrypt.hash(staffData.password, 10);
      }

      // Insert staff record
      const staffQuery = `
        INSERT INTO staff (
          employee_id, first_name, last_name, middle_name,
          date_of_birth, gender, marital_status,
          phone, email, address, city, state,
          role, department, designation, 
          qualification, specialization, license_number,
          employment_date, employment_type, contract_end_date,
          salary_grade, basic_salary, allowances,
          bank_name, bank_account, tax_id,
          next_of_kin, next_of_kin_phone, next_of_kin_relationship,
          password_hash, status, hospital_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, 'active', $32, NOW())
        RETURNING *
      `;

      const values = [
        employeeId,
        staffData.firstName,
        staffData.lastName,
        staffData.middleName || null,
        staffData.dateOfBirth,
        staffData.gender,
        staffData.maritalStatus || null,
        staffData.phone,
        staffData.email,
        staffData.address,
        staffData.city,
        staffData.state || 'Lagos',
        staffData.role, // doctor, nurse, technician, admin, etc.
        staffData.department,
        staffData.designation,
        staffData.qualification || null,
        staffData.specialization || null,
        staffData.licenseNumber || null,
        staffData.employmentDate || new Date(),
        staffData.employmentType || 'full-time',
        staffData.contractEndDate || null,
        staffData.salaryGrade || null,
        staffData.basicSalary || 0,
        JSON.stringify(staffData.allowances || {}),
        staffData.bankName || null,
        staffData.bankAccount || null,
        staffData.taxId || null,
        staffData.nextOfKin,
        staffData.nextOfKinPhone,
        staffData.nextOfKinRelationship || null,
        hashedPassword,
        staffData.hospitalId
      ];

      const result = await client.query(staffQuery, values);

      // Create initial leave balance
      await this.initializeLeaveBalance(client, result.rows[0].id);

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Initialize leave balance for new staff
   */
  async initializeLeaveBalance(client, staffId) {
    const query = `
      INSERT INTO leave_balances (
        staff_id, leave_type, entitled_days, 
        used_days, remaining_days, year
      ) VALUES 
        ($1, 'annual', 21, 0, 21, EXTRACT(YEAR FROM NOW())),
        ($1, 'sick', 10, 0, 10, EXTRACT(YEAR FROM NOW())),
        ($1, 'maternity', 90, 0, 90, EXTRACT(YEAR FROM NOW())),
        ($1, 'paternity', 10, 0, 10, EXTRACT(YEAR FROM NOW()))
    `;

    return await client.query(query, [staffId]);
  }

  /**
   * Create staff schedule/roster
   */
  async createRoster(rosterData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const schedules = [];
      
      for (const schedule of rosterData.schedules) {
        const query = `
          INSERT INTO staff_roster (
            staff_id, date, shift_type, 
            start_time, end_time, 
            department, location,
            duty_type, status, notes,
            created_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'scheduled', $9, $10, NOW())
          ON CONFLICT (staff_id, date, shift_type) 
          DO UPDATE SET
            start_time = $4,
            end_time = $5,
            department = $6,
            location = $7,
            duty_type = $8,
            notes = $9,
            updated_at = NOW()
          RETURNING *
        `;

        const values = [
          schedule.staffId,
          schedule.date,
          schedule.shiftType || 'regular', // regular, night, weekend, holiday
          schedule.startTime,
          schedule.endTime,
          schedule.department || null,
          schedule.location || null,
          schedule.dutyType || 'normal', // normal, on-call, overtime
          schedule.notes || null,
          rosterData.createdBy
        ];

        const result = await client.query(query, values);
        schedules.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return schedules;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Record attendance
   */
  async recordAttendance(attendanceData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if attendance already exists
      const checkQuery = `
        SELECT id FROM staff_attendance 
        WHERE staff_id = $1 AND date = $2
      `;
      
      const existing = await client.query(checkQuery, [
        attendanceData.staffId,
        attendanceData.date
      ]);

      let result;
      
      if (existing.rows.length > 0) {
        // Update existing attendance
        const updateQuery = `
          UPDATE staff_attendance
          SET 
            check_in_time = COALESCE($1, check_in_time),
            check_out_time = COALESCE($2, check_out_time),
            status = $3,
            late_minutes = $4,
            early_leave_minutes = $5,
            overtime_minutes = $6,
            notes = $7,
            updated_at = NOW()
          WHERE id = $8
          RETURNING *
        `;

        const values = [
          attendanceData.checkInTime || null,
          attendanceData.checkOutTime || null,
          attendanceData.status || 'present',
          attendanceData.lateMinutes || 0,
          attendanceData.earlyLeaveMinutes || 0,
          attendanceData.overtimeMinutes || 0,
          attendanceData.notes || null,
          existing.rows[0].id
        ];

        result = await client.query(updateQuery, values);
      } else {
        // Insert new attendance
        const insertQuery = `
          INSERT INTO staff_attendance (
            staff_id, date, check_in_time, check_out_time,
            scheduled_start, scheduled_end,
            status, late_minutes, early_leave_minutes,
            overtime_minutes, shift_type, notes,
            recorded_by, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
          RETURNING *
        `;

        const values = [
          attendanceData.staffId,
          attendanceData.date,
          attendanceData.checkInTime || null,
          attendanceData.checkOutTime || null,
          attendanceData.scheduledStart || null,
          attendanceData.scheduledEnd || null,
          attendanceData.status || 'present',
          attendanceData.lateMinutes || 0,
          attendanceData.earlyLeaveMinutes || 0,
          attendanceData.overtimeMinutes || 0,
          attendanceData.shiftType || 'regular',
          attendanceData.notes || null,
          attendanceData.recordedBy
        ];

        result = await client.query(insertQuery, values);
      }

      // Update roster status if applicable
      if (attendanceData.rosterId) {
        await client.query(
          'UPDATE staff_roster SET status = $1 WHERE id = $2',
          ['completed', attendanceData.rosterId]
        );
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process payroll
   */
  async processPayroll(payrollData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const payrollBatch = `PAY${Date.now()}`;
      const payrollRecords = [];

      for (const staffPayroll of payrollData.staffPayrolls) {
        // Get staff details
        const staffQuery = 'SELECT * FROM staff WHERE id = $1';
        const staffResult = await client.query(staffQuery, [staffPayroll.staffId]);
        const staff = staffResult.rows[0];

        // Calculate earnings
        const basicSalary = staff.basic_salary || 0;
        const allowances = Object.values(staff.allowances || {}).reduce((sum, val) => sum + val, 0);
        const overtimePay = staffPayroll.overtimeHours * (basicSalary / 160) * 1.5; // 1.5x hourly rate
        const bonuses = staffPayroll.bonuses || 0;
        const grossPay = basicSalary + allowances + overtimePay + bonuses;

        // Calculate deductions
        const tax = grossPay * (staffPayroll.taxRate || 0.075); // 7.5% default tax
        const pension = basicSalary * 0.08; // 8% pension
        const healthInsurance = staffPayroll.healthInsurance || 0;
        const loans = staffPayroll.loanDeduction || 0;
        const otherDeductions = staffPayroll.otherDeductions || 0;
        const totalDeductions = tax + pension + healthInsurance + loans + otherDeductions;

        const netPay = grossPay - totalDeductions;

        // Insert payroll record
        const payrollQuery = `
          INSERT INTO payroll (
            batch_number, staff_id, employee_id,
            month, year, payment_date,
            basic_salary, allowances, overtime_hours, overtime_pay,
            bonuses, gross_pay,
            tax, pension, health_insurance, loan_deduction,
            other_deductions, total_deductions,
            net_pay, payment_method, payment_reference,
            bank_name, bank_account,
            status, processed_by, notes, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, NOW())
          RETURNING *
        `;

        const values = [
          payrollBatch,
          staff.id,
          staff.employee_id,
          payrollData.month,
          payrollData.year,
          payrollData.paymentDate || new Date(),
          basicSalary,
          allowances,
          staffPayroll.overtimeHours || 0,
          overtimePay,
          bonuses,
          grossPay,
          tax,
          pension,
          healthInsurance,
          loans,
          otherDeductions,
          totalDeductions,
          netPay,
          payrollData.paymentMethod || 'bank_transfer',
          null, // payment reference will be updated after payment
          staff.bank_name,
          staff.bank_account,
          'pending',
          payrollData.processedBy,
          staffPayroll.notes || null
        ];

        const result = await client.query(payrollQuery, values);
        payrollRecords.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return {
        batchNumber: payrollBatch,
        records: payrollRecords,
        summary: {
          totalStaff: payrollRecords.length,
          totalGross: payrollRecords.reduce((sum, r) => sum + r.gross_pay, 0),
          totalNet: payrollRecords.reduce((sum, r) => sum + r.net_pay, 0),
          totalTax: payrollRecords.reduce((sum, r) => sum + r.tax, 0)
        }
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Process leave request
   */
  async processLeaveRequest(leaveData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check leave balance
      const balanceQuery = `
        SELECT * FROM leave_balances 
        WHERE staff_id = $1 
        AND leave_type = $2 
        AND year = EXTRACT(YEAR FROM NOW())
      `;
      
      const balanceResult = await client.query(balanceQuery, [
        leaveData.staffId,
        leaveData.leaveType
      ]);

      if (balanceResult.rows.length === 0) {
        throw new Error('No leave balance found');
      }

      const balance = balanceResult.rows[0];
      const requestedDays = leaveData.numberOfDays;

      if (balance.remaining_days < requestedDays) {
        throw new Error('Insufficient leave balance');
      }

      // Insert leave request
      const leaveQuery = `
        INSERT INTO leave_requests (
          staff_id, leave_type, start_date, end_date,
          number_of_days, reason, 
          backup_person, backup_confirmed,
          status, requested_date,
          approved_by, approved_date, notes,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, $12, NOW())
        RETURNING *
      `;

      const values = [
        leaveData.staffId,
        leaveData.leaveType,
        leaveData.startDate,
        leaveData.endDate,
        requestedDays,
        leaveData.reason,
        leaveData.backupPerson || null,
        leaveData.backupConfirmed || false,
        leaveData.status || 'pending',
        leaveData.approvedBy || null,
        leaveData.approvedDate || null,
        leaveData.notes || null
      ];

      const leaveResult = await client.query(leaveQuery, values);

      // Update leave balance if approved
      if (leaveData.status === 'approved') {
        const updateBalanceQuery = `
          UPDATE leave_balances
          SET 
            used_days = used_days + $1,
            remaining_days = remaining_days - $1
          WHERE id = $2
        `;
        
        await client.query(updateBalanceQuery, [requestedDays, balance.id]);
      }

      await client.query('COMMIT');
      return leaveResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get department roster
   */
  async getDepartmentRoster(department, startDate, endDate) {
    const query = `
      SELECT 
        sr.*,
        s.first_name,
        s.last_name,
        s.employee_id,
        s.role,
        s.phone
      FROM staff_roster sr
      JOIN staff s ON sr.staff_id = s.id
      WHERE sr.department = $1
      AND sr.date BETWEEN $2 AND $3
      ORDER BY sr.date, sr.start_time
    `;

    const result = await pool.query(query, [department, startDate, endDate]);
    return result.rows;
  }

  /**
   * Get staff performance metrics
   */
  async getStaffPerformance(staffId, startDate, endDate) {
    // Attendance metrics
    const attendanceQuery = `
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN late_minutes > 0 THEN 1 END) as late_days,
        SUM(overtime_minutes) / 60 as total_overtime_hours
      FROM staff_attendance
      WHERE staff_id = $1
      AND date BETWEEN $2 AND $3
    `;

    const attendanceResult = await pool.query(attendanceQuery, [staffId, startDate, endDate]);

    // Leave metrics
    const leaveQuery = `
      SELECT 
        leave_type,
        SUM(number_of_days) as days_taken
      FROM leave_requests
      WHERE staff_id = $1
      AND status = 'approved'
      AND start_date BETWEEN $2 AND $3
      GROUP BY leave_type
    `;

    const leaveResult = await pool.query(leaveQuery, [staffId, startDate, endDate]);

    // Payroll metrics
    const payrollQuery = `
      SELECT 
        AVG(net_pay) as average_earnings,
        SUM(overtime_pay) as total_overtime_earnings,
        COUNT(*) as payroll_count
      FROM payroll
      WHERE staff_id = $1
      AND payment_date BETWEEN $2 AND $3
    `;

    const payrollResult = await pool.query(payrollQuery, [staffId, startDate, endDate]);

    return {
      attendance: attendanceResult.rows[0],
      leave: leaveResult.rows,
      payroll: payrollResult.rows[0]
    };
  }

  /**
   * Generate staff report
   */
  async generateStaffReport(hospitalId, reportType) {
    let query;
    
    switch(reportType) {
      case 'headcount':
        query = `
          SELECT 
            department,
            role,
            employment_type,
            COUNT(*) as count,
            AVG(EXTRACT(YEAR FROM AGE(date_of_birth))) as average_age
          FROM staff
          WHERE hospital_id = $1
          AND status = 'active'
          GROUP BY department, role, employment_type
          ORDER BY department, count DESC
        `;
        break;
      
      case 'attendance':
        query = `
          SELECT 
            DATE(date) as attendance_date,
            COUNT(DISTINCT staff_id) as total_staff,
            COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
            COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent,
            COUNT(CASE WHEN late_minutes > 0 THEN 1 END) as late_arrivals
          FROM staff_attendance sa
          JOIN staff s ON sa.staff_id = s.id
          WHERE s.hospital_id = $1
          AND date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY DATE(date)
          ORDER BY attendance_date DESC
        `;
        break;
      
      case 'payroll_summary':
        query = `
          SELECT 
            month,
            year,
            COUNT(DISTINCT staff_id) as staff_count,
            SUM(gross_pay) as total_gross,
            SUM(total_deductions) as total_deductions,
            SUM(net_pay) as total_net,
            AVG(net_pay) as average_net
          FROM payroll p
          JOIN staff s ON p.staff_id = s.id
          WHERE s.hospital_id = $1
          AND year = EXTRACT(YEAR FROM NOW())
          GROUP BY month, year
          ORDER BY year DESC, month DESC
        `;
        break;
      
      default:
        query = `
          SELECT 
            COUNT(*) as total_staff,
            COUNT(CASE WHEN employment_type = 'full-time' THEN 1 END) as full_time,
            COUNT(CASE WHEN employment_type = 'part-time' THEN 1 END) as part_time,
            COUNT(CASE WHEN employment_type = 'contract' THEN 1 END) as contract,
            AVG(basic_salary) as average_salary
          FROM staff
          WHERE hospital_id = $1
          AND status = 'active'
        `;
    }

    const result = await pool.query(query, [hospitalId]);
    return result.rows;
  }
}

module.exports = new HREnhancedService();

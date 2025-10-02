const pool = require('../config/database');

class HRService {
  // Add staff member
  async addStaff(staffData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate staff ID
      const staffId = `STF${new Date().getFullYear()}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;

      // Create staff record
      const staffQuery = `
        INSERT INTO staff (
          staff_id, first_name, last_name, email, phone_number,
          role, department_id, specialization, qualification,
          employment_date, employment_type, salary_grade,
          base_salary, allowances, bank_name, account_number,
          next_of_kin_name, next_of_kin_phone, address,
          city, state, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
        RETURNING *
      `;

      const values = [
        staffId,
        staffData.firstName,
        staffData.lastName,
        staffData.email,
        staffData.phoneNumber,
        staffData.role, // DOCTOR, NURSE, LAB_TECHNICIAN, PHARMACIST, ADMIN, etc.
        staffData.departmentId,
        staffData.specialization,
        staffData.qualification,
        staffData.employmentDate || new Date(),
        staffData.employmentType || 'FULL_TIME', // FULL_TIME, PART_TIME, CONTRACT
        staffData.salaryGrade,
        staffData.baseSalary,
        JSON.stringify(staffData.allowances || {}),
        staffData.bankName,
        staffData.accountNumber,
        staffData.nextOfKinName,
        staffData.nextOfKinPhone,
        staffData.address,
        staffData.city || 'Lagos',
        staffData.state || 'Lagos',
        'ACTIVE'
      ];

      const result = await client.query(staffQuery, values);
      const staff = result.rows[0];

      // Create login credentials if role requires system access
      if (['DOCTOR', 'NURSE', 'PHARMACIST', 'ADMIN'].includes(staffData.role)) {
        const userQuery = `
          INSERT INTO users (
            username, email, password_hash, role, staff_id, 
            first_name, last_name, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `;

        // In production, use proper password hashing
        const defaultPassword = 'TempPass123!';
        
        await client.query(userQuery, [
          staffData.email.split('@')[0],
          staffData.email,
          defaultPassword, // Should be hashed
          staffData.role,
          staff.id,
          staffData.firstName,
          staffData.lastName
        ]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        staff,
        staffId
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Create work schedule/roster
  async createRoster(rosterData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create roster for multiple staff
      const rosterEntries = [];
      
      for (const schedule of rosterData.schedules) {
        const query = `
          INSERT INTO staff_roster (
            staff_id, department_id, shift_type, start_time, end_time,
            roster_date, week_number, month, year, status, created_by
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (staff_id, roster_date, shift_type) 
          DO UPDATE SET 
            start_time = EXCLUDED.start_time,
            end_time = EXCLUDED.end_time,
            status = EXCLUDED.status
          RETURNING *
        `;

        const rosterDate = new Date(schedule.date);
        const weekNumber = Math.ceil((rosterDate.getDate() - rosterDate.getDay() + 1) / 7);

        const values = [
          schedule.staffId,
          schedule.departmentId,
          schedule.shiftType, // MORNING, AFTERNOON, NIGHT, ON_CALL
          schedule.startTime,
          schedule.endTime,
          schedule.date,
          weekNumber,
          rosterDate.getMonth() + 1,
          rosterDate.getFullYear(),
          'SCHEDULED',
          rosterData.createdBy
        ];

        const result = await client.query(query, values);
        rosterEntries.push(result.rows[0]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        roster: rosterEntries,
        totalScheduled: rosterEntries.length
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Record attendance
  async recordAttendance(attendanceData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check if already clocked in
      const checkQuery = `
        SELECT * FROM staff_attendance 
        WHERE staff_id = $1 AND DATE(check_in_time) = CURRENT_DATE
        AND check_out_time IS NULL
      `;

      const existing = await client.query(checkQuery, [attendanceData.staffId]);

      if (attendanceData.type === 'CHECK_IN' && existing.rows.length > 0) {
        throw new Error('Already checked in for today');
      }

      if (attendanceData.type === 'CHECK_OUT') {
        if (existing.rows.length === 0) {
          throw new Error('No check-in record found for today');
        }

        // Update check-out time
        const updateQuery = `
          UPDATE staff_attendance 
          SET check_out_time = NOW(),
              hours_worked = EXTRACT(EPOCH FROM (NOW() - check_in_time))/3600,
              overtime_hours = CASE 
                WHEN EXTRACT(EPOCH FROM (NOW() - check_in_time))/3600 > 8 
                THEN EXTRACT(EPOCH FROM (NOW() - check_in_time))/3600 - 8
                ELSE 0
              END
          WHERE id = $1
          RETURNING *
        `;

        const result = await client.query(updateQuery, [existing.rows[0].id]);
        await client.query('COMMIT');

        return {
          success: true,
          attendance: result.rows[0],
          message: 'Checked out successfully'
        };
      } else {
        // Create check-in record
        const insertQuery = `
          INSERT INTO staff_attendance (
            staff_id, roster_id, check_in_time, attendance_date,
            shift_type, status, location
          ) VALUES ($1, $2, NOW(), CURRENT_DATE, $3, $4, $5)
          RETURNING *
        `;

        const values = [
          attendanceData.staffId,
          attendanceData.rosterId,
          attendanceData.shiftType || 'REGULAR',
          'PRESENT',
          attendanceData.location || 'Main Hospital'
        ];

        const result = await client.query(insertQuery, values);
        await client.query('COMMIT');

        return {
          success: true,
          attendance: result.rows[0],
          message: 'Checked in successfully'
        };
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Apply for leave
  async applyLeave(leaveData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Check leave balance
      const balanceQuery = `
        SELECT * FROM leave_balances 
        WHERE staff_id = $1 AND leave_type = $2 AND year = $3
      `;

      const currentYear = new Date().getFullYear();
      const balance = await client.query(balanceQuery, [
        leaveData.staffId,
        leaveData.leaveType,
        currentYear
      ]);

      if (balance.rows.length === 0) {
        // Initialize leave balance if not exists
        await client.query(
          `INSERT INTO leave_balances (staff_id, leave_type, year, entitled_days, used_days, remaining_days)
           VALUES ($1, $2, $3, $4, 0, $4)`,
          [leaveData.staffId, leaveData.leaveType, currentYear, 21] // Default 21 days annual leave
        );
      }

      // Calculate leave days
      const startDate = new Date(leaveData.startDate);
      const endDate = new Date(leaveData.endDate);
      const leaveDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

      // Create leave application
      const leaveQuery = `
        INSERT INTO leave_applications (
          staff_id, leave_type, start_date, end_date, days_requested,
          reason, status, applied_date, relief_staff_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8)
        RETURNING *
      `;

      const values = [
        leaveData.staffId,
        leaveData.leaveType, // ANNUAL, SICK, MATERNITY, PATERNITY, STUDY, CASUAL
        leaveData.startDate,
        leaveData.endDate,
        leaveDays,
        leaveData.reason,
        'PENDING',
        leaveData.reliefStaffId
      ];

      const result = await client.query(leaveQuery, values);

      await client.query('COMMIT');

      return {
        success: true,
        leave: result.rows[0],
        daysRequested: leaveDays
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Approve/reject leave
  async processLeaveApplication(leaveId, decision, approvedBy, comments) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get leave details
      const leaveQuery = 'SELECT * FROM leave_applications WHERE id = $1';
      const leaveResult = await client.query(leaveQuery, [leaveId]);
      
      if (leaveResult.rows.length === 0) {
        throw new Error('Leave application not found');
      }

      const leave = leaveResult.rows[0];

      // Update leave status
      const updateQuery = `
        UPDATE leave_applications
        SET status = $1, approved_by = $2, approval_date = NOW(), 
            approval_comments = $3
        WHERE id = $4
        RETURNING *
      `;

      const result = await client.query(updateQuery, [
        decision, // APPROVED, REJECTED
        approvedBy,
        comments,
        leaveId
      ]);

      // If approved, update leave balance
      if (decision === 'APPROVED') {
        const balanceUpdateQuery = `
          UPDATE leave_balances
          SET used_days = used_days + $1,
              remaining_days = entitled_days - (used_days + $1)
          WHERE staff_id = $2 AND leave_type = $3 AND year = $4
        `;

        await client.query(balanceUpdateQuery, [
          leave.days_requested,
          leave.staff_id,
          leave.leave_type,
          new Date().getFullYear()
        ]);

        // Update roster to mark staff as on leave
        const rosterUpdateQuery = `
          UPDATE staff_roster
          SET status = 'ON_LEAVE'
          WHERE staff_id = $1 
          AND roster_date BETWEEN $2 AND $3
        `;

        await client.query(rosterUpdateQuery, [
          leave.staff_id,
          leave.start_date,
          leave.end_date
        ]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        leave: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Calculate payroll
  async calculatePayroll(payrollPeriod) {
    try {
      const { month, year, hospitalId } = payrollPeriod;

      // Get all active staff
      const staffQuery = `
        SELECT 
          s.*,
          COUNT(DISTINCT a.attendance_date) as days_worked,
          SUM(a.hours_worked) as total_hours,
          SUM(a.overtime_hours) as overtime_hours
        FROM staff s
        LEFT JOIN staff_attendance a ON s.id = a.staff_id
          AND EXTRACT(MONTH FROM a.attendance_date) = $1
          AND EXTRACT(YEAR FROM a.attendance_date) = $2
        WHERE s.status = 'ACTIVE'
        ${hospitalId ? 'AND s.hospital_id = $3' : ''}
        GROUP BY s.id
      `;

      const values = hospitalId ? [month, year, hospitalId] : [month, year];
      const staffResult = await pool.query(staffQuery, values);

      const payrollEntries = [];

      for (const staff of staffResult.rows) {
        const baseSalary = parseFloat(staff.base_salary);
        const allowances = JSON.parse(staff.allowances || '{}');
        
        // Calculate gross pay
        let grossPay = baseSalary;
        
        // Add allowances
        const totalAllowances = Object.values(allowances).reduce((sum, val) => sum + parseFloat(val || 0), 0);
        grossPay += totalAllowances;

        // Add overtime (1.5x hourly rate)
        const hourlyRate = baseSalary / (30 * 8); // Assuming 30 days, 8 hours per day
        const overtimePay = (staff.overtime_hours || 0) * hourlyRate * 1.5;
        grossPay += overtimePay;

        // Calculate deductions
        const tax = grossPay * 0.075; // 7.5% PAYE tax (simplified)
        const pension = baseSalary * 0.08; // 8% pension
        const nhis = baseSalary * 0.01; // 1% NHIS
        const totalDeductions = tax + pension + nhis;

        const netPay = grossPay - totalDeductions;

        payrollEntries.push({
          staffId: staff.id,
          staffName: `${staff.first_name} ${staff.last_name}`,
          department: staff.department_id,
          baseSalary,
          allowances: totalAllowances,
          overtimePay,
          grossPay,
          tax,
          pension,
          nhis,
          totalDeductions,
          netPay,
          daysWorked: staff.days_worked || 0,
          hoursWorked: staff.total_hours || 0
        });
      }

      // Calculate summary
      const summary = payrollEntries.reduce((acc, entry) => ({
        totalStaff: acc.totalStaff + 1,
        totalBaseSalary: acc.totalBaseSalary + entry.baseSalary,
        totalAllowances: acc.totalAllowances + entry.allowances,
        totalGrossPay: acc.totalGrossPay + entry.grossPay,
        totalTax: acc.totalTax + entry.tax,
        totalPension: acc.totalPension + entry.pension,
        totalNHIS: acc.totalNHIS + entry.nhis,
        totalDeductions: acc.totalDeductions + entry.totalDeductions,
        totalNetPay: acc.totalNetPay + entry.netPay
      }), {
        totalStaff: 0,
        totalBaseSalary: 0,
        totalAllowances: 0,
        totalGrossPay: 0,
        totalTax: 0,
        totalPension: 0,
        totalNHIS: 0,
        totalDeductions: 0,
        totalNetPay: 0
      });

      return {
        success: true,
        period: `${month}/${year}`,
        entries: payrollEntries,
        summary
      };
    } catch (error) {
      throw error;
    }
  }

  // Get staff performance metrics
  async getStaffPerformance(staffId, period = '30days') {
    try {
      const intervalMap = {
        '7days': '7 days',
        '30days': '30 days',
        '90days': '90 days'
      };

      const interval = intervalMap[period] || '30 days';

      // Attendance metrics
      const attendanceQuery = `
        SELECT 
          COUNT(DISTINCT attendance_date) as days_present,
          AVG(hours_worked) as avg_hours,
          SUM(overtime_hours) as total_overtime,
          COUNT(CASE WHEN status = 'LATE' THEN 1 END) as late_days
        FROM staff_attendance
        WHERE staff_id = $1
        AND attendance_date >= CURRENT_DATE - INTERVAL '${interval}'
      `;

      const attendance = await pool.query(attendanceQuery, [staffId]);

      // Patient interaction metrics (for medical staff)
      const patientQuery = `
        SELECT 
          COUNT(DISTINCT patient_id) as patients_treated,
          COUNT(id) as total_consultations,
          AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_consultation_time
        FROM encounters
        WHERE doctor_id = $1
        AND encounter_date >= CURRENT_DATE - INTERVAL '${interval}'
      `;

      const patientMetrics = await pool.query(patientQuery, [staffId]);

      // Leave metrics
      const leaveQuery = `
        SELECT 
          COUNT(id) as leave_applications,
          SUM(days_requested) as total_leave_days
        FROM leave_applications
        WHERE staff_id = $1
        AND EXTRACT(YEAR FROM applied_date) = EXTRACT(YEAR FROM CURRENT_DATE)
      `;

      const leaveMetrics = await pool.query(leaveQuery, [staffId]);

      return {
        success: true,
        performance: {
          attendance: attendance.rows[0],
          patientCare: patientMetrics.rows[0],
          leave: leaveMetrics.rows[0],
          attendanceRate: attendance.rows[0].days_present / 30 * 100 // Simplified calculation
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get department staffing levels
  async getDepartmentStaffing(departmentId) {
    try {
      const query = `
        SELECT 
          d.name as department_name,
          COUNT(DISTINCT s.id) as total_staff,
          COUNT(DISTINCT CASE WHEN s.role = 'DOCTOR' THEN s.id END) as doctors,
          COUNT(DISTINCT CASE WHEN s.role = 'NURSE' THEN s.id END) as nurses,
          COUNT(DISTINCT CASE WHEN s.employment_type = 'FULL_TIME' THEN s.id END) as full_time,
          COUNT(DISTINCT CASE WHEN s.employment_type = 'PART_TIME' THEN s.id END) as part_time,
          COUNT(DISTINCT CASE WHEN s.employment_type = 'CONTRACT' THEN s.id END) as contract,
          COUNT(DISTINCT a.staff_id) as present_today,
          ROUND(AVG(s.base_salary)) as avg_salary
        FROM departments d
        LEFT JOIN staff s ON d.id = s.department_id AND s.status = 'ACTIVE'
        LEFT JOIN staff_attendance a ON s.id = a.staff_id 
          AND DATE(a.attendance_date) = CURRENT_DATE
        WHERE d.id = $1
        GROUP BY d.id, d.name
      `;

      const result = await pool.query(query, [departmentId]);

      return {
        success: true,
        staffing: result.rows[0] || {
          department_name: 'Unknown',
          total_staff: 0,
          doctors: 0,
          nurses: 0,
          full_time: 0,
          part_time: 0,
          contract: 0,
          present_today: 0,
          avg_salary: 0
        }
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new HRService();

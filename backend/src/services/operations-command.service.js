/**
 * Centralized Operations Command Centre Service
 * Aggregates metrics across all hospitals and manages alerts
 */

const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class OperationsCommandService {
  /**
   * Get aggregated metrics across all hospitals
   */
  async getCommandCentreDashboard(params = {}) {
    try {
      const { startDate, endDate, hospitalIds } = params;
      const dateFilter = this.getDateFilter(startDate, endDate);
      const hospitalFilter = hospitalIds ? `AND h.id = ANY($1)` : '';
      
      // Aggregate patient metrics
      const patientMetrics = await this.getPatientMetrics(dateFilter, hospitalFilter, hospitalIds);
      
      // Aggregate staff KPIs
      const staffKPIs = await this.getStaffKPIs(dateFilter, hospitalFilter, hospitalIds);
      
      // Aggregate financial summaries
      const financialSummary = await this.getFinancialSummary(dateFilter, hospitalFilter, hospitalIds);
      
      // Get current alerts
      const activeAlerts = await this.getActiveAlerts(hospitalIds);
      
      // Get hospital performance scores
      const performanceScores = await this.getHospitalPerformanceScores(hospitalIds);
      
      // Get real-time occupancy
      const occupancyData = await this.getRealTimeOccupancy(hospitalIds);
      
      return {
        success: true,
        data: {
          timestamp: new Date().toISOString(),
          metrics: {
            patients: patientMetrics,
            staff: staffKPIs,
            financial: financialSummary,
            occupancy: occupancyData,
            performance: performanceScores
          },
          alerts: activeAlerts,
          summary: {
            totalHospitals: performanceScores.length,
            criticalAlerts: activeAlerts.filter(a => a.severity === 'critical').length,
            avgPerformanceScore: this.calculateAvgScore(performanceScores),
            systemHealth: this.determineSystemHealth(activeAlerts)
          }
        }
      };
    } catch (error) {
      console.error('Error getting command centre dashboard:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get patient inflow and admission metrics
   */
  async getPatientMetrics(dateFilter, hospitalFilter, hospitalIds) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT p.id) as total_patients,
          COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '24 hours' THEN p.id END) as new_patients_today,
          COUNT(DISTINCT CASE WHEN p.created_at >= NOW() - INTERVAL '7 days' THEN p.id END) as new_patients_week,
          COUNT(DISTINCT CASE WHEN mr.admission_date IS NOT NULL THEN p.id END) as total_admissions,
          COUNT(DISTINCT CASE WHEN mr.discharge_date IS NULL AND mr.admission_date IS NOT NULL THEN p.id END) as current_admissions,
          AVG(CASE WHEN mr.discharge_date IS NOT NULL 
            THEN EXTRACT(day FROM (mr.discharge_date - mr.admission_date)) 
            END) as avg_length_of_stay,
          COUNT(DISTINCT CASE WHEN mr.record_type = 'emergency' THEN mr.id END) as emergency_visits,
          COUNT(DISTINCT CASE WHEN mr.record_type = 'outpatient' THEN mr.id END) as outpatient_visits
        FROM patients p
        LEFT JOIN medical_records mr ON p.id = mr.patient_id
        LEFT JOIN hospitals h ON p.hospital_id = h.id
        WHERE 1=1 ${dateFilter} ${hospitalFilter}
      `;
      
      const params = hospitalIds ? [hospitalIds] : [];
      const result = await pool.query(query, params);
      
      return {
        totalPatients: parseInt(result.rows[0].total_patients) || 0,
        newPatientsToday: parseInt(result.rows[0].new_patients_today) || 0,
        newPatientsWeek: parseInt(result.rows[0].new_patients_week) || 0,
        totalAdmissions: parseInt(result.rows[0].total_admissions) || 0,
        currentAdmissions: parseInt(result.rows[0].current_admissions) || 0,
        avgLengthOfStay: parseFloat(result.rows[0].avg_length_of_stay) || 0,
        emergencyVisits: parseInt(result.rows[0].emergency_visits) || 0,
        outpatientVisits: parseInt(result.rows[0].outpatient_visits) || 0,
        inflowTrend: await this.calculateInflowTrend()
      };
    } catch (error) {
      console.error('Error getting patient metrics:', error);
      return {};
    }
  }

  /**
   * Get staff KPIs across hospitals
   */
  async getStaffKPIs(dateFilter, hospitalFilter, hospitalIds) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT s.id) as total_staff,
          COUNT(DISTINCT CASE WHEN s.status = 'active' THEN s.id END) as active_staff,
          COUNT(DISTINCT CASE WHEN sa.date = CURRENT_DATE AND sa.clock_in IS NOT NULL THEN s.id END) as staff_present_today,
          AVG(CASE WHEN sa.date >= CURRENT_DATE - INTERVAL '30 days' 
            THEN sa.hours_worked END) as avg_hours_worked,
          COUNT(DISTINCT CASE WHEN s.role = 'Doctor' THEN s.id END) as total_doctors,
          COUNT(DISTINCT CASE WHEN s.role = 'Nurse' THEN s.id END) as total_nurses,
          AVG(CASE WHEN pr.month = EXTRACT(MONTH FROM CURRENT_DATE) 
            THEN pr.performance_score END) as avg_performance_score,
          COUNT(DISTINCT CASE WHEN lr.status = 'pending' THEN lr.id END) as pending_leave_requests
        FROM staff s
        LEFT JOIN staff_attendance sa ON s.id = sa.staff_id
        LEFT JOIN performance_reviews pr ON s.id = pr.staff_id
        LEFT JOIN leave_requests lr ON s.id = lr.staff_id
        LEFT JOIN hospitals h ON s.hospital_id = h.id
        WHERE 1=1 ${dateFilter} ${hospitalFilter}
      `;
      
      const params = hospitalIds ? [hospitalIds] : [];
      const result = await pool.query(query, params);
      
      // Calculate patient-to-staff ratios
      const ratios = await this.calculateStaffRatios(hospitalIds);
      
      return {
        totalStaff: parseInt(result.rows[0].total_staff) || 0,
        activeStaff: parseInt(result.rows[0].active_staff) || 0,
        presentToday: parseInt(result.rows[0].staff_present_today) || 0,
        avgHoursWorked: parseFloat(result.rows[0].avg_hours_worked) || 0,
        doctors: parseInt(result.rows[0].total_doctors) || 0,
        nurses: parseInt(result.rows[0].total_nurses) || 0,
        avgPerformanceScore: parseFloat(result.rows[0].avg_performance_score) || 0,
        pendingLeaveRequests: parseInt(result.rows[0].pending_leave_requests) || 0,
        patientToNurseRatio: ratios.patientToNurse,
        patientToDoctorRatio: ratios.patientToDoctor,
        attendanceRate: this.calculateAttendanceRate(result.rows[0])
      };
    } catch (error) {
      console.error('Error getting staff KPIs:', error);
      return {};
    }
  }

  /**
   * Get financial summary across hospitals
   */
  async getFinancialSummary(dateFilter, hospitalFilter, hospitalIds) {
    try {
      const query = `
        SELECT 
          SUM(i.total_amount) as total_revenue,
          SUM(CASE WHEN i.created_at >= CURRENT_DATE THEN i.total_amount END) as revenue_today,
          SUM(CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN i.total_amount END) as revenue_month,
          SUM(CASE WHEN i.status = 'paid' THEN i.total_amount END) as collected_revenue,
          SUM(CASE WHEN i.status IN ('pending', 'partially_paid') THEN i.total_amount END) as outstanding_revenue,
          COUNT(DISTINCT CASE WHEN i.status = 'pending' AND i.due_date < CURRENT_DATE THEN i.id END) as overdue_invoices,
          SUM(ic.claim_amount) as total_insurance_claims,
          SUM(CASE WHEN ic.status = 'approved' THEN ic.claim_amount END) as approved_claims,
          AVG(i.total_amount) as avg_invoice_amount,
          COUNT(DISTINCT i.id) as total_invoices
        FROM invoices i
        LEFT JOIN insurance_claims ic ON i.id = ic.invoice_id
        LEFT JOIN hospitals h ON i.hospital_id = h.id
        WHERE 1=1 ${dateFilter} ${hospitalFilter}
      `;
      
      const params = hospitalIds ? [hospitalIds] : [];
      const result = await pool.query(query, params);
      
      // Calculate financial health indicators
      const collectionRate = this.calculateCollectionRate(result.rows[0]);
      const revenueGrowth = await this.calculateRevenueGrowth(hospitalIds);
      
      return {
        totalRevenue: parseFloat(result.rows[0].total_revenue) || 0,
        revenueToday: parseFloat(result.rows[0].revenue_today) || 0,
        revenueMonth: parseFloat(result.rows[0].revenue_month) || 0,
        collectedRevenue: parseFloat(result.rows[0].collected_revenue) || 0,
        outstandingRevenue: parseFloat(result.rows[0].outstanding_revenue) || 0,
        overdueInvoices: parseInt(result.rows[0].overdue_invoices) || 0,
        insuranceClaims: parseFloat(result.rows[0].total_insurance_claims) || 0,
        approvedClaims: parseFloat(result.rows[0].approved_claims) || 0,
        avgInvoiceAmount: parseFloat(result.rows[0].avg_invoice_amount) || 0,
        totalInvoices: parseInt(result.rows[0].total_invoices) || 0,
        collectionRate: collectionRate,
        revenueGrowth: revenueGrowth,
        financialHealth: this.determineFinancialHealth(collectionRate, revenueGrowth)
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      return {};
    }
  }

  /**
   * Create and manage alerts
   */
  async createAlert(alertData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const { type, severity, hospitalId, message, threshold, currentValue, metadata } = alertData;
      
      // Check if similar alert already exists and is active
      const existingAlert = await client.query(`
        SELECT id FROM operations_alerts 
        WHERE hospital_id = $1 
          AND type = $2 
          AND status = 'active'
          AND created_at > NOW() - INTERVAL '1 hour'
      `, [hospitalId, type]);
      
      if (existingAlert.rows.length > 0) {
        // Update existing alert
        const updateQuery = `
          UPDATE operations_alerts 
          SET 
            current_value = $1,
            updated_at = NOW(),
            occurrence_count = occurrence_count + 1
          WHERE id = $2
          RETURNING *
        `;
        const result = await client.query(updateQuery, [currentValue, existingAlert.rows[0].id]);
        await client.query('COMMIT');
        return result.rows[0];
      }
      
      // Create new alert
      const insertQuery = `
        INSERT INTO operations_alerts (
          id, type, severity, hospital_id, message, 
          threshold_value, current_value, status, 
          metadata, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'active', $8, NOW()
        ) RETURNING *
      `;
      
      const values = [
        uuidv4(),
        type,
        severity,
        hospitalId,
        message,
        threshold,
        currentValue,
        JSON.stringify(metadata || {})
      ];
      
      const result = await client.query(insertQuery, values);
      
      // Trigger notification if critical
      if (severity === 'critical') {
        await this.triggerCriticalAlertNotification(result.rows[0]);
      }
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating alert:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check for low stock alerts
   */
  async checkLowStockAlerts() {
    try {
      const query = `
        SELECT 
          ii.id,
          ii.item_name,
          ii.category,
          ii.quantity_in_stock,
          ii.reorder_level,
          ii.hospital_id,
          h.name as hospital_name
        FROM inventory_items ii
        JOIN hospitals h ON ii.hospital_id = h.id
        WHERE ii.quantity_in_stock <= ii.reorder_level
          AND ii.status = 'active'
      `;
      
      const result = await pool.query(query);
      const alerts = [];
      
      for (const item of result.rows) {
        const alert = await this.createAlert({
          type: 'low_stock',
          severity: item.quantity_in_stock === 0 ? 'critical' : 'warning',
          hospitalId: item.hospital_id,
          message: `Low stock alert: ${item.item_name} (${item.quantity_in_stock} remaining)`,
          threshold: item.reorder_level,
          currentValue: item.quantity_in_stock,
          metadata: {
            itemId: item.id,
            itemName: item.item_name,
            category: item.category,
            hospitalName: item.hospital_name
          }
        });
        alerts.push(alert);
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking low stock alerts:', error);
      return [];
    }
  }

  /**
   * Check for performance anomalies
   */
  async checkPerformanceAnomalies() {
    try {
      const alerts = [];
      
      // Check for unusual patient wait times
      const waitTimeQuery = `
        SELECT 
          h.id as hospital_id,
          h.name as hospital_name,
          AVG(EXTRACT(EPOCH FROM (mr.consultation_start - mr.arrival_time))/60) as avg_wait_time
        FROM medical_records mr
        JOIN hospitals h ON mr.hospital_id = h.id
        WHERE mr.created_at >= NOW() - INTERVAL '24 hours'
        GROUP BY h.id, h.name
        HAVING AVG(EXTRACT(EPOCH FROM (mr.consultation_start - mr.arrival_time))/60) > 60
      `;
      
      const waitTimeResult = await pool.query(waitTimeQuery);
      
      for (const hospital of waitTimeResult.rows) {
        if (hospital.avg_wait_time > 60) {
          const alert = await this.createAlert({
            type: 'performance_anomaly',
            severity: hospital.avg_wait_time > 120 ? 'critical' : 'warning',
            hospitalId: hospital.hospital_id,
            message: `High patient wait time: ${Math.round(hospital.avg_wait_time)} minutes average`,
            threshold: 60,
            currentValue: hospital.avg_wait_time,
            metadata: {
              hospitalName: hospital.hospital_name,
              metricType: 'wait_time'
            }
          });
          alerts.push(alert);
        }
      }
      
      // Check for low staff attendance
      const attendanceQuery = `
        SELECT 
          h.id as hospital_id,
          h.name as hospital_name,
          COUNT(DISTINCT s.id) as total_staff,
          COUNT(DISTINCT sa.staff_id) as present_staff,
          (COUNT(DISTINCT sa.staff_id)::float / NULLIF(COUNT(DISTINCT s.id), 0) * 100) as attendance_rate
        FROM hospitals h
        JOIN staff s ON h.id = s.hospital_id
        LEFT JOIN staff_attendance sa ON s.id = sa.staff_id AND sa.date = CURRENT_DATE
        WHERE s.status = 'active'
        GROUP BY h.id, h.name
        HAVING (COUNT(DISTINCT sa.staff_id)::float / NULLIF(COUNT(DISTINCT s.id), 0) * 100) < 70
      `;
      
      const attendanceResult = await pool.query(attendanceQuery);
      
      for (const hospital of attendanceResult.rows) {
        const alert = await this.createAlert({
          type: 'performance_anomaly',
          severity: hospital.attendance_rate < 50 ? 'critical' : 'warning',
          hospitalId: hospital.hospital_id,
          message: `Low staff attendance: ${Math.round(hospital.attendance_rate)}%`,
          threshold: 70,
          currentValue: hospital.attendance_rate,
          metadata: {
            hospitalName: hospital.hospital_name,
            totalStaff: hospital.total_staff,
            presentStaff: hospital.present_staff,
            metricType: 'attendance'
          }
        });
        alerts.push(alert);
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking performance anomalies:', error);
      return [];
    }
  }

  /**
   * Check for revenue gaps
   */
  async checkRevenueGaps() {
    try {
      const alerts = [];
      
      // Compare current month revenue with previous month
      const revenueQuery = `
        WITH monthly_revenue AS (
          SELECT 
            h.id as hospital_id,
            h.name as hospital_name,
            DATE_TRUNC('month', i.created_at) as month,
            SUM(i.total_amount) as revenue
          FROM invoices i
          JOIN hospitals h ON i.hospital_id = h.id
          WHERE i.created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')
          GROUP BY h.id, h.name, DATE_TRUNC('month', i.created_at)
        ),
        revenue_comparison AS (
          SELECT 
            hospital_id,
            hospital_name,
            MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE) THEN revenue END) as current_month,
            MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN revenue END) as previous_month
          FROM monthly_revenue
          GROUP BY hospital_id, hospital_name
        )
        SELECT 
          *,
          ((current_month - previous_month) / NULLIF(previous_month, 0) * 100) as growth_rate
        FROM revenue_comparison
        WHERE current_month < previous_month * 0.8
      `;
      
      const result = await pool.query(revenueQuery);
      
      for (const hospital of result.rows) {
        const alert = await this.createAlert({
          type: 'revenue_gap',
          severity: hospital.growth_rate < -30 ? 'critical' : 'warning',
          hospitalId: hospital.hospital_id,
          message: `Revenue decline: ${Math.abs(Math.round(hospital.growth_rate))}% decrease from last month`,
          threshold: -20,
          currentValue: hospital.growth_rate,
          metadata: {
            hospitalName: hospital.hospital_name,
            currentMonthRevenue: hospital.current_month,
            previousMonthRevenue: hospital.previous_month
          }
        });
        alerts.push(alert);
      }
      
      // Check for high outstanding payments
      const outstandingQuery = `
        SELECT 
          h.id as hospital_id,
          h.name as hospital_name,
          SUM(i.total_amount) as total_outstanding,
          COUNT(i.id) as outstanding_count,
          AVG(CURRENT_DATE - i.due_date) as avg_days_overdue
        FROM invoices i
        JOIN hospitals h ON i.hospital_id = h.id
        WHERE i.status IN ('pending', 'partially_paid')
          AND i.due_date < CURRENT_DATE
        GROUP BY h.id, h.name
        HAVING SUM(i.total_amount) > 1000000
      `;
      
      const outstandingResult = await pool.query(outstandingQuery);
      
      for (const hospital of outstandingResult.rows) {
        const alert = await this.createAlert({
          type: 'revenue_gap',
          severity: hospital.total_outstanding > 5000000 ? 'critical' : 'warning',
          hospitalId: hospital.hospital_id,
          message: `High outstanding payments: ₦${hospital.total_outstanding.toLocaleString()}`,
          threshold: 1000000,
          currentValue: hospital.total_outstanding,
          metadata: {
            hospitalName: hospital.hospital_name,
            outstandingCount: hospital.outstanding_count,
            avgDaysOverdue: Math.round(hospital.avg_days_overdue)
          }
        });
        alerts.push(alert);
      }
      
      return alerts;
    } catch (error) {
      console.error('Error checking revenue gaps:', error);
      return [];
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts(hospitalIds = null) {
    try {
      let query = `
        SELECT 
          a.*,
          h.name as hospital_name
        FROM operations_alerts a
        LEFT JOIN hospitals h ON a.hospital_id = h.id
        WHERE a.status = 'active'
      `;
      
      const params = [];
      if (hospitalIds) {
        query += ` AND a.hospital_id = ANY($1)`;
        params.push(hospitalIds);
      }
      
      query += ` ORDER BY 
        CASE a.severity 
          WHEN 'critical' THEN 1 
          WHEN 'warning' THEN 2 
          ELSE 3 
        END,
        a.created_at DESC
      `;
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting active alerts:', error);
      return [];
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId, acknowledgedBy, notes = null) {
    try {
      const query = `
        UPDATE operations_alerts
        SET 
          status = 'acknowledged',
          acknowledged_by = $2,
          acknowledged_at = NOW(),
          resolution_notes = $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [alertId, acknowledgedBy, notes]);
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId, resolvedBy, resolutionNotes) {
    try {
      const query = `
        UPDATE operations_alerts
        SET 
          status = 'resolved',
          resolved_by = $2,
          resolved_at = NOW(),
          resolution_notes = $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pool.query(query, [alertId, resolvedBy, resolutionNotes]);
      return {
        success: true,
        data: result.rows[0]
      };
    } catch (error) {
      console.error('Error resolving alert:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get hospital performance scores
   */
  async getHospitalPerformanceScores(hospitalIds = null) {
    try {
      let query = `
        WITH hospital_metrics AS (
          SELECT 
            h.id,
            h.name,
            COUNT(DISTINCT p.id) as patient_count,
            COUNT(DISTINCT s.id) as staff_count,
            AVG(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) * 100 as collection_rate,
            AVG(pr.rating) as patient_satisfaction,
            COUNT(DISTINCT CASE WHEN sa.date = CURRENT_DATE THEN sa.staff_id END)::float / 
              NULLIF(COUNT(DISTINCT s.id), 0) * 100 as attendance_rate
          FROM hospitals h
          LEFT JOIN patients p ON h.id = p.hospital_id
          LEFT JOIN staff s ON h.id = s.hospital_id
          LEFT JOIN invoices i ON h.id = i.hospital_id
          LEFT JOIN patient_reviews pr ON h.id = pr.hospital_id
          LEFT JOIN staff_attendance sa ON s.id = sa.staff_id
          WHERE 1=1
      `;
      
      const params = [];
      if (hospitalIds) {
        query += ` AND h.id = ANY($1)`;
        params.push(hospitalIds);
      }
      
      query += `
          GROUP BY h.id, h.name
        )
        SELECT 
          *,
          (
            (CASE WHEN patient_count > 0 THEN 20 ELSE 0 END) +
            (CASE WHEN collection_rate > 80 THEN 25 WHEN collection_rate > 60 THEN 15 ELSE 5 END) +
            (CASE WHEN patient_satisfaction > 4 THEN 25 WHEN patient_satisfaction > 3 THEN 15 ELSE 5 END) +
            (CASE WHEN attendance_rate > 90 THEN 30 WHEN attendance_rate > 75 THEN 20 ELSE 10 END)
          ) as performance_score
        FROM hospital_metrics
        ORDER BY performance_score DESC
      `;
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting performance scores:', error);
      return [];
    }
  }

  /**
   * Get real-time occupancy data
   */
  async getRealTimeOccupancy(hospitalIds = null) {
    try {
      let query = `
        SELECT 
          h.id,
          h.name,
          h.total_beds,
          COUNT(DISTINCT CASE WHEN mr.discharge_date IS NULL AND mr.admission_date IS NOT NULL THEN mr.patient_id END) as occupied_beds,
          h.total_beds - COUNT(DISTINCT CASE WHEN mr.discharge_date IS NULL AND mr.admission_date IS NOT NULL THEN mr.patient_id END) as available_beds,
          (COUNT(DISTINCT CASE WHEN mr.discharge_date IS NULL AND mr.admission_date IS NOT NULL THEN mr.patient_id END)::float / NULLIF(h.total_beds, 0) * 100) as occupancy_rate
        FROM hospitals h
        LEFT JOIN medical_records mr ON h.id = mr.hospital_id
        WHERE 1=1
      `;
      
      const params = [];
      if (hospitalIds) {
        query += ` AND h.id = ANY($1)`;
        params.push(hospitalIds);
      }
      
      query += ` GROUP BY h.id, h.name, h.total_beds`;
      
      const result = await pool.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('Error getting occupancy data:', error);
      return [];
    }
  }

  // Helper methods
  getDateFilter(startDate, endDate) {
    if (startDate && endDate) {
      return `AND created_at BETWEEN '${startDate}' AND '${endDate}'`;
    }
    return '';
  }

  calculateAvgScore(scores) {
    if (!scores.length) return 0;
    const sum = scores.reduce((acc, s) => acc + (s.performance_score || 0), 0);
    return Math.round(sum / scores.length);
  }

  determineSystemHealth(alerts) {
    const critical = alerts.filter(a => a.severity === 'critical').length;
    const warning = alerts.filter(a => a.severity === 'warning').length;
    
    if (critical > 5) return 'critical';
    if (critical > 0 || warning > 10) return 'warning';
    return 'healthy';
  }

  calculateCollectionRate(data) {
    if (!data.total_revenue || data.total_revenue === 0) return 0;
    return Math.round((data.collected_revenue / data.total_revenue) * 100);
  }

  async calculateRevenueGrowth(hospitalIds) {
    try {
      const query = `
        WITH monthly_revenue AS (
          SELECT 
            DATE_TRUNC('month', created_at) as month,
            SUM(total_amount) as revenue
          FROM invoices
          WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '2 months')
            ${hospitalIds ? 'AND hospital_id = ANY($1)' : ''}
          GROUP BY DATE_TRUNC('month', created_at)
        )
        SELECT 
          MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE) THEN revenue END) as current,
          MAX(CASE WHEN month = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month') THEN revenue END) as previous
        FROM monthly_revenue
      `;
      
      const params = hospitalIds ? [hospitalIds] : [];
      const result = await pool.query(query, params);
      
      if (result.rows[0].previous && result.rows[0].previous > 0) {
        const growth = ((result.rows[0].current - result.rows[0].previous) / result.rows[0].previous) * 100;
        return Math.round(growth);
      }
      return 0;
    } catch (error) {
      return 0;
    }
  }

  determineFinancialHealth(collectionRate, revenueGrowth) {
    if (collectionRate > 90 && revenueGrowth > 0) return 'excellent';
    if (collectionRate > 75 && revenueGrowth >= 0) return 'good';
    if (collectionRate > 60 || revenueGrowth < -10) return 'fair';
    return 'poor';
  }

  calculateAttendanceRate(data) {
    if (!data.total_staff || data.total_staff === 0) return 0;
    return Math.round((data.staff_present_today / data.active_staff) * 100);
  }

  async calculateStaffRatios(hospitalIds) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT p.id) as patients,
          COUNT(DISTINCT CASE WHEN s.role = 'Nurse' THEN s.id END) as nurses,
          COUNT(DISTINCT CASE WHEN s.role = 'Doctor' THEN s.id END) as doctors
        FROM patients p
        CROSS JOIN staff s
        WHERE p.hospital_id = s.hospital_id
          ${hospitalIds ? 'AND p.hospital_id = ANY($1)' : ''}
      `;
      
      const params = hospitalIds ? [hospitalIds] : [];
      const result = await pool.query(query, params);
      
      const data = result.rows[0];
      return {
        patientToNurse: data.nurses > 0 ? Math.round(data.patients / data.nurses) : 0,
        patientToDoctor: data.doctors > 0 ? Math.round(data.patients / data.doctors) : 0
      };
    } catch (error) {
      return { patientToNurse: 0, patientToDoctor: 0 };
    }
  }

  async calculateInflowTrend() {
    try {
      const query = `
        WITH daily_admissions AS (
          SELECT 
            DATE(created_at) as date,
            COUNT(*) as count
          FROM patients
          WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY DATE(created_at)
        )
        SELECT 
          CASE 
            WHEN AVG(CASE WHEN date >= CURRENT_DATE - INTERVAL '3 days' THEN count END) > 
                 AVG(CASE WHEN date < CURRENT_DATE - INTERVAL '3 days' THEN count END)
            THEN 'increasing'
            WHEN AVG(CASE WHEN date >= CURRENT_DATE - INTERVAL '3 days' THEN count END) < 
                 AVG(CASE WHEN date < CURRENT_DATE - INTERVAL '3 days' THEN count END)
            THEN 'decreasing'
            ELSE 'stable'
          END as trend
        FROM daily_admissions
      `;
      
      const result = await pool.query(query);
      return result.rows[0]?.trend || 'stable';
    } catch (error) {
      return 'unknown';
    }
  }

  async triggerCriticalAlertNotification(alert) {
    // In production, this would send SMS, email, or push notifications
    console.log('🚨 CRITICAL ALERT:', alert.message);
    // Could integrate with notification services like Twilio, SendGrid, etc.
  }

  /**
   * Run automated alert checks
   */
  async runAutomatedAlertChecks() {
    try {
      const alerts = [];
      
      // Check various alert conditions
      const lowStockAlerts = await this.checkLowStockAlerts();
      const performanceAlerts = await this.checkPerformanceAnomalies();
      const revenueAlerts = await this.checkRevenueGaps();
      
      alerts.push(...lowStockAlerts, ...performanceAlerts, ...revenueAlerts);
      
      return {
        success: true,
        alertsGenerated: alerts.length,
        alerts: alerts
      };
    } catch (error) {
      console.error('Error running automated alert checks:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new OperationsCommandService();

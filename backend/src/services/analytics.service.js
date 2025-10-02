const pool = require('../config/database');

class AnalyticsService {
  // Get real-time occupancy data
  async getOccupancyAnalytics(hospitalId) {
    try {
      const query = `
        WITH bed_status AS (
          SELECT 
            w.id as ward_id,
            w.name as ward_name,
            w.ward_type,
            w.total_beds,
            COUNT(ba.id) as occupied_beds,
            w.total_beds - COUNT(ba.id) as available_beds,
            ROUND((COUNT(ba.id)::numeric / NULLIF(w.total_beds, 0) * 100), 2) as occupancy_rate
          FROM wards w
          LEFT JOIN bed_assignments ba ON w.id = ba.ward_id 
            AND ba.status = 'OCCUPIED' 
            AND ba.discharge_date IS NULL
          WHERE w.hospital_id = $1
          GROUP BY w.id, w.name, w.ward_type, w.total_beds
        ),
        department_occupancy AS (
          SELECT 
            d.name as department_name,
            COUNT(DISTINCT e.id) as active_patients,
            COUNT(DISTINCT CASE WHEN e.encounter_type = 'EMERGENCY' THEN e.id END) as emergency_patients,
            COUNT(DISTINCT CASE WHEN e.encounter_type = 'OUTPATIENT' THEN e.id END) as outpatients,
            COUNT(DISTINCT CASE WHEN e.encounter_type = 'INPATIENT' THEN e.id END) as inpatients
          FROM departments d
          LEFT JOIN encounters e ON d.id = e.department_id
            AND e.status IN ('IN_PROGRESS', 'ADMITTED')
            AND DATE(e.encounter_date) = CURRENT_DATE
          WHERE d.hospital_id = $1
          GROUP BY d.id, d.name
        )
        SELECT 
          (SELECT SUM(total_beds) FROM bed_status) as total_beds,
          (SELECT SUM(occupied_beds) FROM bed_status) as total_occupied,
          (SELECT SUM(available_beds) FROM bed_status) as total_available,
          (SELECT ROUND(AVG(occupancy_rate), 2) FROM bed_status) as avg_occupancy_rate,
          (SELECT COUNT(*) FROM bed_status WHERE occupancy_rate >= 90) as critical_wards,
          (SELECT json_agg(row_to_json(bed_status)) FROM bed_status) as ward_details,
          (SELECT json_agg(row_to_json(department_occupancy)) FROM department_occupancy) as department_stats
      `;

      const result = await pool.query(query, [hospitalId || 1]);
      const data = result.rows[0];

      // Get admission trends
      const trendsQuery = `
        SELECT 
          DATE(admission_date) as date,
          COUNT(*) as admissions,
          COUNT(CASE WHEN admission_type = 'EMERGENCY' THEN 1 END) as emergency_admissions,
          COUNT(CASE WHEN admission_type = 'PLANNED' THEN 1 END) as planned_admissions
        FROM bed_assignments
        WHERE hospital_id = $1
        AND admission_date >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(admission_date)
        ORDER BY date DESC
      `;

      const trends = await pool.query(trendsQuery, [hospitalId || 1]);

      return {
        success: true,
        occupancy: {
          summary: {
            totalBeds: parseInt(data.total_beds || 0),
            occupied: parseInt(data.total_occupied || 0),
            available: parseInt(data.total_available || 0),
            occupancyRate: parseFloat(data.avg_occupancy_rate || 0),
            criticalWards: parseInt(data.critical_wards || 0)
          },
          wards: data.ward_details || [],
          departments: data.department_stats || [],
          weeklyTrends: trends.rows
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get patient flow analytics
  async getPatientFlowAnalytics(hospitalId, date = new Date()) {
    try {
      const query = `
        WITH hourly_flow AS (
          SELECT 
            EXTRACT(HOUR FROM created_at) as hour,
            COUNT(*) as patient_count,
            AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_wait_time
          FROM encounters
          WHERE hospital_id = $1
          AND DATE(encounter_date) = $2
          GROUP BY EXTRACT(HOUR FROM created_at)
        ),
        department_flow AS (
          SELECT 
            d.name as department,
            COUNT(e.id) as total_patients,
            AVG(CASE 
              WHEN e.status = 'COMPLETED' 
              THEN EXTRACT(EPOCH FROM (e.updated_at - e.created_at))/60 
              ELSE NULL 
            END) as avg_service_time,
            COUNT(CASE WHEN e.status = 'WAITING' THEN 1 END) as waiting_patients,
            COUNT(CASE WHEN e.status = 'IN_PROGRESS' THEN 1 END) as in_progress,
            COUNT(CASE WHEN e.status = 'COMPLETED' THEN 1 END) as completed
          FROM departments d
          LEFT JOIN encounters e ON d.id = e.department_id
            AND DATE(e.encounter_date) = $2
          WHERE d.hospital_id = $1
          GROUP BY d.id, d.name
        ),
        patient_categories AS (
          SELECT
            COUNT(CASE WHEN encounter_type = 'EMERGENCY' THEN 1 END) as emergency,
            COUNT(CASE WHEN encounter_type = 'OUTPATIENT' THEN 1 END) as outpatient,
            COUNT(CASE WHEN encounter_type = 'INPATIENT' THEN 1 END) as inpatient,
            COUNT(CASE WHEN encounter_type = 'FOLLOW_UP' THEN 1 END) as follow_up
          FROM encounters
          WHERE hospital_id = $1
          AND DATE(encounter_date) = $2
        )
        SELECT 
          (SELECT COUNT(*) FROM encounters WHERE hospital_id = $1 AND DATE(encounter_date) = $2) as total_patients_today,
          (SELECT COUNT(*) FROM encounters WHERE hospital_id = $1 AND DATE(encounter_date) = $2 AND status = 'WAITING') as currently_waiting,
          (SELECT AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/60) FROM encounters WHERE hospital_id = $1 AND DATE(encounter_date) = $2 AND status = 'WAITING') as avg_current_wait_time,
          (SELECT json_agg(row_to_json(hourly_flow) ORDER BY hour) FROM hourly_flow) as hourly_distribution,
          (SELECT json_agg(row_to_json(department_flow)) FROM department_flow) as department_flow,
          (SELECT row_to_json(patient_categories) FROM patient_categories) as patient_types
      `;

      const result = await pool.query(query, [hospitalId || 1, date]);
      const data = result.rows[0];

      // Get bottleneck analysis
      const bottleneckQuery = `
        SELECT 
          d.name as department,
          COUNT(e.id) as queue_length,
          AVG(EXTRACT(EPOCH FROM (NOW() - e.created_at))/60) as avg_wait_minutes
        FROM departments d
        JOIN encounters e ON d.id = e.department_id
        WHERE e.hospital_id = $1
        AND e.status = 'WAITING'
        AND DATE(e.encounter_date) = $2
        GROUP BY d.id, d.name
        HAVING COUNT(e.id) > 5
        ORDER BY avg_wait_minutes DESC
        LIMIT 5
      `;

      const bottlenecks = await pool.query(bottleneckQuery, [hospitalId || 1, date]);

      return {
        success: true,
        patientFlow: {
          summary: {
            totalToday: parseInt(data.total_patients_today || 0),
            currentlyWaiting: parseInt(data.currently_waiting || 0),
            avgWaitTime: Math.round(data.avg_current_wait_time || 0),
            patientTypes: data.patient_types || {}
          },
          hourlyDistribution: data.hourly_distribution || [],
          departmentFlow: data.department_flow || [],
          bottlenecks: bottlenecks.rows
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get emergency department metrics
  async getEmergencyMetrics(hospitalId) {
    try {
      const query = `
        WITH triage_stats AS (
          SELECT 
            triage_level,
            COUNT(*) as count,
            AVG(EXTRACT(EPOCH FROM (treatment_start_time - arrival_time))/60) as avg_wait_to_treatment
          FROM emergency_visits
          WHERE hospital_id = $1
          AND DATE(arrival_time) = CURRENT_DATE
          GROUP BY triage_level
        ),
        hourly_arrivals AS (
          SELECT 
            EXTRACT(HOUR FROM arrival_time) as hour,
            COUNT(*) as arrivals
          FROM emergency_visits
          WHERE hospital_id = $1
          AND DATE(arrival_time) = CURRENT_DATE
          GROUP BY EXTRACT(HOUR FROM arrival_time)
        )
        SELECT 
          (SELECT COUNT(*) FROM emergency_visits WHERE hospital_id = $1 AND DATE(arrival_time) = CURRENT_DATE) as total_today,
          (SELECT COUNT(*) FROM emergency_visits WHERE hospital_id = $1 AND DATE(arrival_time) = CURRENT_DATE AND status = 'WAITING') as waiting,
          (SELECT COUNT(*) FROM emergency_visits WHERE hospital_id = $1 AND DATE(arrival_time) = CURRENT_DATE AND status = 'IN_TREATMENT') as in_treatment,
          (SELECT AVG(EXTRACT(EPOCH FROM (treatment_start_time - arrival_time))/60) FROM emergency_visits WHERE hospital_id = $1 AND DATE(arrival_time) = CURRENT_DATE) as avg_wait_time,
          (SELECT json_agg(row_to_json(triage_stats) ORDER BY triage_level) FROM triage_stats) as triage_breakdown,
          (SELECT json_agg(row_to_json(hourly_arrivals) ORDER BY hour) FROM hourly_arrivals) as hourly_pattern
      `;

      const result = await pool.query(query, [hospitalId || 1]);

      return {
        success: true,
        emergency: result.rows[0]
      };
    } catch (error) {
      throw error;
    }
  }

  // Get department performance metrics
  async getDepartmentPerformance(hospitalId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          d.id,
          d.name as department_name,
          COUNT(DISTINCT e.patient_id) as unique_patients,
          COUNT(e.id) as total_encounters,
          AVG(CASE 
            WHEN e.status = 'COMPLETED' 
            THEN EXTRACT(EPOCH FROM (e.updated_at - e.created_at))/60 
          END) as avg_service_time,
          COUNT(DISTINCT e.doctor_id) as active_doctors,
          COUNT(DISTINCT DATE(e.encounter_date)) as operating_days,
          SUM(bi.total_price) as revenue_generated,
          COUNT(CASE WHEN ps.rating >= 4 THEN 1 END)::float / NULLIF(COUNT(ps.rating), 0) * 100 as satisfaction_rate
        FROM departments d
        LEFT JOIN encounters e ON d.id = e.department_id
          AND e.encounter_date BETWEEN $2 AND $3
        LEFT JOIN bills b ON e.id = b.encounter_id
        LEFT JOIN bill_items bi ON b.id = bi.bill_id
        LEFT JOIN patient_satisfaction ps ON e.id = ps.encounter_id
        WHERE d.hospital_id = $1
        GROUP BY d.id, d.name
        ORDER BY revenue_generated DESC
      `;

      const result = await pool.query(query, [hospitalId || 1, startDate, endDate]);

      return {
        success: true,
        departments: result.rows
      };
    } catch (error) {
      throw error;
    }
  }

  // Get resource utilization metrics
  async getResourceUtilization(hospitalId) {
    try {
      // Staff utilization
      const staffQuery = `
        SELECT 
          role,
          COUNT(*) as total_staff,
          COUNT(CASE WHEN a.attendance_date = CURRENT_DATE THEN 1 END) as present_today,
          ROUND(COUNT(CASE WHEN a.attendance_date = CURRENT_DATE THEN 1 END)::numeric / COUNT(*) * 100, 2) as attendance_rate,
          AVG(a.hours_worked) as avg_hours_worked
        FROM staff s
        LEFT JOIN staff_attendance a ON s.id = a.staff_id
        WHERE s.hospital_id = $1 AND s.status = 'ACTIVE'
        GROUP BY role
      `;

      const staffUtilization = await pool.query(staffQuery, [hospitalId || 1]);

      // Equipment utilization
      const equipmentQuery = `
        SELECT 
          category,
          COUNT(*) as total_equipment,
          COUNT(CASE WHEN status = 'IN_USE' THEN 1 END) as in_use,
          COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available,
          COUNT(CASE WHEN status = 'MAINTENANCE' THEN 1 END) as under_maintenance,
          ROUND(COUNT(CASE WHEN status = 'IN_USE' THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) as utilization_rate
        FROM medical_equipment
        WHERE hospital_id = $1
        GROUP BY category
      `;

      const equipmentUtilization = await pool.query(equipmentQuery, [hospitalId || 1]);

      // Operating room utilization
      const orQuery = `
        SELECT 
          or_name,
          COUNT(*) as surgeries_today,
          SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as total_hours_used,
          ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600) / 24 * 100, 2) as utilization_rate
        FROM operating_room_schedule
        WHERE hospital_id = $1
        AND DATE(surgery_date) = CURRENT_DATE
        GROUP BY or_name
      `;

      const orUtilization = await pool.query(orQuery, [hospitalId || 1]);

      return {
        success: true,
        utilization: {
          staff: staffUtilization.rows,
          equipment: equipmentUtilization.rows,
          operatingRooms: orUtilization.rows
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get financial performance metrics
  async getFinancialMetrics(hospitalId, period = '30days') {
    try {
      const intervalMap = {
        '7days': '7 days',
        '30days': '30 days',
        '90days': '90 days',
        '1year': '1 year'
      };

      const interval = intervalMap[period] || '30 days';

      const query = `
        WITH daily_metrics AS (
          SELECT 
            DATE(bill_date) as date,
            SUM(total_amount) as gross_revenue,
            SUM(patient_amount) as net_revenue,
            SUM(insurance_coverage) as insurance_revenue,
            COUNT(DISTINCT patient_id) as unique_patients,
            COUNT(id) as total_bills
          FROM bills
          WHERE hospital_id = $1
          AND bill_date >= CURRENT_DATE - INTERVAL '${interval}'
          GROUP BY DATE(bill_date)
        ),
        payment_metrics AS (
          SELECT 
            SUM(CASE WHEN payment_method = 'CASH' THEN amount_paid ELSE 0 END) as cash_collected,
            SUM(CASE WHEN payment_method = 'CARD' THEN amount_paid ELSE 0 END) as card_collected,
            SUM(CASE WHEN payment_method = 'BANK_TRANSFER' THEN amount_paid ELSE 0 END) as transfer_collected,
            SUM(amount_paid) as total_collected
          FROM payments p
          JOIN bills b ON p.bill_id = b.id
          WHERE b.hospital_id = $1
          AND p.payment_date >= CURRENT_DATE - INTERVAL '${interval}'
        ),
        outstanding_metrics AS (
          SELECT 
            COUNT(*) as outstanding_bills,
            SUM(patient_amount - COALESCE(paid.amount_paid, 0)) as outstanding_amount
          FROM bills b
          LEFT JOIN (
            SELECT bill_id, SUM(amount_paid) as amount_paid
            FROM payments
            GROUP BY bill_id
          ) paid ON b.id = paid.bill_id
          WHERE b.hospital_id = $1
          AND b.status IN ('PENDING', 'PARTIAL')
        )
        SELECT 
          (SELECT SUM(gross_revenue) FROM daily_metrics) as total_gross_revenue,
          (SELECT SUM(net_revenue) FROM daily_metrics) as total_net_revenue,
          (SELECT SUM(insurance_revenue) FROM daily_metrics) as total_insurance_revenue,
          (SELECT AVG(gross_revenue) FROM daily_metrics) as avg_daily_revenue,
          (SELECT json_agg(row_to_json(daily_metrics) ORDER BY date DESC) FROM daily_metrics) as daily_breakdown,
          (SELECT row_to_json(payment_metrics) FROM payment_metrics) as payment_methods,
          (SELECT row_to_json(outstanding_metrics) FROM outstanding_metrics) as outstanding
      `;

      const result = await pool.query(query, [hospitalId || 1]);

      return {
        success: true,
        financial: result.rows[0]
      };
    } catch (error) {
      throw error;
    }
  }

  // Get predictive analytics
  async getPredictiveAnalytics(hospitalId) {
    try {
      // Predict next day patient volume based on historical data
      const volumeQuery = `
        WITH historical_data AS (
          SELECT 
            EXTRACT(DOW FROM encounter_date) as day_of_week,
            COUNT(*) as patient_count
          FROM encounters
          WHERE hospital_id = $1
          AND encounter_date >= CURRENT_DATE - INTERVAL '90 days'
          GROUP BY EXTRACT(DOW FROM encounter_date)
        )
        SELECT 
          AVG(CASE WHEN day_of_week = EXTRACT(DOW FROM CURRENT_DATE + INTERVAL '1 day') THEN patient_count END) as predicted_tomorrow,
          AVG(patient_count) as avg_daily_patients,
          MAX(patient_count) as max_daily_patients,
          MIN(patient_count) as min_daily_patients
        FROM historical_data
      `;

      const volumePrediction = await pool.query(volumeQuery, [hospitalId || 1]);

      // Predict bed occupancy
      const occupancyQuery = `
        WITH occupancy_trend AS (
          SELECT 
            DATE(admission_date) as date,
            COUNT(*) as admissions,
            AVG(COUNT(*)) OVER (ORDER BY DATE(admission_date) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
          FROM bed_assignments
          WHERE hospital_id = $1
          AND admission_date >= CURRENT_DATE - INTERVAL '30 days'
          GROUP BY DATE(admission_date)
        )
        SELECT 
          ROUND(AVG(moving_avg)) as predicted_admissions,
          ROUND(AVG(moving_avg) * 3.5) as predicted_bed_days -- Assuming avg stay of 3.5 days
        FROM occupancy_trend
        WHERE date >= CURRENT_DATE - INTERVAL '7 days'
      `;

      const occupancyPrediction = await pool.query(occupancyQuery, [hospitalId || 1]);

      // Predict supply needs
      const supplyQuery = `
        WITH usage_pattern AS (
          SELECT 
            item_id,
            i.item_name,
            i.category,
            AVG(quantity) as avg_daily_usage,
            i.quantity_in_stock,
            i.reorder_level
          FROM stock_movements sm
          JOIN inventory_items i ON sm.item_id = i.id
          WHERE sm.movement_type IN ('DISPENSED', 'STOCK_OUT')
          AND sm.movement_date >= CURRENT_DATE - INTERVAL '30 days'
          AND i.hospital_id = $1
          GROUP BY item_id, i.item_name, i.category, i.quantity_in_stock, i.reorder_level
        )
        SELECT 
          item_name,
          category,
          ROUND(avg_daily_usage * 7) as predicted_weekly_usage,
          quantity_in_stock,
          ROUND(quantity_in_stock / NULLIF(avg_daily_usage, 0)) as days_until_stockout
        FROM usage_pattern
        WHERE quantity_in_stock / NULLIF(avg_daily_usage, 0) <= 14
        ORDER BY days_until_stockout ASC
        LIMIT 10
      `;

      const supplyPrediction = await pool.query(supplyQuery, [hospitalId || 1]);

      return {
        success: true,
        predictions: {
          patientVolume: {
            tomorrow: Math.round(volumePrediction.rows[0]?.predicted_tomorrow || 0),
            avgDaily: Math.round(volumePrediction.rows[0]?.avg_daily_patients || 0),
            range: {
              min: volumePrediction.rows[0]?.min_daily_patients || 0,
              max: volumePrediction.rows[0]?.max_daily_patients || 0
            }
          },
          bedOccupancy: {
            expectedAdmissions: occupancyPrediction.rows[0]?.predicted_admissions || 0,
            expectedBedDays: occupancyPrediction.rows[0]?.predicted_bed_days || 0
          },
          supplyNeeds: supplyPrediction.rows
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate executive dashboard
  async getExecutiveDashboard(hospitalId) {
    try {
      const [
        occupancy,
        patientFlow,
        financial,
        utilization,
        predictions
      ] = await Promise.all([
        this.getOccupancyAnalytics(hospitalId),
        this.getPatientFlowAnalytics(hospitalId),
        this.getFinancialMetrics(hospitalId, '30days'),
        this.getResourceUtilization(hospitalId),
        this.getPredictiveAnalytics(hospitalId)
      ]);

      return {
        success: true,
        dashboard: {
          timestamp: new Date().toISOString(),
          occupancy: occupancy.occupancy.summary,
          patientFlow: patientFlow.patientFlow.summary,
          financial: {
            monthlyRevenue: financial.financial.total_net_revenue,
            dailyAverage: financial.financial.avg_daily_revenue,
            outstanding: financial.financial.outstanding
          },
          utilization: {
            staffPresent: utilization.utilization.staff.reduce((sum, s) => sum + (s.present_today || 0), 0),
            equipmentInUse: utilization.utilization.equipment.reduce((sum, e) => sum + (e.in_use || 0), 0)
          },
          predictions: predictions.predictions,
          alerts: await this.getActiveAlerts(hospitalId)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get active alerts
  async getActiveAlerts(hospitalId) {
    try {
      const query = `
        SELECT 
          alert_type,
          severity,
          COUNT(*) as count,
          array_agg(message) as messages
        FROM (
          SELECT 'INVENTORY' as alert_type, severity, message
          FROM inventory_alerts
          WHERE status = 'ACTIVE' AND hospital_id = $1
          UNION ALL
          SELECT 'CLINICAL' as alert_type, severity, message
          FROM clinical_alerts
          WHERE status = 'ACTIVE' AND hospital_id = $1
          UNION ALL
          SELECT 'OPERATIONAL' as alert_type, 'HIGH' as severity, 
                 'Ward at critical occupancy: ' || name as message
          FROM wards
          WHERE hospital_id = $1
          AND (SELECT COUNT(*) FROM bed_assignments WHERE ward_id = wards.id AND status = 'OCCUPIED') 
              >= total_beds * 0.95
        ) alerts
        GROUP BY alert_type, severity
        ORDER BY 
          CASE severity 
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            ELSE 4
          END
      `;

      const result = await pool.query(query, [hospitalId || 1]);

      return result.rows;
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }
}

module.exports = new AnalyticsService();

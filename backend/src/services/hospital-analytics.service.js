const { pool } = require('../config/database');

class HospitalAnalyticsService {
  // Real-time occupancy analytics
  async getOccupancyMetrics(hospitalId) {
    try {
      const query = `
        SELECT 
          h.id as hospital_id,
          h.name as hospital_name,
          h.total_beds,
          COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'ADMITTED') as occupied_beds,
          ROUND((COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'ADMITTED')::numeric / h.total_beds) * 100, 2) as occupancy_rate,
          COUNT(DISTINCT a.id) FILTER (WHERE a.admission_date >= NOW() - INTERVAL '24 hours') as new_admissions,
          COUNT(DISTINCT d.id) FILTER (WHERE d.discharge_date >= NOW() - INTERVAL '24 hours') as recent_discharges,
          COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'IN_PROGRESS') as emergency_cases,
          AVG(EXTRACT(EPOCH FROM (COALESCE(d.discharge_date, NOW()) - a.admission_date))/86400)::numeric(10,2) as avg_length_of_stay
        FROM hospitals h
        LEFT JOIN admissions a ON h.id = a.hospital_id
        LEFT JOIN discharges d ON a.id = d.admission_id
        LEFT JOIN emergency_cases e ON h.id = e.hospital_id
        WHERE h.id = $1
        GROUP BY h.id, h.name, h.total_beds
      `;

      const result = await pool.query(query, [hospitalId]);
      return result.rows[0] || {};
    } catch (error) {
      console.error('Error fetching occupancy metrics:', error);
      throw error;
    }
  }

  // Patient flow analytics
  async getPatientFlowMetrics(hospitalId, dateRange) {
    try {
      const query = `
        WITH hourly_flow AS (
          SELECT 
            DATE_TRUNC('hour', arrival_time) as hour,
            COUNT(*) as arrivals,
            AVG(wait_time_minutes) as avg_wait_time,
            COUNT(*) FILTER (WHERE department = 'EMERGENCY') as emergency_visits,
            COUNT(*) FILTER (WHERE department = 'OPD') as opd_visits,
            COUNT(*) FILTER (WHERE department = 'SPECIALIST') as specialist_visits
          FROM patient_visits
          WHERE hospital_id = $1
            AND arrival_time BETWEEN $2 AND $3
          GROUP BY DATE_TRUNC('hour', arrival_time)
        )
        SELECT 
          hour,
          arrivals,
          avg_wait_time,
          emergency_visits,
          opd_visits,
          specialist_visits,
          SUM(arrivals) OVER (ORDER BY hour) as cumulative_patients
        FROM hourly_flow
        ORDER BY hour
      `;

      const result = await pool.query(query, [
        hospitalId,
        dateRange.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        dateRange.endDate || new Date()
      ]);

      return result.rows;
    } catch (error) {
      console.error('Error fetching patient flow metrics:', error);
      throw error;
    }
  }

  // Revenue analytics
  async getRevenueMetrics(hospitalId, period) {
    try {
      const query = `
        SELECT 
          DATE_TRUNC($2, payment_date) as period,
          COUNT(DISTINCT b.id) as total_bills,
          SUM(b.total_amount) as total_billed,
          SUM(p.amount_paid) as total_collected,
          SUM(b.total_amount - COALESCE(p.amount_paid, 0)) as outstanding,
          COUNT(DISTINCT b.id) FILTER (WHERE b.payment_status = 'PAID') as paid_bills,
          COUNT(DISTINCT b.id) FILTER (WHERE b.payment_status = 'PENDING') as pending_bills,
          SUM(b.insurance_amount) as insurance_claims,
          SUM(b.nhis_amount) as nhis_claims,
          AVG(b.total_amount) as avg_bill_amount,
          json_agg(DISTINCT b.service_category) as service_categories
        FROM bills b
        LEFT JOIN payments p ON b.id = p.bill_id
        WHERE b.hospital_id = $1
          AND b.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC($2, payment_date)
        ORDER BY period DESC
      `;

      const result = await pool.query(query, [
        hospitalId,
        period || 'day'
      ]);

      // Calculate collection rate
      const metrics = result.rows.map(row => ({
        ...row,
        collection_rate: row.total_billed > 0 
          ? ((row.total_collected / row.total_billed) * 100).toFixed(2)
          : 0
      }));

      return metrics;
    } catch (error) {
      console.error('Error fetching revenue metrics:', error);
      throw error;
    }
  }

  // Staff performance analytics
  async getStaffPerformanceMetrics(hospitalId) {
    try {
      const query = `
        WITH staff_metrics AS (
          SELECT 
            s.id,
            s.name,
            s.role,
            s.department,
            COUNT(DISTINCT p.id) as patients_attended,
            AVG(pr.rating) as avg_rating,
            COUNT(DISTINCT sh.id) as shifts_worked,
            SUM(sh.hours_worked) as total_hours,
            COUNT(DISTINCT t.id) as procedures_performed,
            COUNT(DISTINCT pr.id) as reviews_received
          FROM staff s
          LEFT JOIN patient_consultations pc ON s.id = pc.staff_id
          LEFT JOIN patients p ON pc.patient_id = p.id
          LEFT JOIN patient_reviews pr ON s.id = pr.staff_id
          LEFT JOIN staff_shifts sh ON s.id = sh.staff_id
          LEFT JOIN medical_procedures t ON s.id = t.performed_by
          WHERE s.hospital_id = $1
            AND sh.shift_date >= NOW() - INTERVAL '30 days'
          GROUP BY s.id, s.name, s.role, s.department
        )
        SELECT 
          *,
          CASE 
            WHEN total_hours > 0 
            THEN ROUND((patients_attended::numeric / total_hours) * 8, 2)
            ELSE 0 
          END as patients_per_shift,
          RANK() OVER (PARTITION BY department ORDER BY patients_attended DESC) as dept_rank
        FROM staff_metrics
        ORDER BY department, patients_attended DESC
      `;

      const result = await pool.query(query, [hospitalId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching staff performance metrics:', error);
      throw error;
    }
  }

  // Inventory analytics
  async getInventoryMetrics(hospitalId) {
    try {
      const query = `
        SELECT 
          ic.category_name,
          COUNT(DISTINCT i.id) as total_items,
          SUM(i.quantity_in_stock) as total_stock,
          SUM(i.quantity_in_stock * i.unit_cost) as stock_value,
          COUNT(DISTINCT i.id) FILTER (WHERE i.quantity_in_stock <= i.reorder_level) as low_stock_items,
          COUNT(DISTINCT i.id) FILTER (WHERE i.quantity_in_stock = 0) as out_of_stock,
          COUNT(DISTINCT i.id) FILTER (WHERE i.expiry_date <= NOW() + INTERVAL '30 days') as expiring_soon,
          AVG(i.quantity_in_stock::numeric / NULLIF(i.reorder_level, 0)) as avg_stock_ratio
        FROM inventory_items i
        JOIN inventory_categories ic ON i.category_id = ic.id
        WHERE i.hospital_id = $1
        GROUP BY ic.category_name
        ORDER BY stock_value DESC
      `;

      const result = await pool.query(query, [hospitalId]);
      
      // Add critical alerts
      const criticalItems = await this.getCriticalInventoryAlerts(hospitalId);
      
      return {
        categories: result.rows,
        criticalAlerts: criticalItems
      };
    } catch (error) {
      console.error('Error fetching inventory metrics:', error);
      throw error;
    }
  }

  // Critical inventory alerts
  async getCriticalInventoryAlerts(hospitalId) {
    try {
      const query = `
        SELECT 
          i.item_name,
          i.quantity_in_stock,
          i.reorder_level,
          i.expiry_date,
          CASE
            WHEN i.quantity_in_stock = 0 THEN 'OUT_OF_STOCK'
            WHEN i.quantity_in_stock <= i.reorder_level THEN 'LOW_STOCK'
            WHEN i.expiry_date <= NOW() THEN 'EXPIRED'
            WHEN i.expiry_date <= NOW() + INTERVAL '7 days' THEN 'EXPIRING_SOON'
          END as alert_type,
          CASE
            WHEN i.quantity_in_stock = 0 THEN 'CRITICAL'
            WHEN i.quantity_in_stock <= i.reorder_level * 0.5 THEN 'HIGH'
            ELSE 'MEDIUM'
          END as priority
        FROM inventory_items i
        WHERE i.hospital_id = $1
          AND (
            i.quantity_in_stock <= i.reorder_level
            OR i.expiry_date <= NOW() + INTERVAL '30 days'
          )
        ORDER BY 
          CASE priority
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            ELSE 3
          END,
          i.quantity_in_stock ASC
        LIMIT 20
      `;

      const result = await pool.query(query, [hospitalId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching critical inventory alerts:', error);
      throw error;
    }
  }

  // Department-wise analytics
  async getDepartmentMetrics(hospitalId) {
    try {
      const query = `
        SELECT 
          d.department_name,
          COUNT(DISTINCT p.id) as patients_served,
          COUNT(DISTINCT s.id) as staff_count,
          AVG(pv.wait_time_minutes) as avg_wait_time,
          COUNT(DISTINCT pv.id) FILTER (WHERE pv.created_at >= NOW() - INTERVAL '24 hours') as today_visits,
          SUM(b.total_amount) as revenue_generated,
          AVG(pr.rating) as avg_satisfaction,
          COUNT(DISTINCT e.id) FILTER (WHERE e.priority = 'HIGH') as high_priority_cases
        FROM departments d
        LEFT JOIN patient_visits pv ON d.id = pv.department_id
        LEFT JOIN patients p ON pv.patient_id = p.id
        LEFT JOIN staff s ON d.id = s.department_id
        LEFT JOIN bills b ON pv.id = b.visit_id
        LEFT JOIN patient_reviews pr ON pv.id = pr.visit_id
        LEFT JOIN emergency_cases e ON d.id = e.department_id
        WHERE d.hospital_id = $1
          AND pv.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY d.department_name
        ORDER BY patients_served DESC
      `;

      const result = await pool.query(query, [hospitalId]);
      return result.rows;
    } catch (error) {
      console.error('Error fetching department metrics:', error);
      throw error;
    }
  }

  // Predictive analytics
  async getPredictiveMetrics(hospitalId) {
    try {
      // Predict next week's patient volume based on historical data
      const volumeQuery = `
        WITH weekly_averages AS (
          SELECT 
            EXTRACT(DOW FROM arrival_time) as day_of_week,
            EXTRACT(HOUR FROM arrival_time) as hour_of_day,
            COUNT(*) as patient_count
          FROM patient_visits
          WHERE hospital_id = $1
            AND arrival_time >= NOW() - INTERVAL '90 days'
          GROUP BY EXTRACT(DOW FROM arrival_time), EXTRACT(HOUR FROM arrival_time)
        ),
        daily_trend AS (
          SELECT 
            DATE_TRUNC('day', arrival_time) as day,
            COUNT(*) as daily_count,
            AVG(COUNT(*)) OVER (ORDER BY DATE_TRUNC('day', arrival_time) ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
          FROM patient_visits
          WHERE hospital_id = $1
            AND arrival_time >= NOW() - INTERVAL '30 days'
          GROUP BY DATE_TRUNC('day', arrival_time)
        )
        SELECT 
          'next_week_prediction' as metric,
          json_build_object(
            'expected_daily_average', ROUND(AVG(daily_count)),
            'peak_hours', (
              SELECT json_agg(hour_of_day ORDER BY patient_count DESC)
              FROM (SELECT hour_of_day, SUM(patient_count) as patient_count FROM weekly_averages GROUP BY hour_of_day ORDER BY patient_count DESC LIMIT 3) t
            ),
            'busiest_days', (
              SELECT json_agg(day_of_week ORDER BY patient_count DESC)
              FROM (SELECT day_of_week, SUM(patient_count) as patient_count FROM weekly_averages GROUP BY day_of_week ORDER BY patient_count DESC LIMIT 3) t
            ),
            'trend', CASE 
              WHEN (SELECT moving_avg FROM daily_trend ORDER BY day DESC LIMIT 1) > (SELECT moving_avg FROM daily_trend ORDER BY day ASC LIMIT 1) 
              THEN 'INCREASING'
              ELSE 'DECREASING'
            END
          ) as prediction_data
        FROM daily_trend
      `;

      const volumeResult = await pool.query(volumeQuery, [hospitalId]);

      // Predict drug demand
      const drugDemandQuery = `
        WITH usage_trend AS (
          SELECT 
            i.item_name,
            i.category_id,
            AVG(iu.quantity_used) as avg_daily_usage,
            STDDEV(iu.quantity_used) as usage_stddev,
            i.quantity_in_stock,
            i.reorder_level,
            CASE 
              WHEN i.quantity_in_stock > 0 
              THEN ROUND(i.quantity_in_stock::numeric / NULLIF(AVG(iu.quantity_used), 0))
              ELSE 0 
            END as days_until_stockout
          FROM inventory_items i
          LEFT JOIN inventory_usage iu ON i.id = iu.item_id
          WHERE i.hospital_id = $1
            AND iu.usage_date >= NOW() - INTERVAL '30 days'
          GROUP BY i.id, i.item_name, i.category_id, i.quantity_in_stock, i.reorder_level
          HAVING AVG(iu.quantity_used) > 0
        )
        SELECT 
          item_name,
          avg_daily_usage,
          days_until_stockout,
          CASE 
            WHEN days_until_stockout <= 3 THEN 'CRITICAL'
            WHEN days_until_stockout <= 7 THEN 'HIGH'
            WHEN days_until_stockout <= 14 THEN 'MEDIUM'
            ELSE 'LOW'
          END as urgency
        FROM usage_trend
        WHERE days_until_stockout <= 14
        ORDER BY days_until_stockout ASC
        LIMIT 10
      `;

      const drugResult = await pool.query(drugDemandQuery, [hospitalId]);

      return {
        patientVolume: volumeResult.rows[0],
        inventoryPredictions: drugResult.rows
      };
    } catch (error) {
      console.error('Error fetching predictive metrics:', error);
      throw error;
    }
  }

  // Comprehensive dashboard metrics
  async getDashboardMetrics(hospitalId) {
    try {
      const [
        occupancy,
        revenue,
        departments,
        predictions
      ] = await Promise.all([
        this.getOccupancyMetrics(hospitalId),
        this.getRevenueMetrics(hospitalId, 'day'),
        this.getDepartmentMetrics(hospitalId),
        this.getPredictiveMetrics(hospitalId)
      ]);

      // Get real-time alerts
      const alertsQuery = `
        SELECT 
          'alert' as type,
          priority,
          message,
          created_at
        FROM system_alerts
        WHERE hospital_id = $1
          AND acknowledged = false
          AND created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY 
          CASE priority
            WHEN 'CRITICAL' THEN 1
            WHEN 'HIGH' THEN 2
            WHEN 'MEDIUM' THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT 10
      `;

      const alerts = await pool.query(alertsQuery, [hospitalId]);

      return {
        timestamp: new Date(),
        occupancy,
        revenue: revenue[0] || {},
        departments,
        predictions,
        alerts: alerts.rows,
        summary: {
          status: occupancy.occupancy_rate > 90 ? 'CRITICAL' : occupancy.occupancy_rate > 75 ? 'HIGH' : 'NORMAL',
          message: this.generateSummaryMessage(occupancy, revenue[0])
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  generateSummaryMessage(occupancy, revenue) {
    const messages = [];
    
    if (occupancy.occupancy_rate > 90) {
      messages.push(`High occupancy alert: ${occupancy.occupancy_rate}% beds occupied`);
    }
    
    if (revenue && revenue.collection_rate < 70) {
      messages.push(`Low collection rate: ${revenue.collection_rate}%`);
    }
    
    if (occupancy.emergency_cases > 5) {
      messages.push(`${occupancy.emergency_cases} emergency cases in progress`);
    }
    
    return messages.length > 0 ? messages.join('. ') : 'All systems operational';
  }
}

module.exports = new HospitalAnalyticsService();

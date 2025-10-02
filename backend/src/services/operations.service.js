const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class OperationsService {
  // Get aggregated metrics across all hospitals
  async getMultiHospitalMetrics(timeRange = '24h') {
    try {
      const metrics = {
        timestamp: new Date(),
        timeRange,
        hospitals: [],
        aggregate: {
          totalPatients: 0,
          totalAdmissions: 0,
          totalRevenue: 0,
          averageOccupancy: 0,
          criticalAlerts: 0,
          staffOnDuty: 0,
          emergencyCases: 0
        }
      };

      // Get all hospitals
      const hospitals = await db.query(`
        SELECT h.*, 
               COUNT(DISTINCT p.id) as patient_count,
               COUNT(DISTINCT e.id) FILTER (WHERE e.created_at > NOW() - INTERVAL '24 hours') as daily_encounters
        FROM hospitals h
        LEFT JOIN patients p ON p.hospital_id = h.id
        LEFT JOIN encounters e ON e.hospital_id = h.id
        GROUP BY h.id
        ORDER BY h.name
      `);

      for (const hospital of hospitals.rows) {
        const hospitalMetrics = await this.getHospitalMetrics(hospital.id, timeRange);
        metrics.hospitals.push({
          id: hospital.id,
          name: hospital.name,
          location: hospital.location,
          metrics: hospitalMetrics
        });

        // Aggregate totals
        metrics.aggregate.totalPatients += hospitalMetrics.patients.total;
        metrics.aggregate.totalAdmissions += hospitalMetrics.admissions.current;
        metrics.aggregate.totalRevenue += hospitalMetrics.finance.dailyRevenue;
        metrics.aggregate.staffOnDuty += hospitalMetrics.staffing.onDuty;
        metrics.aggregate.emergencyCases += hospitalMetrics.emergency.activeCases;
        metrics.aggregate.criticalAlerts += hospitalMetrics.alerts.critical;
      }

      // Calculate averages
      if (hospitals.rows.length > 0) {
        metrics.aggregate.averageOccupancy = 
          metrics.hospitals.reduce((sum, h) => sum + h.metrics.occupancy.percentage, 0) / hospitals.rows.length;
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching multi-hospital metrics:', error);
      throw error;
    }
  }

  // Get detailed metrics for a single hospital
  async getHospitalMetrics(hospitalId, timeRange = '24h') {
    const timeFilter = this.getTimeFilter(timeRange);
    
    try {
      const metrics = {
        hospitalId,
        timestamp: new Date(),
        
        // Patient metrics
        patients: {
          total: 0,
          newToday: 0,
          outpatient: 0,
          inpatient: 0,
          discharged: 0,
          averageWaitTime: 0,
          satisfactionScore: 0
        },
        
        // Admission metrics
        admissions: {
          current: 0,
          newToday: 0,
          planned: 0,
          emergency: 0,
          averageLOS: 0, // Length of Stay
          dischargeRate: 0
        },
        
        // Occupancy metrics
        occupancy: {
          totalBeds: 0,
          occupiedBeds: 0,
          percentage: 0,
          icuOccupancy: 0,
          wardOccupancy: 0,
          emergencyOccupancy: 0
        },
        
        // Staff metrics
        staffing: {
          totalStaff: 0,
          onDuty: 0,
          onLeave: 0,
          attendanceRate: 0,
          patientToNurseRatio: 0,
          doctorAvailability: 0
        },
        
        // Financial metrics
        finance: {
          dailyRevenue: 0,
          pendingPayments: 0,
          insuranceClaims: 0,
          collectionRate: 0,
          averageBillSize: 0,
          revenueByDepartment: {}
        },
        
        // Clinical metrics
        clinical: {
          surgeries: 0,
          labTests: 0,
          prescriptions: 0,
          criticalResults: 0,
          readmissionRate: 0,
          mortalityRate: 0
        },
        
        // Inventory metrics
        inventory: {
          stockLevels: 0,
          lowStockItems: 0,
          expiringItems: 0,
          stockValue: 0,
          consumptionRate: 0
        },
        
        // Emergency metrics
        emergency: {
          activeCases: 0,
          averageResponseTime: 0,
          triageDistribution: {},
          criticalCases: 0
        },
        
        // Quality metrics
        quality: {
          infectionRate: 0,
          fallRate: 0,
          medicationErrors: 0,
          patientComplaints: 0,
          complianceScore: 0
        },
        
        // Alerts
        alerts: {
          critical: 0,
          warning: 0,
          info: 0,
          unresolved: 0
        }
      };

      // Fetch patient metrics
      const patientStats = await db.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as new_today,
          AVG(EXTRACT(EPOCH FROM (first_consultation_time - registration_time))/60) as avg_wait_time
        FROM patients 
        WHERE hospital_id = $1
      `, [hospitalId]);

      if (patientStats.rows[0]) {
        metrics.patients.total = parseInt(patientStats.rows[0].total) || 0;
        metrics.patients.newToday = parseInt(patientStats.rows[0].new_today) || 0;
        metrics.patients.averageWaitTime = parseFloat(patientStats.rows[0].avg_wait_time) || 0;
      }

      // Fetch encounter metrics
      const encounterStats = await db.query(`
        SELECT 
          encounter_type,
          COUNT(*) as count
        FROM encounters 
        WHERE hospital_id = $1 AND encounter_date > NOW() - INTERVAL '${timeRange}'
        GROUP BY encounter_type
      `, [hospitalId]);

      encounterStats.rows.forEach(row => {
        if (row.encounter_type === 'outpatient') {
          metrics.patients.outpatient = parseInt(row.count) || 0;
        } else if (row.encounter_type === 'inpatient') {
          metrics.patients.inpatient = parseInt(row.count) || 0;
        } else if (row.encounter_type === 'emergency') {
          metrics.emergency.activeCases = parseInt(row.count) || 0;
        }
      });

      // Fetch admission metrics
      const admissionStats = await db.query(`
        SELECT 
          COUNT(*) as current_admissions,
          COUNT(*) FILTER (WHERE admission_date > NOW() - INTERVAL '24 hours') as new_today,
          COUNT(*) FILTER (WHERE admission_type = 'planned') as planned,
          COUNT(*) FILTER (WHERE admission_type = 'emergency') as emergency,
          AVG(EXTRACT(EPOCH FROM (discharge_date - admission_date))/86400) as avg_los
        FROM admissions 
        WHERE hospital_id = $1 AND discharge_date IS NULL
      `, [hospitalId]);

      if (admissionStats.rows[0]) {
        metrics.admissions.current = parseInt(admissionStats.rows[0].current_admissions) || 0;
        metrics.admissions.newToday = parseInt(admissionStats.rows[0].new_today) || 0;
        metrics.admissions.planned = parseInt(admissionStats.rows[0].planned) || 0;
        metrics.admissions.emergency = parseInt(admissionStats.rows[0].emergency) || 0;
        metrics.admissions.averageLOS = parseFloat(admissionStats.rows[0].avg_los) || 0;
      }

      // Fetch bed occupancy
      const bedStats = await db.query(`
        SELECT 
          SUM(total_beds) as total_beds,
          SUM(occupied_beds) as occupied_beds,
          SUM(icu_beds) as icu_total,
          SUM(icu_occupied) as icu_occupied
        FROM bed_occupancy 
        WHERE hospital_id = $1
      `, [hospitalId]);

      if (bedStats.rows[0]) {
        metrics.occupancy.totalBeds = parseInt(bedStats.rows[0].total_beds) || 0;
        metrics.occupancy.occupiedBeds = parseInt(bedStats.rows[0].occupied_beds) || 0;
        if (metrics.occupancy.totalBeds > 0) {
          metrics.occupancy.percentage = 
            (metrics.occupancy.occupiedBeds / metrics.occupancy.totalBeds) * 100;
        }
        
        const icuTotal = parseInt(bedStats.rows[0].icu_total) || 0;
        const icuOccupied = parseInt(bedStats.rows[0].icu_occupied) || 0;
        if (icuTotal > 0) {
          metrics.occupancy.icuOccupancy = (icuOccupied / icuTotal) * 100;
        }
      }

      // Fetch staff metrics
      const staffStats = await db.query(`
        SELECT 
          COUNT(DISTINCT s.id) as total_staff,
          COUNT(DISTINCT s.id) FILTER (WHERE a.status = 'present') as on_duty,
          COUNT(DISTINCT s.id) FILTER (WHERE l.status = 'approved' AND CURRENT_DATE BETWEEN l.start_date AND l.end_date) as on_leave
        FROM staff s
        LEFT JOIN attendance a ON s.id = a.staff_id AND a.date = CURRENT_DATE
        LEFT JOIN leave_requests l ON s.id = l.staff_id
        WHERE s.hospital_id = $1
      `, [hospitalId]);

      if (staffStats.rows[0]) {
        metrics.staffing.totalStaff = parseInt(staffStats.rows[0].total_staff) || 0;
        metrics.staffing.onDuty = parseInt(staffStats.rows[0].on_duty) || 0;
        metrics.staffing.onLeave = parseInt(staffStats.rows[0].on_leave) || 0;
        
        if (metrics.staffing.totalStaff > 0) {
          metrics.staffing.attendanceRate = 
            (metrics.staffing.onDuty / metrics.staffing.totalStaff) * 100;
        }
      }

      // Fetch financial metrics
      const financeStats = await db.query(`
        SELECT 
          SUM(total_amount) FILTER (WHERE bill_date > NOW() - INTERVAL '24 hours') as daily_revenue,
          SUM(total_amount) FILTER (WHERE status = 'pending') as pending_payments,
          COUNT(*) FILTER (WHERE payment_method IN ('nhis', 'hmo', 'insurance')) as insurance_claims,
          AVG(total_amount) as avg_bill_size
        FROM bills 
        WHERE hospital_id = $1 AND bill_date > NOW() - INTERVAL '${timeRange}'
      `, [hospitalId]);

      if (financeStats.rows[0]) {
        metrics.finance.dailyRevenue = parseFloat(financeStats.rows[0].daily_revenue) || 0;
        metrics.finance.pendingPayments = parseFloat(financeStats.rows[0].pending_payments) || 0;
        metrics.finance.insuranceClaims = parseInt(financeStats.rows[0].insurance_claims) || 0;
        metrics.finance.averageBillSize = parseFloat(financeStats.rows[0].avg_bill_size) || 0;
      }

      // Fetch inventory metrics
      const inventoryStats = await db.query(`
        SELECT 
          COUNT(*) as total_items,
          COUNT(*) FILTER (WHERE current_quantity <= reorder_level) as low_stock,
          COUNT(*) FILTER (WHERE expiry_date <= NOW() + INTERVAL '30 days') as expiring_soon,
          SUM(current_quantity * unit_price) as stock_value
        FROM inventory_items 
        WHERE hospital_id = $1
      `, [hospitalId]);

      if (inventoryStats.rows[0]) {
        metrics.inventory.stockLevels = parseInt(inventoryStats.rows[0].total_items) || 0;
        metrics.inventory.lowStockItems = parseInt(inventoryStats.rows[0].low_stock) || 0;
        metrics.inventory.expiringItems = parseInt(inventoryStats.rows[0].expiring_soon) || 0;
        metrics.inventory.stockValue = parseFloat(inventoryStats.rows[0].stock_value) || 0;
      }

      // Calculate alerts
      metrics.alerts = await this.calculateAlerts(metrics);

      return metrics;
    } catch (error) {
      console.error('Error fetching hospital metrics:', error);
      throw error;
    }
  }

  // Calculate alerts based on metrics
  async calculateAlerts(metrics) {
    const alerts = {
      critical: 0,
      warning: 0,
      info: 0,
      unresolved: 0,
      details: []
    };

    // Critical alerts
    if (metrics.occupancy.percentage > 95) {
      alerts.critical++;
      alerts.details.push({
        type: 'critical',
        category: 'occupancy',
        message: `Critical: Bed occupancy at ${metrics.occupancy.percentage.toFixed(1)}%`,
        value: metrics.occupancy.percentage,
        threshold: 95
      });
    }

    if (metrics.occupancy.icuOccupancy > 90) {
      alerts.critical++;
      alerts.details.push({
        type: 'critical',
        category: 'icu',
        message: `Critical: ICU occupancy at ${metrics.occupancy.icuOccupancy.toFixed(1)}%`,
        value: metrics.occupancy.icuOccupancy,
        threshold: 90
      });
    }

    if (metrics.inventory.lowStockItems > 10) {
      alerts.critical++;
      alerts.details.push({
        type: 'critical',
        category: 'inventory',
        message: `Critical: ${metrics.inventory.lowStockItems} items low on stock`,
        value: metrics.inventory.lowStockItems,
        threshold: 10
      });
    }

    // Warning alerts
    if (metrics.occupancy.percentage > 85 && metrics.occupancy.percentage <= 95) {
      alerts.warning++;
      alerts.details.push({
        type: 'warning',
        category: 'occupancy',
        message: `Warning: High bed occupancy ${metrics.occupancy.percentage.toFixed(1)}%`,
        value: metrics.occupancy.percentage,
        threshold: 85
      });
    }

    if (metrics.staffing.attendanceRate < 80) {
      alerts.warning++;
      alerts.details.push({
        type: 'warning',
        category: 'staffing',
        message: `Warning: Low staff attendance ${metrics.staffing.attendanceRate.toFixed(1)}%`,
        value: metrics.staffing.attendanceRate,
        threshold: 80
      });
    }

    if (metrics.finance.collectionRate < 70) {
      alerts.warning++;
      alerts.details.push({
        type: 'warning',
        category: 'finance',
        message: `Warning: Low collection rate ${metrics.finance.collectionRate.toFixed(1)}%`,
        value: metrics.finance.collectionRate,
        threshold: 70
      });
    }

    // Info alerts
    if (metrics.patients.averageWaitTime > 30) {
      alerts.info++;
      alerts.details.push({
        type: 'info',
        category: 'patient_flow',
        message: `Info: Average wait time ${metrics.patients.averageWaitTime.toFixed(0)} minutes`,
        value: metrics.patients.averageWaitTime,
        threshold: 30
      });
    }

    return alerts;
  }

  // Get performance KPIs across hospitals
  async getPerformanceKPIs(hospitalId = null, period = 'month') {
    try {
      const kpis = {
        clinical: {
          patientSatisfaction: 0,
          clinicalOutcomes: 0,
          readmissionRate: 0,
          mortalityRate: 0,
          infectionRate: 0,
          averageLOS: 0
        },
        operational: {
          bedTurnoverRate: 0,
          theatreUtilization: 0,
          equipmentDowntime: 0,
          staffProductivity: 0,
          patientThroughput: 0
        },
        financial: {
          revenuePerPatient: 0,
          costPerPatient: 0,
          profitMargin: 0,
          collectionEfficiency: 0,
          insuranceClaimRate: 0
        },
        quality: {
          clinicalCompliance: 0,
          documentationQuality: 0,
          medicationSafety: 0,
          patientSafety: 0,
          regulatoryCompliance: 0
        }
      };

      const hospitalFilter = hospitalId ? 'AND hospital_id = $1' : '';
      const params = hospitalId ? [hospitalId] : [];

      // Clinical KPIs
      const clinicalData = await db.query(`
        SELECT 
          AVG(satisfaction_score) as avg_satisfaction,
          COUNT(*) FILTER (WHERE readmission_30day = true) * 100.0 / COUNT(*) as readmission_rate,
          AVG(length_of_stay) as avg_los
        FROM patient_outcomes
        WHERE created_at > NOW() - INTERVAL '1 ${period}' ${hospitalFilter}
      `, params);

      if (clinicalData.rows[0]) {
        kpis.clinical.patientSatisfaction = parseFloat(clinicalData.rows[0].avg_satisfaction) || 0;
        kpis.clinical.readmissionRate = parseFloat(clinicalData.rows[0].readmission_rate) || 0;
        kpis.clinical.averageLOS = parseFloat(clinicalData.rows[0].avg_los) || 0;
      }

      // Operational KPIs
      const operationalData = await db.query(`
        SELECT 
          AVG(bed_turnover_rate) as bed_turnover,
          AVG(theatre_utilization) as theatre_util,
          AVG(staff_productivity_score) as staff_productivity
        FROM operational_metrics
        WHERE metric_date > NOW() - INTERVAL '1 ${period}' ${hospitalFilter}
      `, params);

      if (operationalData.rows[0]) {
        kpis.operational.bedTurnoverRate = parseFloat(operationalData.rows[0].bed_turnover) || 0;
        kpis.operational.theatreUtilization = parseFloat(operationalData.rows[0].theatre_util) || 0;
        kpis.operational.staffProductivity = parseFloat(operationalData.rows[0].staff_productivity) || 0;
      }

      // Financial KPIs
      const financialData = await db.query(`
        SELECT 
          SUM(total_amount) / COUNT(DISTINCT patient_id) as revenue_per_patient,
          SUM(amount_collected) * 100.0 / SUM(total_amount) as collection_rate
        FROM bills
        WHERE bill_date > NOW() - INTERVAL '1 ${period}' ${hospitalFilter}
      `, params);

      if (financialData.rows[0]) {
        kpis.financial.revenuePerPatient = parseFloat(financialData.rows[0].revenue_per_patient) || 0;
        kpis.financial.collectionEfficiency = parseFloat(financialData.rows[0].collection_rate) || 0;
      }

      return kpis;
    } catch (error) {
      console.error('Error fetching performance KPIs:', error);
      throw error;
    }
  }

  // Get comparative analytics between hospitals
  async getComparativeAnalytics(hospitalIds = [], metric = 'revenue') {
    try {
      const comparisons = {
        metric,
        period: 'last_30_days',
        hospitals: [],
        rankings: [],
        bestPerformer: null,
        average: 0
      };

      // If no specific hospitals, get all
      if (hospitalIds.length === 0) {
        const allHospitals = await db.query('SELECT id FROM hospitals');
        hospitalIds = allHospitals.rows.map(h => h.id);
      }

      for (const hospitalId of hospitalIds) {
        const hospitalData = await this.getHospitalMetrics(hospitalId, '30d');
        const metricValue = this.extractMetricValue(hospitalData, metric);
        
        comparisons.hospitals.push({
          hospitalId,
          name: hospitalData.name || `Hospital ${hospitalId}`,
          value: metricValue,
          trend: await this.calculateTrend(hospitalId, metric)
        });
      }

      // Sort and rank
      comparisons.hospitals.sort((a, b) => b.value - a.value);
      comparisons.hospitals.forEach((h, index) => {
        h.rank = index + 1;
      });

      comparisons.bestPerformer = comparisons.hospitals[0];
      comparisons.average = 
        comparisons.hospitals.reduce((sum, h) => sum + h.value, 0) / comparisons.hospitals.length;

      return comparisons;
    } catch (error) {
      console.error('Error fetching comparative analytics:', error);
      throw error;
    }
  }

  // Project management for hospital expansions
  async getExpansionProjects(status = null) {
    try {
      let query = `
        SELECT 
          p.*,
          h.name as hospital_name,
          COUNT(t.id) as total_tasks,
          COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks
        FROM expansion_projects p
        LEFT JOIN hospitals h ON p.hospital_id = h.id
        LEFT JOIN project_tasks t ON p.id = t.project_id
      `;

      const params = [];
      if (status) {
        query += ' WHERE p.status = $1';
        params.push(status);
      }

      query += ' GROUP BY p.id, h.name ORDER BY p.start_date DESC';

      const projects = await db.query(query, params);

      return projects.rows.map(project => ({
        ...project,
        progress: project.total_tasks > 0 
          ? (project.completed_tasks / project.total_tasks) * 100 
          : 0
      }));
    } catch (error) {
      console.error('Error fetching expansion projects:', error);
      throw error;
    }
  }

  // Create or update expansion project
  async createExpansionProject(projectData) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      const projectId = projectData.id || uuidv4();
      
      const project = await client.query(`
        INSERT INTO expansion_projects (
          id, hospital_id, project_name, project_type,
          description, budget, start_date, end_date,
          status, priority, project_manager
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          project_name = EXCLUDED.project_name,
          description = EXCLUDED.description,
          budget = EXCLUDED.budget,
          end_date = EXCLUDED.end_date,
          status = EXCLUDED.status,
          priority = EXCLUDED.priority
        RETURNING *
      `, [
        projectId,
        projectData.hospital_id,
        projectData.project_name,
        projectData.project_type || 'expansion',
        projectData.description,
        projectData.budget,
        projectData.start_date,
        projectData.end_date,
        projectData.status || 'planning',
        projectData.priority || 'medium',
        projectData.project_manager
      ]);

      // Add initial tasks if provided
      if (projectData.tasks && projectData.tasks.length > 0) {
        for (const task of projectData.tasks) {
          await client.query(`
            INSERT INTO project_tasks (
              project_id, task_name, description,
              assigned_to, due_date, status, priority
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            projectId,
            task.task_name,
            task.description,
            task.assigned_to,
            task.due_date,
            task.status || 'pending',
            task.priority || 'medium'
          ]);
        }
      }

      await client.query('COMMIT');
      return project.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating expansion project:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Get real-time alerts
  async getRealTimeAlerts(severity = null, resolved = false) {
    try {
      let query = `
        SELECT 
          a.*,
          h.name as hospital_name,
          h.location as hospital_location
        FROM system_alerts a
        LEFT JOIN hospitals h ON a.hospital_id = h.id
        WHERE resolved = $1
      `;

      const params = [resolved];

      if (severity) {
        query += ' AND severity = $2';
        params.push(severity);
      }

      query += ' ORDER BY created_at DESC LIMIT 100';

      const alerts = await db.query(query, params);
      return alerts.rows;
    } catch (error) {
      console.error('Error fetching real-time alerts:', error);
      throw error;
    }
  }

  // Create system alert
  async createAlert(alertData) {
    try {
      const alert = await db.query(`
        INSERT INTO system_alerts (
          hospital_id, alert_type, severity,
          title, description, metric_value,
          threshold_value, source_system
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        alertData.hospital_id,
        alertData.alert_type,
        alertData.severity || 'info',
        alertData.title,
        alertData.description,
        alertData.metric_value,
        alertData.threshold_value,
        alertData.source_system || 'operations_monitor'
      ]);

      return alert.rows[0];
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  // Resolve alert
  async resolveAlert(alertId, resolution) {
    try {
      const alert = await db.query(`
        UPDATE system_alerts 
        SET 
          resolved = true,
          resolved_at = NOW(),
          resolution = $2,
          resolved_by = $3
        WHERE id = $1
        RETURNING *
      `, [alertId, resolution.notes, resolution.resolved_by]);

      return alert.rows[0];
    } catch (error) {
      console.error('Error resolving alert:', error);
      throw error;
    }
  }

  // Helper function to get time filter
  getTimeFilter(timeRange) {
    const filters = {
      '1h': '1 hour',
      '6h': '6 hours',
      '24h': '24 hours',
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days'
    };
    return filters[timeRange] || '24 hours';
  }

  // Helper function to extract metric value
  extractMetricValue(hospitalData, metric) {
    const metricPaths = {
      'revenue': hospitalData.finance?.dailyRevenue || 0,
      'occupancy': hospitalData.occupancy?.percentage || 0,
      'patients': hospitalData.patients?.total || 0,
      'satisfaction': hospitalData.patients?.satisfactionScore || 0,
      'staff_productivity': hospitalData.staffing?.attendanceRate || 0
    };
    return metricPaths[metric] || 0;
  }

  // Calculate trend for a metric
  async calculateTrend(hospitalId, metric, days = 7) {
    try {
      // Simplified trend calculation
      // In production, this would compare current vs previous period
      const trend = Math.random() * 20 - 10; // Random between -10 and +10
      return {
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        percentage: Math.abs(trend),
        days
      };
    } catch (error) {
      console.error('Error calculating trend:', error);
      return { direction: 'stable', percentage: 0, days };
    }
  }
}

module.exports = new OperationsService();

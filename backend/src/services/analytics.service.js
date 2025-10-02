/**
 * Predictive Analytics Service
 * Implements ML models for demand forecasting, fraud detection, and patient risk scoring
 */

const { pool } = require('../config/database');
const EventEmitter = require('events');

class PredictiveAnalyticsService extends EventEmitter {
  constructor() {
    super();
    this.models = new Map();
    this.initialized = false;
  }

  /**
   * Initialize analytics models
   */
  async initialize() {
    console.log('Initializing predictive analytics models...');
    
    // Register models
    await this.registerModel('drug_demand_forecast', 'regression', '1.0.0');
    await this.registerModel('patient_risk_score', 'classification', '1.0.0');
    await this.registerModel('fraud_detection', 'anomaly_detection', '1.0.0');
    await this.registerModel('triage_bot', 'classification', '1.0.0');
    
    this.initialized = true;
    console.log('Predictive analytics models initialized');
  }

  /**
   * Register a model in the database
   */
  async registerModel(name, type, version) {
    const client = await pool.connect();
    
    try {
      const query = `
        INSERT INTO ml_models.model_registry (
          model_name, model_type, version, 
          accuracy_score, is_active, training_date
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE)
        ON CONFLICT (model_name, version) DO UPDATE
        SET is_active = true
        RETURNING model_id
      `;
      
      // Mock accuracy scores for demo
      const accuracy = 0.85 + Math.random() * 0.1;
      
      const result = await client.query(query, [
        name, type, version, accuracy, true
      ]);
      
      this.models.set(name, {
        id: result.rows[0].model_id,
        name,
        type,
        version,
        accuracy
      });
      
      return result.rows[0].model_id;
      
    } catch (error) {
      console.error(`Failed to register model ${name}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Drug Demand Forecasting
   * Predicts drug consumption for the next period
   */
  async forecastDrugDemand(hospitalId, drugId, days = 30) {
    const client = await pool.connect();
    
    try {
      // Get historical consumption data
      const historyQuery = `
        SELECT 
          consumption_date,
          quantity_consumed,
          total_cost
        FROM analytics.fact_drug_consumption
        WHERE hospital_id = $1 
        AND drug_id = $2
        AND consumption_date >= CURRENT_DATE - INTERVAL '90 days'
        ORDER BY consumption_date
      `;
      
      const history = await client.query(historyQuery, [hospitalId, drugId]);
      
      // Simple moving average forecast (in production, use proper ML model)
      let avgConsumption = 10; // Default
      if (history.rows.length > 0) {
        const totalConsumption = history.rows.reduce(
          (sum, row) => sum + (row.quantity_consumed || 0), 0
        );
        avgConsumption = Math.ceil(totalConsumption / history.rows.length);
      }
      
      // Calculate forecast with seasonality adjustment
      const seasonalFactor = this.calculateSeasonalFactor(new Date());
      const predictedDemand = Math.ceil(avgConsumption * days * seasonalFactor);
      
      // Add some variance for confidence intervals
      const variance = avgConsumption * 0.2;
      const lowerBound = Math.max(0, predictedDemand - (variance * days));
      const upperBound = predictedDemand + (variance * days);
      
      // Store forecast
      const modelId = this.models.get('drug_demand_forecast')?.id || 1;
      
      const insertQuery = `
        INSERT INTO ml_models.drug_demand_forecasts (
          hospital_id, drug_id, forecast_date, 
          forecast_period_days, predicted_demand,
          confidence_interval_lower, confidence_interval_upper,
          model_id
        ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        hospitalId, drugId, days, predictedDemand,
        Math.floor(lowerBound), Math.ceil(upperBound), modelId
      ]);
      
      return {
        drugId,
        hospitalId,
        forecastPeriodDays: days,
        predictedDemand,
        confidenceInterval: {
          lower: Math.floor(lowerBound),
          upper: Math.ceil(upperBound)
        },
        historicalAverage: avgConsumption,
        seasonalFactor,
        forecastId: result.rows[0].forecast_id
      };
      
    } catch (error) {
      console.error('Drug demand forecast failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Patient Risk Scoring
   * Calculates risk scores for various conditions
   */
  async calculatePatientRisk(patientId, riskCategory = 'readmission') {
    const client = await pool.connect();
    
    try {
      // Get patient history
      const patientQuery = `
        SELECT 
          COUNT(*) as visit_count,
          MAX(visit_date) as last_visit,
          AVG(visit_duration_minutes) as avg_duration,
          COUNT(DISTINCT diagnosis_code) as unique_diagnoses
        FROM analytics.fact_patient_visits
        WHERE patient_id = $1
        AND visit_date >= CURRENT_DATE - INTERVAL '1 year'
      `;
      
      const patientData = await client.query(patientQuery, [patientId]);
      const stats = patientData.rows[0];
      
      // Risk scoring algorithm (simplified for demo)
      let riskScore = 0;
      const factors = [];
      
      // Frequency of visits
      if (stats.visit_count > 10) {
        riskScore += 0.3;
        factors.push({ factor: 'high_visit_frequency', weight: 0.3 });
      }
      
      // Multiple diagnoses
      if (stats.unique_diagnoses > 5) {
        riskScore += 0.2;
        factors.push({ factor: 'multiple_conditions', weight: 0.2 });
      }
      
      // Recent visit pattern
      const daysSinceLastVisit = stats.last_visit 
        ? Math.floor((new Date() - new Date(stats.last_visit)) / (1000 * 60 * 60 * 24))
        : 999;
        
      if (daysSinceLastVisit < 30) {
        riskScore += 0.2;
        factors.push({ factor: 'recent_visit', weight: 0.2 });
      }
      
      // Add random factors for demo
      if (Math.random() > 0.5) {
        riskScore += 0.15;
        factors.push({ factor: 'chronic_condition', weight: 0.15 });
      }
      
      // Normalize score
      riskScore = Math.min(1, Math.max(0, riskScore));
      
      // Determine risk level
      let riskLevel;
      if (riskScore < 0.3) riskLevel = 'low';
      else if (riskScore < 0.6) riskLevel = 'medium';
      else if (riskScore < 0.8) riskLevel = 'high';
      else riskLevel = 'critical';
      
      // Recommended interventions
      const interventions = this.getRecommendedInterventions(riskLevel, riskCategory);
      
      // Store risk score
      const modelId = this.models.get('patient_risk_score')?.id || 2;
      
      const insertQuery = `
        INSERT INTO ml_models.patient_risk_scores (
          patient_id, risk_category, risk_score, 
          risk_level, contributing_factors, 
          recommended_interventions, model_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        patientId, riskCategory, riskScore, riskLevel,
        JSON.stringify(factors), JSON.stringify(interventions), modelId
      ]);
      
      return {
        patientId,
        riskCategory,
        riskScore: parseFloat(riskScore.toFixed(4)),
        riskLevel,
        contributingFactors: factors,
        recommendedInterventions: interventions,
        scoreId: result.rows[0].score_id
      };
      
    } catch (error) {
      console.error('Patient risk scoring failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Fraud Detection
   * Identifies suspicious patterns in claims and billing
   */
  async detectFraud(entityType, entityId, transactionData) {
    const client = await pool.connect();
    
    try {
      const suspiciousPatterns = [];
      let fraudScore = 0;
      
      // Check for various fraud patterns
      if (entityType === 'claim') {
        // Duplicate claims
        const duplicateCheck = await client.query(`
          SELECT COUNT(*) as count
          FROM analytics.fact_insurance_claims
          WHERE patient_id = $1
          AND claim_amount = $2
          AND claim_date >= CURRENT_DATE - INTERVAL '7 days'
        `, [transactionData.patientId, transactionData.amount]);
        
        if (duplicateCheck.rows[0].count > 1) {
          fraudScore += 0.4;
          suspiciousPatterns.push('duplicate_claim_detected');
        }
        
        // Unusual claim amount
        if (transactionData.amount > 100000) {
          fraudScore += 0.3;
          suspiciousPatterns.push('unusually_high_amount');
        }
        
        // Frequency anomaly
        const frequencyCheck = await client.query(`
          SELECT COUNT(*) as claim_count
          FROM analytics.fact_insurance_claims
          WHERE patient_id = $1
          AND claim_date >= CURRENT_DATE - INTERVAL '30 days'
        `, [transactionData.patientId]);
        
        if (frequencyCheck.rows[0].claim_count > 5) {
          fraudScore += 0.2;
          suspiciousPatterns.push('high_claim_frequency');
        }
      }
      
      // Check for billing fraud
      if (entityType === 'billing') {
        // Service unbundling
        if (transactionData.services && transactionData.services.length > 10) {
          fraudScore += 0.3;
          suspiciousPatterns.push('possible_service_unbundling');
        }
        
        // Phantom billing
        if (transactionData.patientPresent === false && transactionData.serviceType === 'in-person') {
          fraudScore += 0.5;
          suspiciousPatterns.push('phantom_billing_suspected');
        }
      }
      
      // Add random anomaly for demo
      if (Math.random() > 0.8) {
        fraudScore += 0.2;
        suspiciousPatterns.push('statistical_anomaly');
      }
      
      // Normalize score
      fraudScore = Math.min(1, Math.max(0, fraudScore));
      
      // Only create alert if score is significant
      if (fraudScore > 0.3) {
        const modelId = this.models.get('fraud_detection')?.id || 3;
        
        const insertQuery = `
          INSERT INTO ml_models.fraud_alerts (
            entity_type, entity_id, fraud_type,
            risk_score, suspicious_patterns, model_id
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        
        const fraudType = fraudScore > 0.7 ? 'high_risk' : 
                         fraudScore > 0.5 ? 'medium_risk' : 'low_risk';
        
        const result = await client.query(insertQuery, [
          entityType, entityId, fraudType, fraudScore,
          JSON.stringify(suspiciousPatterns), modelId
        ]);
        
        return {
          alertCreated: true,
          alertId: result.rows[0].alert_id,
          entityType,
          entityId,
          fraudScore: parseFloat(fraudScore.toFixed(4)),
          fraudType,
          suspiciousPatterns,
          requiresInvestigation: fraudScore > 0.5
        };
      }
      
      return {
        alertCreated: false,
        entityType,
        entityId,
        fraudScore: parseFloat(fraudScore.toFixed(4)),
        suspiciousPatterns,
        requiresInvestigation: false
      };
      
    } catch (error) {
      console.error('Fraud detection failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Triage Bot
   * Predicts urgency and recommended department based on symptoms
   */
  async triagePatient(patientId, symptoms) {
    const client = await pool.connect();
    
    try {
      // Symptom analysis (simplified for demo)
      const urgencyScore = this.calculateUrgencyScore(symptoms);
      const department = this.recommendDepartment(symptoms);
      
      let urgencyLevel;
      if (urgencyScore > 0.8) urgencyLevel = 'emergency';
      else if (urgencyScore > 0.6) urgencyLevel = 'urgent';
      else if (urgencyScore > 0.4) urgencyLevel = 'semi-urgent';
      else if (urgencyScore > 0.2) urgencyLevel = 'non-urgent';
      else urgencyLevel = 'routine';
      
      // Store triage prediction
      const modelId = this.models.get('triage_bot')?.id || 4;
      
      const insertQuery = `
        INSERT INTO ml_models.triage_predictions (
          patient_id, symptoms, predicted_urgency,
          recommended_department, confidence_score, model_id
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const result = await client.query(insertQuery, [
        patientId, JSON.stringify(symptoms), urgencyLevel,
        department, urgencyScore, modelId
      ]);
      
      return {
        triageId: result.rows[0].triage_id,
        patientId,
        predictedUrgency: urgencyLevel,
        recommendedDepartment: department,
        confidenceScore: parseFloat(urgencyScore.toFixed(4)),
        estimatedWaitTime: this.getEstimatedWaitTime(urgencyLevel),
        triageInstructions: this.getTriageInstructions(urgencyLevel, department)
      };
      
    } catch (error) {
      console.error('Triage prediction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Helper: Calculate seasonal factor for demand forecasting
   */
  calculateSeasonalFactor(date) {
    const month = date.getMonth();
    
    // Nigerian seasonal patterns (rainy season, harmattan, etc.)
    const seasonalFactors = {
      0: 1.1,  // January - Harmattan
      1: 1.0,  // February
      2: 0.9,  // March
      3: 1.0,  // April - Start of rainy season
      4: 1.2,  // May - Rainy season
      5: 1.3,  // June - Peak rainy season
      6: 1.3,  // July - Peak rainy season
      7: 1.2,  // August - Rainy season
      8: 1.1,  // September
      9: 1.0,  // October
      10: 1.1, // November - Start of Harmattan
      11: 1.2  // December - Harmattan
    };
    
    return seasonalFactors[month] || 1.0;
  }

  /**
   * Helper: Get recommended interventions based on risk level
   */
  getRecommendedInterventions(riskLevel, riskCategory) {
    const interventions = {
      low: [
        'routine_monitoring',
        'health_education',
        'preventive_care_reminders'
      ],
      medium: [
        'care_coordination',
        'medication_review',
        'lifestyle_counseling',
        'follow_up_appointment'
      ],
      high: [
        'case_management',
        'specialist_referral',
        'home_health_visits',
        'medication_adherence_program'
      ],
      critical: [
        'immediate_intervention',
        'emergency_contact',
        'intensive_case_management',
        'multidisciplinary_team_review'
      ]
    };
    
    return interventions[riskLevel] || interventions.low;
  }

  /**
   * Helper: Calculate urgency score from symptoms
   */
  calculateUrgencyScore(symptoms) {
    // Critical symptoms
    const criticalSymptoms = [
      'chest pain', 'difficulty breathing', 'unconscious',
      'severe bleeding', 'stroke symptoms', 'heart attack'
    ];
    
    // Urgent symptoms
    const urgentSymptoms = [
      'high fever', 'severe pain', 'vomiting blood',
      'confusion', 'severe headache', 'allergic reaction'
    ];
    
    let score = 0.1; // Base score
    
    // Check for critical symptoms
    for (const symptom of symptoms) {
      if (criticalSymptoms.some(cs => symptom.toLowerCase().includes(cs))) {
        score = Math.max(score, 0.9);
      } else if (urgentSymptoms.some(us => symptom.toLowerCase().includes(us))) {
        score = Math.max(score, 0.6);
      }
    }
    
    // Add some randomness for demo
    score += (Math.random() * 0.1);
    
    return Math.min(1, score);
  }

  /**
   * Helper: Recommend department based on symptoms
   */
  recommendDepartment(symptoms) {
    const departmentKeywords = {
      'Emergency': ['chest pain', 'breathing', 'unconscious', 'bleeding', 'trauma'],
      'Cardiology': ['heart', 'chest pain', 'palpitations', 'blood pressure'],
      'Pediatrics': ['child', 'infant', 'baby', 'pediatric'],
      'Orthopedics': ['fracture', 'bone', 'joint', 'sprain', 'back pain'],
      'Neurology': ['headache', 'seizure', 'dizziness', 'numbness', 'stroke'],
      'General Medicine': ['fever', 'cold', 'flu', 'infection', 'general']
    };
    
    for (const [dept, keywords] of Object.entries(departmentKeywords)) {
      for (const symptom of symptoms) {
        if (keywords.some(kw => symptom.toLowerCase().includes(kw))) {
          return dept;
        }
      }
    }
    
    return 'General Medicine';
  }

  /**
   * Helper: Get estimated wait time based on urgency
   */
  getEstimatedWaitTime(urgencyLevel) {
    const waitTimes = {
      'emergency': '0-15 minutes',
      'urgent': '15-30 minutes',
      'semi-urgent': '30-60 minutes',
      'non-urgent': '1-2 hours',
      'routine': '2-4 hours'
    };
    
    return waitTimes[urgencyLevel] || '1-2 hours';
  }

  /**
   * Helper: Get triage instructions
   */
  getTriageInstructions(urgencyLevel, department) {
    return {
      urgencyLevel,
      department,
      instructions: [
        `Proceed to ${department} department`,
        `Priority level: ${urgencyLevel}`,
        'Bring all relevant medical documents',
        'Prepare list of current medications'
      ],
      preparationSteps: [
        'Complete registration if not done',
        'Provide insurance information',
        'Be ready to describe symptoms in detail'
      ]
    };
  }

  /**
   * Get analytics dashboard data
   */
  async getAnalyticsDashboard(hospitalId) {
    const client = await pool.connect();
    
    try {
      // Get latest metrics
      const metricsQuery = `
        SELECT 
          metric_date,
          total_patients,
          total_revenue,
          bed_occupancy_rate,
          patient_satisfaction_avg
        FROM analytics.daily_metrics
        WHERE hospital_id = $1
        AND metric_date >= CURRENT_DATE - INTERVAL '30 days'
        ORDER BY metric_date DESC
      `;
      
      const metrics = await client.query(metricsQuery, [hospitalId]);
      
      // Get drug forecasts
      const forecastsQuery = `
        SELECT 
          df.drug_id,
          df.predicted_demand,
          df.forecast_period_days,
          d.drug_name
        FROM ml_models.drug_demand_forecasts df
        LEFT JOIN analytics.dim_drugs d ON df.drug_id = d.drug_id
        WHERE df.hospital_id = $1
        AND df.forecast_date >= CURRENT_DATE - INTERVAL '7 days'
        ORDER BY df.created_at DESC
        LIMIT 10
      `;
      
      const forecasts = await client.query(forecastsQuery, [hospitalId]);
      
      // Get recent fraud alerts
      const fraudQuery = `
        SELECT 
          alert_id,
          entity_type,
          fraud_type,
          risk_score,
          investigation_status
        FROM ml_models.fraud_alerts
        WHERE investigation_status = 'pending'
        ORDER BY detected_at DESC
        LIMIT 5
      `;
      
      const fraudAlerts = await client.query(fraudQuery);
      
      return {
        metrics: metrics.rows,
        drugForecasts: forecasts.rows,
        fraudAlerts: fraudAlerts.rows,
        summary: {
          totalPatients30Days: metrics.rows.reduce((sum, m) => sum + (m.total_patients || 0), 0),
          totalRevenue30Days: metrics.rows.reduce((sum, m) => sum + parseFloat(m.total_revenue || 0), 0),
          averageOccupancy: metrics.rows.length > 0 
            ? (metrics.rows.reduce((sum, m) => sum + parseFloat(m.bed_occupancy_rate || 0), 0) / metrics.rows.length).toFixed(2)
            : 0,
          activeFraudAlerts: fraudAlerts.rows.length
        }
      };
      
    } catch (error) {
      console.error('Failed to get analytics dashboard:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = new PredictiveAnalyticsService();

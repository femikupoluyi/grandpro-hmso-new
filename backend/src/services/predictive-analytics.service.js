/**
 * Predictive Analytics Service
 * Implements ML models for demand forecasting, triage, fraud detection, and risk scoring
 */

const pool = require('../config/database');

class PredictiveAnalyticsService {
  constructor() {
    this.models = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing Predictive Analytics Service...');
    
    // Register ML models
    await this.loadModelsFromRegistry();
    
    this.isInitialized = true;
    console.log('Predictive Analytics Service initialized with', this.models.size, 'models');
  }

  async loadModelsFromRegistry() {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM ml_models.model_registry WHERE is_active = true
      `);

      for (const model of result.rows) {
        this.models.set(model.model_name, {
          id: model.model_id,
          type: model.model_type,
          version: model.model_version,
          algorithm: model.algorithm,
          parameters: model.parameters
        });
      }
    } finally {
      client.release();
    }
  }

  // =====================================================
  // DRUG DEMAND FORECASTING
  // =====================================================

  async forecastDrugDemand(hospitalId, drugId, days = 30) {
    const client = await pool.connect();
    try {
      // Get historical usage data
      const history = await client.query(`
        SELECT 
          DATE(transaction_date) as date,
          SUM(quantity) as daily_usage
        FROM data_lake.fact_inventory_transactions
        WHERE hospital_id = $1 
          AND item_id = $2
          AND transaction_type = 'OUT'
          AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'
        GROUP BY DATE(transaction_date)
        ORDER BY date
      `, [hospitalId, drugId]);

      // Simple moving average forecast (stub for ARIMA model)
      const historicalData = history.rows.map(r => parseFloat(r.daily_usage));
      const avgDailyUsage = historicalData.length > 0 
        ? historicalData.reduce((a, b) => a + b, 0) / historicalData.length 
        : 10;

      // Add seasonal variation (stub)
      const seasonalFactor = 1 + (Math.sin(Date.now() / 86400000) * 0.2);
      const trendFactor = 1.02; // 2% growth trend

      const forecast = [];
      for (let i = 1; i <= days; i++) {
        const predictedValue = avgDailyUsage * seasonalFactor * Math.pow(trendFactor, i/30);
        const confidence = Math.max(0.7, Math.min(0.95, 0.9 - (i * 0.01))); // Confidence decreases over time
        
        forecast.push({
          day: i,
          date: new Date(Date.now() + i * 86400000),
          predicted_quantity: Math.round(predictedValue),
          confidence_score: confidence,
          lower_bound: Math.round(predictedValue * 0.8),
          upper_bound: Math.round(predictedValue * 1.2)
        });
      }

      // Store predictions
      const modelId = this.models.get('Drug Demand Forecaster')?.id || 1;
      for (const pred of forecast) {
        await client.query(`
          INSERT INTO ml_models.predictions (
            model_id, prediction_type, entity_type, entity_id,
            prediction_date, predicted_value, confidence_score, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          modelId, 'DEMAND_FORECAST', 'DRUG', drugId,
          pred.date, pred.predicted_quantity, pred.confidence_score,
          JSON.stringify({ hospital_id: hospitalId, bounds: [pred.lower_bound, pred.upper_bound] })
        ]);
      }

      return {
        drug_id: drugId,
        hospital_id: hospitalId,
        forecast_period: days,
        total_predicted_demand: forecast.reduce((sum, f) => sum + f.predicted_quantity, 0),
        average_daily_demand: avgDailyUsage,
        predictions: forecast
      };

    } finally {
      client.release();
    }
  }

  // =====================================================
  // PATIENT TRIAGE BOT
  // =====================================================

  async triagePatient(patientData) {
    const { symptoms, vitalSigns, age, medicalHistory } = patientData;
    
    // Symptom severity scoring (stub for Random Forest model)
    const symptomScores = {
      'chest pain': 0.9,
      'difficulty breathing': 0.95,
      'severe bleeding': 1.0,
      'unconscious': 1.0,
      'high fever': 0.7,
      'headache': 0.4,
      'nausea': 0.3,
      'fatigue': 0.2,
      'cough': 0.3,
      'abdominal pain': 0.6
    };

    // Calculate urgency score
    let urgencyScore = 0;
    let matchedSymptoms = [];
    
    for (const symptom of symptoms || []) {
      const symptomLower = symptom.toLowerCase();
      for (const [key, score] of Object.entries(symptomScores)) {
        if (symptomLower.includes(key)) {
          urgencyScore = Math.max(urgencyScore, score);
          matchedSymptoms.push(key);
        }
      }
    }

    // Adjust for vital signs (stub)
    if (vitalSigns) {
      if (vitalSigns.bloodPressure && vitalSigns.bloodPressure.systolic > 180) {
        urgencyScore = Math.max(urgencyScore, 0.85);
      }
      if (vitalSigns.heartRate && (vitalSigns.heartRate > 120 || vitalSigns.heartRate < 50)) {
        urgencyScore = Math.max(urgencyScore, 0.8);
      }
      if (vitalSigns.temperature && vitalSigns.temperature > 39) {
        urgencyScore = Math.max(urgencyScore, 0.7);
      }
    }

    // Age factor
    if (age && (age < 2 || age > 70)) {
      urgencyScore = Math.min(1.0, urgencyScore * 1.15);
    }

    // Determine urgency level
    let urgencyLevel;
    let recommendedDepartment;
    let estimatedWaitTime;

    if (urgencyScore >= 0.8) {
      urgencyLevel = 'CRITICAL';
      recommendedDepartment = 'Emergency';
      estimatedWaitTime = 0;
    } else if (urgencyScore >= 0.6) {
      urgencyLevel = 'HIGH';
      recommendedDepartment = 'Urgent Care';
      estimatedWaitTime = 15;
    } else if (urgencyScore >= 0.4) {
      urgencyLevel = 'MEDIUM';
      recommendedDepartment = 'General Practice';
      estimatedWaitTime = 30;
    } else {
      urgencyLevel = 'LOW';
      recommendedDepartment = 'Outpatient';
      estimatedWaitTime = 60;
    }

    // Risk factors
    const riskFactors = [];
    if (matchedSymptoms.includes('chest pain')) riskFactors.push('Cardiac risk');
    if (matchedSymptoms.includes('difficulty breathing')) riskFactors.push('Respiratory distress');
    if (age > 65) riskFactors.push('Advanced age');
    if (medicalHistory && medicalHistory.includes('diabetes')) riskFactors.push('Diabetic complications');

    const client = await pool.connect();
    try {
      // Store triage prediction
      await client.query(`
        INSERT INTO ml_models.triage_predictions (
          patient_id, symptoms, vital_signs, predicted_urgency,
          confidence_score, recommended_department, estimated_wait_time,
          risk_factors, model_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        patientData.patientId || null,
        JSON.stringify(symptoms),
        JSON.stringify(vitalSigns),
        urgencyLevel,
        Math.min(0.95, 0.7 + urgencyScore * 0.3),
        recommendedDepartment,
        estimatedWaitTime,
        JSON.stringify(riskFactors),
        '1.0.0'
      ]);
    } finally {
      client.release();
    }

    return {
      urgency_level: urgencyLevel,
      urgency_score: urgencyScore,
      confidence: Math.min(0.95, 0.7 + urgencyScore * 0.3),
      recommended_department: recommendedDepartment,
      estimated_wait_time_minutes: estimatedWaitTime,
      matched_symptoms: matchedSymptoms,
      risk_factors: riskFactors,
      recommendations: this.getTriageRecommendations(urgencyLevel)
    };
  }

  getTriageRecommendations(urgencyLevel) {
    const recommendations = {
      'CRITICAL': [
        'Immediate medical attention required',
        'Call emergency services if not at hospital',
        'Do not attempt to drive yourself'
      ],
      'HIGH': [
        'Seek medical attention within 1 hour',
        'Go to nearest emergency room or urgent care',
        'Bring list of current medications'
      ],
      'MEDIUM': [
        'Schedule appointment within 24 hours',
        'Monitor symptoms for changes',
        'Take over-the-counter pain relief if needed'
      ],
      'LOW': [
        'Schedule routine appointment',
        'Rest and stay hydrated',
        'Monitor symptoms and return if they worsen'
      ]
    };

    return recommendations[urgencyLevel] || [];
  }

  // =====================================================
  // FRAUD DETECTION
  // =====================================================

  async detectFraud(transaction) {
    const { type, amount, patientId, providerId, claims, metadata } = transaction;
    
    // Anomaly scoring (stub for Isolation Forest model)
    let anomalyScore = 0;
    const suspiciousPatterns = [];

    // Check for unusual amount
    if (amount > 1000000) {
      anomalyScore += 0.3;
      suspiciousPatterns.push('Unusually high amount');
    }

    // Check for duplicate claims
    if (claims && claims.length > 1) {
      const duplicates = claims.filter((c, i) => 
        claims.findIndex(x => x.diagnosis === c.diagnosis && x.date === c.date) !== i
      );
      if (duplicates.length > 0) {
        anomalyScore += 0.4;
        suspiciousPatterns.push('Duplicate claims detected');
      }
    }

    // Check for frequency anomalies
    const client = await pool.connect();
    try {
      // Check patient claim frequency
      if (patientId) {
        const recentClaims = await client.query(`
          SELECT COUNT(*) as claim_count
          FROM data_lake.fact_financial_transactions
          WHERE patient_id = $1 
            AND transaction_type = 'INSURANCE_CLAIM'
            AND transaction_date >= CURRENT_DATE - INTERVAL '30 days'
        `, [patientId]);

        if (recentClaims.rows[0].claim_count > 10) {
          anomalyScore += 0.2;
          suspiciousPatterns.push('High claim frequency');
        }
      }

      // Pattern analysis (stub)
      if (metadata) {
        // Check for billing after hours
        const hour = new Date().getHours();
        if (hour < 6 || hour > 22) {
          anomalyScore += 0.1;
          suspiciousPatterns.push('Unusual billing time');
        }

        // Check for round numbers (potential indicator)
        if (amount % 1000 === 0 && amount > 10000) {
          anomalyScore += 0.05;
          suspiciousPatterns.push('Suspiciously round amount');
        }
      }

      // Determine risk level
      let riskLevel;
      let isFlagged = false;
      
      if (anomalyScore >= 0.7) {
        riskLevel = 'HIGH';
        isFlagged = true;
      } else if (anomalyScore >= 0.4) {
        riskLevel = 'MEDIUM';
        isFlagged = true;
      } else {
        riskLevel = 'LOW';
      }

      // Store fraud detection result
      await client.query(`
        INSERT INTO ml_models.fraud_alerts (
          transaction_id, transaction_type, amount,
          anomaly_score, risk_level, is_flagged,
          suspicious_patterns, model_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        transaction.transactionId || null,
        type,
        amount,
        anomalyScore,
        riskLevel,
        isFlagged,
        JSON.stringify(suspiciousPatterns),
        '1.0.0'
      ]);

      return {
        is_flagged: isFlagged,
        risk_level: riskLevel,
        anomaly_score: anomalyScore,
        fraud_probability: Math.min(0.95, anomalyScore),
        suspicious_patterns: suspiciousPatterns,
        recommendation: isFlagged ? 'Review required before processing' : 'Transaction appears normal'
      };

    } finally {
      client.release();
    }
  }

  // =====================================================
  // PATIENT RISK SCORING
  // =====================================================

  async calculatePatientRiskScore(patientId, riskType = 'READMISSION') {
    const client = await pool.connect();
    try {
      // Get patient data
      const patientData = await client.query(`
        SELECT 
          p.*,
          COUNT(DISTINCT pv.visit_id) as visit_count,
          COUNT(DISTINCT mr.id) as medical_records_count,
          MAX(pv.visit_date) as last_visit
        FROM patients p
        LEFT JOIN data_lake.fact_patient_visits pv ON pv.patient_id = p.id
        LEFT JOIN medical_records mr ON mr.patient_id = p.id
        WHERE p.id = $1
        GROUP BY p.id
      `, [patientId]);

      if (patientData.rows.length === 0) {
        throw new Error('Patient not found');
      }

      const patient = patientData.rows[0];
      
      // Risk scoring (stub for Logistic Regression model)
      let riskScore = 0;
      const contributingFactors = [];

      // Age factor
      const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
      if (age > 65) {
        riskScore += 0.2;
        contributingFactors.push({ factor: 'Age > 65', weight: 0.2 });
      }

      // Visit frequency
      if (patient.visit_count > 5) {
        riskScore += 0.15;
        contributingFactors.push({ factor: 'Frequent hospital visits', weight: 0.15 });
      }

      // Chronic conditions (stub - would check medical history)
      const chronicConditions = await client.query(`
        SELECT DISTINCT diagnosis 
        FROM medical_records 
        WHERE patient_id = $1 
          AND diagnosis ILIKE ANY(ARRAY['%diabetes%', '%hypertension%', '%heart%', '%kidney%'])
      `, [patientId]);

      if (chronicConditions.rows.length > 0) {
        riskScore += 0.1 * chronicConditions.rows.length;
        contributingFactors.push({ 
          factor: `${chronicConditions.rows.length} chronic conditions`, 
          weight: 0.1 * chronicConditions.rows.length 
        });
      }

      // Recent admission
      const daysSinceLastVisit = patient.last_visit 
        ? Math.floor((Date.now() - new Date(patient.last_visit).getTime()) / 86400000)
        : 999;
      
      if (daysSinceLastVisit < 30) {
        riskScore += 0.25;
        contributingFactors.push({ factor: 'Recent admission (<30 days)', weight: 0.25 });
      }

      // Normalize score
      riskScore = Math.min(1.0, riskScore);
      
      // Determine risk level
      let riskLevel;
      if (riskScore >= 0.7) {
        riskLevel = 'HIGH';
      } else if (riskScore >= 0.4) {
        riskLevel = 'MEDIUM';
      } else {
        riskLevel = 'LOW';
      }

      // Generate recommendations
      const recommendations = this.getPatientRiskRecommendations(riskLevel, riskType);

      // Store risk score
      await client.query(`
        INSERT INTO ml_models.patient_risk_scores (
          patient_id, risk_type, risk_score, risk_level,
          contributing_factors, recommendations, 
          next_assessment_date, model_version
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (patient_id, risk_type) 
        DO UPDATE SET 
          risk_score = $3,
          risk_level = $4,
          contributing_factors = $5,
          recommendations = $6,
          calculated_at = CURRENT_TIMESTAMP
      `, [
        patientId, riskType, riskScore, riskLevel,
        JSON.stringify(contributingFactors),
        JSON.stringify(recommendations),
        new Date(Date.now() + 30 * 86400000), // 30 days from now
        '1.0.0'
      ]);

      return {
        patient_id: patientId,
        risk_type: riskType,
        risk_score: riskScore,
        risk_level: riskLevel,
        probability: (riskScore * 100).toFixed(1) + '%',
        contributing_factors: contributingFactors,
        recommendations: recommendations,
        next_assessment: new Date(Date.now() + 30 * 86400000)
      };

    } finally {
      client.release();
    }
  }

  getPatientRiskRecommendations(riskLevel, riskType) {
    const recommendations = {
      'HIGH': [
        'Schedule follow-up within 7 days',
        'Assign care coordinator',
        'Provide patient education materials',
        'Consider home health services',
        'Review medication compliance'
      ],
      'MEDIUM': [
        'Schedule follow-up within 14 days',
        'Provide discharge planning',
        'Monitor symptoms remotely',
        'Encourage medication adherence'
      ],
      'LOW': [
        'Standard follow-up care',
        'Routine appointment in 30 days',
        'Continue current treatment plan'
      ]
    };

    return recommendations[riskLevel] || recommendations['LOW'];
  }

  // =====================================================
  // BATCH PREDICTIONS
  // =====================================================

  async runBatchPredictions() {
    const results = {
      drug_forecasts: 0,
      triage_assessments: 0,
      fraud_checks: 0,
      risk_scores: 0
    };

    const client = await pool.connect();
    try {
      // Run drug demand forecasts for top drugs
      const topDrugs = await client.query(`
        SELECT DISTINCT item_id, hospital_id
        FROM data_lake.fact_inventory_transactions
        WHERE transaction_type = 'OUT'
          AND transaction_date >= CURRENT_DATE - 7
        GROUP BY item_id, hospital_id
        ORDER BY SUM(quantity) DESC
        LIMIT 10
      `);

      for (const drug of topDrugs.rows) {
        await this.forecastDrugDemand(drug.hospital_id, drug.item_id);
        results.drug_forecasts++;
      }

      // Run patient risk scoring for recent patients
      const recentPatients = await client.query(`
        SELECT DISTINCT patient_id
        FROM data_lake.fact_patient_visits
        WHERE visit_date >= CURRENT_DATE - 7
        LIMIT 20
      `);

      for (const patient of recentPatients.rows) {
        await this.calculatePatientRiskScore(patient.patient_id);
        results.risk_scores++;
      }

      return results;

    } finally {
      client.release();
    }
  }
}

module.exports = new PredictiveAnalyticsService();

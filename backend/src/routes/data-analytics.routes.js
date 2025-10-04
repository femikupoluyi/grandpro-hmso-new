/**
 * Data Analytics Routes
 * Endpoints for data lake, ETL, and predictive analytics
 */

const express = require('express');
const router = express.Router();
const etlService = require('../services/etl.service');
const predictiveAnalytics = require('../services/predictive-analytics.service');
const pool = require('../config/database');

// Initialize services
(async () => {
  try {
    await predictiveAnalytics.initialize();
    if (process.env.NODE_ENV === 'production') {
      await etlService.initialize();
    }
    console.log('Analytics services initialized');
  } catch (error) {
    console.error('Failed to initialize analytics services:', error);
  }
})();

// =====================================================
// DATA LAKE ENDPOINTS
// =====================================================

// Get data lake statistics
router.get('/data-lake/stats', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const stats = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM data_lake.fact_patient_visits) as patient_visits,
          (SELECT COUNT(*) FROM data_lake.fact_inventory_transactions) as inventory_transactions,
          (SELECT COUNT(*) FROM data_lake.fact_financial_transactions) as financial_transactions,
          (SELECT COUNT(*) FROM analytics.hospital_daily_metrics) as daily_metrics,
          (SELECT COUNT(*) FROM ml_models.predictions) as predictions,
          (SELECT COUNT(*) FROM ml_models.model_registry WHERE is_active = true) as active_models
      `);

      res.json({
        success: true,
        data: stats.rows[0],
        schemas: {
          data_lake: 'Operational data warehouse',
          analytics: 'Aggregated metrics',
          ml_models: 'Machine learning models and predictions'
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Query data lake
router.post('/data-lake/query', async (req, res) => {
  try {
    const { table, filters, aggregations, limit = 100 } = req.body;
    
    // Basic security check (in production, use proper query builder)
    const allowedTables = [
      'fact_patient_visits', 'fact_inventory_transactions', 
      'fact_financial_transactions', 'dim_time', 'dim_hospitals'
    ];
    
    if (!allowedTables.includes(table)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid table name' 
      });
    }

    const client = await pool.connect();
    try {
      let query = `SELECT * FROM data_lake.${table}`;
      const conditions = [];
      const values = [];

      // Add filters
      if (filters) {
        let paramCount = 1;
        for (const [key, value] of Object.entries(filters)) {
          conditions.push(`${key} = $${paramCount}`);
          values.push(value);
          paramCount++;
        }
        if (conditions.length > 0) {
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
      }

      query += ` LIMIT ${Math.min(limit, 1000)}`;

      const result = await client.query(query, values);
      
      res.json({
        success: true,
        data: result.rows,
        count: result.rowCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// ETL PIPELINE ENDPOINTS
// =====================================================

// Get ETL pipeline status
router.get('/etl/status', async (req, res) => {
  try {
    const status = etlService.getPipelineStatus();
    
    res.json({
      success: true,
      pipelines: status,
      environment: process.env.NODE_ENV,
      message: process.env.NODE_ENV !== 'production' 
        ? 'ETL pipelines disabled in non-production environment' 
        : 'ETL pipelines active'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Manually trigger ETL pipeline
router.post('/etl/run/:pipeline', async (req, res) => {
  try {
    const { pipeline } = req.params;
    const result = await etlService.runPipeline(pipeline);
    
    res.json({
      success: true,
      pipeline,
      result,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ETL job history
router.get('/etl/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM data_lake.etl_job_runs
        ORDER BY start_time DESC
        LIMIT $1
      `, [limit]);

      res.json({
        success: true,
        jobs: result.rows,
        count: result.rowCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// PREDICTIVE ANALYTICS ENDPOINTS
// =====================================================

// Drug demand forecasting
router.post('/predict/drug-demand', async (req, res) => {
  try {
    const { hospitalId, drugId, days = 30 } = req.body;
    
    if (!hospitalId || !drugId) {
      return res.status(400).json({
        success: false,
        error: 'hospitalId and drugId are required'
      });
    }

    const forecast = await predictiveAnalytics.forecastDrugDemand(
      hospitalId, drugId, days
    );
    
    res.json({
      success: true,
      data: forecast,
      model: 'Drug Demand Forecaster v1.0.0'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get drug demand forecast for a hospital
router.get('/predict/drug-demand/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          p.*,
          i.item_name as drug_name
        FROM ml_models.predictions p
        LEFT JOIN inventory i ON i.id = p.entity_id
        WHERE p.prediction_type = 'DEMAND_FORECAST'
          AND p.metadata->>'hospital_id' = $1
          AND p.prediction_date >= CURRENT_DATE
        ORDER BY p.prediction_date, p.entity_id
        LIMIT 100
      `, [hospitalId]);

      res.json({
        success: true,
        hospital_id: hospitalId,
        forecasts: result.rows,
        count: result.rowCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Patient triage assessment
router.post('/predict/triage', async (req, res) => {
  try {
    const { patientId, symptoms, vitalSigns, age, medicalHistory } = req.body;
    
    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Symptoms are required for triage assessment'
      });
    }

    const assessment = await predictiveAnalytics.triagePatient({
      patientId, symptoms, vitalSigns, age, medicalHistory
    });
    
    res.json({
      success: true,
      data: assessment,
      model: 'Patient Triage Bot v1.0.0'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fraud detection
router.post('/predict/fraud', async (req, res) => {
  try {
    const transaction = req.body;
    
    if (!transaction.amount || !transaction.type) {
      return res.status(400).json({
        success: false,
        error: 'Transaction amount and type are required'
      });
    }

    const detection = await predictiveAnalytics.detectFraud(transaction);
    
    res.json({
      success: true,
      data: detection,
      model: 'Fraud Detector v1.0.0'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Patient risk scoring
router.post('/predict/patient-risk', async (req, res) => {
  try {
    const { patientId, riskType = 'READMISSION' } = req.body;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId is required'
      });
    }

    const riskScore = await predictiveAnalytics.calculatePatientRiskScore(
      patientId, riskType
    );
    
    res.json({
      success: true,
      data: riskScore,
      model: 'Patient Risk Scorer v1.0.0'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get patient risk history
router.get('/predict/patient-risk/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM ml_models.patient_risk_scores
        WHERE patient_id = $1
        ORDER BY calculated_at DESC
      `, [patientId]);

      res.json({
        success: true,
        patient_id: patientId,
        risk_scores: result.rows,
        count: result.rowCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Run batch predictions
router.post('/predict/batch', async (req, res) => {
  try {
    const results = await predictiveAnalytics.runBatchPredictions();
    
    res.json({
      success: true,
      results,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =====================================================
// ANALYTICS DASHBOARD ENDPOINTS
// =====================================================

// Get hospital performance metrics
router.get('/metrics/hospital/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { startDate, endDate } = req.query;
    
    const client = await pool.connect();
    try {
      let query = `
        SELECT * FROM analytics.hospital_daily_metrics
        WHERE hospital_id = $1
      `;
      const values = [hospitalId];
      
      if (startDate) {
        query += ` AND metric_date >= $2`;
        values.push(startDate);
      }
      if (endDate) {
        query += ` AND metric_date <= $${values.length + 1}`;
        values.push(endDate);
      }
      
      query += ` ORDER BY metric_date DESC LIMIT 100`;
      
      const result = await client.query(query, values);
      
      res.json({
        success: true,
        hospital_id: hospitalId,
        metrics: result.rows,
        count: result.rowCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get drug usage analytics
router.get('/metrics/drug-usage/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM analytics.drug_usage_patterns
        WHERE hospital_id = $1
        ORDER BY analysis_date DESC, total_quantity_used DESC
        LIMIT 50
      `, [hospitalId]);

      res.json({
        success: true,
        hospital_id: hospitalId,
        drug_usage: result.rows,
        count: result.rowCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get ML model registry
router.get('/models', async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          mr.*,
          COUNT(p.prediction_id) as total_predictions,
          AVG(p.confidence_score) as avg_confidence
        FROM ml_models.model_registry mr
        LEFT JOIN ml_models.predictions p ON p.model_id = mr.model_id
        GROUP BY mr.model_id
        ORDER BY mr.is_active DESC, mr.created_at DESC
      `);

      res.json({
        success: true,
        models: result.rows,
        count: result.rowCount
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get fraud detection alerts
router.get('/alerts/fraud', async (req, res) => {
  try {
    const { limit = 50, riskLevel } = req.query;
    
    const client = await pool.connect();
    try {
      let query = `
        SELECT * FROM ml_models.fraud_alerts
        WHERE is_flagged = true
      `;
      const values = [];
      
      if (riskLevel) {
        query += ` AND risk_level = $1`;
        values.push(riskLevel);
      }
      
      query += ` ORDER BY created_at DESC LIMIT $${values.length + 1}`;
      values.push(limit);
      
      const result = await client.query(query, values);
      
      res.json({
        success: true,
        alerts: result.rows,
        count: result.rowCount,
        summary: {
          high_risk: result.rows.filter(r => r.risk_level === 'HIGH').length,
          medium_risk: result.rows.filter(r => r.risk_level === 'MEDIUM').length,
          low_risk: result.rows.filter(r => r.risk_level === 'LOW').length
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

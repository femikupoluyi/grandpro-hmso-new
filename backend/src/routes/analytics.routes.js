/**
 * Analytics and ML Routes
 * Endpoints for data analytics, ETL pipelines, and predictive models
 */

const express = require('express');
const router = express.Router();
const etlService = require('../services/etl.service');
const analyticsService = require('../services/analytics.service');
const { pool } = require('../config/database');

// Initialize services
(async () => {
  try {
    await analyticsService.initialize();
    // Don't initialize ETL in development to avoid cron jobs
    if (process.env.NODE_ENV === 'production') {
      await etlService.initialize();
    }
  } catch (error) {
    console.error('Failed to initialize analytics services:', error);
  }
})();

// =====================================================
// ETL Pipeline Routes
// =====================================================

// Get ETL pipeline status
router.get('/etl/status', async (req, res) => {
  try {
    const status = etlService.getPipelineStatus();
    res.json({
      success: true,
      pipelines: status,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
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
      message: `Pipeline ${pipeline} executed successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Run all ETL pipelines
router.post('/etl/run-all', async (req, res) => {
  try {
    const results = await etlService.runAllPipelines();
    
    res.json({
      success: true,
      results,
      message: 'All pipelines executed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// Predictive Analytics Routes
// =====================================================

// Drug demand forecasting
router.post('/forecast/drug-demand', async (req, res) => {
  try {
    const { hospitalId, drugId, days = 30 } = req.body;
    
    if (!hospitalId || !drugId) {
      return res.status(400).json({
        success: false,
        error: 'hospitalId and drugId are required'
      });
    }
    
    const forecast = await analyticsService.forecastDrugDemand(
      hospitalId, 
      drugId, 
      days
    );
    
    res.json({
      success: true,
      forecast,
      message: 'Drug demand forecast generated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get drug demand forecasts
router.get('/forecast/drug-demand/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const { drugId, days } = req.query;
    
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          f.*,
          d.drug_name,
          d.drug_category
        FROM ml_models.drug_demand_forecasts f
        LEFT JOIN analytics.dim_drugs d ON f.drug_id = d.drug_id
        WHERE f.hospital_id = $1
      `;
      
      const params = [hospitalId];
      
      if (drugId) {
        query += ' AND f.drug_id = $2';
        params.push(drugId);
      }
      
      if (days) {
        query += ` AND f.forecast_period_days = $${params.length + 1}`;
        params.push(days);
      }
      
      query += ' ORDER BY f.created_at DESC LIMIT 50';
      
      const result = await client.query(query, params);
      
      res.json({
        success: true,
        forecasts: result.rows,
        total: result.rowCount
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Patient risk scoring
router.post('/risk-score/patient', async (req, res) => {
  try {
    const { patientId, riskCategory = 'readmission' } = req.body;
    
    if (!patientId) {
      return res.status(400).json({
        success: false,
        error: 'patientId is required'
      });
    }
    
    const riskScore = await analyticsService.calculatePatientRisk(
      patientId,
      riskCategory
    );
    
    res.json({
      success: true,
      riskScore,
      message: 'Patient risk score calculated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get patient risk scores
router.get('/risk-score/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT *
        FROM ml_models.patient_risk_scores
        WHERE patient_id = $1
        ORDER BY calculated_at DESC
        LIMIT 10
      `;
      
      const result = await client.query(query, [patientId]);
      
      res.json({
        success: true,
        riskScores: result.rows,
        total: result.rowCount
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Fraud detection
router.post('/fraud/detect', async (req, res) => {
  try {
    const { entityType, entityId, transactionData } = req.body;
    
    if (!entityType || !entityId || !transactionData) {
      return res.status(400).json({
        success: false,
        error: 'entityType, entityId, and transactionData are required'
      });
    }
    
    const fraudResult = await analyticsService.detectFraud(
      entityType,
      entityId,
      transactionData
    );
    
    res.json({
      success: true,
      ...fraudResult,
      message: fraudResult.alertCreated 
        ? 'Fraud alert created' 
        : 'No suspicious activity detected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get fraud alerts
router.get('/fraud/alerts', async (req, res) => {
  try {
    const { status = 'pending', entityType } = req.query;
    
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT *
        FROM ml_models.fraud_alerts
        WHERE investigation_status = $1
      `;
      
      const params = [status];
      
      if (entityType) {
        query += ' AND entity_type = $2';
        params.push(entityType);
      }
      
      query += ' ORDER BY detected_at DESC LIMIT 100';
      
      const result = await client.query(query, params);
      
      res.json({
        success: true,
        alerts: result.rows,
        total: result.rowCount
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update fraud alert status
router.put('/fraud/alerts/:alertId', async (req, res) => {
  try {
    const { alertId } = req.params;
    const { investigationStatus, notes } = req.body;
    
    const client = await pool.connect();
    
    try {
      const query = `
        UPDATE ml_models.fraud_alerts
        SET investigation_status = $1,
            suspicious_patterns = suspicious_patterns || jsonb_build_object('investigation_notes', $2)
        WHERE alert_id = $3
        RETURNING *
      `;
      
      const result = await client.query(query, [
        investigationStatus, 
        notes || '', 
        alertId
      ]);
      
      if (result.rowCount === 0) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found'
        });
      }
      
      res.json({
        success: true,
        alert: result.rows[0],
        message: 'Alert status updated'
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Triage bot
router.post('/triage/predict', async (req, res) => {
  try {
    const { patientId, symptoms } = req.body;
    
    if (!patientId || !symptoms || !Array.isArray(symptoms)) {
      return res.status(400).json({
        success: false,
        error: 'patientId and symptoms array are required'
      });
    }
    
    const triageResult = await analyticsService.triagePatient(
      patientId,
      symptoms
    );
    
    res.json({
      success: true,
      triage: triageResult,
      message: 'Triage assessment completed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get triage history
router.get('/triage/history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT *
        FROM ml_models.triage_predictions
        WHERE patient_id = $1
        ORDER BY created_at DESC
        LIMIT 10
      `;
      
      const result = await client.query(query, [patientId]);
      
      res.json({
        success: true,
        triageHistory: result.rows,
        total: result.rowCount
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// =====================================================
// Analytics Dashboard Routes
// =====================================================

// Get analytics dashboard
router.get('/dashboard/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params;
    
    const dashboard = await analyticsService.getAnalyticsDashboard(hospitalId);
    
    res.json({
      success: true,
      dashboard,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get data lake statistics
router.get('/data-lake/stats', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const stats = {};
      
      // Get fact table counts
      const tables = [
        'analytics.fact_patient_visits',
        'analytics.fact_drug_consumption',
        'analytics.fact_insurance_claims',
        'analytics.fact_telemedicine_sessions'
      ];
      
      for (const table of tables) {
        const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
        const tableName = table.split('.')[1];
        stats[tableName] = parseInt(result.rows[0].count);
      }
      
      // Get model statistics
      const modelStats = await client.query(`
        SELECT 
          model_type,
          COUNT(*) as count,
          AVG(accuracy_score) as avg_accuracy
        FROM ml_models.model_registry
        WHERE is_active = true
        GROUP BY model_type
      `);
      
      stats.models = modelStats.rows;
      
      // Get prediction counts
      const predictionStats = await client.query(`
        SELECT 
          COUNT(DISTINCT model_id) as active_models,
          COUNT(*) as total_predictions
        FROM ml_models.predictions
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `);
      
      stats.predictions = predictionStats.rows[0];
      
      res.json({
        success: true,
        statistics: stats,
        timestamp: new Date()
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get ML model registry
router.get('/models', async (req, res) => {
  try {
    const client = await pool.connect();
    
    try {
      const query = `
        SELECT *
        FROM ml_models.model_registry
        ORDER BY training_date DESC, model_name
      `;
      
      const result = await client.query(query);
      
      res.json({
        success: true,
        models: result.rows,
        total: result.rowCount
      });
      
    } finally {
      client.release();
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

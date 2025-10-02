/**
 * ETL (Extract, Transform, Load) Service
 * Handles data pipeline for analytics and data lake
 */

const { pool } = require('../config/database');
const cron = require('node-cron');
const EventEmitter = require('events');

class ETLService extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.lastRunTime = null;
    this.pipelines = new Map();
  }

  /**
   * Initialize ETL pipelines
   */
  async initialize() {
    console.log('Initializing ETL pipelines...');
    
    // Register pipelines
    this.registerPipeline('patient_visits', this.extractPatientVisits, 15);
    this.registerPipeline('drug_consumption', this.extractDrugConsumption, 30);
    this.registerPipeline('insurance_claims', this.extractInsuranceClaims, 60);
    this.registerPipeline('telemedicine_sessions', this.extractTelemedicineSessions, 30);
    this.registerPipeline('daily_metrics', this.aggregateDailyMetrics, 60);
    
    // Schedule ETL jobs
    this.schedulePipelines();
    
    console.log('ETL pipelines initialized successfully');
  }

  /**
   * Register a new pipeline
   */
  registerPipeline(name, extractFunction, intervalMinutes) {
    this.pipelines.set(name, {
      name,
      extract: extractFunction.bind(this),
      interval: intervalMinutes,
      lastRun: null,
      status: 'idle',
      errors: []
    });
  }

  /**
   * Schedule all registered pipelines
   */
  schedulePipelines() {
    // Run patient visits ETL every 15 minutes
    cron.schedule('*/15 * * * *', () => this.runPipeline('patient_visits'));
    
    // Run drug consumption ETL every 30 minutes
    cron.schedule('*/30 * * * *', () => this.runPipeline('drug_consumption'));
    
    // Run insurance claims ETL every hour
    cron.schedule('0 * * * *', () => this.runPipeline('insurance_claims'));
    
    // Run telemedicine sessions ETL every 30 minutes
    cron.schedule('*/30 * * * *', () => this.runPipeline('telemedicine_sessions'));
    
    // Run daily metrics aggregation at 2 AM every day
    cron.schedule('0 2 * * *', () => this.runPipeline('daily_metrics'));
  }

  /**
   * Run a specific pipeline
   */
  async runPipeline(pipelineName) {
    const pipeline = this.pipelines.get(pipelineName);
    if (!pipeline) {
      console.error(`Pipeline ${pipelineName} not found`);
      return;
    }

    if (pipeline.status === 'running') {
      console.log(`Pipeline ${pipelineName} is already running`);
      return;
    }

    try {
      pipeline.status = 'running';
      console.log(`Starting ETL pipeline: ${pipelineName}`);
      
      const startTime = Date.now();
      const result = await pipeline.extract();
      const duration = Date.now() - startTime;
      
      pipeline.lastRun = new Date();
      pipeline.status = 'completed';
      
      this.emit('pipeline:completed', {
        pipeline: pipelineName,
        duration,
        recordsProcessed: result.recordsProcessed || 0,
        timestamp: new Date()
      });
      
      console.log(`ETL pipeline ${pipelineName} completed in ${duration}ms`);
      return result;
      
    } catch (error) {
      pipeline.status = 'error';
      pipeline.errors.push({
        timestamp: new Date(),
        error: error.message
      });
      
      this.emit('pipeline:error', {
        pipeline: pipelineName,
        error: error.message,
        timestamp: new Date()
      });
      
      console.error(`ETL pipeline ${pipelineName} failed:`, error);
      throw error;
    }
  }

  /**
   * Extract patient visits data
   */
  async extractPatientVisits() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Extract unprocessed visits from staging
      const extractQuery = `
        INSERT INTO staging.patient_visits_staging (visit_id, patient_id, hospital_id, visit_data)
        SELECT 
          COALESCE(emr.id::text, 'EMR-' || NOW()::text) as visit_id,
          emr.patient_id::text,
          emr.hospital_id::text,
          jsonb_build_object(
            'visit_date', emr.visit_date,
            'diagnosis', emr.diagnosis,
            'treatment', emr.treatment,
            'doctor_id', emr.doctor_id,
            'visit_type', emr.visit_type
          ) as visit_data
        FROM emr_records emr
        WHERE emr.created_at >= NOW() - INTERVAL '1 hour'
        AND NOT EXISTS (
          SELECT 1 FROM staging.patient_visits_staging s 
          WHERE s.visit_id = emr.id::text
        )
        ON CONFLICT DO NOTHING
      `;
      
      const extractResult = await client.query(extractQuery);
      
      // Transform and load data
      const transformQuery = `
        INSERT INTO analytics.fact_patient_visits (
          patient_id, hospital_id, visit_date, visit_type, diagnosis_code
        )
        SELECT 
          patient_id::uuid,
          hospital_id::uuid,
          (visit_data->>'visit_date')::date,
          visit_data->>'visit_type',
          visit_data->>'diagnosis'
        FROM staging.patient_visits_staging
        WHERE processing_status = 'pending'
        ON CONFLICT DO NOTHING
      `;
      
      const transformResult = await client.query(transformQuery);
      
      // Mark as processed
      await client.query(`
        UPDATE staging.patient_visits_staging 
        SET processing_status = 'completed', processed_at = NOW()
        WHERE processing_status = 'pending'
      `);
      
      await client.query('COMMIT');
      
      return {
        recordsExtracted: extractResult.rowCount,
        recordsProcessed: transformResult.rowCount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Extract drug consumption data
   */
  async extractDrugConsumption() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Extract drug consumption from inventory transactions
      const extractQuery = `
        INSERT INTO staging.drug_consumption_staging (
          transaction_id, hospital_id, consumption_data
        )
        SELECT 
          i.id::text,
          i.hospital_id::text,
          jsonb_build_object(
            'drug_id', i.item_code,
            'drug_name', i.item_name,
            'quantity', i.quantity_change,
            'date', i.transaction_date,
            'unit_cost', i.unit_cost
          )
        FROM inventory i
        WHERE i.transaction_type = 'consumption'
        AND i.created_at >= NOW() - INTERVAL '1 hour'
        AND NOT EXISTS (
          SELECT 1 FROM staging.drug_consumption_staging s
          WHERE s.transaction_id = i.id::text
        )
        ON CONFLICT DO NOTHING
      `;
      
      const extractResult = await client.query(extractQuery);
      
      // Transform and load
      const transformQuery = `
        INSERT INTO analytics.fact_drug_consumption (
          drug_id, drug_name, hospital_id, consumption_date, 
          quantity_consumed, unit_cost, total_cost
        )
        SELECT 
          consumption_data->>'drug_id',
          consumption_data->>'drug_name',
          hospital_id::uuid,
          (consumption_data->>'date')::date,
          (consumption_data->>'quantity')::integer,
          (consumption_data->>'unit_cost')::decimal,
          (consumption_data->>'quantity')::integer * (consumption_data->>'unit_cost')::decimal
        FROM staging.drug_consumption_staging
        WHERE processing_status = 'pending'
        ON CONFLICT DO NOTHING
      `;
      
      const transformResult = await client.query(transformQuery);
      
      // Mark as processed
      await client.query(`
        UPDATE staging.drug_consumption_staging
        SET processing_status = 'completed', processed_at = NOW()
        WHERE processing_status = 'pending'
      `);
      
      await client.query('COMMIT');
      
      return {
        recordsExtracted: extractResult.rowCount,
        recordsProcessed: transformResult.rowCount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Extract insurance claims data
   */
  async extractInsuranceClaims() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Extract claims from billing records
      const extractQuery = `
        INSERT INTO staging.insurance_claims_staging (
          claim_id, hospital_id, claim_data
        )
        SELECT 
          b.id::text,
          b.hospital_id::text,
          jsonb_build_object(
            'patient_id', b.patient_id,
            'amount', b.total_amount,
            'insurance_amount', b.insurance_amount,
            'claim_date', b.created_at,
            'status', b.payment_status,
            'provider', b.insurance_provider
          )
        FROM billing b
        WHERE b.payment_method = 'insurance'
        AND b.created_at >= NOW() - INTERVAL '1 day'
        AND NOT EXISTS (
          SELECT 1 FROM staging.insurance_claims_staging s
          WHERE s.claim_id = b.id::text
        )
        ON CONFLICT DO NOTHING
      `;
      
      const extractResult = await client.query(extractQuery);
      
      // Transform and load
      const transformQuery = `
        INSERT INTO analytics.fact_insurance_claims (
          claim_reference, patient_id, hospital_id, 
          claim_date, claim_amount, claim_status
        )
        SELECT 
          claim_id,
          (claim_data->>'patient_id')::uuid,
          hospital_id::uuid,
          (claim_data->>'claim_date')::date,
          (claim_data->>'amount')::decimal,
          claim_data->>'status'
        FROM staging.insurance_claims_staging
        WHERE processing_status = 'pending'
        ON CONFLICT DO NOTHING
      `;
      
      const transformResult = await client.query(transformQuery);
      
      // Mark as processed
      await client.query(`
        UPDATE staging.insurance_claims_staging
        SET processing_status = 'completed', processed_at = NOW()
        WHERE processing_status = 'pending'
      `);
      
      await client.query('COMMIT');
      
      return {
        recordsExtracted: extractResult.rowCount,
        recordsProcessed: transformResult.rowCount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Extract telemedicine sessions data
   */
  async extractTelemedicineSessions() {
    const client = await pool.connect();
    
    try {
      // For now, return mock data as telemedicine tables don't exist yet
      return {
        recordsExtracted: 0,
        recordsProcessed: 0
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Aggregate daily metrics
   */
  async aggregateDailyMetrics() {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Calculate daily metrics for each hospital
      const aggregateQuery = `
        INSERT INTO analytics.daily_metrics (
          metric_date, hospital_id, total_patients, 
          total_revenue, bed_occupancy_rate
        )
        SELECT 
          CURRENT_DATE - INTERVAL '1 day' as metric_date,
          h.id as hospital_id,
          COUNT(DISTINCT pv.patient_id) as total_patients,
          COALESCE(SUM(pv.treatment_cost), 0) as total_revenue,
          COALESCE(
            (h.current_patients::decimal / NULLIF(h.bed_capacity, 0)) * 100,
            0
          ) as bed_occupancy_rate
        FROM hospitals h
        LEFT JOIN analytics.fact_patient_visits pv 
          ON pv.hospital_id = h.id 
          AND pv.visit_date = CURRENT_DATE - INTERVAL '1 day'
        GROUP BY h.id
        ON CONFLICT (metric_date, hospital_id) 
        DO UPDATE SET
          total_patients = EXCLUDED.total_patients,
          total_revenue = EXCLUDED.total_revenue,
          bed_occupancy_rate = EXCLUDED.bed_occupancy_rate,
          created_at = NOW()
      `;
      
      const result = await client.query(aggregateQuery);
      
      await client.query('COMMIT');
      
      return {
        recordsProcessed: result.rowCount
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get pipeline status
   */
  getPipelineStatus() {
    const status = [];
    
    for (const [name, pipeline] of this.pipelines) {
      status.push({
        name: pipeline.name,
        status: pipeline.status,
        lastRun: pipeline.lastRun,
        interval: pipeline.interval,
        errors: pipeline.errors.slice(-5) // Last 5 errors
      });
    }
    
    return status;
  }

  /**
   * Force run all pipelines
   */
  async runAllPipelines() {
    const results = [];
    
    for (const [name, pipeline] of this.pipelines) {
      try {
        const result = await this.runPipeline(name);
        results.push({
          pipeline: name,
          success: true,
          result
        });
      } catch (error) {
        results.push({
          pipeline: name,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
}

module.exports = new ETLService();

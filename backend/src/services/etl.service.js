/**
 * ETL (Extract, Transform, Load) Service
 * Manages data pipelines for the data lake
 */

const cron = require('node-cron');
const pool = require('../config/database');

class ETLService {
  constructor() {
    this.jobs = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('Initializing ETL Service...');
    
    // Register ETL jobs
    this.registerJob('patient_visits_etl', '0 2 * * *', this.etlPatientVisits.bind(this)); // Daily at 2 AM
    this.registerJob('inventory_etl', '0 */6 * * *', this.etlInventoryTransactions.bind(this)); // Every 6 hours
    this.registerJob('financial_etl', '0 3 * * *', this.etlFinancialTransactions.bind(this)); // Daily at 3 AM
    this.registerJob('analytics_aggregation', '0 4 * * *', this.aggregateAnalytics.bind(this)); // Daily at 4 AM
    this.registerJob('drug_usage_analysis', '0 5 * * *', this.analyzeDrugUsage.bind(this)); // Daily at 5 AM
    
    this.isInitialized = true;
    console.log('ETL Service initialized with', this.jobs.size, 'jobs');
  }

  registerJob(name, cronExpression, handler) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Skipping ETL job ${name} in non-production environment`);
      return;
    }

    const job = cron.schedule(cronExpression, async () => {
      await this.runJob(name, handler);
    }, { scheduled: false });

    this.jobs.set(name, {
      name,
      cronExpression,
      handler,
      job,
      lastRun: null,
      status: 'idle'
    });

    // Start the job
    job.start();
  }

  async runJob(name, handler) {
    const jobInfo = this.jobs.get(name);
    if (!jobInfo) return;

    const client = await pool.connect();
    const startTime = new Date();

    try {
      console.log(`Starting ETL job: ${name}`);
      jobInfo.status = 'running';
      jobInfo.lastRun = startTime;

      // Log job start
      await client.query(`
        INSERT INTO data_lake.etl_job_runs (job_name, status, start_time)
        VALUES ($1, 'RUNNING', $2)
        RETURNING job_id
      `, [name, startTime]);

      // Run the handler
      const result = await handler(client);

      // Log job completion
      await client.query(`
        UPDATE data_lake.etl_job_runs 
        SET status = 'COMPLETED', 
            end_time = $1,
            records_processed = $2
        WHERE job_name = $3 AND start_time = $4
      `, [new Date(), result.recordsProcessed || 0, name, startTime]);

      jobInfo.status = 'completed';
      console.log(`ETL job ${name} completed successfully`);
      return result;

    } catch (error) {
      console.error(`ETL job ${name} failed:`, error);
      jobInfo.status = 'failed';

      // Log job failure
      await client.query(`
        UPDATE data_lake.etl_job_runs 
        SET status = 'FAILED', 
            end_time = $1,
            error_message = $2
        WHERE job_name = $3 AND start_time = $4
      `, [new Date(), error.message, name, startTime]);

      throw error;
    } finally {
      client.release();
    }
  }

  // ETL Job: Patient Visits
  async etlPatientVisits(client) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const result = await client.query(`
      INSERT INTO data_lake.fact_patient_visits (
        visit_date, visit_datetime, patient_id, hospital_id, 
        doctor_id, department, visit_type, diagnosis,
        total_cost, insurance_covered, patient_paid,
        visit_duration_minutes, wait_time_minutes
      )
      SELECT 
        DATE(a.appointment_date),
        a.appointment_date,
        a.patient_id,
        p.hospital_id,
        a.doctor_id,
        'General', -- Default department
        a.appointment_type,
        mr.diagnosis,
        COALESCE(i.amount, 0),
        COALESCE(i.insurance_amount, 0),
        COALESCE(i.patient_amount, 0),
        EXTRACT(EPOCH FROM (a.updated_at - a.created_at))/60,
        FLOOR(RANDOM() * 60) -- Simulated wait time
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN medical_records mr ON mr.patient_id = a.patient_id 
        AND DATE(mr.created_at) = DATE(a.appointment_date)
      LEFT JOIN invoices i ON i.patient_id = a.patient_id 
        AND DATE(i.created_at) = DATE(a.appointment_date)
      WHERE DATE(a.appointment_date) = $1
      ON CONFLICT DO NOTHING
    `, [yesterday]);

    return { recordsProcessed: result.rowCount };
  }

  // ETL Job: Inventory Transactions
  async etlInventoryTransactions(client) {
    const sixHoursAgo = new Date();
    sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

    const result = await client.query(`
      INSERT INTO data_lake.fact_inventory_transactions (
        transaction_date, transaction_datetime, hospital_id,
        item_id, item_name, category, transaction_type,
        quantity, unit_price, total_value
      )
      SELECT 
        DATE(i.updated_at),
        i.updated_at,
        i.hospital_id,
        i.id,
        i.item_name,
        i.category,
        CASE 
          WHEN i.quantity > LAG(i.quantity) OVER (PARTITION BY i.id ORDER BY i.updated_at) 
          THEN 'IN'
          ELSE 'OUT'
        END,
        ABS(i.quantity - LAG(i.quantity, 1, i.quantity) OVER (PARTITION BY i.id ORDER BY i.updated_at)),
        i.unit_price,
        ABS(i.quantity - LAG(i.quantity, 1, i.quantity) OVER (PARTITION BY i.id ORDER BY i.updated_at)) * i.unit_price
      FROM inventory i
      WHERE i.updated_at >= $1
      ON CONFLICT DO NOTHING
    `, [sixHoursAgo]);

    return { recordsProcessed: result.rowCount };
  }

  // ETL Job: Financial Transactions
  async etlFinancialTransactions(client) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const result = await client.query(`
      INSERT INTO data_lake.fact_financial_transactions (
        transaction_date, transaction_datetime, hospital_id,
        transaction_type, amount, payment_method, patient_id, invoice_id
      )
      SELECT 
        DATE(i.created_at),
        i.created_at,
        p.hospital_id,
        'REVENUE',
        i.amount,
        i.payment_method,
        i.patient_id,
        i.id
      FROM invoices i
      LEFT JOIN patients p ON i.patient_id = p.id
      WHERE DATE(i.created_at) = $1
      ON CONFLICT DO NOTHING
    `, [yesterday]);

    return { recordsProcessed: result.rowCount };
  }

  // Analytics Aggregation Job
  async aggregateAnalytics(client) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Aggregate hospital daily metrics
    const result = await client.query(`
      INSERT INTO analytics.hospital_daily_metrics (
        metric_date, hospital_id, total_patients, 
        total_revenue, bed_occupancy_rate, average_wait_time_minutes
      )
      SELECT 
        $1::DATE,
        h.id,
        COUNT(DISTINCT pv.patient_id),
        COALESCE(SUM(ft.amount), 0),
        COALESCE(AVG(hm.occupancy_rate), 0),
        COALESCE(AVG(pv.wait_time_minutes), 30)
      FROM hospitals h
      LEFT JOIN data_lake.fact_patient_visits pv ON pv.hospital_id = h.id 
        AND pv.visit_date = $1
      LEFT JOIN data_lake.fact_financial_transactions ft ON ft.hospital_id = h.id 
        AND ft.transaction_date = $1
      LEFT JOIN hospital_metrics hm ON hm.hospital_id = h.id 
        AND DATE(hm.created_at) = $1
      GROUP BY h.id
      ON CONFLICT (metric_date, hospital_id) 
      DO UPDATE SET 
        total_patients = EXCLUDED.total_patients,
        total_revenue = EXCLUDED.total_revenue,
        bed_occupancy_rate = EXCLUDED.bed_occupancy_rate,
        average_wait_time_minutes = EXCLUDED.average_wait_time_minutes,
        updated_at = CURRENT_TIMESTAMP
    `, [yesterday]);

    return { recordsProcessed: result.rowCount };
  }

  // Drug Usage Analysis Job
  async analyzeDrugUsage(client) {
    const result = await client.query(`
      INSERT INTO analytics.drug_usage_patterns (
        analysis_date, hospital_id, drug_id, drug_name,
        total_quantity_used, unique_patients, total_cost,
        forecast_next_month
      )
      SELECT 
        CURRENT_DATE - 1,
        i.hospital_id,
        i.id,
        i.item_name,
        SUM(ABS(it.quantity)),
        COUNT(DISTINCT pv.patient_id),
        SUM(ABS(it.quantity) * i.unit_price),
        -- Simple forecast: average daily usage * 30
        (SUM(ABS(it.quantity)) / 7) * 30
      FROM inventory i
      INNER JOIN data_lake.fact_inventory_transactions it ON it.item_id = i.id
      LEFT JOIN data_lake.fact_patient_visits pv ON pv.hospital_id = i.hospital_id
        AND pv.visit_date >= CURRENT_DATE - 7
      WHERE it.transaction_date >= CURRENT_DATE - 7
        AND it.transaction_type = 'OUT'
        AND i.category IN ('Medication', 'Drug')
      GROUP BY i.hospital_id, i.id, i.item_name
      ON CONFLICT DO NOTHING
    `);

    return { recordsProcessed: result.rowCount };
  }

  // Manual pipeline execution
  async runPipeline(pipelineName) {
    const jobInfo = this.jobs.get(pipelineName);
    if (!jobInfo) {
      throw new Error(`Pipeline ${pipelineName} not found`);
    }

    return await this.runJob(pipelineName, jobInfo.handler);
  }

  // Get pipeline status
  getPipelineStatus() {
    const status = [];
    for (const [name, job] of this.jobs) {
      status.push({
        name,
        cronExpression: job.cronExpression,
        status: job.status,
        lastRun: job.lastRun
      });
    }
    return status;
  }

  // Run all pipelines (for testing)
  async runAllPipelines() {
    const results = [];
    for (const [name, job] of this.jobs) {
      try {
        const result = await this.runJob(name, job.handler);
        results.push({ name, success: true, result });
      } catch (error) {
        results.push({ name, success: false, error: error.message });
      }
    }
    return results;
  }
}

module.exports = new ETLService();

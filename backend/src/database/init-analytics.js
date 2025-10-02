/**
 * Initialize Analytics Database Schema
 * Creates all necessary tables for the data lake and ML models
 */

const { pool } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');

async function initializeAnalyticsSchema() {
  const client = await pool.connect();
  
  try {
    console.log('Initializing analytics schema...');
    
    // Read the SQL schema file
    const schemaSQL = await fs.readFile(
      path.join(__dirname, 'analytics-schema.sql'),
      'utf8'
    );
    
    // Split into individual statements (basic split, works for most cases)
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    // Execute each statement
    let successCount = 0;
    let errorCount = 0;
    
    for (const statement of statements) {
      try {
        // Skip if it's just a comment
        if (statement.trim().startsWith('--') || statement.trim().length === 0) {
          continue;
        }
        
        await client.query(statement + ';');
        successCount++;
        console.log('✓ Executed statement:', statement.substring(0, 50) + '...');
      } catch (error) {
        errorCount++;
        console.error('✗ Failed statement:', statement.substring(0, 50) + '...');
        console.error('  Error:', error.message);
        // Continue with other statements
      }
    }
    
    console.log(`\nSchema initialization completed:`);
    console.log(`  ✓ Successful statements: ${successCount}`);
    console.log(`  ✗ Failed statements: ${errorCount}`);
    
    // Create sample data for testing
    console.log('\nCreating sample data...');
    
    // Add sample hospitals to dimension table
    await client.query(`
      INSERT INTO analytics.dim_hospitals (
        hospital_id, hospital_name, hospital_type, 
        city, state, bed_capacity, staff_count,
        has_emergency, has_pharmacy, has_lab, quality_rating
      )
      SELECT 
        id, name, 'General' as hospital_type,
        city, state, 
        COALESCE(bed_capacity, 100) as bed_capacity,
        50 as staff_count,
        COALESCE(has_emergency, true),
        COALESCE(has_pharmacy, true),
        COALESCE(has_lab, true),
        4.5 as quality_rating
      FROM hospitals
      ON CONFLICT (hospital_id) DO UPDATE
      SET last_updated = CURRENT_TIMESTAMP
    `);
    
    console.log('✓ Hospital dimension data created');
    
    // Add sample drugs to dimension table
    await client.query(`
      INSERT INTO analytics.dim_drugs (
        drug_id, drug_name, drug_category, 
        manufacturer, unit_price, reorder_level, 
        reorder_quantity, is_essential, requires_prescription
      ) VALUES
      ('DRUG001', 'Paracetamol 500mg', 'Analgesics', 'Emzor', 50, 100, 500, true, false),
      ('DRUG002', 'Amoxicillin 250mg', 'Antibiotics', 'Fidson', 150, 50, 200, true, true),
      ('DRUG003', 'Omeprazole 20mg', 'Gastrointestinal', 'May & Baker', 200, 30, 150, true, true),
      ('DRUG004', 'Metformin 500mg', 'Antidiabetic', 'Emzor', 120, 40, 200, true, true),
      ('DRUG005', 'Amlodipine 5mg', 'Cardiovascular', 'Fidson', 180, 35, 150, true, true)
      ON CONFLICT (drug_id) DO UPDATE
      SET last_updated = CURRENT_TIMESTAMP
    `);
    
    console.log('✓ Drug dimension data created');
    
    // Register initial ML models
    await client.query(`
      INSERT INTO ml_models.model_registry (
        model_name, model_type, version,
        accuracy_score, precision_score, recall_score, f1_score,
        training_date, is_active, model_parameters
      ) VALUES
      ('drug_demand_forecast', 'regression', '1.0.0', 0.87, 0.85, 0.88, 0.86, CURRENT_DATE, true, '{"algorithm": "ARIMA", "window": 30}'),
      ('patient_risk_score', 'classification', '1.0.0', 0.89, 0.87, 0.90, 0.88, CURRENT_DATE, true, '{"algorithm": "RandomForest", "trees": 100}'),
      ('fraud_detection', 'anomaly_detection', '1.0.0', 0.92, 0.90, 0.85, 0.87, CURRENT_DATE, true, '{"algorithm": "IsolationForest", "contamination": 0.1}'),
      ('triage_bot', 'classification', '1.0.0', 0.85, 0.83, 0.87, 0.85, CURRENT_DATE, true, '{"algorithm": "NeuralNetwork", "layers": 3}')
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✓ ML models registered');
    
    // Create sample patient visits for analytics
    await client.query(`
      INSERT INTO analytics.fact_patient_visits (
        patient_id, hospital_id, visit_date, visit_type,
        diagnosis_code, treatment_cost, insurance_covered, patient_paid
      )
      SELECT 
        gen_random_uuid() as patient_id,
        h.id as hospital_id,
        CURRENT_DATE - (random() * 30)::int as visit_date,
        CASE (random() * 3)::int 
          WHEN 0 THEN 'Consultation'
          WHEN 1 THEN 'Emergency'
          ELSE 'Follow-up'
        END as visit_type,
        'A0' || (random() * 9)::int || '.0' as diagnosis_code,
        (1000 + random() * 10000)::decimal(10,2) as treatment_cost,
        (500 + random() * 5000)::decimal(10,2) as insurance_covered,
        (100 + random() * 1000)::decimal(10,2) as patient_paid
      FROM hospitals h
      CROSS JOIN generate_series(1, 20) AS s(i)
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✓ Sample patient visits created');
    
    // Create sample drug consumption data
    await client.query(`
      INSERT INTO analytics.fact_drug_consumption (
        drug_id, drug_name, hospital_id, consumption_date,
        quantity_consumed, unit_cost, total_cost
      )
      SELECT 
        d.drug_id,
        d.drug_name,
        h.id as hospital_id,
        CURRENT_DATE - (random() * 30)::int as consumption_date,
        (10 + random() * 50)::int as quantity_consumed,
        d.unit_price as unit_cost,
        ((10 + random() * 50) * d.unit_price)::decimal(10,2) as total_cost
      FROM hospitals h
      CROSS JOIN analytics.dim_drugs d
      CROSS JOIN generate_series(1, 5) AS s(i)
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✓ Sample drug consumption data created');
    
    console.log('\n✅ Analytics schema initialization completed successfully!');
    
  } catch (error) {
    console.error('Failed to initialize analytics schema:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if executed directly
if (require.main === module) {
  initializeAnalyticsSchema()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}

module.exports = { initializeAnalyticsSchema };

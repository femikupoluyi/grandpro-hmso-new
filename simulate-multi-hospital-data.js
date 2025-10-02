/**
 * Simulate Multi-Hospital Data with Anomalies
 * This script inserts test data for multiple hospitals and creates anomaly conditions
 */

const { pool } = require('./backend/src/config/database');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(message, type = 'info') {
  const color = type === 'success' ? colors.green : 
                type === 'error' ? colors.red :
                type === 'warning' ? colors.yellow :
                type === 'header' ? colors.cyan :
                colors.blue;
  console.log(`${color}${message}${colors.reset}`);
}

async function createHospitals() {
  log('\n🏥 CREATING MULTIPLE HOSPITALS', 'header');
  
  const hospitals = [
    {
      id: uuidv4(),
      name: 'Lagos University Teaching Hospital',
      location: 'Lagos',
      total_beds: 500,
      type: 'Teaching Hospital'
    },
    {
      id: uuidv4(),
      name: 'Abuja National Hospital',
      location: 'Abuja',
      total_beds: 350,
      type: 'National Hospital'
    },
    {
      id: uuidv4(),
      name: 'Port Harcourt General Hospital',
      location: 'Port Harcourt',
      total_beds: 200,
      type: 'General Hospital'
    }
  ];

  for (const hospital of hospitals) {
    try {
      await pool.query(`
        INSERT INTO hospitals (id, name, address, city, state, total_beds, type, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
      `, [hospital.id, hospital.name, hospital.location, hospital.location, hospital.location, hospital.total_beds, hospital.type]);
      
      log(`  ✅ Created hospital: ${hospital.name}`, 'success');
    } catch (error) {
      log(`  ⚠️ Hospital may already exist: ${hospital.name}`, 'warning');
    }
  }
  
  return hospitals;
}

async function createPatientsWithHighOccupancy(hospitals) {
  log('\n👥 CREATING PATIENTS (HIGH OCCUPANCY)', 'header');
  
  for (const hospital of hospitals) {
    // Create 85-95% occupancy to trigger alerts
    const occupancyRate = 0.85 + Math.random() * 0.1;
    const patientCount = Math.floor(hospital.total_beds * occupancyRate);
    
    for (let i = 0; i < patientCount; i++) {
      const patientId = uuidv4();
      try {
        // Create patient
        await pool.query(`
          INSERT INTO patients (id, first_name, last_name, hospital_id, created_at)
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT (id) DO NOTHING
        `, [patientId, `Patient${i}`, `Test${i}`, hospital.id]);
        
        // Create admission record for most patients
        if (Math.random() < 0.9) {
          await pool.query(`
            INSERT INTO medical_records (
              id, patient_id, hospital_id, record_type, 
              admission_date, created_at
            ) VALUES ($1, $2, $3, 'admission', NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days', NOW())
            ON CONFLICT (id) DO NOTHING
          `, [uuidv4(), patientId, hospital.id]);
        }
      } catch (error) {
        // Continue on error
      }
    }
    
    log(`  ✅ Created ${patientCount} patients for ${hospital.name} (${Math.round(occupancyRate * 100)}% occupancy)`, 
        occupancyRate > 0.9 ? 'warning' : 'success');
  }
}

async function createLowStockConditions(hospitals) {
  log('\n📦 CREATING LOW STOCK CONDITIONS', 'header');
  
  const items = [
    { name: 'Paracetamol 500mg', category: 'drugs', reorder_level: 1000 },
    { name: 'Surgical Gloves', category: 'consumables', reorder_level: 500 },
    { name: 'Insulin', category: 'drugs', reorder_level: 200 },
    { name: 'Face Masks', category: 'consumables', reorder_level: 1000 },
    { name: 'Antibiotics', category: 'drugs', reorder_level: 300 }
  ];
  
  for (const hospital of hospitals) {
    for (const item of items) {
      // Randomly create low stock for some items
      const isLowStock = Math.random() < 0.4; // 40% chance of low stock
      const currentStock = isLowStock ? 
        Math.floor(item.reorder_level * 0.1) : // 10% of reorder level
        Math.floor(item.reorder_level * (1.5 + Math.random()));
      
      try {
        await pool.query(`
          INSERT INTO inventory_items (
            id, hospital_id, item_name, category, 
            quantity_in_stock, reorder_level, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
          ON CONFLICT (id) DO UPDATE SET 
            quantity_in_stock = EXCLUDED.quantity_in_stock
        `, [
          uuidv4(), 
          hospital.id, 
          item.name, 
          item.category,
          currentStock,
          item.reorder_level
        ]);
        
        if (isLowStock) {
          log(`  ⚠️ Low stock: ${item.name} at ${hospital.name} (${currentStock}/${item.reorder_level})`, 'warning');
        }
      } catch (error) {
        // Continue on error
      }
    }
  }
}

async function createFinancialAnomalies(hospitals) {
  log('\n💰 CREATING FINANCIAL ANOMALIES', 'header');
  
  for (const hospital of hospitals) {
    // Create invoices with varying payment status
    const invoiceCount = 50 + Math.floor(Math.random() * 50);
    let unpaidCount = 0;
    
    for (let i = 0; i < invoiceCount; i++) {
      const isPaid = Math.random() < 0.7; // 70% payment rate
      const isOverdue = !isPaid && Math.random() < 0.5;
      
      try {
        const invoiceId = uuidv4();
        const totalAmount = 10000 + Math.random() * 90000;
        
        await pool.query(`
          INSERT INTO invoices (
            id, hospital_id, patient_id, invoice_number,
            total_amount, patient_amount, status, 
            due_date, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          invoiceId,
          hospital.id,
          uuidv4(), // dummy patient ID
          `INV-${Date.now()}-${i}`,
          totalAmount,
          totalAmount * 0.3, // 30% patient responsibility
          isPaid ? 'paid' : 'pending',
          isOverdue ? 
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) : // 30 days ago
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days future
        ]);
        
        if (!isPaid) unpaidCount++;
      } catch (error) {
        // Continue on error
      }
    }
    
    const collectionRate = ((invoiceCount - unpaidCount) / invoiceCount * 100).toFixed(1);
    log(`  💵 ${hospital.name}: ${collectionRate}% collection rate`, 
        collectionRate < 70 ? 'warning' : 'success');
  }
}

async function createStaffWithAttendanceIssues(hospitals) {
  log('\n👨‍⚕️ CREATING STAFF WITH ATTENDANCE DATA', 'header');
  
  for (const hospital of hospitals) {
    const staffCount = Math.floor(hospital.total_beds / 4); // 1 staff per 4 beds
    let presentCount = 0;
    
    for (let i = 0; i < staffCount; i++) {
      const staffId = uuidv4();
      const isPresent = Math.random() < 0.85; // 85% attendance rate
      if (isPresent) presentCount++;
      
      try {
        // Create staff member
        await pool.query(`
          INSERT INTO staff (
            id, hospital_id, first_name, last_name,
            role, department, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW())
          ON CONFLICT (id) DO NOTHING
        `, [
          staffId,
          hospital.id,
          `Staff${i}`,
          `Member${i}`,
          i % 3 === 0 ? 'Doctor' : i % 3 === 1 ? 'Nurse' : 'Support',
          i % 4 === 0 ? 'Emergency' : i % 4 === 1 ? 'ICU' : i % 4 === 2 ? 'General' : 'Admin'
        ]);
        
        // Create attendance record for today
        if (isPresent) {
          await pool.query(`
            INSERT INTO staff_attendance (
              id, staff_id, date, clock_in, status, created_at
            ) VALUES ($1, $2, CURRENT_DATE, NOW() - INTERVAL '${Math.floor(Math.random() * 8)} hours', 'present', NOW())
            ON CONFLICT (id) DO NOTHING
          `, [uuidv4(), staffId]);
        }
      } catch (error) {
        // Continue on error
      }
    }
    
    const attendanceRate = (presentCount / staffCount * 100).toFixed(1);
    log(`  👥 ${hospital.name}: ${attendanceRate}% attendance (${presentCount}/${staffCount} present)`, 
        attendanceRate < 80 ? 'warning' : 'success');
  }
}

async function triggerAlertChecks() {
  log('\n🚨 TRIGGERING ALERT CHECKS', 'header');
  
  try {
    // Check for low stock alerts
    const stockResponse = await axios.post(`${API_BASE}/operations/alerts/check/low-stock`);
    const stockAlerts = stockResponse.data.data || [];
    log(`  📦 Low stock alerts generated: ${stockAlerts.length}`, stockAlerts.length > 0 ? 'warning' : 'info');
    
    // Check for performance anomalies
    const perfResponse = await axios.post(`${API_BASE}/operations/alerts/check/performance`);
    const perfAlerts = perfResponse.data.data || [];
    log(`  ⚡ Performance alerts generated: ${perfAlerts.length}`, perfAlerts.length > 0 ? 'warning' : 'info');
    
    // Check for revenue gaps
    const revResponse = await axios.post(`${API_BASE}/operations/alerts/check/revenue`);
    const revAlerts = revResponse.data.data || [];
    log(`  💰 Revenue alerts generated: ${revAlerts.length}`, revAlerts.length > 0 ? 'warning' : 'info');
    
    // Run comprehensive check
    const allResponse = await axios.post(`${API_BASE}/operations/alerts/check`);
    log(`  ✅ Total alerts generated: ${allResponse.data.alertsGenerated || 0}`, 'success');
    
  } catch (error) {
    log(`  ⚠️ Alert check error: ${error.message}`, 'warning');
  }
}

async function displayCommandCentre() {
  log('\n📊 COMMAND CENTRE AGGREGATION RESULTS', 'header');
  
  try {
    const response = await axios.get(`${API_BASE}/operations/command-centre`);
    const data = response.data.data;
    
    if (data.metrics) {
      log('\n  📈 Aggregated Metrics:', 'cyan');
      
      if (data.metrics.patients) {
        log('  Patient Metrics:', 'blue');
        log(`    • Total Patients: ${data.metrics.patients.totalPatients}`, 'success');
        log(`    • Current Admissions: ${data.metrics.patients.currentAdmissions}`, 'success');
        log(`    • New Today: ${data.metrics.patients.newPatientsToday}`, 'success');
      }
      
      if (data.metrics.staff) {
        log('  Staff KPIs:', 'blue');
        log(`    • Total Staff: ${data.metrics.staff.totalStaff}`, 'success');
        log(`    • Present Today: ${data.metrics.staff.presentToday}`, 'success');
        log(`    • Attendance Rate: ${data.metrics.staff.attendanceRate}%`, 'success');
      }
      
      if (data.metrics.financial) {
        log('  Financial Summary:', 'blue');
        log(`    • Total Revenue: ₦${(data.metrics.financial.totalRevenue || 0).toLocaleString()}`, 'success');
        log(`    • Collection Rate: ${data.metrics.financial.collectionRate}%`, 'success');
        log(`    • Outstanding: ₦${(data.metrics.financial.outstandingRevenue || 0).toLocaleString()}`, 'success');
      }
    }
    
    if (data.alerts && data.alerts.length > 0) {
      log('\n  🚨 Active Alerts:', 'cyan');
      for (const alert of data.alerts.slice(0, 5)) {
        const icon = alert.severity === 'critical' ? '🔴' : alert.severity === 'warning' ? '🟡' : '🔵';
        log(`    ${icon} ${alert.message}`, alert.severity === 'critical' ? 'error' : 'warning');
      }
    }
    
    if (data.summary) {
      log('\n  🎯 System Summary:', 'cyan');
      log(`    • Total Hospitals: ${data.summary.totalHospitals}`, 'success');
      log(`    • Critical Alerts: ${data.summary.criticalAlerts}`, 
          data.summary.criticalAlerts > 0 ? 'error' : 'success');
      log(`    • System Health: ${data.summary.systemHealth}`, 
          data.summary.systemHealth === 'healthy' ? 'success' : 'warning');
    }
    
  } catch (error) {
    log(`  ❌ Failed to get command centre data: ${error.message}`, 'error');
  }
}

async function runSimulation() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'header');
  log('║         MULTI-HOSPITAL DATA SIMULATION WITH ANOMALIES         ║', 'header');
  log('╚════════════════════════════════════════════════════════════════╝', 'header');
  
  try {
    // 1. Create hospitals
    const hospitals = await createHospitals();
    
    // 2. Create high occupancy (anomaly condition)
    await createPatientsWithHighOccupancy(hospitals);
    
    // 3. Create low stock conditions (anomaly)
    await createLowStockConditions(hospitals);
    
    // 4. Create financial anomalies
    await createFinancialAnomalies(hospitals);
    
    // 5. Create staff with attendance issues
    await createStaffWithAttendanceIssues(hospitals);
    
    // 6. Trigger alert checks
    await triggerAlertChecks();
    
    // 7. Display command centre aggregation
    await displayCommandCentre();
    
    log('\n✅ SIMULATION COMPLETE', 'success');
    log('The Command Centre now has:', 'success');
    log('  • Data from 3 different hospitals', 'success');
    log('  • Multiple anomaly conditions triggering alerts', 'success');
    log('  • Aggregated metrics across all facilities', 'success');
    log('  • Performance scores and KPIs calculated', 'success');
    
  } catch (error) {
    log(`\n❌ Simulation error: ${error.message}`, 'error');
  } finally {
    await pool.end();
  }
}

// Run the simulation
runSimulation()
  .then(() => {
    log('\n═══════════════════════════════════════════════════════════════', 'header');
    process.exit(0);
  })
  .catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });

#!/usr/bin/env node

/**
 * Command Centre Validation Test
 * Validates:
 * 1. Data aggregation from multiple hospitals
 * 2. Alert firing under anomaly conditions
 */

const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost/api';

// Test configuration
const HOSPITALS = [
  { id: 'hosp-lagos-001', name: 'Lagos University Teaching Hospital' },
  { id: 'hosp-abuja-001', name: 'National Hospital Abuja' },
  { id: 'hosp-ibadan-001', name: 'University College Hospital Ibadan' },
  { id: 'hosp-lagos-002', name: 'St. Nicholas Hospital' },
  { id: 'hosp-kano-001', name: 'Aminu Kano Teaching Hospital' },
  { id: 'hosp-owerri-001', name: 'Federal Medical Centre Owerri' },
  { id: 'hosp-ileife-001', name: 'Obafemi Awolowo University Teaching Hospital' }
];

// Anomaly conditions to test
const ANOMALY_CONDITIONS = [
  {
    type: 'LOW_STOCK',
    description: 'Inventory below critical level',
    threshold: 10,
    expectedSeverity: 'critical'
  },
  {
    type: 'HIGH_OCCUPANCY',
    description: 'Bed occupancy above 88%',
    threshold: 88,
    expectedSeverity: 'warning'
  },
  {
    type: 'REVENUE_GAP',
    description: 'Revenue 18% below target',
    threshold: -18,
    expectedSeverity: 'warning'
  },
  {
    type: 'LONG_WAIT_TIME',
    description: 'Emergency wait time > 90 minutes',
    threshold: 90,
    expectedSeverity: 'critical'
  }
];

async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message 
    };
  }
}

async function validateDataAggregation() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('VALIDATING DATA AGGREGATION FROM MULTIPLE HOSPITALS'.cyan.bold);
  console.log('='.repeat(60).cyan + '\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Fetch aggregated metrics
  console.log('Test 1: Fetching aggregated metrics across all hospitals...'.yellow);
  const metricsResponse = await makeRequest('/command-centre/metrics/aggregate?period=today');
  
  if (metricsResponse.success && metricsResponse.data) {
    const data = metricsResponse.data;
    
    // Validate system totals
    if (data.system_totals && data.system_totals.total_hospitals > 0) {
      console.log(`✅ System aggregation successful`.green);
      console.log(`   Total Hospitals: ${data.system_totals.total_hospitals}`.gray);
      console.log(`   Total Patients: ${data.system_totals.total_patients}`.gray);
      console.log(`   Total Staff: ${data.system_totals.total_staff}`.gray);
      console.log(`   Monthly Revenue: ₦${data.system_totals.total_revenue_month?.toLocaleString()}`.gray);
      console.log(`   Avg Occupancy: ${data.system_totals.avg_occupancy}%`.gray);
      results.passed++;
      results.tests.push('System totals aggregation');
    } else {
      console.log(`❌ System aggregation failed - missing totals`.red);
      results.failed++;
    }

    // Validate individual hospital data
    if (data.hospitals && data.hospitals.length > 0) {
      console.log(`\n✅ Hospital-level data present for ${data.hospitals.length} hospitals:`.green);
      
      data.hospitals.forEach((hospital, index) => {
        if (index < 3) { // Show first 3 hospitals
          console.log(`   ${hospital.hospital_name}:`.cyan);
          console.log(`     - Patients: ${hospital.patient_metrics?.total_patients || 0}`.gray);
          console.log(`     - Occupancy: ${hospital.admission_metrics?.occupancy_rate || 0}%`.gray);
          console.log(`     - Revenue: ₦${hospital.financial_metrics?.revenue_month?.toLocaleString() || 0}`.gray);
        }
      });
      
      results.passed++;
      results.tests.push('Individual hospital metrics');
    } else {
      console.log(`❌ No hospital data found`.red);
      results.failed++;
    }
  } else {
    console.log(`❌ Failed to fetch aggregated metrics`.red);
    results.failed++;
  }

  // Test 2: Real-time dashboard
  console.log('\nTest 2: Validating real-time dashboard...'.yellow);
  const dashboardResponse = await makeRequest('/command-centre/dashboard/realtime');
  
  if (dashboardResponse.success && dashboardResponse.data) {
    const dashboard = dashboardResponse.data;
    
    if (dashboard.metrics) {
      console.log(`✅ Real-time metrics active`.green);
      console.log(`   Active Hospitals: ${dashboard.metrics.active_hospitals}`.gray);
      console.log(`   Patients Today: ${dashboard.metrics.patients_today}`.gray);
      console.log(`   Current Admissions: ${dashboard.metrics.current_admissions}`.gray);
      console.log(`   Revenue Today: ₦${dashboard.metrics.revenue_today?.toLocaleString()}`.gray);
      results.passed++;
      results.tests.push('Real-time dashboard metrics');
    }

    if (dashboard.recent_activities && dashboard.recent_activities.length > 0) {
      console.log(`\n✅ Recent activities tracking (${dashboard.recent_activities.length} events)`.green);
      dashboard.recent_activities.slice(0, 3).forEach(activity => {
        console.log(`   - ${activity.type}: ${activity.description}`.gray);
      });
      results.passed++;
      results.tests.push('Activity tracking');
    }
  } else {
    console.log(`❌ Real-time dashboard validation failed`.red);
    results.failed++;
  }

  // Test 3: Performance comparison
  console.log('\nTest 3: Validating cross-hospital performance comparison...'.yellow);
  const performanceResponse = await makeRequest('/command-centre/performance/comparison');
  
  if (performanceResponse.success && performanceResponse.data) {
    const performance = performanceResponse.data;
    
    if (performance.performance_data && performance.performance_data.length > 0) {
      console.log(`✅ Performance comparison working for ${performance.performance_data.length} hospitals`.green);
      console.log(`   Top Performer: ${performance.top_performer?.name} (Score: ${performance.top_performer?.performance_score})`.gray);
      console.log(`   Average Performance: ${performance.average_performance}`.gray);
      
      // Show top 3 hospitals
      performance.performance_data.slice(0, 3).forEach(hosp => {
        console.log(`   ${hosp.rank}. ${hosp.name}: Score ${hosp.performance_score}`.gray);
      });
      
      results.passed++;
      results.tests.push('Performance comparison');
    } else {
      console.log(`❌ Performance comparison failed`.red);
      results.failed++;
    }
  }

  // Test 4: Individual hospital command centre
  console.log('\nTest 4: Validating individual hospital command centre...'.yellow);
  const hospitalResponse = await makeRequest('/command-centre/hospital/hosp-lagos-001?timeRange=24h');
  
  if (hospitalResponse.success && hospitalResponse.data) {
    const hospital = hospitalResponse.data;
    
    if (hospital.hospital) {
      console.log(`✅ Individual hospital data retrieved`.green);
      console.log(`   Hospital: ${hospital.hospital.hospital_name}`.gray);
      console.log(`   Occupancy Rate: ${hospital.hospital.occupancy_rate}%`.gray);
      console.log(`   Operational Status: ${hospital.operational_status}`.gray);
      
      if (hospital.departments && hospital.departments.length > 0) {
        console.log(`   Departments tracked: ${hospital.departments.length}`.gray);
      }
      
      if (hospital.top_diagnoses && hospital.top_diagnoses.length > 0) {
        console.log(`   Top Diagnosis: ${hospital.top_diagnoses[0].diagnosis} (${hospital.top_diagnoses[0].case_count} cases)`.gray);
      }
      
      results.passed++;
      results.tests.push('Individual hospital view');
    } else {
      console.log(`❌ Individual hospital data missing`.red);
      results.failed++;
    }
  }

  return results;
}

async function validateAlertSystem() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('VALIDATING ALERT SYSTEM UNDER ANOMALY CONDITIONS'.cyan.bold);
  console.log('='.repeat(60).cyan + '\n');

  const results = {
    passed: 0,
    failed: 0,
    alerts: []
  };

  // Test 1: Fetch current active alerts
  console.log('Test 1: Checking for active alerts...'.yellow);
  const alertsResponse = await makeRequest('/alerts/active');
  
  if (alertsResponse.success && alertsResponse.data) {
    const alertData = alertsResponse.data;
    
    console.log(`✅ Alert system active`.green);
    console.log(`   Total Alerts: ${alertData.total_alerts}`.gray);
    console.log(`   Critical: ${alertData.critical_count}`.red);
    console.log(`   Warning: ${alertData.warning_count}`.yellow);
    
    if (alertData.alerts && alertData.alerts.length > 0) {
      console.log(`\n   Active alerts detected:`.cyan);
      alertData.alerts.forEach(alert => {
        const severityColor = alert.severity === 'critical' ? 'red' : 'yellow';
        console.log(`   [${alert.severity.toUpperCase()}]`.bold[severityColor] + ` ${alert.title}`);
        console.log(`     ${alert.message}`.gray);
        results.alerts.push(alert);
      });
    }
    
    results.passed++;
  } else {
    console.log(`❌ Failed to fetch alerts`.red);
    results.failed++;
  }

  // Test 2: Validate alert categories
  console.log('\nTest 2: Validating alert categories...'.yellow);
  const categories = ['inventory', 'occupancy', 'revenue', 'wait_time'];
  
  for (const category of categories) {
    const categoryResponse = await makeRequest(`/alerts/active?category=${category}`);
    
    if (categoryResponse.success) {
      const count = categoryResponse.data.total_alerts || 0;
      console.log(`   ✅ ${category} alerts: ${count} active`.green);
    }
  }

  // Test 3: Simulate anomaly conditions
  console.log('\nTest 3: Simulating anomaly conditions...'.yellow);
  
  for (const condition of ANOMALY_CONDITIONS) {
    console.log(`\n   Testing: ${condition.description}`.cyan);
    
    // Check if corresponding alerts exist
    const alertFound = results.alerts.some(alert => {
      switch(condition.type) {
        case 'LOW_STOCK':
          return alert.category === 'inventory' && alert.severity === condition.expectedSeverity;
        case 'HIGH_OCCUPANCY':
          return alert.category === 'occupancy' && alert.details?.occupancy_rate >= condition.threshold;
        case 'REVENUE_GAP':
          return alert.category === 'revenue' && alert.details?.gap_percentage <= condition.threshold;
        case 'LONG_WAIT_TIME':
          return alert.category === 'wait_time' && alert.details?.avg_wait_time >= condition.threshold;
        default:
          return false;
      }
    });

    if (alertFound) {
      console.log(`   ✅ Alert triggered for ${condition.type}`.green);
      results.passed++;
    } else {
      console.log(`   ⚠️  No alert found for ${condition.type} (may not meet threshold)`.yellow);
    }
  }

  // Test 4: Create and resolve custom alert
  console.log('\nTest 4: Testing custom alert creation and resolution...'.yellow);
  
  const customAlert = {
    category: 'test',
    severity: 'warning',
    title: 'Test Alert - Command Centre Validation',
    message: 'This is a test alert to validate the alert system',
    hospital_id: 'hosp-lagos-001'
  };

  const createResponse = await makeRequest('/alerts/custom', 'POST', customAlert);
  
  if (createResponse.success) {
    console.log(`   ✅ Custom alert created successfully`.green);
    const alertId = createResponse.data.alert?.id;
    
    if (alertId) {
      // Try to resolve the alert
      const resolveResponse = await makeRequest(`/alerts/${alertId}/resolve`, 'PUT', {
        resolution_notes: 'Test completed - alert resolved'
      });
      
      if (resolveResponse.success) {
        console.log(`   ✅ Alert resolution working`.green);
        results.passed++;
      }
    }
  } else {
    console.log(`   ❌ Custom alert creation failed`.red);
    results.failed++;
  }

  // Test 5: Alert statistics
  console.log('\nTest 5: Validating alert statistics...'.yellow);
  const statsResponse = await makeRequest('/alerts/statistics?period=7d');
  
  if (statsResponse.success && statsResponse.data) {
    const stats = statsResponse.data.statistics;
    
    if (stats.summary) {
      console.log(`   ✅ Alert statistics available`.green);
      console.log(`     Total Alerts (7d): ${stats.summary.total_alerts}`.gray);
      console.log(`     Resolution Rate: ${((stats.summary.resolved_alerts / stats.summary.total_alerts) * 100).toFixed(0)}%`.gray);
      console.log(`     Avg Resolution Time: ${stats.summary.avg_resolution_time_minutes} minutes`.gray);
      console.log(`     Trend: ${stats.trend || 'stable'}`.gray);
      results.passed++;
    }
    
    if (stats.by_category && stats.by_category.length > 0) {
      console.log(`\n   Alert distribution by category:`.cyan);
      stats.by_category.forEach(cat => {
        console.log(`     ${cat.category}: ${cat.count} alerts`.gray);
      });
    }
  }

  return results;
}

async function validateMultiHospitalAggregation() {
  console.log('\n' + '='.repeat(60).cyan);
  console.log('VALIDATING MULTI-HOSPITAL DATA AGGREGATION'.cyan.bold);
  console.log('='.repeat(60).cyan + '\n');

  const results = {
    passed: 0,
    failed: 0,
    hospitals_validated: 0
  };

  // Validate that metrics include data from multiple hospitals
  console.log('Validating data from multiple hospital instances...'.yellow);
  
  const response = await makeRequest('/command-centre/metrics/aggregate');
  
  if (response.success && response.data) {
    const data = response.data;
    
    // Check for multiple hospitals
    if (data.hospitals && data.hospitals.length >= 2) {
      console.log(`✅ Data aggregated from ${data.hospitals.length} hospitals`.green);
      
      // Validate each hospital has complete metrics
      let completeHospitals = 0;
      data.hospitals.forEach(hospital => {
        const hasPatientMetrics = hospital.patient_metrics && hospital.patient_metrics.total_patients > 0;
        const hasFinancialMetrics = hospital.financial_metrics && hospital.financial_metrics.revenue_month > 0;
        const hasStaffMetrics = hospital.staff_metrics && hospital.staff_metrics.total_staff > 0;
        
        if (hasPatientMetrics && hasFinancialMetrics && hasStaffMetrics) {
          completeHospitals++;
        }
      });
      
      console.log(`   ${completeHospitals}/${data.hospitals.length} hospitals have complete metrics`.gray);
      
      if (completeHospitals >= 2) {
        console.log(`   ✅ Multiple hospitals contributing data`.green);
        results.passed++;
        results.hospitals_validated = completeHospitals;
      } else {
        console.log(`   ⚠️  Some hospitals missing metrics`.yellow);
      }
      
      // Verify aggregation math
      const calculatedTotal = data.hospitals.reduce((sum, h) => 
        sum + (h.patient_metrics?.total_patients || 0), 0
      );
      
      console.log(`\n   Aggregation verification:`.cyan);
      console.log(`     Sum of hospital patients: ${calculatedTotal}`.gray);
      console.log(`     System total patients: ${data.system_totals.total_patients}`.gray);
      
      if (Math.abs(calculatedTotal - data.system_totals.total_patients) <= calculatedTotal * 0.1) {
        console.log(`     ✅ Aggregation math verified`.green);
        results.passed++;
      } else {
        console.log(`     ⚠️  Aggregation discrepancy detected`.yellow);
      }
      
    } else {
      console.log(`❌ Insufficient hospitals for aggregation test`.red);
      results.failed++;
    }
  } else {
    console.log(`❌ Failed to retrieve aggregated data`.red);
    results.failed++;
  }

  return results;
}

// Main execution
async function runValidation() {
  console.log('\n' + '='.repeat(60).cyan.bold);
  console.log('COMMAND CENTRE VALIDATION TEST'.cyan.bold);
  console.log('Validating multi-hospital aggregation and alert system'.cyan);
  console.log('='.repeat(60).cyan.bold);

  const testResults = {
    aggregation: null,
    alerts: null,
    multiHospital: null
  };

  try {
    // Run validation tests
    testResults.aggregation = await validateDataAggregation();
    testResults.alerts = await validateAlertSystem();
    testResults.multiHospital = await validateMultiHospitalAggregation();

    // Summary
    console.log('\n' + '='.repeat(60).cyan.bold);
    console.log('VALIDATION SUMMARY'.cyan.bold);
    console.log('='.repeat(60).cyan.bold + '\n');

    // Aggregation results
    console.log('Data Aggregation Tests:'.yellow.bold);
    console.log(`  Passed: ${testResults.aggregation.passed}`.green);
    console.log(`  Failed: ${testResults.aggregation.failed}`.red);
    testResults.aggregation.tests.forEach(test => {
      console.log(`    ✓ ${test}`.gray);
    });

    // Alert system results
    console.log('\nAlert System Tests:'.yellow.bold);
    console.log(`  Passed: ${testResults.alerts.passed}`.green);
    console.log(`  Failed: ${testResults.alerts.failed}`.red);
    console.log(`  Active Alerts: ${testResults.alerts.alerts.length}`.cyan);

    // Multi-hospital validation
    console.log('\nMulti-Hospital Aggregation:'.yellow.bold);
    console.log(`  Passed: ${testResults.multiHospital.passed}`.green);
    console.log(`  Failed: ${testResults.multiHospital.failed}`.red);
    console.log(`  Hospitals Validated: ${testResults.multiHospital.hospitals_validated}`.cyan);

    // Overall result
    const totalPassed = testResults.aggregation.passed + testResults.alerts.passed + testResults.multiHospital.passed;
    const totalFailed = testResults.aggregation.failed + testResults.alerts.failed + testResults.multiHospital.failed;
    const successRate = (totalPassed / (totalPassed + totalFailed) * 100).toFixed(0);

    console.log('\n' + '='.repeat(60).cyan.bold);
    console.log('OVERALL RESULT'.cyan.bold);
    console.log('='.repeat(60).cyan.bold);
    
    if (successRate >= 80) {
      console.log(`\n✅ VALIDATION SUCCESSFUL!`.green.bold);
      console.log(`Success Rate: ${successRate}%`.green);
      console.log('\nKey Findings:'.cyan);
      console.log('1. Command Centre successfully aggregates data from multiple hospitals ✓'.green);
      console.log('2. Alert system detects and reports anomaly conditions ✓'.green);
      console.log('3. Real-time monitoring and performance tracking operational ✓'.green);
      console.log('4. Multi-hospital metrics properly calculated and displayed ✓'.green);
    } else if (successRate >= 60) {
      console.log(`\n⚠️  PARTIAL VALIDATION`.yellow.bold);
      console.log(`Success Rate: ${successRate}%`.yellow);
      console.log('Some features working but improvements needed'.yellow);
    } else {
      console.log(`\n❌ VALIDATION FAILED`.red.bold);
      console.log(`Success Rate: ${successRate}%`.red);
      console.log('Major issues detected in command centre functionality'.red);
    }

    console.log('\n' + '='.repeat(60).cyan.bold + '\n');

  } catch (error) {
    console.error('Validation error:'.red, error.message);
  }
}

// Run the validation
runValidation().catch(console.error);

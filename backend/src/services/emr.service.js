const pool = require('../config/database');

class EMRService {
  // Create new patient medical record
  async createPatientRecord(patientData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create patient record
      const patientQuery = `
        INSERT INTO patients (
          registration_number, first_name, last_name, date_of_birth,
          gender, blood_group, genotype, phone_number, email,
          address, city, state, next_of_kin_name, next_of_kin_phone,
          insurance_provider, insurance_number, nhis_number,
          allergies, chronic_conditions, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, NOW())
        RETURNING *
      `;

      const regNumber = `GP${new Date().getFullYear()}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`;
      
      const values = [
        regNumber,
        patientData.firstName,
        patientData.lastName,
        patientData.dateOfBirth,
        patientData.gender,
        patientData.bloodGroup,
        patientData.genotype,
        patientData.phoneNumber,
        patientData.email,
        patientData.address,
        patientData.city || 'Lagos',
        patientData.state || 'Lagos',
        patientData.nextOfKinName,
        patientData.nextOfKinPhone,
        patientData.insuranceProvider,
        patientData.insuranceNumber,
        patientData.nhisNumber,
        JSON.stringify(patientData.allergies || []),
        JSON.stringify(patientData.chronicConditions || [])
      ];

      const result = await client.query(patientQuery, values);
      const patient = result.rows[0];

      // Create initial medical history entry
      const historyQuery = `
        INSERT INTO medical_history (
          patient_id, created_by, summary, created_at
        ) VALUES ($1, $2, $3, NOW())
      `;

      await client.query(historyQuery, [
        patient.id,
        patientData.createdBy || 'SYSTEM',
        'Initial patient registration'
      ]);

      await client.query('COMMIT');

      return {
        success: true,
        patient,
        registrationNumber: regNumber
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get patient medical record
  async getPatientRecord(patientId) {
    try {
      const query = `
        SELECT 
          p.*,
          COUNT(DISTINCT e.id) as total_visits,
          COUNT(DISTINCT pr.id) as total_prescriptions,
          COUNT(DISTINCT lr.id) as total_lab_results,
          MAX(e.encounter_date) as last_visit_date
        FROM patients p
        LEFT JOIN encounters e ON p.id = e.patient_id
        LEFT JOIN prescriptions pr ON p.id = pr.patient_id
        LEFT JOIN lab_results lr ON p.id = lr.patient_id
        WHERE p.id = $1
        GROUP BY p.id
      `;

      const result = await pool.query(query, [patientId]);
      
      if (result.rows.length === 0) {
        throw new Error('Patient not found');
      }

      const patient = result.rows[0];

      // Get recent encounters
      const encountersQuery = `
        SELECT e.*, s.name as doctor_name, d.name as department_name
        FROM encounters e
        LEFT JOIN staff s ON e.doctor_id = s.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE e.patient_id = $1
        ORDER BY e.encounter_date DESC
        LIMIT 10
      `;

      const encounters = await pool.query(encountersQuery, [patientId]);

      // Get active prescriptions
      const prescriptionsQuery = `
        SELECT p.*, m.name as medication_name, m.dosage_form
        FROM prescriptions p
        JOIN medications m ON p.medication_id = m.id
        WHERE p.patient_id = $1 AND p.status = 'ACTIVE'
        ORDER BY p.prescribed_date DESC
      `;

      const prescriptions = await pool.query(prescriptionsQuery, [patientId]);

      // Get recent lab results
      const labResultsQuery = `
        SELECT lr.*, lt.name as test_name, lt.category
        FROM lab_results lr
        JOIN lab_tests lt ON lr.test_id = lt.id
        WHERE lr.patient_id = $1
        ORDER BY lr.test_date DESC
        LIMIT 10
      `;

      const labResults = await pool.query(labResultsQuery, [patientId]);

      return {
        success: true,
        patient: {
          ...patient,
          allergies: JSON.parse(patient.allergies || '[]'),
          chronic_conditions: JSON.parse(patient.chronic_conditions || '[]')
        },
        encounters: encounters.rows,
        activePrescriptions: prescriptions.rows,
        recentLabResults: labResults.rows
      };
    } catch (error) {
      throw error;
    }
  }

  // Create encounter (visit record)
  async createEncounter(encounterData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create encounter
      const encounterQuery = `
        INSERT INTO encounters (
          patient_id, doctor_id, department_id, encounter_type,
          encounter_date, chief_complaint, symptoms, vital_signs,
          diagnosis, treatment_plan, notes, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
        RETURNING *
      `;

      const vitalSigns = {
        bloodPressure: encounterData.bloodPressure,
        temperature: encounterData.temperature,
        pulse: encounterData.pulse,
        respiratoryRate: encounterData.respiratoryRate,
        weight: encounterData.weight,
        height: encounterData.height,
        bmi: encounterData.weight && encounterData.height ? 
          (encounterData.weight / Math.pow(encounterData.height / 100, 2)).toFixed(2) : null
      };

      const values = [
        encounterData.patientId,
        encounterData.doctorId,
        encounterData.departmentId,
        encounterData.encounterType || 'OUTPATIENT',
        encounterData.encounterDate || new Date(),
        encounterData.chiefComplaint,
        JSON.stringify(encounterData.symptoms || []),
        JSON.stringify(vitalSigns),
        encounterData.diagnosis,
        encounterData.treatmentPlan,
        encounterData.notes,
        encounterData.status || 'IN_PROGRESS'
      ];

      const result = await client.query(encounterQuery, values);
      const encounter = result.rows[0];

      // Update medical history
      const historyQuery = `
        INSERT INTO medical_history (
          patient_id, encounter_id, created_by, 
          complaint, diagnosis, treatment, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      `;

      await client.query(historyQuery, [
        encounterData.patientId,
        encounter.id,
        encounterData.doctorId,
        encounterData.chiefComplaint,
        encounterData.diagnosis,
        encounterData.treatmentPlan
      ]);

      await client.query('COMMIT');

      return {
        success: true,
        encounter
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Add prescription
  async addPrescription(prescriptionData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Add prescription
      const prescriptionQuery = `
        INSERT INTO prescriptions (
          patient_id, encounter_id, doctor_id, medication_id,
          dosage, frequency, duration, quantity, instructions,
          prescribed_date, start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const endDate = new Date(prescriptionData.startDate || new Date());
      endDate.setDate(endDate.getDate() + (prescriptionData.duration || 7));

      const values = [
        prescriptionData.patientId,
        prescriptionData.encounterId,
        prescriptionData.doctorId,
        prescriptionData.medicationId,
        prescriptionData.dosage,
        prescriptionData.frequency,
        prescriptionData.duration,
        prescriptionData.quantity,
        prescriptionData.instructions,
        new Date(),
        prescriptionData.startDate || new Date(),
        endDate,
        'ACTIVE'
      ];

      const result = await client.query(prescriptionQuery, values);
      const prescription = result.rows[0];

      // Update inventory if dispensed
      if (prescriptionData.dispensed) {
        const inventoryQuery = `
          UPDATE inventory_items 
          SET quantity_in_stock = quantity_in_stock - $1,
              last_updated = NOW()
          WHERE medication_id = $2 AND quantity_in_stock >= $1
        `;

        const inventoryResult = await client.query(inventoryQuery, [
          prescriptionData.quantity,
          prescriptionData.medicationId
        ]);

        if (inventoryResult.rowCount === 0) {
          throw new Error('Insufficient stock for medication');
        }

        // Record dispensing
        const dispensingQuery = `
          INSERT INTO medication_dispensing (
            prescription_id, dispensed_by, quantity_dispensed,
            dispensed_date, notes
          ) VALUES ($1, $2, $3, NOW(), $4)
        `;

        await client.query(dispensingQuery, [
          prescription.id,
          prescriptionData.dispensedBy,
          prescriptionData.quantity,
          prescriptionData.dispensingNotes
        ]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        prescription
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Order lab test
  async orderLabTest(labOrderData) {
    try {
      const query = `
        INSERT INTO lab_orders (
          patient_id, encounter_id, doctor_id, test_id,
          priority, clinical_info, order_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
        RETURNING *
      `;

      const values = [
        labOrderData.patientId,
        labOrderData.encounterId,
        labOrderData.doctorId,
        labOrderData.testId,
        labOrderData.priority || 'ROUTINE',
        labOrderData.clinicalInfo,
        'PENDING'
      ];

      const result = await pool.query(query, values);

      return {
        success: true,
        labOrder: result.rows[0]
      };
    } catch (error) {
      throw error;
    }
  }

  // Record lab results
  async recordLabResult(resultData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Record result
      const resultQuery = `
        INSERT INTO lab_results (
          patient_id, lab_order_id, test_id, result_value,
          reference_range, unit, interpretation, test_date,
          reported_by, verified_by, status, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const values = [
        resultData.patientId,
        resultData.labOrderId,
        resultData.testId,
        resultData.resultValue,
        resultData.referenceRange,
        resultData.unit,
        resultData.interpretation,
        resultData.testDate || new Date(),
        resultData.reportedBy,
        resultData.verifiedBy,
        resultData.status || 'FINAL',
        resultData.notes
      ];

      const result = await client.query(resultQuery, values);

      // Update lab order status
      if (resultData.labOrderId) {
        await client.query(
          'UPDATE lab_orders SET status = $1, completed_date = NOW() WHERE id = $2',
          ['COMPLETED', resultData.labOrderId]
        );
      }

      // Check for critical values
      if (resultData.interpretation === 'CRITICAL') {
        // Create alert for critical result
        const alertQuery = `
          INSERT INTO clinical_alerts (
            patient_id, alert_type, severity, message,
            created_at, status
          ) VALUES ($1, $2, $3, $4, NOW(), 'ACTIVE')
        `;

        await client.query(alertQuery, [
          resultData.patientId,
          'CRITICAL_LAB_RESULT',
          'HIGH',
          `Critical lab result: ${resultData.testName} - ${resultData.resultValue} ${resultData.unit}`
        ]);
      }

      await client.query('COMMIT');

      return {
        success: true,
        labResult: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get patient medical history
  async getMedicalHistory(patientId) {
    try {
      const query = `
        SELECT 
          mh.*,
          e.encounter_date,
          s.name as doctor_name
        FROM medical_history mh
        LEFT JOIN encounters e ON mh.encounter_id = e.id
        LEFT JOIN staff s ON mh.created_by = s.id::text
        WHERE mh.patient_id = $1
        ORDER BY mh.created_at DESC
      `;

      const result = await pool.query(query, [patientId]);

      return {
        success: true,
        history: result.rows
      };
    } catch (error) {
      throw error;
    }
  }

  // Search patients
  async searchPatients(searchCriteria) {
    try {
      let query = `
        SELECT 
          id, registration_number, first_name, last_name,
          date_of_birth, gender, phone_number, email,
          insurance_provider, nhis_number
        FROM patients
        WHERE 1=1
      `;

      const values = [];
      let paramCount = 0;

      if (searchCriteria.name) {
        paramCount++;
        query += ` AND (LOWER(first_name) LIKE $${paramCount} OR LOWER(last_name) LIKE $${paramCount})`;
        values.push(`%${searchCriteria.name.toLowerCase()}%`);
      }

      if (searchCriteria.registrationNumber) {
        paramCount++;
        query += ` AND registration_number = $${paramCount}`;
        values.push(searchCriteria.registrationNumber);
      }

      if (searchCriteria.phoneNumber) {
        paramCount++;
        query += ` AND phone_number LIKE $${paramCount}`;
        values.push(`%${searchCriteria.phoneNumber}%`);
      }

      if (searchCriteria.nhisNumber) {
        paramCount++;
        query += ` AND nhis_number = $${paramCount}`;
        values.push(searchCriteria.nhisNumber);
      }

      query += ' ORDER BY created_at DESC LIMIT 50';

      const result = await pool.query(query, values);

      return {
        success: true,
        patients: result.rows
      };
    } catch (error) {
      throw error;
    }
  }

  // Get department-specific EMR data
  async getDepartmentEMRStats(departmentId) {
    try {
      const query = `
        SELECT 
          COUNT(DISTINCT e.patient_id) as unique_patients,
          COUNT(e.id) as total_encounters,
          AVG(EXTRACT(EPOCH FROM (e.updated_at - e.created_at))/60) as avg_consultation_time,
          COUNT(CASE WHEN e.encounter_type = 'EMERGENCY' THEN 1 END) as emergency_cases,
          COUNT(CASE WHEN e.encounter_type = 'OUTPATIENT' THEN 1 END) as outpatient_cases,
          COUNT(CASE WHEN e.encounter_type = 'INPATIENT' THEN 1 END) as inpatient_cases
        FROM encounters e
        WHERE e.department_id = $1
        AND e.encounter_date >= CURRENT_DATE - INTERVAL '30 days'
      `;

      const result = await pool.query(query, [departmentId]);

      return {
        success: true,
        stats: result.rows[0]
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new EMRService();

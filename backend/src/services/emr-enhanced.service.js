/**
 * Enhanced Electronic Medical Records (EMR) Service
 * Comprehensive patient record management system
 */

const { pool } = require('../config/database');

class EMREnhancedService {
  /**
   * Register a new patient
   */
  async registerPatient(patientData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate patient ID
      const patientId = `PAT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

      // Insert into patients table
      const patientQuery = `
        INSERT INTO patients (
          patient_id, first_name, last_name, date_of_birth, gender,
          blood_group, genotype, phone, email, address, city, state,
          next_of_kin, next_of_kin_phone, allergies, chronic_conditions,
          registration_date, hospital_id, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
        RETURNING *
      `;

      const values = [
        patientId,
        patientData.firstName,
        patientData.lastName,
        patientData.dateOfBirth,
        patientData.gender,
        patientData.bloodGroup || null,
        patientData.genotype || null,
        patientData.phone,
        patientData.email,
        patientData.address,
        patientData.city,
        patientData.state || 'Lagos',
        patientData.nextOfKin,
        patientData.nextOfKinPhone,
        patientData.allergies || 'None',
        patientData.chronicConditions || 'None',
        new Date(),
        patientData.hospitalId
      ];

      const result = await client.query(patientQuery, values);
      
      // Create initial medical record
      const recordQuery = `
        INSERT INTO medical_records (
          patient_id, record_type, status, created_at
        ) VALUES ($1, 'initial_registration', 'active', NOW())
        RETURNING id
      `;
      
      await client.query(recordQuery, [result.rows[0].id]);
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a new medical record entry
   */
  async createMedicalRecord(recordData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert medical record
      const recordQuery = `
        INSERT INTO medical_records (
          patient_id, visit_date, visit_type, chief_complaint, 
          history_of_present_illness, past_medical_history,
          examination_findings, diagnosis, diagnosis_code,
          treatment_plan, medications_prescribed, procedures_performed,
          lab_results, imaging_results, vital_signs,
          doctor_id, doctor_name, department, 
          follow_up_date, notes, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'completed', NOW())
        RETURNING *
      `;

      const vitalSigns = {
        bloodPressure: recordData.bloodPressure,
        temperature: recordData.temperature,
        pulse: recordData.pulse,
        respiratoryRate: recordData.respiratoryRate,
        weight: recordData.weight,
        height: recordData.height,
        bmi: recordData.bmi,
        oxygenSaturation: recordData.oxygenSaturation
      };

      const values = [
        recordData.patientId,
        recordData.visitDate || new Date(),
        recordData.visitType || 'consultation',
        recordData.chiefComplaint,
        recordData.historyOfPresentIllness,
        recordData.pastMedicalHistory,
        recordData.examinationFindings,
        recordData.diagnosis,
        recordData.diagnosisCode,
        recordData.treatmentPlan,
        JSON.stringify(recordData.medicationsPrescribed || []),
        JSON.stringify(recordData.proceduresPerformed || []),
        JSON.stringify(recordData.labResults || {}),
        JSON.stringify(recordData.imagingResults || {}),
        JSON.stringify(vitalSigns),
        recordData.doctorId,
        recordData.doctorName,
        recordData.department,
        recordData.followUpDate,
        recordData.notes,
      ];

      const result = await client.query(recordQuery, values);

      // Update patient's last visit date
      await client.query(
        'UPDATE patients SET last_visit_date = $1 WHERE id = $2',
        [recordData.visitDate || new Date(), recordData.patientId]
      );

      // Create prescriptions if medications prescribed
      if (recordData.medicationsPrescribed && recordData.medicationsPrescribed.length > 0) {
        for (const medication of recordData.medicationsPrescribed) {
          await this.createPrescription(client, {
            recordId: result.rows[0].id,
            patientId: recordData.patientId,
            medication: medication
          });
        }
      }

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create prescription
   */
  async createPrescription(client, prescriptionData) {
    const query = `
      INSERT INTO prescriptions (
        record_id, patient_id, medication_name, dosage, 
        frequency, duration, route, quantity, 
        instructions, prescribed_date, prescribed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10)
      RETURNING *
    `;

    const values = [
      prescriptionData.recordId,
      prescriptionData.patientId,
      prescriptionData.medication.name,
      prescriptionData.medication.dosage,
      prescriptionData.medication.frequency,
      prescriptionData.medication.duration,
      prescriptionData.medication.route || 'oral',
      prescriptionData.medication.quantity,
      prescriptionData.medication.instructions,
      prescriptionData.medication.prescribedBy
    ];

    return await client.query(query, values);
  }

  /**
   * Get patient medical history
   */
  async getPatientHistory(patientId) {
    const query = `
      SELECT 
        mr.*,
        p.first_name, p.last_name, p.patient_id as patient_number,
        p.blood_group, p.genotype, p.allergies
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE mr.patient_id = $1
      ORDER BY mr.visit_date DESC
    `;

    const result = await pool.query(query, [patientId]);
    return result.rows;
  }

  /**
   * Search patients
   */
  async searchPatients(searchTerm, hospitalId) {
    const query = `
      SELECT * FROM patients 
      WHERE hospital_id = $1 
      AND (
        LOWER(first_name) LIKE $2 OR 
        LOWER(last_name) LIKE $2 OR 
        patient_id LIKE $2 OR 
        phone LIKE $2 OR
        email LIKE $2
      )
      LIMIT 20
    `;

    const searchPattern = `%${searchTerm.toLowerCase()}%`;
    const result = await pool.query(query, [hospitalId, searchPattern]);
    return result.rows;
  }

  /**
   * Get patient vitals history
   */
  async getVitalsHistory(patientId, limit = 10) {
    const query = `
      SELECT 
        visit_date,
        vital_signs,
        doctor_name
      FROM medical_records
      WHERE patient_id = $1
      AND vital_signs IS NOT NULL
      ORDER BY visit_date DESC
      LIMIT $2
    `;

    const result = await pool.query(query, [patientId, limit]);
    return result.rows;
  }

  /**
   * Create lab request
   */
  async createLabRequest(labData) {
    const query = `
      INSERT INTO lab_requests (
        patient_id, record_id, test_type, test_names,
        urgency, clinical_notes, requested_by,
        status, requested_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
      RETURNING *
    `;

    const values = [
      labData.patientId,
      labData.recordId,
      labData.testType,
      JSON.stringify(labData.testNames),
      labData.urgency || 'routine',
      labData.clinicalNotes,
      labData.requestedBy
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Update lab results
   */
  async updateLabResults(labRequestId, results) {
    const query = `
      UPDATE lab_requests
      SET 
        results = $1,
        status = 'completed',
        completed_date = NOW(),
        completed_by = $2
      WHERE id = $3
      RETURNING *
    `;

    const values = [
      JSON.stringify(results.data),
      results.completedBy,
      labRequestId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get patient allergies and alerts
   */
  async getPatientAlerts(patientId) {
    const query = `
      SELECT 
        allergies,
        chronic_conditions,
        blood_group,
        genotype,
        (SELECT array_agg(medication_name) 
         FROM prescriptions 
         WHERE patient_id = $1 
         AND prescribed_date > NOW() - INTERVAL '30 days') as current_medications
      FROM patients
      WHERE id = $1
    `;

    const result = await pool.query(query, [patientId]);
    return result.rows[0];
  }

  /**
   * Create referral
   */
  async createReferral(referralData) {
    const query = `
      INSERT INTO referrals (
        patient_id, record_id, referred_to,
        department, reason, urgency,
        clinical_summary, referred_by,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())
      RETURNING *
    `;

    const values = [
      referralData.patientId,
      referralData.recordId,
      referralData.referredTo,
      referralData.department,
      referralData.reason,
      referralData.urgency || 'routine',
      referralData.clinicalSummary,
      referralData.referredBy
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get department statistics
   */
  async getDepartmentStats(hospitalId, department) {
    const query = `
      SELECT 
        COUNT(DISTINCT patient_id) as total_patients,
        COUNT(*) as total_visits,
        DATE(visit_date) as date,
        AVG(CAST(vital_signs->>'temperature' AS FLOAT)) as avg_temperature
      FROM medical_records mr
      JOIN patients p ON mr.patient_id = p.id
      WHERE p.hospital_id = $1
      AND mr.department = $2
      AND mr.visit_date > NOW() - INTERVAL '30 days'
      GROUP BY DATE(visit_date)
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [hospitalId, department]);
    return result.rows;
  }
}

module.exports = new EMREnhancedService();

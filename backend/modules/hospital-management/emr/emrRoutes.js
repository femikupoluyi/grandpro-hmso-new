const express = require('express');
const router = express.Router();
const pool = require('../../../config/database');

// ============================================
// PATIENT MANAGEMENT
// ============================================

// Register new patient
router.post('/patients', async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      first_name, last_name, middle_name, date_of_birth, gender, blood_group, genotype,
      marital_status, phone_primary, phone_secondary, email, address_line1, address_line2,
      city, state, country, postal_code, emergency_contact_name, emergency_contact_phone,
      emergency_contact_relationship, insurance_provider, insurance_policy_number,
      nhis_number, hmo_provider, hmo_plan, allergies, chronic_conditions,
      current_medications, past_surgeries, family_medical_history, hospital_id
    } = req.body;

    // Generate patient number
    const patientNumber = `GP${Date.now().toString().slice(-10)}`;

    const query = `
      INSERT INTO patients (
        patient_number, first_name, last_name, middle_name, date_of_birth, gender,
        blood_group, genotype, marital_status, phone_primary, phone_secondary, email,
        address_line1, address_line2, city, state, country, postal_code,
        emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
        insurance_provider, insurance_policy_number, nhis_number, hmo_provider, hmo_plan,
        allergies, chronic_conditions, current_medications, past_surgeries,
        family_medical_history, hospital_id, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33
      ) RETURNING *`;

    const values = [
      patientNumber, first_name, last_name, middle_name, date_of_birth, gender,
      blood_group, genotype, marital_status, phone_primary, phone_secondary, email,
      address_line1, address_line2, city, state, country || 'Nigeria', postal_code,
      emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
      insurance_provider, insurance_policy_number, nhis_number, hmo_provider, hmo_plan,
      allergies, chronic_conditions, current_medications, past_surgeries,
      family_medical_history, hospital_id, req.user?.id
    ];

    const result = await client.query(query, values);
    
    // Create billing account for the patient
    await client.query(`
      INSERT INTO billing_accounts (patient_id, account_number, account_type, primary_payer)
      VALUES ($1, $2, $3, $4)`,
      [result.rows[0].id, `ACC${patientNumber}`, insurance_provider ? 'INSURANCE' : 'CASH', insurance_provider || 'SELF']
    );

    res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register patient',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get patient by ID or patient number
router.get('/patients/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Check if identifier is UUID or patient number
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    
    const query = `
      SELECT p.*, 
        ba.account_number, ba.account_type, ba.current_balance,
        COUNT(DISTINCT e.id) as total_visits,
        MAX(e.encounter_date) as last_visit_date
      FROM patients p
      LEFT JOIN billing_accounts ba ON ba.patient_id = p.id
      LEFT JOIN encounters e ON e.patient_id = p.id
      WHERE ${isUUID ? 'p.id' : 'p.patient_number'} = $1
      GROUP BY p.id, ba.account_number, ba.account_type, ba.current_balance`;

    const result = await pool.query(query, [identifier]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient',
      error: error.message
    });
  }
});

// Search patients
router.get('/patients', async (req, res) => {
  try {
    const { search, hospital_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.id, p.patient_number, p.first_name, p.last_name, p.date_of_birth,
        p.gender, p.phone_primary, p.email, p.city, p.state,
        MAX(e.encounter_date) as last_visit
      FROM patients p
      LEFT JOIN encounters e ON e.patient_id = p.id
      WHERE p.is_active = true`;

    const values = [];
    let valueIndex = 1;

    if (hospital_id) {
      query += ` AND p.hospital_id = $${valueIndex}`;
      values.push(hospital_id);
      valueIndex++;
    }

    if (search) {
      query += ` AND (
        p.first_name ILIKE $${valueIndex} OR 
        p.last_name ILIKE $${valueIndex} OR 
        p.patient_number ILIKE $${valueIndex} OR
        p.phone_primary ILIKE $${valueIndex}
      )`;
      values.push(`%${search}%`);
      valueIndex++;
    }

    query += ` GROUP BY p.id ORDER BY p.created_at DESC LIMIT $${valueIndex} OFFSET $${valueIndex + 1}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM patients p WHERE p.is_active = true`;
    const countValues = [];
    let countIndex = 1;

    if (hospital_id) {
      countQuery += ` AND p.hospital_id = $${countIndex}`;
      countValues.push(hospital_id);
      countIndex++;
    }

    if (search) {
      countQuery += ` AND (
        p.first_name ILIKE $${countIndex} OR 
        p.last_name ILIKE $${countIndex} OR 
        p.patient_number ILIKE $${countIndex} OR
        p.phone_primary ILIKE $${countIndex}
      )`;
      countValues.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countValues);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search patients',
      error: error.message
    });
  }
});

// Update patient information
router.put('/patients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    delete updateFields.id;
    delete updateFields.patient_number;
    delete updateFields.created_at;

    const setClause = Object.keys(updateFields)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!setClause) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    const query = `
      UPDATE patients 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP, updated_by = $${Object.keys(updateFields).length + 2}
      WHERE id = $1
      RETURNING *`;

    const values = [id, ...Object.values(updateFields), req.user?.id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient',
      error: error.message
    });
  }
});

// ============================================
// ENCOUNTER MANAGEMENT
// ============================================

// Create new encounter
router.post('/encounters', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      patient_id, encounter_type, department, assigned_doctor_id, assigned_nurse_id,
      blood_pressure_systolic, blood_pressure_diastolic, pulse_rate, temperature_celsius,
      respiratory_rate, weight_kg, height_cm, oxygen_saturation, chief_complaint,
      presenting_symptoms, hospital_id
    } = req.body;

    // Generate encounter number
    const encounterNumber = `ENC${Date.now().toString().slice(-10)}`;

    // Calculate BMI if height and weight are provided
    let bmi = null;
    if (weight_kg && height_cm) {
      bmi = (weight_kg / Math.pow(height_cm / 100, 2)).toFixed(1);
    }

    const query = `
      INSERT INTO encounters (
        encounter_number, patient_id, encounter_type, encounter_date, department,
        assigned_doctor_id, assigned_nurse_id, blood_pressure_systolic,
        blood_pressure_diastolic, pulse_rate, temperature_celsius, respiratory_rate,
        weight_kg, height_cm, bmi, oxygen_saturation, chief_complaint,
        presenting_symptoms, hospital_id
      ) VALUES (
        $1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18
      ) RETURNING *`;

    const values = [
      encounterNumber, patient_id, encounter_type, department, assigned_doctor_id,
      assigned_nurse_id, blood_pressure_systolic, blood_pressure_diastolic, pulse_rate,
      temperature_celsius, respiratory_rate, weight_kg, height_cm, bmi, oxygen_saturation,
      chief_complaint, presenting_symptoms, hospital_id
    ];

    const result = await client.query(query, values);

    // Create initial clinical note
    if (chief_complaint) {
      await client.query(`
        INSERT INTO clinical_notes (
          encounter_id, patient_id, note_type, note_content, author_id, author_name, author_role
        ) VALUES ($1, $2, 'INITIAL', $3, $4, $5, $6)`,
        [result.rows[0].id, patient_id, chief_complaint, req.user?.id, req.user?.name, 'NURSE']
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Encounter created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create encounter',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get encounter details
router.get('/encounters/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT e.*, 
        p.first_name, p.last_name, p.patient_number, p.date_of_birth, p.gender,
        p.blood_group, p.genotype, p.allergies, p.chronic_conditions, p.current_medications,
        sd.first_name as doctor_first_name, sd.last_name as doctor_last_name,
        sn.first_name as nurse_first_name, sn.last_name as nurse_last_name
      FROM encounters e
      JOIN patients p ON p.id = e.patient_id
      LEFT JOIN staff sd ON sd.id = e.assigned_doctor_id
      LEFT JOIN staff sn ON sn.id = e.assigned_nurse_id
      WHERE e.id = $1`;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Encounter not found'
      });
    }

    // Get clinical notes
    const notesResult = await pool.query(
      `SELECT * FROM clinical_notes WHERE encounter_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        clinical_notes: notesResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch encounter',
      error: error.message
    });
  }
});

// Get patient encounters
router.get('/patients/:patient_id/encounters', async (req, res) => {
  try {
    const { patient_id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const query = `
      SELECT e.*, 
        sd.first_name as doctor_first_name, sd.last_name as doctor_last_name,
        sn.first_name as nurse_first_name, sn.last_name as nurse_last_name
      FROM encounters e
      LEFT JOIN staff sd ON sd.id = e.assigned_doctor_id
      LEFT JOIN staff sn ON sn.id = e.assigned_nurse_id
      WHERE e.patient_id = $1
      ORDER BY e.encounter_date DESC
      LIMIT $2 OFFSET $3`;

    const result = await pool.query(query, [patient_id, limit, offset]);

    // Get total count
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM encounters WHERE patient_id = $1',
      [patient_id]
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching patient encounters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient encounters',
      error: error.message
    });
  }
});

// Update encounter
router.put('/encounters/:id', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const {
      provisional_diagnosis, final_diagnosis, treatment_plan, prescriptions,
      lab_orders, imaging_orders, procedures_performed, encounter_status,
      discharge_summary, follow_up_required, follow_up_date, referral_to
    } = req.body;

    const query = `
      UPDATE encounters 
      SET provisional_diagnosis = $2, final_diagnosis = $3, treatment_plan = $4,
        prescriptions = $5, lab_orders = $6, imaging_orders = $7,
        procedures_performed = $8, encounter_status = $9, discharge_summary = $10,
        follow_up_required = $11, follow_up_date = $12, referral_to = $13,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *`;

    const values = [
      id, provisional_diagnosis, final_diagnosis, treatment_plan, prescriptions,
      lab_orders, imaging_orders, procedures_performed, encounter_status,
      discharge_summary, follow_up_required, follow_up_date, referral_to
    ];

    const result = await client.query(query, values);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Encounter not found'
      });
    }

    // Add clinical note for the update
    if (treatment_plan || final_diagnosis) {
      const noteContent = `Diagnosis: ${final_diagnosis?.join(', ') || 'Pending'}\nTreatment Plan: ${treatment_plan || 'To be determined'}`;
      await client.query(`
        INSERT INTO clinical_notes (
          encounter_id, patient_id, note_type, note_content, author_id, author_name, author_role
        ) VALUES ($1, $2, 'PROGRESS', $3, $4, $5, $6)`,
        [id, result.rows[0].patient_id, noteContent, req.user?.id, req.user?.name, 'DOCTOR']
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Encounter updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating encounter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update encounter',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Add clinical note
router.post('/encounters/:encounter_id/notes', async (req, res) => {
  try {
    const { encounter_id } = req.params;
    const { patient_id, note_type, note_content, is_confidential } = req.body;

    const query = `
      INSERT INTO clinical_notes (
        encounter_id, patient_id, note_type, note_content, author_id,
        author_name, author_role, is_confidential
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`;

    const values = [
      encounter_id, patient_id, note_type, note_content,
      req.user?.id, req.user?.name, req.user?.role, is_confidential || false
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Clinical note added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding clinical note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add clinical note',
      error: error.message
    });
  }
});

// Get today's encounters
router.get('/encounters', async (req, res) => {
  try {
    const { hospital_id, date, department, status } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT e.*, 
        p.first_name, p.last_name, p.patient_number, p.date_of_birth,
        sd.first_name as doctor_first_name, sd.last_name as doctor_last_name
      FROM encounters e
      JOIN patients p ON p.id = e.patient_id
      LEFT JOIN staff sd ON sd.id = e.assigned_doctor_id
      WHERE DATE(e.encounter_date) = $1`;

    const values = [targetDate];
    let valueIndex = 2;

    if (hospital_id) {
      query += ` AND e.hospital_id = $${valueIndex}`;
      values.push(hospital_id);
      valueIndex++;
    }

    if (department) {
      query += ` AND e.department = $${valueIndex}`;
      values.push(department);
      valueIndex++;
    }

    if (status) {
      query += ` AND e.encounter_status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    query += ` ORDER BY e.encounter_date DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows,
      summary: {
        total: result.rows.length,
        in_progress: result.rows.filter(e => e.encounter_status === 'IN_PROGRESS').length,
        completed: result.rows.filter(e => e.encounter_status === 'COMPLETED').length
      }
    });
  } catch (error) {
    console.error('Error fetching encounters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch encounters',
      error: error.message
    });
  }
});

module.exports = router;

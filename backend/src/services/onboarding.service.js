// Digital Sourcing & Partner Onboarding Service
const { pool } = require('../config/database');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class OnboardingService {
  // Submit hospital application
  async submitApplication(applicationData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Generate application ID
      const applicationId = `APP-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      // Insert application
      const applicationQuery = `
        INSERT INTO hospital_applications (
          application_id, hospital_name, registration_number,
          address, city, state, phone_number, email,
          owner_first_name, owner_last_name, owner_email, owner_phone,
          bed_capacity, staff_count, specialties,
          years_in_operation, annual_revenue, status,
          submitted_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *
      `;
      
      const values = [
        applicationId,
        applicationData.hospital_name,
        applicationData.registration_number,
        applicationData.address,
        applicationData.city,
        applicationData.state,
        applicationData.phone_number,
        applicationData.email,
        applicationData.owner_first_name,
        applicationData.owner_last_name,
        applicationData.owner_email,
        applicationData.owner_phone,
        applicationData.bed_capacity,
        applicationData.staff_count,
        JSON.stringify(applicationData.specialties || []),
        applicationData.years_in_operation,
        applicationData.annual_revenue,
        'submitted',
        new Date()
      ];
      
      const result = await client.query(applicationQuery, values);
      
      // Create onboarding checklist
      const checklistItems = [
        'Submit Application',
        'Upload CAC Documents',
        'Upload Medical License',
        'Upload Tax Clearance',
        'Upload Financial Statements',
        'Background Verification',
        'Site Inspection',
        'Evaluation Scoring',
        'Contract Review',
        'Contract Signing',
        'System Setup',
        'Training Completion'
      ];
      
      for (const item of checklistItems) {
        await client.query(
          `INSERT INTO onboarding_checklist (application_id, item_name, status, created_at)
           VALUES ($1, $2, $3, $4)`,
          [applicationId, item, item === 'Submit Application' ? 'completed' : 'pending', new Date()]
        );
      }
      
      // Create onboarding status entry
      await client.query(
        `INSERT INTO onboarding_status (application_id, current_stage, overall_progress, created_at)
         VALUES ($1, $2, $3, $4)`,
        [applicationId, 'application_submitted', 8, new Date()]
      );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        application: result.rows[0],
        message: 'Application submitted successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Upload documents
  async uploadDocument(applicationId, documentType, file) {
    const client = await pool.connect();
    
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(__dirname, '../../uploads', applicationId);
      await fs.mkdir(uploadsDir, { recursive: true });
      
      // Generate unique filename
      const filename = `${documentType}_${Date.now()}_${file.originalname}`;
      const filepath = path.join(uploadsDir, filename);
      
      // Save file
      await fs.writeFile(filepath, file.buffer);
      
      // Save document record to database
      const query = `
        INSERT INTO documents (
          application_id, document_type, filename,
          file_path, file_size, mime_type,
          uploaded_at, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        applicationId,
        documentType,
        filename,
        filepath,
        file.size,
        file.mimetype,
        new Date(),
        'uploaded'
      ];
      
      const result = await client.query(query, values);
      
      // Update checklist item
      let checklistItem = '';
      switch(documentType) {
        case 'cac_certificate':
          checklistItem = 'Upload CAC Documents';
          break;
        case 'medical_license':
          checklistItem = 'Upload Medical License';
          break;
        case 'tax_clearance':
          checklistItem = 'Upload Tax Clearance';
          break;
        case 'financial_statements':
          checklistItem = 'Upload Financial Statements';
          break;
      }
      
      if (checklistItem) {
        await client.query(
          `UPDATE onboarding_checklist 
           SET status = 'completed', completed_at = $1
           WHERE application_id = $2 AND item_name = $3`,
          [new Date(), applicationId, checklistItem]
        );
      }
      
      // Update overall progress
      await this.updateOnboardingProgress(applicationId, client);
      
      return {
        success: true,
        document: result.rows[0],
        message: `${documentType} uploaded successfully`
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Automated evaluation scoring
  async evaluateApplication(applicationId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get application details
      const appResult = await client.query(
        'SELECT * FROM hospital_applications WHERE application_id = $1',
        [applicationId]
      );
      
      if (!appResult.rows.length) {
        throw new Error('Application not found');
      }
      
      const application = appResult.rows[0];
      const scores = {};
      let totalScore = 0;
      
      // Evaluation criteria with Nigerian context
      const criteria = [
        {
          name: 'Infrastructure',
          weight: 25,
          evaluate: (app) => {
            let score = 0;
            if (app.bed_capacity >= 100) score += 40;
            else if (app.bed_capacity >= 50) score += 30;
            else if (app.bed_capacity >= 20) score += 20;
            else score += 10;
            
            if (app.staff_count >= 100) score += 30;
            else if (app.staff_count >= 50) score += 20;
            else if (app.staff_count >= 20) score += 15;
            else score += 10;
            
            // Bonus for specialized departments
            const specialties = JSON.parse(app.specialties || '[]');
            if (specialties.length >= 5) score += 30;
            else if (specialties.length >= 3) score += 20;
            else score += 10;
            
            return Math.min(100, score);
          }
        },
        {
          name: 'Financial_Stability',
          weight: 20,
          evaluate: (app) => {
            let score = 0;
            const revenue = app.annual_revenue || 0;
            
            // Revenue in NGN (millions)
            if (revenue >= 500000000) score += 50; // 500M+ NGN
            else if (revenue >= 200000000) score += 40; // 200M+ NGN
            else if (revenue >= 100000000) score += 30; // 100M+ NGN
            else if (revenue >= 50000000) score += 20; // 50M+ NGN
            else score += 10;
            
            // Years in operation
            if (app.years_in_operation >= 10) score += 50;
            else if (app.years_in_operation >= 5) score += 35;
            else if (app.years_in_operation >= 2) score += 20;
            else score += 10;
            
            return Math.min(100, score);
          }
        },
        {
          name: 'Compliance',
          weight: 25,
          evaluate: async (app) => {
            let score = 0;
            
            // Check uploaded documents
            const docsResult = await client.query(
              'SELECT document_type FROM documents WHERE application_id = $1',
              [app.application_id]
            );
            
            const uploadedDocs = docsResult.rows.map(d => d.document_type);
            
            if (uploadedDocs.includes('cac_certificate')) score += 25;
            if (uploadedDocs.includes('medical_license')) score += 25;
            if (uploadedDocs.includes('tax_clearance')) score += 25;
            if (uploadedDocs.includes('financial_statements')) score += 25;
            
            return score;
          }
        },
        {
          name: 'Geographic_Coverage',
          weight: 15,
          evaluate: (app) => {
            let score = 0;
            
            // Priority states for expansion
            const priorityStates = ['Lagos', 'FCT', 'Rivers', 'Kano', 'Oyo', 'Kaduna'];
            const secondaryStates = ['Anambra', 'Delta', 'Edo', 'Enugu', 'Ogun', 'Cross River'];
            
            if (priorityStates.includes(app.state)) score = 100;
            else if (secondaryStates.includes(app.state)) score = 75;
            else score = 50;
            
            return score;
          }
        },
        {
          name: 'Technology_Readiness',
          weight: 15,
          evaluate: (app) => {
            // Mock evaluation - in production would check IT infrastructure
            return 70; // Default score
          }
        }
      ];
      
      // Calculate scores
      for (const criterion of criteria) {
        const score = await criterion.evaluate(application);
        scores[criterion.name] = {
          score,
          weight: criterion.weight,
          weighted_score: (score * criterion.weight) / 100
        };
        totalScore += (score * criterion.weight) / 100;
      }
      
      // Save evaluation scores
      for (const [criterionName, scoreData] of Object.entries(scores)) {
        await client.query(
          `INSERT INTO evaluation_scores (
            application_id, criterion_name, score,
            weight, weighted_score, evaluated_at
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            applicationId,
            criterionName,
            scoreData.score,
            scoreData.weight,
            scoreData.weighted_score,
            new Date()
          ]
        );
      }
      
      // Update application with total score and status
      const status = totalScore >= 70 ? 'approved' : totalScore >= 50 ? 'under_review' : 'rejected';
      
      await client.query(
        `UPDATE hospital_applications 
         SET evaluation_score = $1, status = $2, evaluated_at = $3
         WHERE application_id = $4`,
        [totalScore.toFixed(2), status, new Date(), applicationId]
      );
      
      // Update checklist
      await client.query(
        `UPDATE onboarding_checklist 
         SET status = 'completed', completed_at = $1
         WHERE application_id = $2 AND item_name = 'Evaluation Scoring'`,
        [new Date(), applicationId]
      );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        totalScore: totalScore.toFixed(2),
        status,
        scores,
        recommendation: totalScore >= 70 
          ? 'Recommended for onboarding'
          : totalScore >= 50 
          ? 'Requires additional review'
          : 'Not recommended at this time'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Generate contract
  async generateContract(applicationId) {
    const client = await pool.connect();
    
    try {
      // Get application details
      const appResult = await client.query(
        'SELECT * FROM hospital_applications WHERE application_id = $1',
        [applicationId]
      );
      
      if (!appResult.rows.length) {
        throw new Error('Application not found');
      }
      
      const application = appResult.rows[0];
      
      // Get contract template
      const templateResult = await client.query(
        'SELECT * FROM contract_templates WHERE template_type = $1 AND is_active = true',
        ['hospital_onboarding']
      );
      
      let template;
      if (templateResult.rows.length) {
        template = templateResult.rows[0];
      } else {
        // Create default template if none exists
        template = await this.createDefaultContractTemplate(client);
      }
      
      // Generate contract
      const contractId = `CONTRACT-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
      
      // Calculate contract terms based on evaluation
      const evaluationScore = parseFloat(application.evaluation_score || 0);
      const contractValue = this.calculateContractValue(application);
      const commissionRate = evaluationScore >= 80 ? 15 : evaluationScore >= 70 ? 18 : 20;
      
      const contractQuery = `
        INSERT INTO contracts (
          contract_id, application_id, hospital_id,
          contract_type, start_date, end_date,
          value, commission_rate, payment_terms,
          status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 2); // 2-year contract
      
      const values = [
        contractId,
        applicationId,
        null, // Hospital ID will be set after full onboarding
        'management',
        startDate,
        endDate,
        contractValue,
        commissionRate,
        'Monthly',
        'draft',
        new Date()
      ];
      
      const result = await client.query(contractQuery, values);
      
      // Update checklist
      await client.query(
        `UPDATE onboarding_checklist 
         SET status = 'in_progress', completed_at = $1
         WHERE application_id = $2 AND item_name = 'Contract Review'`,
        [new Date(), applicationId]
      );
      
      return {
        success: true,
        contract: result.rows[0],
        message: 'Contract generated successfully'
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Digital signature integration
  async signContract(contractId, signatureData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Save signature
      const signatureQuery = `
        INSERT INTO digital_signatures (
          contract_id, signer_name, signer_email,
          signature_data, signature_hash, ip_address,
          signed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const signatureHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(signatureData))
        .digest('hex');
      
      const values = [
        contractId,
        signatureData.signer_name,
        signatureData.signer_email,
        signatureData.signature,
        signatureHash,
        signatureData.ip_address,
        new Date()
      ];
      
      const signatureResult = await client.query(signatureQuery, values);
      
      // Update contract status
      await client.query(
        'UPDATE contracts SET status = $1, signed_at = $2 WHERE contract_id = $3',
        ['signed', new Date(), contractId]
      );
      
      // Get application ID from contract
      const contractResult = await client.query(
        'SELECT application_id FROM contracts WHERE contract_id = $1',
        [contractId]
      );
      
      if (contractResult.rows.length) {
        const applicationId = contractResult.rows[0].application_id;
        
        // Update checklist
        await client.query(
          `UPDATE onboarding_checklist 
           SET status = 'completed', completed_at = $1
           WHERE application_id = $2 AND item_name IN ('Contract Review', 'Contract Signing')`,
          [new Date(), applicationId]
        );
        
        // Update application status
        await client.query(
          'UPDATE hospital_applications SET status = $1 WHERE application_id = $2',
          ['contract_signed', applicationId]
        );
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        signature: signatureResult.rows[0],
        message: 'Contract signed successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Get onboarding dashboard data
  async getOnboardingDashboard(filters = {}) {
    const client = await pool.connect();
    
    try {
      // Get applications with status counts
      const statusQuery = `
        SELECT 
          status,
          COUNT(*) as count
        FROM hospital_applications
        GROUP BY status
      `;
      
      const statusResult = await client.query(statusQuery);
      
      // Get recent applications
      const recentQuery = `
        SELECT 
          ha.*,
          os.current_stage,
          os.overall_progress
        FROM hospital_applications ha
        LEFT JOIN onboarding_status os ON ha.application_id = os.application_id
        ORDER BY ha.submitted_at DESC
        LIMIT 10
      `;
      
      const recentResult = await client.query(recentQuery);
      
      // Get evaluation metrics
      const metricsQuery = `
        SELECT 
          AVG(CAST(evaluation_score AS FLOAT)) as avg_score,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          COUNT(CASE WHEN status = 'under_review' THEN 1 END) as review_count
        FROM hospital_applications
        WHERE evaluation_score IS NOT NULL
      `;
      
      const metricsResult = await client.query(metricsQuery);
      
      // Get document statistics
      const docsQuery = `
        SELECT 
          document_type,
          COUNT(*) as count
        FROM documents
        GROUP BY document_type
      `;
      
      const docsResult = await client.query(docsQuery);
      
      return {
        statusCounts: statusResult.rows.reduce((acc, row) => {
          acc[row.status] = parseInt(row.count);
          return acc;
        }, {}),
        recentApplications: recentResult.rows,
        evaluationMetrics: metricsResult.rows[0],
        documentStats: docsResult.rows,
        summary: {
          totalApplications: recentResult.rows.length,
          averageProgress: recentResult.rows.reduce((sum, app) => 
            sum + (app.overall_progress || 0), 0) / Math.max(recentResult.rows.length, 1),
          pendingReviews: statusResult.rows
            .filter(r => r.status === 'under_review')
            .reduce((sum, r) => sum + parseInt(r.count), 0)
        }
      };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }
  
  // Helper: Update onboarding progress
  async updateOnboardingProgress(applicationId, client) {
    const checklistResult = await client.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'completed\' THEN 1 END) as completed FROM onboarding_checklist WHERE application_id = $1',
      [applicationId]
    );
    
    const progress = (checklistResult.rows[0].completed / checklistResult.rows[0].total) * 100;
    
    await client.query(
      'UPDATE onboarding_status SET overall_progress = $1 WHERE application_id = $2',
      [progress, applicationId]
    );
    
    return progress;
  }
  
  // Helper: Calculate contract value
  calculateContractValue(application) {
    const baseValue = 10000000; // 10M NGN base
    let multiplier = 1;
    
    if (application.bed_capacity >= 100) multiplier += 0.5;
    if (application.bed_capacity >= 200) multiplier += 0.5;
    if (application.staff_count >= 100) multiplier += 0.3;
    if (application.annual_revenue >= 500000000) multiplier += 0.5;
    
    return baseValue * multiplier;
  }
  
  // Helper: Create default contract template
  async createDefaultContractTemplate(client) {
    const template = {
      template_type: 'hospital_onboarding',
      template_name: 'Standard Hospital Management Agreement',
      template_content: 'This Hospital Management Agreement is entered into...',
      is_active: true,
      created_at: new Date()
    };
    
    const result = await client.query(
      `INSERT INTO contract_templates (template_type, template_name, template_content, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      Object.values(template)
    );
    
    return result.rows[0];
  }
}

module.exports = new OnboardingService();

const { sql, pool } = require('../config/database');
const crypto = require('crypto');

class OnboardingService {
  /**
   * Calculate automatic evaluation scores based on application data
   */
  async calculateAutomaticScores(applicationId, applicationData) {
    try {
      // Get automatic evaluation criteria
      const autoCriteria = await sql`
        SELECT * FROM evaluation_criteria 
        WHERE evaluation_type = 'auto'
      `;

      const scores = [];
      
      for (const criterion of autoCriteria) {
        let score = 0;
        
        switch (criterion.criterion_name) {
          case 'Bed Capacity':
            // Score based on bed capacity (0-100 beds = 0-10 score)
            score = Math.min(10, (applicationData.bed_capacity || 0) / 10);
            break;
            
          case 'Doctor-Patient Ratio':
            // Score based on staff count
            const doctorCount = Math.floor((applicationData.staff_count || 0) * 0.2); // Assume 20% are doctors
            score = Math.min(10, doctorCount / 2); // 1 doctor per 2 score points
            break;
            
          case 'Nursing Staff':
            // Score based on staff count
            const nurseCount = Math.floor((applicationData.staff_count || 0) * 0.4); // Assume 40% are nurses
            score = Math.min(10, nurseCount / 3); // 3 nurses per score point
            break;
            
          case 'EMR System':
            // Check if they mentioned EMR in their application
            score = applicationData.has_emr ? 10 : 0;
            break;
            
          default:
            score = 5; // Default middle score for auto criteria
        }
        
        const weightedScore = score * criterion.weight;
        scores.push({
          application_id: applicationId,
          criterion_id: criterion.id,
          score: score,
          weighted_score: weightedScore
        });
      }
      
      return scores;
    } catch (error) {
      console.error('Error calculating automatic scores:', error);
      throw error;
    }
  }

  /**
   * Calculate overall evaluation score
   */
  async calculateOverallScore(applicationId) {
    try {
      const result = await sql`
        SELECT 
          SUM(es.weighted_score) as total_weighted_score,
          SUM(ec.max_score * ec.weight) as max_possible_score,
          COUNT(CASE WHEN ec.is_mandatory AND es.score < 5 THEN 1 END) as failed_mandatory
        FROM evaluation_scores es
        JOIN evaluation_criteria ec ON ec.id = es.criterion_id
        WHERE es.application_id = ${applicationId}
      `;

      const { total_weighted_score, max_possible_score, failed_mandatory } = result[0];
      
      // If any mandatory criteria failed (score < 5), overall score is reduced
      if (failed_mandatory > 0) {
        return {
          score: 0,
          percentage: 0,
          status: 'rejected',
          reason: `Failed ${failed_mandatory} mandatory criteria`
        };
      }

      const percentage = (total_weighted_score / max_possible_score) * 100;
      const status = percentage >= 70 ? 'approved' : percentage >= 50 ? 'review' : 'rejected';

      return {
        score: total_weighted_score,
        percentage: percentage,
        status: status,
        max_possible: max_possible_score
      };
    } catch (error) {
      console.error('Error calculating overall score:', error);
      throw error;
    }
  }

  /**
   * Update onboarding stage
   */
  async updateOnboardingStage(applicationId, newStage, notes = null) {
    try {
      // Get current status
      const currentStatus = await sql`
        SELECT * FROM onboarding_status 
        WHERE application_id = ${applicationId} 
        AND is_active = true
      `;

      let statusId;
      
      if (currentStatus.length === 0) {
        // Create new status record
        const newStatus = await sql`
          INSERT INTO onboarding_status (
            application_id, current_stage, overall_progress, notes
          ) VALUES (
            ${applicationId}, ${newStage}, ${this.getStageProgress(newStage)}, ${notes}
          ) RETURNING id
        `;
        statusId = newStatus[0].id;
      } else {
        // Update existing status
        const current = currentStatus[0];
        await sql`
          UPDATE onboarding_status 
          SET 
            previous_stage = ${current.current_stage},
            current_stage = ${newStage},
            stage_started_at = CURRENT_TIMESTAMP,
            overall_progress = ${this.getStageProgress(newStage)},
            notes = ${notes}
          WHERE id = ${current.id}
        `;
        statusId = current.id;
      }

      // Update application with status ID
      await sql`
        UPDATE hospital_applications 
        SET onboarding_status_id = ${statusId}
        WHERE id = ${applicationId}
      `;

      return statusId;
    } catch (error) {
      console.error('Error updating onboarding stage:', error);
      throw error;
    }
  }

  /**
   * Get stage progress percentage
   */
  getStageProgress(stage) {
    const stageProgress = {
      'application': 10,
      'document_submission': 25,
      'evaluation': 50,
      'contract_negotiation': 70,
      'signature': 90,
      'completed': 100,
      'cancelled': 0
    };
    return stageProgress[stage] || 0;
  }

  /**
   * Create onboarding checklist
   */
  async createOnboardingChecklist(applicationId) {
    try {
      const tasks = [
        { task_name: 'Submit Application Form', priority: 'high', due_days: 0 },
        { task_name: 'Upload CAC Certificate', priority: 'high', due_days: 3 },
        { task_name: 'Upload Tax Clearance Certificate', priority: 'high', due_days: 3 },
        { task_name: 'Upload Practice License', priority: 'high', due_days: 3 },
        { task_name: 'Upload Insurance Certificate', priority: 'high', due_days: 5 },
        { task_name: 'Submit Facility Photos', priority: 'medium', due_days: 7 },
        { task_name: 'Provide Equipment List', priority: 'medium', due_days: 7 },
        { task_name: 'Submit Staff Credentials', priority: 'medium', due_days: 10 },
        { task_name: 'Financial Statement Submission', priority: 'high', due_days: 10 },
        { task_name: 'Complete Evaluation Process', priority: 'high', due_days: 14 },
        { task_name: 'Review Contract Terms', priority: 'high', due_days: 21 },
        { task_name: 'Sign Digital Contract', priority: 'high', due_days: 25 },
        { task_name: 'Complete Onboarding Training', priority: 'medium', due_days: 30 }
      ];

      const taskPromises = tasks.map(task => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + task.due_days);
        
        return sql`
          INSERT INTO onboarding_checklist (
            application_id, task_name, task_description, priority, due_date
          ) VALUES (
            ${applicationId}, 
            ${task.task_name}, 
            ${`Complete ${task.task_name} for onboarding`},
            ${task.priority},
            ${dueDate}
          )
        `;
      });

      await Promise.all(taskPromises);
      return true;
    } catch (error) {
      console.error('Error creating onboarding checklist:', error);
      throw error;
    }
  }

  /**
   * Generate verification code for digital signatures
   */
  generateVerificationCode() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Verify digital signature
   */
  async verifySignature(signatureId, verificationCode) {
    try {
      const signature = await sql`
        SELECT * FROM digital_signatures 
        WHERE id = ${signatureId} 
        AND verification_code = ${verificationCode}
      `;

      if (signature.length === 0) {
        return { valid: false, message: 'Invalid signature or verification code' };
      }

      return { 
        valid: signature[0].is_valid, 
        signedAt: signature[0].signed_at,
        signatory: signature[0].signatory_id 
      };
    } catch (error) {
      console.error('Error verifying signature:', error);
      throw error;
    }
  }
}

module.exports = new OnboardingService();

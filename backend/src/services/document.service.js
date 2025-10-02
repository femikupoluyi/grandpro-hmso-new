const { sql } = require('../config/database');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class DocumentService {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/documents');
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Error creating upload directory:', error);
    }
  }

  /**
   * Save document metadata to database
   */
  async saveDocumentMetadata(documentData) {
    try {
      const document = await sql`
        INSERT INTO documents (
          application_id,
          hospital_id,
          document_type,
          document_name,
          file_path,
          file_size,
          mime_type,
          expiry_date,
          metadata
        ) VALUES (
          ${documentData.application_id},
          ${documentData.hospital_id},
          ${documentData.document_type},
          ${documentData.document_name},
          ${documentData.file_path},
          ${documentData.file_size},
          ${documentData.mime_type},
          ${documentData.expiry_date},
          ${documentData.metadata || {}}
        ) RETURNING *
      `;

      return document[0];
    } catch (error) {
      console.error('Error saving document metadata:', error);
      throw error;
    }
  }

  /**
   * Generate secure file path
   */
  generateSecureFilePath(originalName, applicationId) {
    const ext = path.extname(originalName);
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const fileName = `${applicationId}_${timestamp}_${random}${ext}`;
    return path.join('documents', fileName);
  }

  /**
   * Verify document
   */
  async verifyDocument(documentId, verifierId, status, notes) {
    try {
      const updated = await sql`
        UPDATE documents
        SET 
          status = ${status},
          verified_by = ${verifierId},
          verified_at = CURRENT_TIMESTAMP,
          metadata = jsonb_set(
            COALESCE(metadata, '{}'),
            '{verification_notes}',
            ${JSON.stringify(notes)}::jsonb
          )
        WHERE id = ${documentId}
        RETURNING *
      `;

      // Update onboarding checklist if applicable
      if (updated[0]) {
        const taskName = this.getTaskNameForDocumentType(updated[0].document_type);
        if (taskName) {
          await sql`
            UPDATE onboarding_checklist
            SET 
              is_completed = ${status === 'verified'},
              completed_by = ${verifierId},
              completed_at = CURRENT_TIMESTAMP
            WHERE application_id = ${updated[0].application_id}
            AND task_name LIKE ${`%${taskName}%`}
          `;
        }
      }

      return updated[0];
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  }

  /**
   * Get task name for document type
   */
  getTaskNameForDocumentType(documentType) {
    const mapping = {
      'cac_certificate': 'CAC Certificate',
      'tax_clearance': 'Tax Clearance',
      'practice_license': 'Practice License',
      'insurance_certificate': 'Insurance Certificate',
      'facility_photos': 'Facility Photos',
      'equipment_list': 'Equipment List',
      'staff_credentials': 'Staff Credentials',
      'financial_statement': 'Financial Statement'
    };
    return mapping[documentType];
  }

  /**
   * Get all documents for an application
   */
  async getApplicationDocuments(applicationId) {
    try {
      const documents = await sql`
        SELECT 
          d.*,
          u.first_name as verifier_first_name,
          u.last_name as verifier_last_name
        FROM documents d
        LEFT JOIN users u ON u.id = d.verified_by
        WHERE d.application_id = ${applicationId}
        ORDER BY d.upload_date DESC
      `;

      return documents;
    } catch (error) {
      console.error('Error fetching application documents:', error);
      throw error;
    }
  }

  /**
   * Check if all required documents are uploaded
   */
  async checkRequiredDocuments(applicationId) {
    try {
      const requiredTypes = [
        'cac_certificate',
        'tax_clearance',
        'practice_license',
        'insurance_certificate'
      ];

      const documents = await sql`
        SELECT document_type, status
        FROM documents
        WHERE application_id = ${applicationId}
        AND document_type = ANY(${requiredTypes})
        AND status = 'verified'
      `;

      const uploadedTypes = documents.map(d => d.document_type);
      const missingTypes = requiredTypes.filter(t => !uploadedTypes.includes(t));

      return {
        complete: missingTypes.length === 0,
        missing: missingTypes,
        uploaded: uploadedTypes
      };
    } catch (error) {
      console.error('Error checking required documents:', error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId) {
    try {
      const document = await sql`
        SELECT file_path FROM documents WHERE id = ${documentId}
      `;

      if (document[0]) {
        // Delete physical file
        const fullPath = path.join(this.uploadDir, document[0].file_path);
        try {
          await fs.unlink(fullPath);
        } catch (err) {
          console.error('Error deleting file:', err);
        }

        // Delete database record
        await sql`DELETE FROM documents WHERE id = ${documentId}`;
      }

      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
}

module.exports = new DocumentService();

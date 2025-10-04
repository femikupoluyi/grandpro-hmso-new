/**
 * Encryption Service
 * Handles end-to-end encryption for data at rest and in transit
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

class EncryptionService {
  constructor() {
    // Use environment variable or generate a secure key
    this.algorithm = 'aes-256-gcm';
    this.secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32);
    this.saltRounds = 12;
  }

  /**
   * Encrypt sensitive data for storage (data at rest)
   */
  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      return {
        encrypted,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData) {
    try {
      const { encrypted, iv, authTag } = encryptedData;
      
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.secretKey,
        Buffer.from(iv, 'hex')
      );
      
      decipher.setAuthTag(Buffer.from(authTag, 'hex'));
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash passwords using bcrypt
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Verify password against hash
   */
  async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate secure random tokens
   */
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Encrypt PII fields in an object
   */
  encryptPII(data) {
    const piiFields = [
      'ssn', 'social_security_number',
      'credit_card', 'card_number',
      'bank_account', 'account_number',
      'medical_record_number', 'mrn',
      'driver_license', 'passport_number',
      'email', 'phone_number',
      'date_of_birth', 'dob'
    ];

    const encryptedData = { ...data };
    
    for (const field of piiFields) {
      if (data[field]) {
        encryptedData[field] = this.encrypt(data[field].toString());
      }
    }
    
    return encryptedData;
  }

  /**
   * Decrypt PII fields in an object
   */
  decryptPII(data) {
    const decryptedData = { ...data };
    
    Object.keys(data).forEach(key => {
      if (data[key] && typeof data[key] === 'object' && 
          data[key].encrypted && data[key].iv && data[key].authTag) {
        try {
          decryptedData[key] = this.decrypt(data[key]);
        } catch (error) {
          console.error(`Failed to decrypt field ${key}`);
          decryptedData[key] = null;
        }
      }
    });
    
    return decryptedData;
  }

  /**
   * Create encrypted database connection string
   */
  encryptConnectionString(connectionString) {
    return this.encrypt(connectionString);
  }

  /**
   * Generate encryption key for field-level encryption
   */
  generateFieldKey(fieldName, recordId) {
    const combined = `${fieldName}-${recordId}-${this.secretKey.toString('hex')}`;
    return crypto.createHash('sha256').update(combined).digest();
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data) {
    const sensitiveFields = ['password', 'ssn', 'credit_card', 'api_key', 'token'];
    const masked = { ...data };
    
    sensitiveFields.forEach(field => {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    });
    
    return masked;
  }

  /**
   * Generate data encryption key (DEK) for large files
   */
  generateDEK() {
    return crypto.randomBytes(32);
  }

  /**
   * Encrypt DEK with master key (key wrapping)
   */
  wrapDEK(dek) {
    return this.encrypt(dek.toString('hex'));
  }

  /**
   * Unwrap DEK
   */
  unwrapDEK(wrappedDEK) {
    const dekHex = this.decrypt(wrappedDEK);
    return Buffer.from(dekHex, 'hex');
  }
}

module.exports = new EncryptionService();

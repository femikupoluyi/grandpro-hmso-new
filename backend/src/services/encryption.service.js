// End-to-End Encryption Service for HIPAA/GDPR Compliance
const crypto = require('crypto');
const securityConfig = require('../config/security.config');

class EncryptionService {
  constructor() {
    this.algorithm = securityConfig.encryption.algorithm;
    this.keyDerivation = securityConfig.encryption.keyDerivation;
    this.iterations = securityConfig.encryption.iterations;
    this.keyLength = securityConfig.encryption.keyLength;
    this.saltLength = securityConfig.encryption.saltLength;
    this.tagLength = securityConfig.encryption.tagLength;
    this.ivLength = securityConfig.encryption.ivLength;
    
    // Master key from environment or generate if not exists
    this.masterKey = this.getMasterKey();
  }

  // Get or generate master encryption key
  getMasterKey() {
    if (process.env.MASTER_ENCRYPTION_KEY) {
      return Buffer.from(process.env.MASTER_ENCRYPTION_KEY, 'hex');
    }
    // Generate and log warning for production
    console.warn('WARNING: Using generated master key. Set MASTER_ENCRYPTION_KEY in production!');
    return crypto.randomBytes(this.keyLength);
  }

  // Derive encryption key from master key and salt
  deriveKey(salt, purpose = 'general') {
    const info = Buffer.from(`grandpro-hmso-${purpose}`, 'utf8');
    return crypto.pbkdf2Sync(
      this.masterKey,
      salt,
      this.iterations,
      this.keyLength,
      'sha256'
    );
  }

  // Encrypt data at rest
  encryptData(data, purpose = 'general') {
    try {
      // Convert data to string if object
      const plaintext = typeof data === 'object' 
        ? JSON.stringify(data) 
        : String(data);

      // Generate salt and IV
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);
      
      // Derive key
      const key = this.deriveKey(salt, purpose);
      
      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);
      
      // Encrypt data
      let encrypted = cipher.update(plaintext, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      
      // Get auth tag for GCM
      const authTag = cipher.getAuthTag();
      
      // Combine all components
      const combined = Buffer.concat([
        salt,
        iv,
        authTag,
        encrypted
      ]);
      
      return {
        encrypted: combined.toString('base64'),
        purpose,
        algorithm: this.algorithm,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data
  decryptData(encryptedData, purpose = 'general') {
    try {
      const combined = Buffer.from(encryptedData.encrypted, 'base64');
      
      // Extract components
      const salt = combined.slice(0, this.saltLength);
      const iv = combined.slice(this.saltLength, this.saltLength + this.ivLength);
      const authTag = combined.slice(
        this.saltLength + this.ivLength, 
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = combined.slice(this.saltLength + this.ivLength + this.tagLength);
      
      // Derive key
      const key = this.deriveKey(salt, purpose);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      
      const plaintext = decrypted.toString('utf8');
      
      // Try to parse as JSON if possible
      try {
        return JSON.parse(plaintext);
      } catch {
        return plaintext;
      }
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Encrypt specific PHI/PII fields
  encryptPHI(data) {
    const encrypted = {};
    const sensitiveFields = [
      ...securityConfig.dataClassification.fieldClassification.restricted,
      ...securityConfig.dataClassification.fieldClassification.confidential
    ];

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key) && value) {
        encrypted[key] = this.encryptData(value, 'phi').encrypted;
      } else {
        encrypted[key] = value;
      }
    }

    return encrypted;
  }

  // Decrypt PHI/PII fields
  decryptPHI(data) {
    const decrypted = {};
    const sensitiveFields = [
      ...securityConfig.dataClassification.fieldClassification.restricted,
      ...securityConfig.dataClassification.fieldClassification.confidential
    ];

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key) && value && typeof value === 'string') {
        try {
          decrypted[key] = this.decryptData({ 
            encrypted: value, 
            purpose: 'phi' 
          }, 'phi');
        } catch {
          decrypted[key] = value; // Return as-is if not encrypted
        }
      } else {
        decrypted[key] = value;
      }
    }

    return decrypted;
  }

  // Hash data for integrity verification
  hashData(data) {
    const content = typeof data === 'object' 
      ? JSON.stringify(data) 
      : String(data);
    
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex');
  }

  // Generate secure tokens
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Encrypt for transmission (different key per session)
  encryptForTransmission(data, sessionKey) {
    const iv = crypto.randomBytes(this.ivLength);
    const key = Buffer.from(sessionKey, 'hex').slice(0, 32);
    
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      iv: iv.toString('hex'),
      data: encrypted
    };
  }

  // Decrypt transmission data
  decryptTransmission(encryptedData, sessionKey) {
    const key = Buffer.from(sessionKey, 'hex').slice(0, 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedData.data, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  }

  // Pseudonymization for GDPR
  pseudonymize(data, fields) {
    const pseudonymized = { ...data };
    const mapping = {};

    fields.forEach(field => {
      if (data[field]) {
        const pseudonym = crypto
          .createHash('sha256')
          .update(data[field] + this.masterKey.toString('hex'))
          .digest('hex')
          .substring(0, 16);
        
        mapping[field] = {
          original: data[field],
          pseudonym
        };
        
        pseudonymized[field] = pseudonym;
      }
    });

    return {
      data: pseudonymized,
      mapping // Store securely for potential de-pseudonymization
    };
  }

  // Key rotation
  rotateKeys() {
    const newKey = crypto.randomBytes(this.keyLength);
    const rotationLog = {
      timestamp: new Date().toISOString(),
      oldKeyHash: this.hashData(this.masterKey),
      newKeyHash: this.hashData(newKey),
      status: 'pending'
    };

    // In production, this would trigger a key rotation process
    console.log('Key rotation initiated:', rotationLog);
    
    return rotationLog;
  }

  // Secure deletion (overwrite memory)
  secureDelete(data) {
    if (Buffer.isBuffer(data)) {
      data.fill(0);
    } else if (typeof data === 'string') {
      // For strings, we can't directly overwrite memory
      // But we can at least clear references
      data = null;
    } else if (typeof data === 'object') {
      Object.keys(data).forEach(key => {
        data[key] = null;
        delete data[key];
      });
    }
  }
}

module.exports = new EncryptionService();

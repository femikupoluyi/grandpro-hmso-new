/**
 * Insurance/HMO Integration Module
 * Handles connections with Nigerian insurance providers and HMOs
 */

const axios = require('axios');
const crypto = require('crypto');

// Nigerian Insurance/HMO Provider Configuration
const PROVIDERS = {
  NHIS: {
    name: 'National Health Insurance Scheme',
    baseUrl: process.env.NHIS_API_URL || 'https://api-sandbox.nhis.gov.ng',
    apiKey: process.env.NHIS_API_KEY || 'sandbox_key_nhis',
    authMethod: 'oauth2'
  },
  HYGEIA: {
    name: 'Hygeia HMO',
    baseUrl: process.env.HYGEIA_API_URL || 'https://sandbox.hygeiahmo.com/api',
    apiKey: process.env.HYGEIA_API_KEY || 'sandbox_key_hygeia',
    authMethod: 'hmac'
  },
  RELIANCE: {
    name: 'Reliance HMO',
    baseUrl: process.env.RELIANCE_API_URL || 'https://api-test.reliancehmo.com',
    apiKey: process.env.RELIANCE_API_KEY || 'sandbox_key_reliance',
    authMethod: 'jwt'
  },
  AXAMANSARD: {
    name: 'AXA Mansard Health',
    baseUrl: process.env.AXA_API_URL || 'https://sandbox.axamansard.com/health',
    apiKey: process.env.AXA_API_KEY || 'sandbox_key_axa',
    authMethod: 'apikey'
  },
  AIICO: {
    name: 'AIICO Insurance',
    baseUrl: process.env.AIICO_API_URL || 'https://api-test.aiicoplc.com',
    apiKey: process.env.AIICO_API_KEY || 'sandbox_key_aiico',
    authMethod: 'bearer'
  }
};

// Cache for eligibility checks (5 minutes TTL)
const eligibilityCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

class InsuranceIntegration {
  constructor() {
    this.providers = PROVIDERS;
    this.activeTokens = new Map();
  }

  /**
   * Get authentication headers based on provider's auth method
   */
  async getAuthHeaders(providerId) {
    const provider = this.providers[providerId];
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`);
    }

    switch (provider.authMethod) {
      case 'oauth2':
        return await this.getOAuth2Headers(provider);
      case 'hmac':
        return this.getHMACHeaders(provider);
      case 'jwt':
        return await this.getJWTHeaders(provider);
      case 'apikey':
        return { 'X-API-Key': provider.apiKey };
      case 'bearer':
        return { 'Authorization': `Bearer ${provider.apiKey}` };
      default:
        return {};
    }
  }

  /**
   * OAuth2 authentication flow
   */
  async getOAuth2Headers(provider) {
    // Check if we have a valid token
    const cachedToken = this.activeTokens.get(provider.name);
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return { 'Authorization': `Bearer ${cachedToken.token}` };
    }

    // In production, implement actual OAuth2 flow
    // For sandbox, return mock token
    const mockToken = {
      token: `mock_oauth2_token_${Date.now()}`,
      expiresAt: Date.now() + 3600000 // 1 hour
    };
    
    this.activeTokens.set(provider.name, mockToken);
    return { 'Authorization': `Bearer ${mockToken.token}` };
  }

  /**
   * HMAC signature for requests
   */
  getHMACHeaders(provider) {
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac('sha256', provider.apiKey)
      .update(timestamp)
      .digest('hex');

    return {
      'X-Timestamp': timestamp,
      'X-Signature': signature,
      'X-Client-Id': 'grandpro-hmso'
    };
  }

  /**
   * JWT token generation
   */
  async getJWTHeaders(provider) {
    // In production, use proper JWT library
    // For sandbox, return mock JWT
    const mockJWT = Buffer.from(JSON.stringify({
      iss: 'grandpro-hmso',
      exp: Date.now() + 3600000,
      sub: provider.name
    })).toString('base64');

    return { 'Authorization': `JWT ${mockJWT}` };
  }

  /**
   * Check patient eligibility with caching
   */
  async checkEligibility(patientId, providerId) {
    // Check cache first
    const cacheKey = `${patientId}-${providerId}`;
    const cached = eligibilityCache.get(cacheKey);
    if (cached && cached.timestamp > Date.now() - CACHE_TTL) {
      return cached.data;
    }

    try {
      const provider = this.providers[providerId];
      const headers = await this.getAuthHeaders(providerId);

      // In production, make actual API call
      // For sandbox, return mock data
      const mockResponse = {
        eligible: true,
        patientId: patientId,
        providerId: providerId,
        coveragePercentage: 80,
        coverageLimit: 1000000, // ₦1,000,000
        deductible: 5000, // ₦5,000
        copay: 10, // 10%
        validUntil: '2025-12-31',
        benefits: [
          'Consultation',
          'Diagnostics',
          'Medication',
          'Surgery',
          'Emergency Care'
        ],
        exclusions: ['Cosmetic Surgery', 'Dental Care'],
        message: 'Patient is eligible for coverage'
      };

      // Cache the result
      eligibilityCache.set(cacheKey, {
        data: mockResponse,
        timestamp: Date.now()
      });

      return mockResponse;
    } catch (error) {
      console.error('Eligibility check error:', error);
      throw error;
    }
  }

  /**
   * Submit insurance claim
   */
  async submitClaim(claimData) {
    const { patientId, providerId, amount, services, diagnosisCodes } = claimData;

    try {
      const provider = this.providers[providerId];
      const headers = await this.getAuthHeaders(providerId);

      // Prepare claim payload
      const claimPayload = {
        claimId: `CLM-${Date.now()}`,
        patientId,
        providerId,
        hospitalId: claimData.hospitalId || 'HOSP001',
        claimDate: new Date().toISOString(),
        amount: amount,
        currency: 'NGN',
        services: services || [],
        diagnosisCodes: diagnosisCodes || [],
        documents: claimData.documents || [],
        status: 'submitted'
      };

      // In production, make actual API call
      // For sandbox, simulate submission
      const mockResponse = {
        success: true,
        claimId: claimPayload.claimId,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        estimatedProcessingTime: '48 hours',
        trackingUrl: `${provider.baseUrl}/claims/${claimPayload.claimId}`,
        message: 'Claim submitted successfully'
      };

      // Log claim for audit
      console.log('Claim submitted:', {
        claimId: mockResponse.claimId,
        amount: amount,
        provider: providerId
      });

      return mockResponse;
    } catch (error) {
      console.error('Claim submission error:', error);
      throw error;
    }
  }

  /**
   * Get claim status
   */
  async getClaimStatus(claimId, providerId) {
    try {
      const provider = this.providers[providerId];
      const headers = await this.getAuthHeaders(providerId);

      // In production, make actual API call
      // For sandbox, return mock status
      const mockResponse = {
        claimId,
        status: 'processing',
        submittedAt: '2025-01-02T10:00:00Z',
        lastUpdated: new Date().toISOString(),
        amount: 25000,
        approvedAmount: 20000,
        deniedAmount: 5000,
        paymentStatus: 'pending',
        notes: 'Under review by claims department',
        estimatedCompletion: '2025-01-04T17:00:00Z'
      };

      return mockResponse;
    } catch (error) {
      console.error('Claim status error:', error);
      throw error;
    }
  }

  /**
   * Request pre-authorization
   */
  async requestPreAuthorization(authData) {
    const { patientId, providerId, procedure, estimatedCost } = authData;

    try {
      const provider = this.providers[providerId];
      const headers = await this.getAuthHeaders(providerId);

      // Check eligibility first
      const eligibility = await this.checkEligibility(patientId, providerId);
      if (!eligibility.eligible) {
        return {
          approved: false,
          reason: 'Patient not eligible for coverage',
          authCode: null
        };
      }

      // In production, make actual API call
      // For sandbox, simulate authorization
      const mockResponse = {
        approved: true,
        authCode: `AUTH-${Date.now()}`,
        patientId,
        providerId,
        procedure,
        requestedAmount: estimatedCost,
        approvedAmount: Math.floor(estimatedCost * 0.8), // 80% coverage
        validUntil: new Date(Date.now() + 30 * 24 * 3600000).toISOString(), // 30 days
        conditions: ['Must be performed within 30 days', 'Subject to medical review'],
        message: 'Pre-authorization approved'
      };

      return mockResponse;
    } catch (error) {
      console.error('Pre-authorization error:', error);
      throw error;
    }
  }

  /**
   * Batch claim submission
   */
  async submitBatchClaims(claims) {
    try {
      const results = await Promise.all(
        claims.map(claim => this.submitClaim(claim))
      );

      return {
        success: true,
        totalClaims: claims.length,
        submitted: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results: results,
        batchId: `BATCH-${Date.now()}`
      };
    } catch (error) {
      console.error('Batch claim submission error:', error);
      throw error;
    }
  }

  /**
   * Get provider network
   */
  async getProviderNetwork(providerId, location = 'Lagos') {
    try {
      const provider = this.providers[providerId];
      const headers = await this.getAuthHeaders(providerId);

      // In production, make actual API call
      // For sandbox, return mock network
      const mockResponse = {
        providerId,
        location,
        hospitals: [
          {
            id: 'HOSP001',
            name: 'Lagos General Hospital',
            address: 'Marina, Lagos Island',
            specialties: ['General Medicine', 'Surgery', 'Pediatrics'],
            rating: 4.5
          },
          {
            id: 'HOSP002',
            name: 'St. Nicholas Hospital',
            address: '57 Campbell St, Lagos Island',
            specialties: ['Cardiology', 'Orthopedics', 'Obstetrics'],
            rating: 4.8
          },
          {
            id: 'HOSP003',
            name: 'Reddington Hospital',
            address: '12 Idowu Martins St, Victoria Island',
            specialties: ['All Specialties'],
            rating: 4.7
          }
        ],
        totalCount: 3,
        lastUpdated: new Date().toISOString()
      };

      return mockResponse;
    } catch (error) {
      console.error('Provider network error:', error);
      throw error;
    }
  }

  /**
   * Verify insurance card
   */
  async verifyInsuranceCard(cardNumber, providerId) {
    try {
      const provider = this.providers[providerId];
      const headers = await this.getAuthHeaders(providerId);

      // In production, make actual API call
      // For sandbox, validate format and return mock data
      const isValid = /^\d{10,16}$/.test(cardNumber);

      if (!isValid) {
        return {
          valid: false,
          message: 'Invalid card number format'
        };
      }

      const mockResponse = {
        valid: true,
        cardNumber: cardNumber.replace(/(\d{4})(\d+)(\d{4})/, '$1****$3'),
        memberName: 'John Doe',
        membershipType: 'Family',
        status: 'Active',
        expiryDate: '2025-12-31',
        dependents: 3,
        message: 'Card verified successfully'
      };

      return mockResponse;
    } catch (error) {
      console.error('Card verification error:', error);
      throw error;
    }
  }
}

module.exports = new InsuranceIntegration();

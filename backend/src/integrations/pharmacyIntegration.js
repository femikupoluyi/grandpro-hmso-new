/**
 * Pharmacy Integration Module
 * Handles connections with Nigerian pharmaceutical suppliers
 */

const axios = require('axios');
const crypto = require('crypto');
const EventEmitter = require('events');

// Nigerian Pharmacy Supplier Configuration
const SUPPLIERS = {
  emzor: {
    name: 'Emzor Pharmaceuticals',
    baseUrl: process.env.EMZOR_API_URL || 'https://api-sandbox.emzorpharma.com',
    apiKey: process.env.EMZOR_API_KEY || 'sandbox_key_emzor',
    authMethod: 'oauth2',
    deliveryZones: ['Lagos', 'Abuja', 'Port Harcourt', 'Kano']
  },
  fidson: {
    name: 'Fidson Healthcare',
    baseUrl: process.env.FIDSON_API_URL || 'https://sandbox.fidson.com/api',
    apiKey: process.env.FIDSON_API_KEY || 'sandbox_key_fidson',
    authMethod: 'hmac',
    deliveryZones: ['Lagos', 'Ogun', 'Oyo', 'Osun']
  },
  maybaker: {
    name: 'May & Baker Nigeria',
    baseUrl: process.env.MAYBAKER_API_URL || 'https://api-test.maybaker.ng',
    apiKey: process.env.MAYBAKER_API_KEY || 'sandbox_key_maybaker',
    authMethod: 'apikey',
    deliveryZones: ['Lagos', 'Abuja', 'Kaduna']
  },
  healthplus: {
    name: 'HealthPlus Pharmacy',
    baseUrl: process.env.HEALTHPLUS_API_URL || 'https://sandbox.healthplus.ng/api',
    apiKey: process.env.HEALTHPLUS_API_KEY || 'sandbox_key_healthplus',
    authMethod: 'bearer',
    deliveryZones: ['Lagos', 'Abuja', 'Port Harcourt']
  },
  medplus: {
    name: 'MedPlus Pharmacy',
    baseUrl: process.env.MEDPLUS_API_URL || 'https://api-test.medplus.com.ng',
    apiKey: process.env.MEDPLUS_API_KEY || 'sandbox_key_medplus',
    authMethod: 'jwt',
    deliveryZones: ['Lagos', 'Abuja', 'Ibadan', 'Enugu']
  }
};

// Auto-reorder rules storage
const autoReorderRules = new Map();

// Event emitter for inventory alerts
class InventoryMonitor extends EventEmitter {}
const inventoryMonitor = new InventoryMonitor();

class PharmacyIntegration {
  constructor() {
    this.suppliers = SUPPLIERS;
    this.activeTokens = new Map();
    this.orderQueue = [];
    this.inventoryLevels = new Map();
    this.setupInventoryMonitoring();
  }

  /**
   * Setup inventory monitoring
   */
  setupInventoryMonitoring() {
    // Check inventory levels every 5 minutes
    setInterval(() => {
      this.checkInventoryLevels();
    }, 5 * 60 * 1000);

    // Listen for low stock events
    inventoryMonitor.on('lowStock', (data) => {
      console.log('Low stock alert:', data);
      this.handleLowStock(data);
    });
  }

  /**
   * Get authentication headers based on supplier's auth method
   */
  async getAuthHeaders(supplierId) {
    const supplier = this.suppliers[supplierId];
    if (!supplier) {
      throw new Error(`Unknown supplier: ${supplierId}`);
    }

    switch (supplier.authMethod) {
      case 'oauth2':
        return await this.getOAuth2Headers(supplier);
      case 'hmac':
        return this.getHMACHeaders(supplier);
      case 'jwt':
        return await this.getJWTHeaders(supplier);
      case 'apikey':
        return { 'X-API-Key': supplier.apiKey };
      case 'bearer':
        return { 'Authorization': `Bearer ${supplier.apiKey}` };
      default:
        return {};
    }
  }

  /**
   * OAuth2 authentication
   */
  async getOAuth2Headers(supplier) {
    const cachedToken = this.activeTokens.get(supplier.name);
    if (cachedToken && cachedToken.expiresAt > Date.now()) {
      return { 'Authorization': `Bearer ${cachedToken.token}` };
    }

    const mockToken = {
      token: `mock_oauth2_token_${Date.now()}`,
      expiresAt: Date.now() + 3600000
    };
    
    this.activeTokens.set(supplier.name, mockToken);
    return { 'Authorization': `Bearer ${mockToken.token}` };
  }

  /**
   * HMAC signature for requests
   */
  getHMACHeaders(supplier) {
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac('sha256', supplier.apiKey)
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
  async getJWTHeaders(supplier) {
    const mockJWT = Buffer.from(JSON.stringify({
      iss: 'grandpro-hmso',
      exp: Date.now() + 3600000,
      sub: supplier.name
    })).toString('base64');

    return { 'Authorization': `JWT ${mockJWT}` };
  }

  /**
   * Check drug availability across suppliers
   */
  async checkDrugAvailability(drugName, quantity, location = 'Lagos') {
    const availabilityResults = [];

    for (const [supplierId, supplier] of Object.entries(this.suppliers)) {
      if (!supplier.deliveryZones.includes(location)) {
        continue;
      }

      try {
        const headers = await this.getAuthHeaders(supplierId);
        
        // In production, make actual API call
        // For sandbox, generate mock availability data
        const mockAvailability = {
          supplierId,
          supplierName: supplier.name,
          drugName,
          available: Math.random() > 0.2, // 80% availability
          stock: Math.floor(Math.random() * 1000) + 100,
          unitPrice: Math.floor(Math.random() * 100) + 20,
          currency: 'NGN',
          packSize: '10 tablets',
          manufacturer: ['Emzor', 'Fidson', 'May & Baker'][Math.floor(Math.random() * 3)],
          expiryDate: new Date(Date.now() + 365 * 24 * 3600000).toISOString(),
          deliveryTime: `${Math.floor(Math.random() * 3) + 1} days`,
          minOrderQuantity: 10
        };

        if (mockAvailability.available && mockAvailability.stock >= quantity) {
          availabilityResults.push(mockAvailability);
        }
      } catch (error) {
        console.error(`Error checking availability with ${supplierId}:`, error);
      }
    }

    // Sort by price
    availabilityResults.sort((a, b) => a.unitPrice - b.unitPrice);

    return {
      drugName,
      requestedQuantity: quantity,
      location,
      available: availabilityResults.length > 0,
      suppliers: availabilityResults,
      cheapestOption: availabilityResults[0] || null,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Place order with supplier
   */
  async placeOrder(orderData) {
    const { supplierId, items, hospitalId, urgency = 'normal' } = orderData;

    try {
      const supplier = this.suppliers[supplierId];
      const headers = await this.getAuthHeaders(supplierId);

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);

      // Create order payload
      const orderPayload = {
        orderId: `ORD-${Date.now()}`,
        supplierId,
        supplierName: supplier.name,
        hospitalId,
        orderDate: new Date().toISOString(),
        items: items.map(item => ({
          ...item,
          subtotal: item.quantity * item.unitPrice
        })),
        totalAmount,
        currency: 'NGN',
        urgency,
        deliveryAddress: orderData.deliveryAddress || 'Default Hospital Address',
        status: 'confirmed',
        estimatedDelivery: this.calculateDeliveryDate(urgency),
        paymentTerms: '30 days',
        paymentStatus: 'pending'
      };

      // In production, make actual API call
      // For sandbox, simulate order placement
      const mockResponse = {
        success: true,
        orderId: orderPayload.orderId,
        status: 'confirmed',
        totalAmount: totalAmount,
        estimatedDelivery: orderPayload.estimatedDelivery,
        trackingNumber: `TRK${Date.now()}`,
        invoiceUrl: `${supplier.baseUrl}/invoices/${orderPayload.orderId}`,
        message: 'Order placed successfully'
      };

      // Add to order queue for tracking
      this.orderQueue.push({
        ...orderPayload,
        trackingNumber: mockResponse.trackingNumber
      });

      // Update inventory expectations
      items.forEach(item => {
        const currentLevel = this.inventoryLevels.get(item.drugId) || 0;
        this.inventoryLevels.set(item.drugId, currentLevel + item.quantity);
      });

      return mockResponse;
    } catch (error) {
      console.error('Order placement error:', error);
      throw error;
    }
  }

  /**
   * Calculate delivery date based on urgency
   */
  calculateDeliveryDate(urgency) {
    let daysToAdd = 3; // Default delivery time

    switch (urgency) {
      case 'urgent':
        daysToAdd = 1;
        break;
      case 'emergency':
        daysToAdd = 0.5; // Same day
        break;
      case 'scheduled':
        daysToAdd = 7;
        break;
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);
    return deliveryDate.toISOString();
  }

  /**
   * Track order status
   */
  async trackOrder(orderId, supplierId) {
    try {
      const supplier = this.suppliers[supplierId];
      const headers = await this.getAuthHeaders(supplierId);

      // In production, make actual API call
      // For sandbox, return mock tracking data
      const mockResponse = {
        orderId,
        status: ['confirmed', 'processing', 'shipped', 'in_transit'][Math.floor(Math.random() * 4)],
        trackingNumber: `TRK${orderId.replace('ORD-', '')}`,
        currentLocation: 'Lagos Distribution Center',
        estimatedDelivery: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
        deliveryProgress: 65,
        events: [
          {
            timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
            status: 'Order Confirmed',
            location: 'Online'
          },
          {
            timestamp: new Date(Date.now() - 12 * 3600000).toISOString(),
            status: 'Processing at Warehouse',
            location: 'Lagos Warehouse'
          },
          {
            timestamp: new Date().toISOString(),
            status: 'Out for Delivery',
            location: 'Lagos'
          }
        ]
      };

      return mockResponse;
    } catch (error) {
      console.error('Order tracking error:', error);
      throw error;
    }
  }

  /**
   * Setup automatic reorder rule
   */
  async setupAutoReorder(reorderRule) {
    const { drugId, minStock, reorderQuantity, preferredSupplier, hospitalId } = reorderRule;

    const ruleId = `RULE-${Date.now()}`;
    
    const rule = {
      ruleId,
      drugId,
      minStock,
      reorderQuantity,
      preferredSupplier,
      hospitalId,
      status: 'active',
      createdAt: new Date().toISOString(),
      lastTriggered: null,
      triggeredCount: 0
    };

    autoReorderRules.set(ruleId, rule);

    // Monitor this drug's stock level
    this.monitorDrugStock(drugId, minStock, ruleId);

    return {
      success: true,
      ruleId,
      status: 'active',
      message: 'Auto-reorder rule created successfully'
    };
  }

  /**
   * Monitor drug stock levels
   */
  monitorDrugStock(drugId, minStock, ruleId) {
    // In production, this would connect to inventory management system
    // For sandbox, simulate monitoring
    const checkStock = () => {
      const currentStock = this.inventoryLevels.get(drugId) || Math.floor(Math.random() * 100);
      
      if (currentStock < minStock) {
        inventoryMonitor.emit('lowStock', {
          drugId,
          currentStock,
          minStock,
          ruleId
        });
      }
    };

    // Check immediately and then periodically
    checkStock();
  }

  /**
   * Handle low stock alert
   */
  async handleLowStock(data) {
    const { drugId, currentStock, ruleId } = data;
    const rule = autoReorderRules.get(ruleId);

    if (!rule || rule.status !== 'active') {
      return;
    }

    // Prevent duplicate orders
    const lastTriggered = rule.lastTriggered ? new Date(rule.lastTriggered) : null;
    const hoursSinceLastTrigger = lastTriggered 
      ? (Date.now() - lastTriggered.getTime()) / (1000 * 60 * 60)
      : Infinity;

    if (hoursSinceLastTrigger < 24) {
      console.log(`Auto-reorder for ${drugId} already triggered in last 24 hours`);
      return;
    }

    try {
      // Place automatic reorder
      const orderResult = await this.placeOrder({
        supplierId: rule.preferredSupplier,
        items: [{
          drugId: drugId,
          drugName: `Drug-${drugId}`, // In production, fetch from database
          quantity: rule.reorderQuantity,
          unitPrice: 50 // In production, fetch current price
        }],
        hospitalId: rule.hospitalId,
        urgency: currentStock < 10 ? 'urgent' : 'normal'
      });

      // Update rule
      rule.lastTriggered = new Date().toISOString();
      rule.triggeredCount++;
      autoReorderRules.set(ruleId, rule);

      console.log(`Auto-reorder triggered for ${drugId}: Order ${orderResult.orderId}`);
      return orderResult;
    } catch (error) {
      console.error(`Failed to auto-reorder ${drugId}:`, error);
    }
  }

  /**
   * Get price comparison across suppliers
   */
  async comparePrices(drugList, location = 'Lagos') {
    const priceComparison = [];

    for (const drug of drugList) {
      const availability = await this.checkDrugAvailability(
        drug.name,
        drug.quantity || 100,
        location
      );

      priceComparison.push({
        drugName: drug.name,
        requestedQuantity: drug.quantity || 100,
        suppliers: availability.suppliers.map(s => ({
          supplierName: s.supplierName,
          unitPrice: s.unitPrice,
          totalPrice: s.unitPrice * (drug.quantity || 100),
          deliveryTime: s.deliveryTime,
          inStock: s.available
        })),
        bestPrice: availability.cheapestOption,
        priceRange: {
          min: Math.min(...availability.suppliers.map(s => s.unitPrice)),
          max: Math.max(...availability.suppliers.map(s => s.unitPrice))
        }
      });
    }

    return {
      location,
      drugs: priceComparison,
      generatedAt: new Date().toISOString()
    };
  }

  /**
   * Cancel order
   */
  async cancelOrder(orderId, supplierId, reason) {
    try {
      const supplier = this.suppliers[supplierId];
      const headers = await this.getAuthHeaders(supplierId);

      // In production, make actual API call
      // For sandbox, simulate cancellation
      const mockResponse = {
        success: true,
        orderId,
        status: 'cancelled',
        reason,
        cancelledAt: new Date().toISOString(),
        refundAmount: 0, // No payment was made yet
        message: 'Order cancelled successfully'
      };

      // Remove from order queue
      this.orderQueue = this.orderQueue.filter(order => order.orderId !== orderId);

      return mockResponse;
    } catch (error) {
      console.error('Order cancellation error:', error);
      throw error;
    }
  }

  /**
   * Get supplier catalog
   */
  async getSupplierCatalog(supplierId, category = 'all', page = 1, limit = 50) {
    try {
      const supplier = this.suppliers[supplierId];
      const headers = await this.getAuthHeaders(supplierId);

      // In production, make actual API call
      // For sandbox, return mock catalog
      const mockCatalog = {
        supplierId,
        supplierName: supplier.name,
        category,
        page,
        limit,
        totalItems: 250,
        totalPages: 5,
        items: Array(limit).fill(null).map((_, index) => ({
          drugId: `DRUG${page}${index.toString().padStart(3, '0')}`,
          name: ['Paracetamol', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Omeprazole'][index % 5],
          genericName: ['Acetaminophen', 'Ibuprofen', 'Amoxicillin', 'Metformin', 'Omeprazole'][index % 5],
          category: ['Analgesics', 'Antibiotics', 'Antidiabetics', 'Gastrointestinal'][index % 4],
          manufacturer: ['Emzor', 'Fidson', 'May & Baker'][index % 3],
          strength: ['500mg', '250mg', '100mg', '1000mg'][index % 4],
          packSize: ['10 tablets', '20 tablets', '30 tablets', '100ml'][index % 4],
          unitPrice: Math.floor(Math.random() * 1000) + 50,
          currency: 'NGN',
          inStock: Math.random() > 0.1,
          stockQuantity: Math.floor(Math.random() * 1000),
          requiresPrescription: Math.random() > 0.5
        }))
      };

      return mockCatalog;
    } catch (error) {
      console.error('Catalog fetch error:', error);
      throw error;
    }
  }

  /**
   * Check inventory levels
   */
  checkInventoryLevels() {
    // This would be called periodically to check all monitored drugs
    for (const [ruleId, rule] of autoReorderRules) {
      if (rule.status === 'active') {
        this.monitorDrugStock(rule.drugId, rule.minStock, ruleId);
      }
    }
  }

  /**
   * Handle webhook from supplier
   */
  async handleWebhook(supplierId, event, data) {
    console.log(`Webhook received from ${supplierId}:`, event);

    switch (event) {
      case 'order.shipped':
        // Update order status
        console.log(`Order ${data.orderId} has been shipped`);
        break;
      case 'order.delivered':
        // Update inventory
        console.log(`Order ${data.orderId} has been delivered`);
        break;
      case 'price.update':
        // Update cached prices
        console.log(`Price updated for ${data.drugId}: ${data.newPrice}`);
        break;
      case 'stock.alert':
        // Handle stock alert from supplier
        console.log(`Stock alert for ${data.drugId}: ${data.message}`);
        break;
    }

    return { received: true };
  }
}

module.exports = new PharmacyIntegration();

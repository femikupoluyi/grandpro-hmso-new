/**
 * Enhanced Inventory Management Service
 * Manages drugs, consumables, and medical equipment
 */

const { pool } = require('../config/database');

class InventoryEnhancedService {
  /**
   * Add new inventory item
   */
  async addInventoryItem(itemData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate item code
      const itemCode = `ITM${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Insert inventory item
      const itemQuery = `
        INSERT INTO inventory_items (
          item_code, name, category, subcategory,
          description, unit_of_measure, 
          quantity_in_stock, minimum_stock_level, reorder_level,
          maximum_stock_level, unit_price, selling_price,
          supplier_id, supplier_name, manufacturer,
          batch_number, expiry_date, storage_location,
          requires_prescription, is_controlled_drug,
          hospital_id, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, 'active', NOW())
        RETURNING *
      `;

      const values = [
        itemCode,
        itemData.name,
        itemData.category, // medication, consumable, equipment
        itemData.subcategory || null,
        itemData.description || null,
        itemData.unitOfMeasure || 'unit',
        itemData.quantityInStock || 0,
        itemData.minimumStockLevel || 10,
        itemData.reorderLevel || 20,
        itemData.maximumStockLevel || 100,
        itemData.unitPrice || 0,
        itemData.sellingPrice || 0,
        itemData.supplierId || null,
        itemData.supplierName || null,
        itemData.manufacturer || null,
        itemData.batchNumber || null,
        itemData.expiryDate || null,
        itemData.storageLocation || null,
        itemData.requiresPrescription || false,
        itemData.isControlledDrug || false,
        itemData.hospitalId
      ];

      const result = await client.query(itemQuery, values);

      // Create initial stock transaction
      await this.createStockTransaction(client, {
        itemId: result.rows[0].id,
        transactionType: 'initial_stock',
        quantity: itemData.quantityInStock || 0,
        unitPrice: itemData.unitPrice,
        reference: 'Initial stock entry',
        performedBy: itemData.createdBy
      });

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
   * Update stock levels
   */
  async updateStock(itemId, quantity, transactionType, metadata) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current stock
      const currentStockQuery = 'SELECT quantity_in_stock FROM inventory_items WHERE id = $1 FOR UPDATE';
      const currentStock = await client.query(currentStockQuery, [itemId]);
      
      if (currentStock.rows.length === 0) {
        throw new Error('Item not found');
      }

      const currentQuantity = currentStock.rows[0].quantity_in_stock;
      let newQuantity;

      // Calculate new quantity based on transaction type
      switch(transactionType) {
        case 'purchase':
        case 'return':
        case 'adjustment_increase':
          newQuantity = currentQuantity + quantity;
          break;
        case 'dispensing':
        case 'wastage':
        case 'expiry':
        case 'adjustment_decrease':
          newQuantity = currentQuantity - quantity;
          if (newQuantity < 0) {
            throw new Error('Insufficient stock');
          }
          break;
        default:
          throw new Error('Invalid transaction type');
      }

      // Update stock level
      const updateQuery = `
        UPDATE inventory_items 
        SET 
          quantity_in_stock = $1,
          last_updated = NOW()
        WHERE id = $2
        RETURNING *
      `;

      const updateResult = await client.query(updateQuery, [newQuantity, itemId]);

      // Create transaction record
      await this.createStockTransaction(client, {
        itemId,
        transactionType,
        quantity,
        previousQuantity: currentQuantity,
        newQuantity,
        ...metadata
      });

      // Check if reorder needed
      const item = updateResult.rows[0];
      if (item.quantity_in_stock <= item.reorder_level) {
        await this.createReorderAlert(client, item);
      }

      await client.query('COMMIT');
      return updateResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create stock transaction record
   */
  async createStockTransaction(client, transactionData) {
    const query = `
      INSERT INTO stock_transactions (
        item_id, transaction_type, quantity,
        previous_quantity, new_quantity,
        unit_price, total_value,
        reference_number, notes,
        performed_by, transaction_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      RETURNING *
    `;

    const values = [
      transactionData.itemId,
      transactionData.transactionType,
      transactionData.quantity,
      transactionData.previousQuantity || 0,
      transactionData.newQuantity || transactionData.quantity,
      transactionData.unitPrice || 0,
      transactionData.quantity * (transactionData.unitPrice || 0),
      transactionData.reference || null,
      transactionData.notes || null,
      transactionData.performedBy
    ];

    return await client.query(query, values);
  }

  /**
   * Dispense medication
   */
  async dispenseMedication(dispensingData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update stock for each item
      for (const item of dispensingData.items) {
        await this.updateStock(item.itemId, item.quantity, 'dispensing', {
          patientId: dispensingData.patientId,
          prescriptionId: dispensingData.prescriptionId,
          reference: `DISP-${dispensingData.patientId}-${Date.now()}`,
          performedBy: dispensingData.dispensedBy,
          notes: `Dispensed to patient: ${dispensingData.patientName}`
        });
      }

      // Create dispensing record
      const dispensingQuery = `
        INSERT INTO dispensing_records (
          patient_id, patient_name, prescription_id,
          items, total_amount, payment_status,
          dispensed_by, dispensed_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `;

      const totalAmount = dispensingData.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );

      const values = [
        dispensingData.patientId,
        dispensingData.patientName,
        dispensingData.prescriptionId || null,
        JSON.stringify(dispensingData.items),
        totalAmount,
        dispensingData.paymentStatus || 'pending',
        dispensingData.dispensedBy
      ];

      const result = await client.query(dispensingQuery, values);

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
   * Create reorder alert
   */
  async createReorderAlert(client, item) {
    const query = `
      INSERT INTO reorder_alerts (
        item_id, item_name, current_stock,
        reorder_level, suggested_quantity,
        supplier_name, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())
      ON CONFLICT (item_id) WHERE status = 'pending'
      DO UPDATE SET 
        current_stock = $3,
        updated_at = NOW()
      RETURNING *
    `;

    const suggestedQuantity = item.maximum_stock_level - item.quantity_in_stock;

    const values = [
      item.id,
      item.name,
      item.quantity_in_stock,
      item.reorder_level,
      suggestedQuantity,
      item.supplier_name
    ];

    return await client.query(query, values);
  }

  /**
   * Get reorder alerts
   */
  async getReorderAlerts(hospitalId, status = 'pending') {
    const query = `
      SELECT 
        ra.*,
        ii.item_code,
        ii.category,
        ii.unit_price,
        ii.supplier_name,
        ii.supplier_id
      FROM reorder_alerts ra
      JOIN inventory_items ii ON ra.item_id = ii.id
      WHERE ii.hospital_id = $1
      AND ra.status = $2
      ORDER BY ra.created_at DESC
    `;

    const result = await pool.query(query, [hospitalId, status]);
    return result.rows;
  }

  /**
   * Track medical equipment
   */
  async addMedicalEquipment(equipmentData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Generate equipment ID
      const equipmentId = `EQP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Insert equipment record
      const equipmentQuery = `
        INSERT INTO medical_equipment (
          equipment_id, name, category, model,
          serial_number, manufacturer, 
          purchase_date, purchase_price,
          warranty_expiry, maintenance_schedule,
          last_maintenance_date, next_maintenance_date,
          location, department, status,
          condition_status, notes, hospital_id,
          created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW())
        RETURNING *
      `;

      const values = [
        equipmentId,
        equipmentData.name,
        equipmentData.category,
        equipmentData.model || null,
        equipmentData.serialNumber,
        equipmentData.manufacturer || null,
        equipmentData.purchaseDate || null,
        equipmentData.purchasePrice || 0,
        equipmentData.warrantyExpiry || null,
        equipmentData.maintenanceSchedule || 'quarterly',
        equipmentData.lastMaintenanceDate || null,
        equipmentData.nextMaintenanceDate || null,
        equipmentData.location || null,
        equipmentData.department || null,
        'active',
        equipmentData.conditionStatus || 'good',
        equipmentData.notes || null,
        equipmentData.hospitalId
      ];

      const result = await client.query(equipmentQuery, values);

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
   * Schedule equipment maintenance
   */
  async scheduleMaintenance(equipmentId, maintenanceData) {
    const query = `
      INSERT INTO equipment_maintenance (
        equipment_id, maintenance_type,
        scheduled_date, technician,
        estimated_cost, notes,
        status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', NOW())
      RETURNING *
    `;

    const values = [
      equipmentId,
      maintenanceData.maintenanceType || 'routine',
      maintenanceData.scheduledDate,
      maintenanceData.technician || null,
      maintenanceData.estimatedCost || 0,
      maintenanceData.notes || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Get expiring items
   */
  async getExpiringItems(hospitalId, daysAhead = 90) {
    const query = `
      SELECT 
        *,
        DATE_PART('day', expiry_date - CURRENT_DATE) as days_until_expiry
      FROM inventory_items
      WHERE hospital_id = $1
      AND expiry_date IS NOT NULL
      AND expiry_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
      AND quantity_in_stock > 0
      ORDER BY expiry_date ASC
    `;

    const result = await pool.query(query, [hospitalId]);
    return result.rows;
  }

  /**
   * Get stock valuation
   */
  async getStockValuation(hospitalId, category = null) {
    let query = `
      SELECT 
        category,
        COUNT(*) as item_count,
        SUM(quantity_in_stock) as total_units,
        SUM(quantity_in_stock * unit_price) as total_value,
        AVG(quantity_in_stock) as avg_stock_level
      FROM inventory_items
      WHERE hospital_id = $1
      AND status = 'active'
    `;

    const params = [hospitalId];

    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }

    query += ' GROUP BY category ORDER BY total_value DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get stock movement report
   */
  async getStockMovementReport(hospitalId, startDate, endDate) {
    const query = `
      SELECT 
        DATE(st.transaction_date) as date,
        st.transaction_type,
        ii.category,
        COUNT(*) as transaction_count,
        SUM(st.quantity) as total_quantity,
        SUM(st.total_value) as total_value
      FROM stock_transactions st
      JOIN inventory_items ii ON st.item_id = ii.id
      WHERE ii.hospital_id = $1
      AND st.transaction_date BETWEEN $2 AND $3
      GROUP BY DATE(st.transaction_date), st.transaction_type, ii.category
      ORDER BY date DESC, total_value DESC
    `;

    const result = await pool.query(query, [hospitalId, startDate, endDate]);
    return result.rows;
  }

  /**
   * Perform stock audit
   */
  async performStockAudit(auditData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create audit record
      const auditQuery = `
        INSERT INTO stock_audits (
          audit_date, performed_by,
          items_audited, discrepancies_found,
          notes, hospital_id, status
        ) VALUES (NOW(), $1, $2, $3, $4, $5, 'completed')
        RETURNING *
      `;

      const discrepancies = [];
      
      for (const item of auditData.items) {
        const currentStockQuery = 'SELECT quantity_in_stock FROM inventory_items WHERE id = $1';
        const currentStock = await client.query(currentStockQuery, [item.itemId]);
        
        if (currentStock.rows[0].quantity_in_stock !== item.physicalCount) {
          discrepancies.push({
            itemId: item.itemId,
            systemCount: currentStock.rows[0].quantity_in_stock,
            physicalCount: item.physicalCount,
            variance: item.physicalCount - currentStock.rows[0].quantity_in_stock
          });

          // Update stock to match physical count
          if (auditData.adjustStock) {
            const adjustmentType = item.physicalCount > currentStock.rows[0].quantity_in_stock 
              ? 'adjustment_increase' 
              : 'adjustment_decrease';
            
            const adjustmentQuantity = Math.abs(item.physicalCount - currentStock.rows[0].quantity_in_stock);
            
            await this.updateStock(item.itemId, adjustmentQuantity, adjustmentType, {
              reference: `AUDIT-${Date.now()}`,
              performedBy: auditData.performedBy,
              notes: 'Stock audit adjustment'
            });
          }
        }
      }

      const auditValues = [
        auditData.performedBy,
        auditData.items.length,
        JSON.stringify(discrepancies),
        auditData.notes || null,
        auditData.hospitalId
      ];

      const auditResult = await client.query(auditQuery, auditValues);

      await client.query('COMMIT');
      return {
        audit: auditResult.rows[0],
        discrepancies
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get inventory items
   */
  async getInventoryItems(params = {}) {
    try {
      const { hospital_id, category, status, limit = 50, offset = 0 } = params;
      
      let query = 'SELECT * FROM inventory_items WHERE 1=1';
      const queryParams = [];
      let paramCount = 0;

      if (hospital_id) {
        queryParams.push(hospital_id);
        query += ` AND hospital_id = $${++paramCount}`;
      }
      
      if (category) {
        queryParams.push(category);
        query += ` AND category = $${++paramCount}`;
      }
      
      if (status) {
        queryParams.push(status);
        query += ` AND status = $${++paramCount}`;
      }

      query += ' ORDER BY item_name ASC';
      
      queryParams.push(limit);
      query += ` LIMIT $${++paramCount}`;
      
      queryParams.push(offset);
      query += ` OFFSET $${++paramCount}`;

      const result = await pool.query(query, queryParams);
      
      return {
        success: true,
        data: result.rows,
        total: result.rowCount
      };
    } catch (error) {
      console.error('Error getting inventory items:', error);
      return { 
        success: false, 
        data: [], 
        error: error.message 
      };
    }
  }

  /**
   * Get reorder alerts
   */
  async getReorderAlerts(hospitalId) {
    try {
      const query = `
        SELECT 
          ii.*,
          (ii.quantity_in_stock - ii.reorder_level) as stock_deficit
        FROM inventory_items ii
        WHERE ii.hospital_id = $1
          AND ii.quantity_in_stock <= ii.reorder_level
          AND ii.status = 'active'
        ORDER BY stock_deficit ASC
      `;
      
      const result = await pool.query(query, [hospitalId || null]);
      
      return {
        success: true,
        data: result.rows,
        total: result.rowCount
      };
    } catch (error) {
      console.error('Error getting reorder alerts:', error);
      return {
        success: false,
        data: [],
        error: error.message
      };
    }
  }
}

module.exports = new InventoryEnhancedService();

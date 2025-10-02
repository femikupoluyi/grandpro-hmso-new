const pool = require('../config/database');

class InventoryService {
  // Add new inventory item
  async addInventoryItem(itemData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create inventory item
      const itemQuery = `
        INSERT INTO inventory_items (
          item_code, item_name, category, item_type, unit_of_measure,
          quantity_in_stock, reorder_level, reorder_quantity,
          unit_cost, selling_price, supplier_id, expiry_date,
          batch_number, location, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
        RETURNING *
      `;

      const itemCode = `${itemData.category.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;

      const values = [
        itemCode,
        itemData.itemName,
        itemData.category, // MEDICATION, CONSUMABLE, EQUIPMENT
        itemData.itemType,
        itemData.unitOfMeasure,
        itemData.quantityInStock,
        itemData.reorderLevel,
        itemData.reorderQuantity,
        itemData.unitCost,
        itemData.sellingPrice,
        itemData.supplierId,
        itemData.expiryDate,
        itemData.batchNumber,
        itemData.location,
        'ACTIVE'
      ];

      const result = await client.query(itemQuery, values);
      const item = result.rows[0];

      // Record stock movement
      const movementQuery = `
        INSERT INTO stock_movements (
          item_id, movement_type, quantity, reference_number,
          reason, performed_by, movement_date, unit_cost,
          total_cost, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)
      `;

      await client.query(movementQuery, [
        item.id,
        'STOCK_IN',
        itemData.quantityInStock,
        `PO${Date.now().toString().slice(-8)}`,
        'Initial stock',
        itemData.createdBy,
        itemData.unitCost,
        itemData.unitCost * itemData.quantityInStock,
        itemData.notes
      ]);

      await client.query('COMMIT');

      return {
        success: true,
        item
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Update stock levels
  async updateStock(stockData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current stock
      const currentStockQuery = 'SELECT * FROM inventory_items WHERE id = $1';
      const currentStock = await client.query(currentStockQuery, [stockData.itemId]);
      
      if (currentStock.rows.length === 0) {
        throw new Error('Item not found');
      }

      const item = currentStock.rows[0];
      let newQuantity = parseFloat(item.quantity_in_stock);

      // Calculate new quantity based on movement type
      if (stockData.movementType === 'STOCK_IN' || stockData.movementType === 'PURCHASE') {
        newQuantity += stockData.quantity;
      } else if (stockData.movementType === 'STOCK_OUT' || stockData.movementType === 'DISPENSED') {
        if (newQuantity < stockData.quantity) {
          throw new Error('Insufficient stock');
        }
        newQuantity -= stockData.quantity;
      } else if (stockData.movementType === 'ADJUSTMENT') {
        newQuantity = stockData.newQuantity;
      }

      // Update stock level
      const updateQuery = `
        UPDATE inventory_items 
        SET quantity_in_stock = $1, last_updated = NOW()
        WHERE id = $2
        RETURNING *
      `;

      await client.query(updateQuery, [newQuantity, stockData.itemId]);

      // Record movement
      const movementQuery = `
        INSERT INTO stock_movements (
          item_id, movement_type, quantity, reference_number,
          reason, performed_by, movement_date, unit_cost,
          total_cost, notes, previous_quantity, new_quantity
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, $11)
      `;

      await client.query(movementQuery, [
        stockData.itemId,
        stockData.movementType,
        stockData.quantity,
        stockData.referenceNumber || `MOV${Date.now().toString().slice(-8)}`,
        stockData.reason,
        stockData.performedBy,
        item.unit_cost,
        item.unit_cost * stockData.quantity,
        stockData.notes,
        item.quantity_in_stock,
        newQuantity
      ]);

      // Check if reorder needed
      if (newQuantity <= parseFloat(item.reorder_level)) {
        await this.createReorderAlert(item);
      }

      await client.query('COMMIT');

      return {
        success: true,
        previousQuantity: item.quantity_in_stock,
        newQuantity,
        itemName: item.item_name
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Create reorder alert
  async createReorderAlert(item) {
    try {
      const alertQuery = `
        INSERT INTO inventory_alerts (
          item_id, alert_type, message, severity,
          created_at, status
        ) VALUES ($1, $2, $3, $4, NOW(), 'ACTIVE')
        ON CONFLICT (item_id, alert_type) 
        WHERE status = 'ACTIVE'
        DO NOTHING
      `;

      await pool.query(alertQuery, [
        item.id,
        'REORDER_NEEDED',
        `Stock level for ${item.item_name} is below reorder level. Current: ${item.quantity_in_stock}, Reorder Level: ${item.reorder_level}`,
        'HIGH'
      ]);
    } catch (error) {
      console.error('Error creating reorder alert:', error);
    }
  }

  // Get low stock items
  async getLowStockItems(hospitalId) {
    try {
      const query = `
        SELECT 
          i.*,
          s.name as supplier_name,
          s.contact_phone as supplier_phone,
          CASE 
            WHEN i.quantity_in_stock = 0 THEN 'OUT_OF_STOCK'
            WHEN i.quantity_in_stock <= i.reorder_level * 0.5 THEN 'CRITICAL'
            WHEN i.quantity_in_stock <= i.reorder_level THEN 'LOW'
            ELSE 'ADEQUATE'
          END as stock_status
        FROM inventory_items i
        LEFT JOIN suppliers s ON i.supplier_id = s.id
        WHERE i.quantity_in_stock <= i.reorder_level
        ${hospitalId ? 'AND i.hospital_id = $1' : ''}
        ORDER BY 
          CASE 
            WHEN i.quantity_in_stock = 0 THEN 1
            WHEN i.quantity_in_stock <= i.reorder_level * 0.5 THEN 2
            ELSE 3
          END,
          i.item_name
      `;

      const values = hospitalId ? [hospitalId] : [];
      const result = await pool.query(query, values);

      return {
        success: true,
        items: result.rows,
        summary: {
          outOfStock: result.rows.filter(i => i.quantity_in_stock == 0).length,
          critical: result.rows.filter(i => i.stock_status === 'CRITICAL').length,
          low: result.rows.filter(i => i.stock_status === 'LOW').length
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get expiring items
  async getExpiringItems(daysAhead = 90, hospitalId) {
    try {
      const query = `
        SELECT 
          i.*,
          DATE_PART('day', i.expiry_date - CURRENT_DATE) as days_until_expiry,
          CASE 
            WHEN i.expiry_date < CURRENT_DATE THEN 'EXPIRED'
            WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'CRITICAL'
            WHEN i.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'WARNING'
            ELSE 'GOOD'
          END as expiry_status
        FROM inventory_items i
        WHERE i.expiry_date IS NOT NULL
        AND i.expiry_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
        ${hospitalId ? 'AND i.hospital_id = $1' : ''}
        ORDER BY i.expiry_date ASC
      `;

      const values = hospitalId ? [hospitalId] : [];
      const result = await pool.query(query, values);

      return {
        success: true,
        items: result.rows,
        summary: {
          expired: result.rows.filter(i => i.expiry_status === 'EXPIRED').length,
          critical: result.rows.filter(i => i.expiry_status === 'CRITICAL').length,
          warning: result.rows.filter(i => i.expiry_status === 'WARNING').length,
          totalValue: result.rows.reduce((sum, item) => 
            sum + (parseFloat(item.quantity_in_stock) * parseFloat(item.unit_cost)), 0)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Create purchase order
  async createPurchaseOrder(orderData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create purchase order
      const orderQuery = `
        INSERT INTO purchase_orders (
          order_number, supplier_id, order_date, expected_delivery,
          total_amount, status, created_by, notes
        ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const orderNumber = `PO${new Date().getFullYear()}${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

      const values = [
        orderNumber,
        orderData.supplierId,
        orderData.expectedDelivery,
        orderData.totalAmount,
        'PENDING',
        orderData.createdBy,
        orderData.notes
      ];

      const orderResult = await client.query(orderQuery, values);
      const order = orderResult.rows[0];

      // Add order items
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          const itemQuery = `
            INSERT INTO purchase_order_items (
              purchase_order_id, item_id, quantity_ordered,
              unit_cost, total_cost
            ) VALUES ($1, $2, $3, $4, $5)
          `;

          await client.query(itemQuery, [
            order.id,
            item.itemId,
            item.quantity,
            item.unitCost,
            item.quantity * item.unitCost
          ]);
        }
      }

      await client.query('COMMIT');

      return {
        success: true,
        order,
        orderNumber
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Receive purchase order
  async receivePurchaseOrder(receiveData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update purchase order status
      await client.query(
        'UPDATE purchase_orders SET status = $1, received_date = NOW() WHERE id = $2',
        ['RECEIVED', receiveData.orderId]
      );

      // Process each received item
      for (const item of receiveData.items) {
        // Update inventory
        const updateQuery = `
          UPDATE inventory_items 
          SET quantity_in_stock = quantity_in_stock + $1,
              last_updated = NOW()
          WHERE id = $2
        `;

        await client.query(updateQuery, [item.quantityReceived, item.itemId]);

        // Record stock movement
        const movementQuery = `
          INSERT INTO stock_movements (
            item_id, movement_type, quantity, reference_number,
            reason, performed_by, movement_date
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `;

        await client.query(movementQuery, [
          item.itemId,
          'PURCHASE',
          item.quantityReceived,
          `PO${receiveData.orderId}`,
          'Purchase order received',
          receiveData.receivedBy
        ]);

        // Update purchase order item
        await client.query(
          `UPDATE purchase_order_items 
           SET quantity_received = $1, received_date = NOW() 
           WHERE purchase_order_id = $2 AND item_id = $3`,
          [item.quantityReceived, receiveData.orderId, item.itemId]
        );
      }

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Purchase order received successfully'
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Get inventory value report
  async getInventoryValueReport(hospitalId) {
    try {
      const query = `
        SELECT 
          i.category,
          COUNT(DISTINCT i.id) as item_count,
          SUM(i.quantity_in_stock) as total_quantity,
          SUM(i.quantity_in_stock * i.unit_cost) as total_value,
          SUM(i.quantity_in_stock * i.selling_price) as potential_revenue,
          AVG(i.quantity_in_stock) as avg_quantity,
          COUNT(CASE WHEN i.quantity_in_stock = 0 THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN i.quantity_in_stock <= i.reorder_level THEN 1 END) as below_reorder
        FROM inventory_items i
        WHERE i.status = 'ACTIVE'
        ${hospitalId ? 'AND i.hospital_id = $1' : ''}
        GROUP BY i.category
        ORDER BY total_value DESC
      `;

      const values = hospitalId ? [hospitalId] : [];
      const result = await pool.query(query, values);

      const summary = result.rows.reduce((acc, row) => ({
        totalItems: acc.totalItems + parseInt(row.item_count),
        totalValue: acc.totalValue + parseFloat(row.total_value),
        potentialRevenue: acc.potentialRevenue + parseFloat(row.potential_revenue),
        outOfStock: acc.outOfStock + parseInt(row.out_of_stock),
        belowReorder: acc.belowReorder + parseInt(row.below_reorder)
      }), {
        totalItems: 0,
        totalValue: 0,
        potentialRevenue: 0,
        outOfStock: 0,
        belowReorder: 0
      });

      return {
        success: true,
        categories: result.rows,
        summary,
        profitMargin: summary.totalValue > 0 ? 
          (((summary.potentialRevenue - summary.totalValue) / summary.totalValue) * 100).toFixed(2) : 0
      };
    } catch (error) {
      throw error;
    }
  }

  // Track equipment maintenance
  async scheduleEquipmentMaintenance(maintenanceData) {
    try {
      const query = `
        INSERT INTO equipment_maintenance (
          equipment_id, maintenance_type, scheduled_date,
          description, assigned_to, priority, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [
        maintenanceData.equipmentId,
        maintenanceData.maintenanceType, // PREVENTIVE, CORRECTIVE, CALIBRATION
        maintenanceData.scheduledDate,
        maintenanceData.description,
        maintenanceData.assignedTo,
        maintenanceData.priority || 'NORMAL',
        'SCHEDULED'
      ];

      const result = await pool.query(query, values);

      return {
        success: true,
        maintenance: result.rows[0]
      };
    } catch (error) {
      throw error;
    }
  }

  // Get stock movement history
  async getStockMovements(itemId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          sm.*,
          i.item_name,
          s.name as performed_by_name
        FROM stock_movements sm
        JOIN inventory_items i ON sm.item_id = i.id
        LEFT JOIN staff s ON sm.performed_by = s.id::text
        WHERE sm.item_id = $1
        AND sm.movement_date BETWEEN $2 AND $3
        ORDER BY sm.movement_date DESC
      `;

      const result = await pool.query(query, [itemId, startDate, endDate]);

      return {
        success: true,
        movements: result.rows
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new InventoryService();

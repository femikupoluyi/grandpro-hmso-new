const express = require('express');
const router = express.Router();
const pool = require('../../../config/database');

// ============================================
// INVENTORY ITEMS MANAGEMENT
// ============================================

// Get all inventory items
router.get('/items', async (req, res) => {
  try {
    const { hospital_id, category_id, item_type, search, low_stock } = req.query;
    
    let query = `
      SELECT i.*, c.category_name, c.category_type
      FROM inventory_items i
      LEFT JOIN item_categories c ON c.id = i.category_id
      WHERE i.is_active = true`;
    
    const values = [];
    let valueIndex = 1;

    if (hospital_id) {
      query += ` AND i.hospital_id = $${valueIndex}`;
      values.push(hospital_id);
      valueIndex++;
    }

    if (category_id) {
      query += ` AND i.category_id = $${valueIndex}`;
      values.push(category_id);
      valueIndex++;
    }

    if (item_type) {
      query += ` AND i.item_type = $${valueIndex}`;
      values.push(item_type);
      valueIndex++;
    }

    if (search) {
      query += ` AND (i.item_name ILIKE $${valueIndex} OR i.item_code ILIKE $${valueIndex} OR i.generic_name ILIKE $${valueIndex})`;
      values.push(`%${search}%`);
      valueIndex++;
    }

    if (low_stock === 'true') {
      query += ` AND i.current_stock <= i.reorder_level`;
    }

    query += ` ORDER BY i.item_name`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows,
      summary: {
        total_items: result.rows.length,
        low_stock_items: result.rows.filter(item => item.current_stock <= item.reorder_level).length,
        out_of_stock: result.rows.filter(item => item.current_stock === 0).length
      }
    });
  } catch (error) {
    console.error('Error fetching inventory items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch inventory items',
      error: error.message
    });
  }
});

// Add new inventory item
router.post('/items', async (req, res) => {
  try {
    const {
      item_code, item_name, generic_name, category_id, item_type,
      drug_class, dosage_form, strength, unit_of_measure,
      reorder_level, reorder_quantity, minimum_stock, maximum_stock,
      unit_cost, selling_price, storage_conditions, shelf_location,
      is_controlled, hospital_id
    } = req.body;

    const query = `
      INSERT INTO inventory_items (
        item_code, item_name, generic_name, category_id, item_type,
        drug_class, dosage_form, strength, unit_of_measure,
        reorder_level, reorder_quantity, minimum_stock, maximum_stock,
        current_stock, unit_cost, selling_price, storage_conditions,
        shelf_location, is_controlled, hospital_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING *`;

    const values = [
      item_code, item_name, generic_name, category_id, item_type,
      drug_class, dosage_form, strength, unit_of_measure,
      reorder_level, reorder_quantity, minimum_stock, maximum_stock,
      0, unit_cost, selling_price, storage_conditions,
      shelf_location, is_controlled || false, hospital_id
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add inventory item',
      error: error.message
    });
  }
});

// Update inventory item
router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateFields = req.body;
    delete updateFields.id;
    delete updateFields.item_code;
    delete updateFields.current_stock;
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
      UPDATE inventory_items 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *`;

    const values = [id, ...Object.values(updateFields)];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update inventory item',
      error: error.message
    });
  }
});

// ============================================
// STOCK TRANSACTIONS
// ============================================

// Record stock transaction
router.post('/transactions', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      item_id, transaction_type, quantity, unit_cost,
      reference_type, reference_id, supplier_id,
      batch_number, expiry_date, notes, hospital_id
    } = req.body;

    // Get current stock
    const itemResult = await client.query(
      'SELECT current_stock FROM inventory_items WHERE id = $1',
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      throw new Error('Inventory item not found');
    }

    const currentStock = itemResult.rows[0].current_stock;
    let newStock = currentStock;

    // Calculate new stock based on transaction type
    switch (transaction_type) {
      case 'PURCHASE':
      case 'ADJUSTMENT_IN':
      case 'TRANSFER_IN':
        newStock = currentStock + quantity;
        break;
      case 'SALE':
      case 'ADJUSTMENT_OUT':
      case 'TRANSFER_OUT':
      case 'EXPIRED':
        newStock = currentStock - quantity;
        if (newStock < 0) {
          throw new Error('Insufficient stock');
        }
        break;
      default:
        throw new Error('Invalid transaction type');
    }

    // Generate transaction number
    const transactionNumber = `STX${Date.now().toString().slice(-10)}`;

    // Record transaction
    const transactionQuery = `
      INSERT INTO stock_transactions (
        transaction_number, item_id, transaction_type, transaction_date,
        quantity, unit_cost, total_cost, reference_type, reference_id,
        supplier_id, batch_number, expiry_date, stock_before, stock_after,
        performed_by, notes, hospital_id
      ) VALUES (
        $1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16
      ) RETURNING *`;

    const totalCost = quantity * (unit_cost || 0);
    const values = [
      transactionNumber, item_id, transaction_type, quantity,
      unit_cost, totalCost, reference_type, reference_id,
      supplier_id, batch_number, expiry_date, currentStock,
      newStock, req.user?.id, notes, hospital_id
    ];

    const transactionResult = await client.query(transactionQuery, values);

    // Update item stock
    await client.query(
      'UPDATE inventory_items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newStock, item_id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Stock transaction recorded successfully',
      data: transactionResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error recording stock transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record stock transaction',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get stock transactions
router.get('/transactions', async (req, res) => {
  try {
    const { item_id, transaction_type, start_date, end_date, hospital_id } = req.query;
    
    let query = `
      SELECT st.*, i.item_name, i.item_code, s.supplier_name
      FROM stock_transactions st
      JOIN inventory_items i ON i.id = st.item_id
      LEFT JOIN suppliers s ON s.id = st.supplier_id
      WHERE 1=1`;
    
    const values = [];
    let valueIndex = 1;

    if (item_id) {
      query += ` AND st.item_id = $${valueIndex}`;
      values.push(item_id);
      valueIndex++;
    }

    if (transaction_type) {
      query += ` AND st.transaction_type = $${valueIndex}`;
      values.push(transaction_type);
      valueIndex++;
    }

    if (start_date && end_date) {
      query += ` AND st.transaction_date BETWEEN $${valueIndex} AND $${valueIndex + 1}`;
      values.push(start_date, end_date);
      valueIndex += 2;
    }

    if (hospital_id) {
      query += ` AND st.hospital_id = $${valueIndex}`;
      values.push(hospital_id);
      valueIndex++;
    }

    query += ` ORDER BY st.transaction_date DESC LIMIT 100`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching stock transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock transactions',
      error: error.message
    });
  }
});

// ============================================
// PURCHASE ORDERS
// ============================================

// Create purchase order
router.post('/purchase-orders', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      supplier_id, items, expected_delivery, notes, hospital_id
    } = req.body;

    // Generate PO number
    const poNumber = `PO${Date.now().toString().slice(-10)}`;

    // Calculate totals
    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_cost;
    }

    const taxAmount = subtotal * 0.075; // 7.5% VAT
    const totalAmount = subtotal + taxAmount;

    // Create purchase order
    const poQuery = `
      INSERT INTO purchase_orders (
        po_number, supplier_id, order_date, expected_delivery,
        subtotal, tax_amount, total_amount, order_status,
        requested_by, notes, hospital_id
      ) VALUES (
        $1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10
      ) RETURNING *`;

    const poValues = [
      poNumber, supplier_id, expected_delivery, subtotal,
      taxAmount, totalAmount, 'DRAFT', req.user?.id, notes, hospital_id
    ];

    const poResult = await client.query(poQuery, poValues);
    const purchaseOrder = poResult.rows[0];

    // Add PO items
    for (const item of items) {
      await client.query(`
        INSERT INTO purchase_order_items (
          po_id, item_id, quantity_ordered, unit_cost, total_cost
        ) VALUES ($1, $2, $3, $4, $5)`,
        [purchaseOrder.id, item.item_id, item.quantity, item.unit_cost, item.quantity * item.unit_cost]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: purchaseOrder
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Get purchase orders
router.get('/purchase-orders', async (req, res) => {
  try {
    const { supplier_id, status, hospital_id } = req.query;
    
    let query = `
      SELECT po.*, s.supplier_name,
        (SELECT COUNT(*) FROM purchase_order_items WHERE po_id = po.id) as item_count
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      WHERE 1=1`;
    
    const values = [];
    let valueIndex = 1;

    if (supplier_id) {
      query += ` AND po.supplier_id = $${valueIndex}`;
      values.push(supplier_id);
      valueIndex++;
    }

    if (status) {
      query += ` AND po.order_status = $${valueIndex}`;
      values.push(status);
      valueIndex++;
    }

    if (hospital_id) {
      query += ` AND po.hospital_id = $${valueIndex}`;
      values.push(hospital_id);
      valueIndex++;
    }

    query += ` ORDER BY po.order_date DESC`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
});

// Receive purchase order
router.post('/purchase-orders/:id/receive', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { received_items } = req.body;

    // Get PO details
    const poResult = await client.query(
      'SELECT * FROM purchase_orders WHERE id = $1',
      [id]
    );

    if (poResult.rows.length === 0) {
      throw new Error('Purchase order not found');
    }

    const purchaseOrder = poResult.rows[0];

    // Process each received item
    for (const receivedItem of received_items) {
      // Update PO item
      await client.query(`
        UPDATE purchase_order_items 
        SET quantity_received = quantity_received + $1
        WHERE po_id = $2 AND item_id = $3`,
        [receivedItem.quantity_received, id, receivedItem.item_id]
      );

      // Create stock transaction
      const transactionNumber = `STX${Date.now().toString().slice(-10)}`;
      
      const itemResult = await client.query(
        'SELECT current_stock FROM inventory_items WHERE id = $1',
        [receivedItem.item_id]
      );

      const currentStock = itemResult.rows[0].current_stock;
      const newStock = currentStock + receivedItem.quantity_received;

      await client.query(`
        INSERT INTO stock_transactions (
          transaction_number, item_id, transaction_type, transaction_date,
          quantity, unit_cost, total_cost, reference_type, reference_id,
          supplier_id, batch_number, expiry_date, stock_before, stock_after,
          performed_by, hospital_id
        ) VALUES (
          $1, $2, 'PURCHASE', CURRENT_TIMESTAMP, $3, $4, $5, 'PO', $6,
          $7, $8, $9, $10, $11, $12, $13
        )`,
        [
          transactionNumber, receivedItem.item_id, receivedItem.quantity_received,
          receivedItem.unit_cost, receivedItem.quantity_received * receivedItem.unit_cost,
          id, purchaseOrder.supplier_id, receivedItem.batch_number,
          receivedItem.expiry_date, currentStock, newStock,
          req.user?.id, purchaseOrder.hospital_id
        ]
      );

      // Update inventory stock
      await client.query(
        'UPDATE inventory_items SET current_stock = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, receivedItem.item_id]
      );
    }

    // Update PO status
    await client.query(`
      UPDATE purchase_orders 
      SET order_status = 'RECEIVED', actual_delivery = CURRENT_DATE,
          received_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2`,
      [req.user?.id, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Purchase order received successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error receiving purchase order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to receive purchase order',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// ============================================
// SUPPLIERS
// ============================================

// Get suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const { hospital_id, active = true } = req.query;
    
    let query = `
      SELECT * FROM suppliers 
      WHERE is_active = $1`;
    
    const values = [active];
    let valueIndex = 2;

    if (hospital_id) {
      query += ` AND hospital_id = $${valueIndex}`;
      values.push(hospital_id);
      valueIndex++;
    }

    query += ` ORDER BY supplier_name`;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch suppliers',
      error: error.message
    });
  }
});

// Add supplier
router.post('/suppliers', async (req, res) => {
  try {
    const {
      supplier_name, contact_person, phone, email, address,
      city, state, country, business_registration, tax_id,
      payment_terms, credit_limit, hospital_id
    } = req.body;

    // Generate supplier code
    const supplierCode = `SUP${Date.now().toString().slice(-8)}`;

    const query = `
      INSERT INTO suppliers (
        supplier_code, supplier_name, contact_person, phone, email,
        address, city, state, country, business_registration, tax_id,
        payment_terms, credit_limit, hospital_id
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      ) RETURNING *`;

    const values = [
      supplierCode, supplier_name, contact_person, phone, email,
      address, city, state, country || 'Nigeria', business_registration,
      tax_id, payment_terms || 30, credit_limit, hospital_id
    ];

    const result = await pool.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Supplier added successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add supplier',
      error: error.message
    });
  }
});

// ============================================
// INVENTORY REPORTS
// ============================================

// Get inventory valuation
router.get('/reports/valuation', async (req, res) => {
  try {
    const { hospital_id, category_id } = req.query;
    
    let query = `
      SELECT 
        i.item_code, i.item_name, i.item_type, i.current_stock,
        i.unit_cost, (i.current_stock * i.unit_cost) as stock_value,
        c.category_name
      FROM inventory_items i
      LEFT JOIN item_categories c ON c.id = i.category_id
      WHERE i.is_active = true AND i.current_stock > 0`;
    
    const values = [];
    let valueIndex = 1;

    if (hospital_id) {
      query += ` AND i.hospital_id = $${valueIndex}`;
      values.push(hospital_id);
      valueIndex++;
    }

    if (category_id) {
      query += ` AND i.category_id = $${valueIndex}`;
      values.push(category_id);
      valueIndex++;
    }

    query += ` ORDER BY stock_value DESC`;

    const result = await pool.query(query, values);

    const totalValue = result.rows.reduce((sum, item) => sum + parseFloat(item.stock_value || 0), 0);

    res.json({
      success: true,
      data: {
        items: result.rows,
        summary: {
          total_items: result.rows.length,
          total_value: totalValue
        }
      }
    });
  } catch (error) {
    console.error('Error calculating inventory valuation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate inventory valuation',
      error: error.message
    });
  }
});

// Get expiring items
router.get('/reports/expiring', async (req, res) => {
  try {
    const { hospital_id, days = 90 } = req.query;
    
    let query = `
      SELECT DISTINCT ON (st.item_id, st.batch_number)
        i.item_code, i.item_name, st.batch_number, st.expiry_date,
        st.quantity as batch_quantity,
        (st.expiry_date - CURRENT_DATE) as days_to_expiry
      FROM stock_transactions st
      JOIN inventory_items i ON i.id = st.item_id
      WHERE st.expiry_date IS NOT NULL 
        AND st.expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND st.transaction_type IN ('PURCHASE', 'TRANSFER_IN')`;
    
    if (hospital_id) {
      query += ` AND i.hospital_id = $1`;
    }

    query += ` ORDER BY st.item_id, st.batch_number, st.transaction_date DESC`;

    const values = hospital_id ? [hospital_id] : [];
    const result = await pool.query(query, values);

    const expired = result.rows.filter(item => item.days_to_expiry <= 0);
    const expiringSoon = result.rows.filter(item => item.days_to_expiry > 0 && item.days_to_expiry <= 30);
    const expiringLater = result.rows.filter(item => item.days_to_expiry > 30);

    res.json({
      success: true,
      data: {
        expired: expired,
        expiring_soon: expiringSoon,
        expiring_later: expiringLater,
        summary: {
          expired_count: expired.length,
          expiring_soon_count: expiringSoon.length,
          expiring_later_count: expiringLater.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching expiring items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring items',
      error: error.message
    });
  }
});

module.exports = router;

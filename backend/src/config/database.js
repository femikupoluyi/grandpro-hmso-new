const { neon } = require('@neondatabase/serverless');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create Neon client
const sql = neon(process.env.DATABASE_URL);

// Create connection pool for complex queries
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function to execute queries
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Helper function for transactions
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const result = await sql`SELECT NOW() as current_time, current_database() as database`;
    console.log('✅ Database connected successfully');
    console.log('📅 Server time:', result[0].current_time);
    console.log('🗄️ Database:', result[0].database);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

// Initialize database connection on startup
testConnection();

module.exports = {
  sql,
  pool,
  query,
  transaction,
  testConnection
};

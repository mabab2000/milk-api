require('dotenv').config();
const pool = require('./db');

async function migrate() {
  // Enable uuid-ossp extension for UUID generation
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // Create register table with UUID id if it doesn't exist
  const createRegisterTableQuery = `
    CREATE TABLE IF NOT EXISTS register (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      fullname VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createRegisterTableQuery);

  // Create collection_center table
  const createCollectionCenterTableQuery = `
    CREATE TABLE IF NOT EXISTS collection_center (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      manager VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      price NUMERIC(10,2) NOT NULL,
      location VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createCollectionCenterTableQuery);

  // Add location column if it doesn't exist (for migrations on existing DB)
  await pool.query(`ALTER TABLE collection_center ADD COLUMN IF NOT EXISTS location VARCHAR(255) NOT NULL DEFAULT ''`);

  // Create created_collection table for recording collections
  const createCreatedCollectionTableQuery = `
    CREATE TABLE IF NOT EXISTS created_collection (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      collection_center_id UUID NOT NULL REFERENCES collection_center(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES register(id) ON DELETE CASCADE,
      quantity NUMERIC(10,2) NOT NULL,
      quality VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createCreatedCollectionTableQuery);

  // Create payments table
  const createPaymentsTableQuery = `
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      farmer_id UUID NOT NULL REFERENCES register(id) ON DELETE CASCADE,
      quantity NUMERIC(12,2) NOT NULL,
      amount NUMERIC(12,2) NOT NULL,
      payment_method VARCHAR(100) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  await pool.query(createPaymentsTableQuery);
}

module.exports = migrate;

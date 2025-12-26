const pool = require('./db');

async function migrate() {
  // Enable uuid-ossp extension for UUID generation
  await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

  // Create register table with UUID id if it doesn't exist
  const createTableQuery = `
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
  await pool.query(createTableQuery);
}

module.exports = migrate;

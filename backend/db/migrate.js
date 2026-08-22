const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST,
  port: process.env.PG_PORT,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  }
});

async function runMigration() {
  console.log('🚀 Starting Database Migration...');
  
  try {
    // 1. Run Schema
    console.log('📝 Reading schema.sql...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    console.log('⏳ Executing schema...');
    await pool.query(schemaSql);
    console.log('✅ Schema executed successfully.');

    // 2. Run Seed (only if no data exists yet)
    const existing = await pool.query('SELECT COUNT(*) FROM products');
    if (parseInt(existing.rows[0].count) === 0) {
      console.log('📝 Reading seed.sql...');
      const seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
      
      console.log('⏳ Executing seed data...');
      await pool.query(seedSql);
      console.log('✅ Seed data executed successfully.');
    } else {
      console.log('⏭️  Seed data skipped (products already exist).');
    }

    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

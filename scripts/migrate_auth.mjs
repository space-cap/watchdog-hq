import pkg from 'pg';
const { Client } = pkg;

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_vpI7DBm0oRew@ep-young-breeze-aoz29ou7.c-2.ap-southeast-1.aws.neon.tech:5432/watchdogdb?sslmode=require";

async function runAuthMigration() {
  console.log('[Auth Migration] Connecting to Neon PostgreSQL database...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('[Auth Migration] Connected successfully!');

    console.log('[Auth Migration] Adding password_hash column to users table...');
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    `);

    console.log('[Auth Migration] Successfully added password_hash column!');
  } catch (err) {
    console.error('[Auth Migration] Error:', err);
  } finally {
    await client.end();
  }
}

runAuthMigration();

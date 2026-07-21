import pkg from 'pg';
const { Client } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_vpI7DBm0oRew@ep-young-breeze-aoz29ou7.c-2.ap-southeast-1.aws.neon.tech:5432/watchdogdb?sslmode=require";

async function runMigration() {
  console.log('[Migration] Connecting to Neon PostgreSQL database...');
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('[Migration] Connected successfully!');

    // Read DDL script
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('[Migration] Executing init.sql DDL script...');
    await client.query(sql);

    // Create partition for current month if health_logs is partitioned
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const nextMonthDate = new Date(year, now.getMonth() + 1, 1);
    const nextYear = nextMonthDate.getFullYear();
    const nextMonth = String(nextMonthDate.getMonth() + 1).padStart(2, '0');

    const partitionName = `health_logs_${year}_${month}`;
    const startDate = `${year}-${month}-01`;
    const endDate = `${nextYear}-${nextMonth}-01`;

    const createPartitionSQL = `
      CREATE TABLE IF NOT EXISTS ${partitionName} PARTITION OF health_logs
      FOR VALUES FROM ('${startDate}') TO ('${endDate}');
    `;

    console.log(`[Migration] Creating current month partition ${partitionName}...`);
    await client.query(createPartitionSQL);

    // Insert sample initial targets if health_targets is empty
    const checkTargets = await client.query('SELECT COUNT(*) FROM health_targets');
    if (parseInt(checkTargets.rows[0].count) === 0) {
      console.log('[Migration] Inserting default health check targets...');
      await client.query(`
        INSERT INTO health_targets (name, url, interval_seconds, timeout_seconds, is_active)
        VALUES 
          ('Local Front (Vite)', 'http://localhost:5173/api/health', 5, 2, true),
          ('Local Backend (Redwood)', 'http://localhost:8910/api/health', 5, 2, true);
      `);
    }

    console.log('[Migration] Migration completed successfully! Database is ready.');
  } catch (err) {
    console.error('[Migration] [Error] Migration failed:', err);
  } finally {
    await client.end();
  }
}

runMigration();

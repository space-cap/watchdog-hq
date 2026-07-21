import { Pool } from 'pg';
import { createClient, Client as LibSqlClient } from '@libsql/client';

// Determine Database Mode: 'sqlite' (default for dev) or 'postgres'
const DB_TYPE = (process.env.DATABASE_TYPE || (process.env.NODE_ENV === 'production' ? 'postgres' : 'sqlite')).toLowerCase();

// PostgreSQL Connection Pool (Used in production or when DATABASE_TYPE=postgres)
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vpI7DBm0oRew@ep-young-breeze-aoz29ou7.c-2.ap-southeast-1.aws.neon.tech:5432/watchdogdb?sslmode=require';

export const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// SQLite Client (Used in development to prevent Cloud PG rate limits)
let sqliteClient: LibSqlClient | null = null;
let isSqliteInitialized = false;

if (DB_TYPE === 'sqlite') {
  sqliteClient = createClient({
    url: 'file:watchdog.db',
  });
}

/**
 * Initializes local SQLite tables automatically if they do not exist.
 */
async function initSqliteTables() {
  if (!sqliteClient || isSqliteInitialized) return;

  try {
    await sqliteClient.batch([
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        password_hash TEXT,
        name TEXT,
        plan_tier TEXT DEFAULT 'Free',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan_tier TEXT DEFAULT 'Free',
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS health_targets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        interval_seconds INTEGER DEFAULT 60,
        timeout_seconds INTEGER DEFAULT 5,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS health_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        target_id INTEGER NOT NULL,
        status_code INTEGER,
        latency_ms INTEGER DEFAULT 0,
        is_success INTEGER DEFAULT 1,
        error_message TEXT DEFAULT '',
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
      `CREATE TABLE IF NOT EXISTS alert_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        channel_type TEXT NOT NULL,
        webhook_url TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );`,
    ]);

    isSqliteInitialized = true;
    console.log('✅ Local SQLite database (watchdog.db) initialized successfully.');

    // Migration helper for existing watchdog.db files created before password_hash was added
    try {
      await sqliteClient.execute('ALTER TABLE users ADD COLUMN password_hash TEXT;');
    } catch {
      // Column already exists
    }
  } catch (error) {
    console.error('❌ Failed to initialize SQLite tables:', error);
  }
}

// In-memory fallback storage
export interface MemoryTarget {
  id: number;
  name: string;
  url: string;
  interval_seconds: number;
  timeout_seconds: number;
  is_active: boolean;
  created_at: Date;
}

export interface MemoryLog {
  id: number;
  target_id: number;
  status_code: number;
  latency_ms: number;
  is_success: boolean;
  error_message: string;
  timestamp: Date;
}

class MemoryStore {
  targets: MemoryTarget[] = [];
  logs: MemoryLog[] = [];
  private nextTargetId = 1;
  private nextLogId = 1;

  getTargets(): MemoryTarget[] {
    return this.targets.filter((t) => t.is_active);
  }

  addTarget(name: string, url: string, interval_seconds: number, timeout_seconds: number): MemoryTarget {
    const newTarget: MemoryTarget = {
      id: this.nextTargetId++,
      name,
      url,
      interval_seconds: interval_seconds || 60,
      timeout_seconds: timeout_seconds || 5,
      is_active: true,
      created_at: new Date(),
    };
    this.targets.push(newTarget);
    return newTarget;
  }

  deleteTarget(id: number): boolean {
    const index = this.targets.findIndex((t) => t.id === id);
    if (index !== -1) {
      this.targets[index].is_active = false;
      return true;
    }
    return false;
  }

  addLogs(reports: Array<{ target_id: number; status_code: number; latency_ms: number; is_success: boolean; error_message: string; timestamp?: string }>) {
    reports.forEach((r) => {
      this.logs.push({
        id: this.nextLogId++,
        target_id: r.target_id,
        status_code: r.status_code,
        latency_ms: r.latency_ms,
        is_success: r.is_success,
        error_message: r.error_message || '',
        timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
      });
    });
  }

  getStatusList(isAdmin: boolean = true) {
    return this.targets.filter((t) => t.is_active).map((target) => {
      const targetLogs = this.logs
        .filter((l) => l.target_id === target.id)
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      const latestLog = targetLogs[0];
      const history = targetLogs.slice(0, 10).map((l) => (l.is_success ? 1 : 0)).reverse();

      let status = 'PENDING';
      if (latestLog) {
        status = latestLog.is_success ? 'ONLINE' : 'OFFLINE';
      }

      return {
        id: target.id,
        name: target.name,
        url: isAdmin ? target.url : 'Hidden (Admin Only)',
        interval_seconds: target.interval_seconds,
        status,
        last_check: latestLog ? latestLog.timestamp.toISOString() : null,
        last_latency_ms: latestLog ? latestLog.latency_ms : 0,
        last_status_code: latestLog ? latestLog.status_code : 0,
        error_message: latestLog ? latestLog.error_message : '',
        history,
      };
    });
  }
}

export const memoryStore = new MemoryStore();

/**
 * Universal Database Query Helper (Dual Engine: SQLite for Dev, PostgreSQL for Prod)
 */
export async function queryDB<T>(text: string, params: any[] = []): Promise<T[]> {
  // 1. SQLite Driver Mode
  if (DB_TYPE === 'sqlite' && sqliteClient) {
    try {
      await initSqliteTables();

      // Convert PG style placeholders ($1, $2) to SQLite style (?)
      const sqliteSql = text.replace(/\$\d+/g, '?');

      // Convert boolean params (true/false) to SQLite integers (1/0)
      const formattedParams = params.map((p) => {
        if (typeof p === 'boolean') return p ? 1 : 0;
        if (p instanceof Date) return p.toISOString();
        return p;
      });

      const res = await sqliteClient.execute({
        sql: sqliteSql,
        args: formattedParams,
      });

      // Map rows to plain objects
      const rows = res.rows.map((row) => {
        const obj: any = {};
        for (const col of res.columns) {
          let val = (row as any)[col];
          // Convert SQLite integer boolean representation to JS boolean for consistency
          if (col === 'is_active' || col === 'is_success') {
            val = val === 1 || val === true;
          }
          obj[col] = val;
        }
        return obj;
      });

      // If INSERT query and RETURNING was requested but rows is empty, return lastInsertRowid
      if (rows.length === 0 && res.lastInsertRowid !== undefined && res.lastInsertRowid !== null) {
        return [{ id: Number(res.lastInsertRowid) }] as T[];
      }

      return rows as T[];
    } catch (err) {
      console.error('SQLite query error:', err);
      return [] as T[];
    }
  }

  // 2. PostgreSQL Driver Mode (Production)
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (err) {
    console.error('PostgreSQL query error:', err);
    return [] as T[];
  }
}

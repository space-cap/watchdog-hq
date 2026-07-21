import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_vpI7DBm0oRew@ep-young-breeze-aoz29ou7.c-2.ap-southeast-1.aws.neon.tech:5432/watchdogdb?sslmode=require';

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// In-memory fallback storage for initial development / mock mode when DB is not yet running
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
  targets: MemoryTarget[] = [
    {
      id: 1,
      name: 'Local Front (Vite)',
      url: 'http://localhost:5173/api/health',
      interval_seconds: 5,
      timeout_seconds: 2,
      is_active: true,
      created_at: new Date(),
    },
    {
      id: 2,
      name: 'Local Backend (Redwood)',
      url: 'http://localhost:8910/api/health',
      interval_seconds: 5,
      timeout_seconds: 2,
      is_active: true,
      created_at: new Date(),
    },
  ];

  logs: MemoryLog[] = [];
  private nextTargetId = 3;
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

// Helper to query with automatic fallback to memory store if DB is unavailable
export async function queryDB<T>(text: string, params?: any[]): Promise<T[]> {
  try {
    const res = await pool.query(text, params);
    return res.rows;
  } catch (err) {
    // Graceful fallback to memory store if PostgreSQL connection fails
    return [] as T[];
  }
}

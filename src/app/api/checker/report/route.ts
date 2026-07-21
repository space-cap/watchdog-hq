import { NextRequest, NextResponse } from 'next/server';
import { queryDB, memoryStore } from '@/lib/db';
import { dispatchAlerts } from '@/lib/notifier';

const CHECKER_TOKEN = process.env.CHECKER_TOKEN || 'watchdog-secret-token';

interface ReportItem {
  target_id: number;
  status_code: number;
  latency_ms: number;
  is_success: boolean;
  error_message?: string;
  timestamp?: string;
}

// In-memory cache for target status transition detection (targetId -> isSuccess)
const targetStatusCache = new Map<number, boolean>();

export async function POST(request: NextRequest) {
  const token = request.headers.get('X-Checker-Token');

  if (token !== CHECKER_TOKEN) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing X-Checker-Token header' },
      { status: 401 }
    );
  }

  try {
    const reports: ReportItem[] = await request.json();

    if (!Array.isArray(reports) || reports.length === 0) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Body must be a non-empty array of report objects' },
        { status: 400 }
      );
    }

    // Process DB insertion & state transition alerts
    let dbSuccess = false;
    try {
      for (const item of reports) {
        await queryDB(
          `INSERT INTO health_logs (target_id, status_code, latency_ms, is_success, error_message, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            item.target_id,
            item.status_code || null,
            item.latency_ms || 0,
            item.is_success,
            item.error_message || '',
            item.timestamp ? new Date(item.timestamp) : new Date(),
          ]
        );
      }
      dbSuccess = true;
    } catch {
      dbSuccess = false;
    }

    // Transition detection & Alert Trigger
    for (const item of reports) {
      const prevSuccess = targetStatusCache.get(item.target_id);

      if (prevSuccess === undefined) {
        // Initialize status cache: assume initial state was success (ONLINE)
        targetStatusCache.set(item.target_id, true);
        if (!item.is_success) {
          // If initial check fails, trigger transition alert right away
          triggerTransitionAlert(item);
        }
      } else if (prevSuccess !== item.is_success) {
        // State transition detected! (ONLINE -> OFFLINE or OFFLINE -> ONLINE)
        targetStatusCache.set(item.target_id, item.is_success);
        triggerTransitionAlert(item);
      }
    }

    // Always keep memoryStore updated for seamless development UI updates
    memoryStore.addLogs(
      reports.map((r) => ({
        ...r,
        error_message: r.error_message || '',
      }))
    );

    return NextResponse.json({
      status: 'success',
      processed_records: reports.length,
      db_persisted: dbSuccess,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

async function triggerTransitionAlert(item: ReportItem) {
  let targetName = `Target #${item.target_id}`;
  let targetUrl = 'http://localhost';
  let userId: string | undefined = undefined;

  try {
    const targets = await queryDB<any>(
      'SELECT name, url, user_id FROM health_targets WHERE id = $1',
      [item.target_id]
    );
    if (targets && targets[0]) {
      targetName = targets[0].name;
      targetUrl = targets[0].url;
      userId = targets[0].user_id;
    } else {
      const memTarget = memoryStore.targets.find((t) => t.id === item.target_id);
      if (memTarget) {
        targetName = memTarget.name;
        targetUrl = memTarget.url;
      }
    }
  } catch {
    const memTarget = memoryStore.targets.find((t) => t.id === item.target_id);
    if (memTarget) {
      targetName = memTarget.name;
      targetUrl = memTarget.url;
    }
  }

  // Asynchronously dispatch alerts
  dispatchAlerts(
    item.target_id,
    targetName,
    targetUrl,
    item.is_success,
    item.status_code,
    item.latency_ms,
    item.error_message,
    userId
  );
}

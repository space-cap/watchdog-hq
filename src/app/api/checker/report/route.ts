import { NextRequest, NextResponse } from 'next/server';
import { queryDB, memoryStore } from '@/lib/db';

const CHECKER_TOKEN = process.env.CHECKER_TOKEN || 'watchdog-secret-token';

interface ReportItem {
  target_id: number;
  status_code: number;
  latency_ms: number;
  is_success: boolean;
  error_message?: string;
  timestamp?: string;
}

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

    // Try storing in PostgreSQL
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

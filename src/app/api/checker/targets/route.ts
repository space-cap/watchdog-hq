import { NextRequest, NextResponse } from 'next/server';
import { queryDB, memoryStore } from '@/lib/db';

const CHECKER_TOKEN = process.env.CHECKER_TOKEN || 'watchdog-secret-token';

export async function GET(request: NextRequest) {
  const token = request.headers.get('X-Checker-Token');

  if (token !== CHECKER_TOKEN) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing X-Checker-Token header' },
      { status: 401 }
    );
  }

  try {
    const rows = await queryDB<any>(
      'SELECT id, name, url, interval_seconds, timeout_seconds FROM health_targets WHERE is_active = true ORDER BY created_at DESC'
    );

    if (rows && rows.length > 0) {
      return NextResponse.json(rows);
    }

    // Fallback to memory store
    const targets = memoryStore.getTargets().map((t) => ({
      id: t.id,
      name: t.name,
      url: t.url,
      interval_seconds: t.interval_seconds,
      timeout_seconds: t.timeout_seconds,
    }));

    return NextResponse.json(targets);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

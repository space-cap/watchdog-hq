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
    let dbRows: any[] = [];
    try {
      dbRows = (await queryDB<any>(
        'SELECT id, name, url, interval_seconds, timeout_seconds FROM health_targets WHERE is_active = true ORDER BY created_at DESC'
      )) || [];
    } catch {
      dbRows = [];
    }

    const memoryTargets = memoryStore.getTargets();

    const dbTargetsFormatted = dbRows.map((t: any) => ({
      id: typeof t.id === 'string' ? parseInt(t.id, 10) : Number(t.id),
      name: t.name,
      url: t.url,
      interval_seconds: typeof t.interval_seconds === 'string' ? parseInt(t.interval_seconds, 10) : Number(t.interval_seconds || 5),
      timeout_seconds: typeof t.timeout_seconds === 'string' ? parseInt(t.timeout_seconds, 10) : Number(t.timeout_seconds || 2),
    }));

    const memoryTargetsFormatted = memoryTargets.map((t) => ({
      id: Number(t.id),
      name: t.name,
      url: t.url,
      interval_seconds: Number(t.interval_seconds || 5),
      timeout_seconds: Number(t.timeout_seconds || 2),
    }));

    // Merge DB and MemoryStore targets seamlessly
    const mergedMap = new Map<string, any>();
    for (const t of dbTargetsFormatted) {
      mergedMap.set(t.url, t);
    }
    for (const t of memoryTargetsFormatted) {
      if (!mergedMap.has(t.url)) {
        mergedMap.set(t.url, t);
      }
    }

    const targets = Array.from(mergedMap.values());
    return NextResponse.json(targets);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

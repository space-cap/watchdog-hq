import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryDB, memoryStore } from '@/lib/db';

const AUTH_TOKEN = process.env.AUTH_TOKEN || 'watchdog-secret-token';

async function checkIsAuthorized(request: NextRequest): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return true;
  }
  const cookie = request.cookies.get('session_token');
  if (cookie && cookie.value === AUTH_TOKEN) {
    return true;
  }
  const tokenParam = request.nextUrl.searchParams.get('token');
  return tokenParam === AUTH_TOKEN;
}

export async function GET(request: NextRequest) {
  const isAuthorized = await checkIsAuthorized(request);

  try {
    const dbTargets = await queryDB<any>(
      `SELECT t.id, t.name, t.url, t.interval_seconds
       FROM health_targets t
       WHERE t.is_active = true
       ORDER BY t.created_at DESC`
    );

    let statusList: any[] = [];

    if (dbTargets && dbTargets.length > 0) {
      for (const t of dbTargets) {
        const logs = await queryDB<any>(
          `SELECT status_code, latency_ms, is_success, error_message, timestamp
           FROM health_logs
           WHERE target_id = $1
           ORDER BY timestamp DESC
           LIMIT 10`,
          [t.id]
        );

        const latest = logs[0];
        const history = logs.map((l: any) => (l.is_success ? 1 : 0)).reverse();

        let status = 'PENDING';
        if (latest) {
          status = latest.is_success ? 'ONLINE' : 'OFFLINE';
        }

        statusList.push({
          id: t.id,
          name: t.name,
          url: isAuthorized ? t.url : 'Hidden (Admin Only)',
          interval_seconds: t.interval_seconds,
          status,
          last_check: latest ? latest.timestamp : null,
          last_latency_ms: latest ? latest.latency_ms : 0,
          last_status_code: latest ? (latest.status_code || 0) : 0,
          error_message: latest ? (latest.error_message || '') : '',
          history,
        });
      }
    } else {
      // Memory Store Fallback
      statusList = memoryStore.getStatusList(isAuthorized);
    }

    return NextResponse.json(statusList);
  } catch (error) {
    return NextResponse.json(memoryStore.getStatusList(isAuthorized));
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { queryDB, memoryStore } from '@/lib/db';

const AUTH_TOKEN = process.env.AUTH_TOKEN || 'watchdog-secret-token';

function isAdmin(request: NextRequest): boolean {
  const cookie = request.cookies.get('session_token');
  if (cookie && cookie.value === AUTH_TOKEN) {
    return true;
  }
  const tokenParam = request.nextUrl.searchParams.get('token');
  return tokenParam === AUTH_TOKEN;
}

export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Admin session cookie or token required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, url, interval_seconds, timeout_seconds } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'name and url are required' },
        { status: 400 }
      );
    }

    const interval = parseInt(interval_seconds) || 60;
    const timeout = parseInt(timeout_seconds) || 5;

    // Try PostgreSQL
    try {
      const rows = await queryDB<any>(
        `INSERT INTO health_targets (name, url, interval_seconds, timeout_seconds, is_active)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
        [name, url, interval, timeout]
      );
      if (rows && rows[0]) {
        memoryStore.addTarget(name, url, interval, timeout);
        return NextResponse.json({ status: 'created', id: rows[0].id }, { status: 201 });
      }
    } catch {
      // Fallback
    }

    const created = memoryStore.addTarget(name, url, interval, timeout);
    return NextResponse.json({ status: 'created', id: created.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Admin session cookie or token required' },
      { status: 401 }
    );
  }

  const idStr = request.nextUrl.searchParams.get('id');
  if (!idStr) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'id query parameter is required' },
      { status: 400 }
    );
  }

  const id = parseInt(idStr);

  try {
    await queryDB('UPDATE health_targets SET is_active = false WHERE id = $1', [id]);
    memoryStore.deleteTarget(id);

    return NextResponse.json({ status: 'deleted', id });
  } catch (error) {
    memoryStore.deleteTarget(id);
    return NextResponse.json({ status: 'deleted', id });
  }
}

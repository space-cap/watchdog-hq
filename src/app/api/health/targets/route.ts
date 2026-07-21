import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryDB, memoryStore } from '@/lib/db';

const AUTH_TOKEN = process.env.AUTH_TOKEN || 'watchdog-secret-token';

async function getAuthSession(request: NextRequest) {
  // 1. NextAuth user session check
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return {
      isAuthenticated: true,
      userId: (session.user as any).id || null,
      planTier: (session.user as any).planTier || 'Free',
      isAdmin: false,
    };
  }

  // 2. Admin master token check
  const cookie = request.cookies.get('session_token');
  if (cookie && cookie.value === AUTH_TOKEN) {
    return { isAuthenticated: true, userId: null, planTier: 'Pro', isAdmin: true };
  }
  const tokenParam = request.nextUrl.searchParams.get('token');
  if (tokenParam === AUTH_TOKEN) {
    return { isAuthenticated: true, userId: null, planTier: 'Pro', isAdmin: true };
  }

  return { isAuthenticated: false, userId: null, planTier: 'Free', isAdmin: false };
}

export async function POST(request: NextRequest) {
  const auth = await getAuthSession(request);

  if (!auth.isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized', message: '로그인이 필요합니다. 먼저 로그인하거나 가입해 주세요.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { name, url, interval_seconds, timeout_seconds } = body;

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Bad Request', message: '서비스 명칭과 URL을 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    const interval = parseInt(interval_seconds) || 5;
    const timeout = parseInt(timeout_seconds) || 2;

    // Check Plan limits if not admin
    if (!auth.isAdmin && auth.userId) {
      const existingTargets = await queryDB<any>(
        'SELECT COUNT(*) as count FROM health_targets WHERE user_id = $1',
        [auth.userId]
      );
      const currentCount = existingTargets && existingTargets[0] ? parseInt(existingTargets[0].count) : 0;
      const maxLimit = auth.planTier === 'Professional' ? 50 : auth.planTier === 'Starter' ? 10 : 2;

      if (currentCount >= maxLimit) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: `${auth.planTier} 플랜의 최대 타겟 등록 한도(${maxLimit}개)를 초과했습니다. 플랜을 업그레이드해 주세요.`,
          },
          { status: 403 }
        );
      }
    }

    // Try PostgreSQL
    try {
      const rows = await queryDB<any>(
        `INSERT INTO health_targets (user_id, name, url, interval_seconds, timeout_seconds, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING id`,
        [auth.userId, name, url, interval, timeout]
      );
      if (rows && rows[0]) {
        memoryStore.addTarget(name, url, interval, timeout);
        return NextResponse.json({ status: 'created', id: rows[0].id }, { status: 201 });
      }
    } catch {
      // Memory Store Fallback
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
  const auth = await getAuthSession(request);

  if (!auth.isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized', message: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  const idStr = request.nextUrl.searchParams.get('id');
  if (!idStr) {
    return NextResponse.json(
      { error: 'Bad Request', message: 'id 쿼리 인자가 필요합니다.' },
      { status: 400 }
    );
  }

  const id = parseInt(idStr);

  try {
    if (!auth.isAdmin && auth.userId) {
      await queryDB('DELETE FROM health_targets WHERE id = $1 AND user_id = $2', [
        id,
        auth.userId,
      ]);
    } else {
      await queryDB('DELETE FROM health_targets WHERE id = $1', [id]);
    }
    memoryStore.deleteTarget(id);
    return NextResponse.json({ status: 'deleted', id });
  } catch (error) {
    memoryStore.deleteTarget(id);
    return NextResponse.json({ status: 'deleted', id });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { queryDB, memoryStore } from '@/lib/db';
import { memoryStoreAlertChannels } from '@/lib/notifier';

const AUTH_TOKEN = process.env.AUTH_TOKEN || 'watchdog-secret-token';

async function getUserId(request: NextRequest): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (session?.user && (session.user as any).id) {
    return (session.user as any).id;
  }

  const cookie = request.cookies.get('session_token');
  if (cookie && cookie.value === AUTH_TOKEN) {
    return 'admin';
  }

  const tokenParam = request.nextUrl.searchParams.get('token');
  if (tokenParam === AUTH_TOKEN) {
    return 'admin';
  }

  return null;
}

export async function GET(request: NextRequest) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    if (userId !== 'admin') {
      const rows = await queryDB<any>(
        'SELECT id, channel_type, destination, is_verified, created_at FROM alert_channels WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );
      return NextResponse.json(rows || []);
    } else {
      const rows = await queryDB<any>(
        'SELECT id, channel_type, destination, is_verified, created_at FROM alert_channels ORDER BY created_at DESC'
      );
      return NextResponse.json(rows || []);
    }
  } catch (error) {
    // Memory store fallback
    return NextResponse.json(memoryStoreAlertChannels);
  }
}

export async function POST(request: NextRequest) {
  const userId = await getUserId(request);

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized', message: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { channel_type, destination } = body;

    if (!channel_type || !destination) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'channel_type 및 destination 정보가 필요합니다.' },
        { status: 400 }
      );
    }

    try {
      const dbUserId = userId === 'admin' ? null : userId;
      const rows = await queryDB<any>(
        'INSERT INTO alert_channels (user_id, channel_type, destination, is_verified) VALUES ($1, $2, $3, true) RETURNING id',
        [dbUserId, channel_type, destination]
      );
      if (rows && rows[0]) {
        memoryStoreAlertChannels.push({ channel_type, destination });
        return NextResponse.json({ status: 'created', id: rows[0].id }, { status: 201 });
      }
    } catch {
      // Fallback
    }

    memoryStoreAlertChannels.push({ channel_type, destination });
    return NextResponse.json({ status: 'created', id: Date.now() }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);

  if (!userId) {
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
    await queryDB('DELETE FROM alert_channels WHERE id = $1', [id]);
    return NextResponse.json({ status: 'deleted', id });
  } catch (error) {
    return NextResponse.json({ status: 'deleted', id });
  }
}

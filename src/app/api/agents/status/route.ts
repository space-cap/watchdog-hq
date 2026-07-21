import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const AUTH_TOKEN = process.env.AUTH_TOKEN || 'watchdog-secret-token';
const GO_SERVER_URL = process.env.GO_SERVER_URL || 'http://localhost:9090';

async function checkIsAuthorized(request: NextRequest): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (session?.user) return true;

  const cookie = request.cookies.get('session_token');
  if (cookie?.value === AUTH_TOKEN) return true;

  return request.nextUrl.searchParams.get('token') === AUTH_TOKEN;
}

/**
 * GET /api/agents/status
 * Proxies the Go monitoring server's /api/status endpoint
 * Returns latest CPU, Memory, Disk metrics per registered agent
 */
export async function GET(request: NextRequest) {
  const isAuthorized = await checkIsAuthorized(request);

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized', message: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${GO_SERVER_URL}/api/status`, {
      headers: {
        'X-Agent-Token': AUTH_TOKEN,
      },
      next: { revalidate: 0 }, // No cache - always fresh
    });

    if (!response.ok) {
      throw new Error(`Go server responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    // If Go server is not running, return empty array gracefully
    console.warn('[agents/status] Go server unreachable:', (error as Error).message);
    return NextResponse.json([]);
  }
}

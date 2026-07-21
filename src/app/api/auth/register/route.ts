import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { queryDB } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Bad Request', message: '이메일과 비밀번호를 모두 입력해 주세요.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Bad Request', message: '비밀번호는 최소 6자리 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUsers = await queryDB<any>('SELECT id FROM users WHERE email = $1', [
      normalizedEmail,
    ]);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'Conflict', message: '이미 가입된 이메일 주소입니다.' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into DB
    const newUsers = await queryDB<any>(
      'INSERT INTO users (email, name, password, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, name',
      [normalizedEmail, name || normalizedEmail.split('@')[0], hashedPassword, hashedPassword]
    );

    if (newUsers && newUsers[0]) {
      const userId = newUsers[0].id;
      // Create default Free subscription
      await queryDB(
        'INSERT INTO subscriptions (user_id, plan_tier, status) VALUES ($1, $2, $3)',
        [userId, 'Free', 'active']
      );

      return NextResponse.json(
        {
          status: 'success',
          user: {
            id: userId,
            email: newUsers[0].email || normalizedEmail,
            name: newUsers[0].name || name || normalizedEmail.split('@')[0],
          },
        },
        { status: 201 }
      );
    }

    throw new Error('데이터베이스 회원가입 처리에 실패했습니다.');
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: (error as Error).message },
      { status: 500 }
    );
  }
}

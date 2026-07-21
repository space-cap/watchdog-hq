import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import bcrypt from 'bcryptjs';
import { queryDB, memoryStore } from './db';

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'watchdog-hq-super-secret-nextauth-key-2026',
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || 'dummy-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'dummy-google-client-secret',
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || 'dummy-github-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-github-client-secret',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: '이메일', type: 'email', placeholder: 'user@example.com' },
        password: { label: '비밀번호', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('이메일과 비밀번호를 입력해주세요.');
        }

        try {
          // Query user from PostgreSQL
          const users = await queryDB<any>('SELECT * FROM users WHERE email = $1', [
            credentials.email.toLowerCase(),
          ]);

          let user = users && users[0] ? users[0] : null;

          if (!user) {
            throw new Error('등록되지 않은 이메일 계정입니다.');
          }

          if (!user.password_hash) {
            throw new Error('소셜 로그인으로 가입된 계정입니다. 소셜 버튼으로 로그인해주세요.');
          }

          const isValid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!isValid) {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }

          // Fetch user subscription tier
          const subs = await queryDB<any>('SELECT plan_tier FROM subscriptions WHERE user_id = $1', [
            user.id,
          ]);
          const planTier = subs && subs[0] ? subs[0].plan_tier : 'Free';

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email.split('@')[0],
            planTier,
          };
        } catch (error) {
          throw new Error((error as Error).message);
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          const existingUsers = await queryDB<any>('SELECT * FROM users WHERE email = $1', [
            user.email?.toLowerCase(),
          ]);

          let userId = existingUsers && existingUsers[0] ? existingUsers[0].id : null;

          if (!userId) {
            // Create new user in PostgreSQL
            const newUsers = await queryDB<any>(
              'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING id',
              [user.email?.toLowerCase(), user.name]
            );
            if (newUsers && newUsers[0]) {
              userId = newUsers[0].id;
              // Create default Free subscription
              await queryDB(
                'INSERT INTO subscriptions (user_id, plan_tier, status) VALUES ($1, $2, $3)',
                [userId, 'Free', 'active']
              );
            }
          }
          user.id = userId;
          return true;
        } catch (err) {
          console.error('OAuth signIn error:', err);
          return true;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.planTier = (user as any).planTier || 'Free';
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).planTier = token.planTier || 'Free';
      }
      return session;
    },
  },
};

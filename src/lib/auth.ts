import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { Adapter } from 'next-auth/adapters';
import { db } from '@/lib/db';

const baseAdapter = PrismaAdapter(db);

// The PrismaAdapter only persists OAuth tokens to its own `Account` table.
// Gmail sending/reply-sync reads from `IntegrationAccount` instead, so every
// linkAccount call (initial sign-in, and re-consent since we force
// prompt=consent) also upserts the corresponding IntegrationAccount row.
const adapter = {
  ...baseAdapter,
  async linkAccount(account: Parameters<NonNullable<typeof baseAdapter.linkAccount>>[0]) {
    const result = await baseAdapter.linkAccount!(account);

    if (account.provider === 'google') {
      const user = await db.user.findUnique({ where: { id: account.userId }, select: { email: true } });
      await db.integrationAccount.upsert({
        where: { userId_provider: { userId: account.userId, provider: 'GMAIL' } },
        create: {
          userId: account.userId,
          provider: 'GMAIL',
          accountEmail: user?.email,
          accessToken: account.access_token ?? undefined,
          refreshToken: account.refresh_token ?? undefined,
          expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
        },
        update: {
          accountEmail: user?.email,
          accessToken: account.access_token ?? undefined,
          // Google only returns a refresh_token on the consent it was granted for —
          // keep the existing one on subsequent logins that don't return a new one.
          ...(account.refresh_token ? { refreshToken: account.refresh_token } : {}),
          expiresAt: account.expires_at ? new Date(account.expires_at * 1000) : undefined,
          active: true,
        },
      });
    }

    return result;
  },
} as Adapter;

// CREDENTIAL REQUIRED: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
// See .env.example for instructions on creating Google OAuth credentials.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter,
  // Auth.js only auto-trusts the request host on Vercel; everywhere else
  // (Cloud Run included) it rejects the session with UntrustedHost unless
  // told to trust it, which was silently breaking every authenticated route.
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            'openid',
            'email',
            'profile',
            // Gmail send scope — requested during OAuth so the same token
            // can later be stored in IntegrationAccount for sending
            'https://www.googleapis.com/auth/gmail.send',
            'https://www.googleapis.com/auth/gmail.readonly',
          ].join(' '),
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: { strategy: 'database' },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = await db.user.findUnique({ where: { id: user.id }, select: { role: true } });
        session.user.role = dbUser?.role ?? 'USER';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
});

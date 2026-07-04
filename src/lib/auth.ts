import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { db } from '@/lib/db';

// CREDENTIAL REQUIRED: Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env
// See .env.example for instructions on creating Google OAuth credentials.
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
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

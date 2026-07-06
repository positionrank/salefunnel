import { google } from 'googleapis';
import { db } from '@/lib/db';

const REFRESH_BUFFER_MS = 2 * 60 * 1000;

// Access tokens from IntegrationAccount are ~1hr lived; anything that runs
// async (worker jobs, cron) needs to refresh them against the stored
// refreshToken rather than assuming the token saved at OAuth time is still valid.
export async function getValidGmailAccessToken(integrationAccountId: string): Promise<string> {
  const integration = await db.integrationAccount.findUnique({ where: { id: integrationAccountId } });
  if (!integration || !integration.active) throw new Error('Gmail integration account not found or inactive');

  const isExpired = !integration.expiresAt || integration.expiresAt.getTime() - REFRESH_BUFFER_MS <= Date.now();
  if (!isExpired && integration.accessToken) return integration.accessToken;

  if (!integration.refreshToken) {
    throw new Error('Gmail access token expired and no refresh token is stored — reconnect Gmail in Settings');
  }

  const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2Client.setCredentials({ refresh_token: integration.refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();

  if (!credentials.access_token) throw new Error('Failed to refresh Gmail access token');

  await db.integrationAccount.update({
    where: { id: integrationAccountId },
    data: {
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
    },
  });

  return credentials.access_token;
}

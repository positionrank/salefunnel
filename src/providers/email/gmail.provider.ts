import { google } from 'googleapis';
import type { IEmailProvider, SendEmailOptions, SendEmailResult, ThreadMessage } from './types';

// CREDENTIAL REQUIRED: accessToken must come from a stored IntegrationAccount
// record (provider=GMAIL). The token is obtained via Google OAuth during the
// Gmail integration setup in Settings → Integrations.
export class GmailProvider implements IEmailProvider {
  readonly name = 'gmail';
  readonly supportsOpenTracking = false;  // Gmail API does not support pixel tracking
  readonly supportsClickTracking = false; // Use SendGrid/Mailgun for click tracking

  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private getClient() {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: this.accessToken });
    return google.gmail({ version: 'v1', auth });
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const gmail = this.getClient();

    const fromHeader = options.fromName
      ? `${options.fromName} <${options.from}>`
      : options.from;

    const headers = [
      `From: ${fromHeader}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      options.replyTo ? `Reply-To: ${options.replyTo}` : null,
      options.inReplyToMessageId ? `In-Reply-To: <${options.inReplyToMessageId}>` : null,
      options.inReplyToMessageId ? `References: <${options.inReplyToMessageId}>` : null,
    ]
      .filter(Boolean)
      .join('\r\n');

    const raw = Buffer.from(`${headers}\r\n\r\n${options.bodyText}`)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const res = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw,
        ...(options.threadId ? { threadId: options.threadId } : {}),
      },
    });

    return {
      providerMessageId: res.data.id!,
      providerThreadId: res.data.threadId ?? undefined,
    };
  }

  async getThread(threadId: string): Promise<{ messages: ThreadMessage[] }> {
    const gmail = this.getClient();
    const res = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date'],
    });

    const messages: ThreadMessage[] = (res.data.messages ?? []).map((m) => ({
      id: m.id!,
      snippet: m.snippet ?? '',
      internalDate: m.internalDate ?? undefined,
    }));

    return { messages };
  }
}

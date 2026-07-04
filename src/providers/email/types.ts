export interface SendEmailOptions {
  to: string;
  from: string;
  fromName?: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
  replyTo?: string;
  threadId?: string;
  inReplyToMessageId?: string;
}

export interface SendEmailResult {
  providerMessageId: string;
  providerThreadId?: string;
}

export interface ThreadMessage {
  id: string;
  snippet: string;
  internalDate?: string;
}

export interface IEmailProvider {
  readonly name: string;
  readonly supportsOpenTracking: boolean;
  readonly supportsClickTracking: boolean;
  send(options: SendEmailOptions): Promise<SendEmailResult>;
  getThread(threadId: string): Promise<{ messages: ThreadMessage[] }>;
}

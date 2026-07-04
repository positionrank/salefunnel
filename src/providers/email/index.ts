import { GmailProvider } from './gmail.provider';
import type { IEmailProvider } from './types';

export type EmailProviderName = 'gmail';

// CREDENTIAL REQUIRED: pass the stored access_token from IntegrationAccount
export function createEmailProvider(
  providerName: EmailProviderName,
  accessToken: string
): IEmailProvider {
  switch (providerName) {
    case 'gmail':
      return new GmailProvider(accessToken);
    default:
      throw new Error(`Unknown email provider: ${providerName}`);
  }
}

export type { IEmailProvider, SendEmailOptions, SendEmailResult } from './types';

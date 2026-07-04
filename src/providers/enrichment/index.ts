import { WebsiteEnrichmentProvider } from './website.provider';
import type { IEnrichmentProvider } from './types';

export type EnrichmentProviderName = 'website_scrape';

export function createEnrichmentProvider(name: EnrichmentProviderName): IEnrichmentProvider {
  switch (name) {
    case 'website_scrape':
      return new WebsiteEnrichmentProvider();
    default:
      throw new Error(`Unknown enrichment provider: ${name}`);
  }
}

export function getDefaultEnrichmentProvider(): IEnrichmentProvider {
  return new WebsiteEnrichmentProvider();
}

export type { IEnrichmentProvider, CompanyEnrichmentInput, CompanyEnrichmentResult } from './types';

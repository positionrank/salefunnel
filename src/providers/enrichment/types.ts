export interface CompanyEnrichmentInput {
  name: string;
  website?: string;
  domain?: string;
}

export interface CompanyEnrichmentResult {
  description?: string;
  industry?: string;
  size?: string;
  phone?: string;
  linkedinUrl?: string;
  summary?: string;
  confidence: number;
  source: string;
}

export interface IEnrichmentProvider {
  readonly name: string;
  enrichCompany(input: CompanyEnrichmentInput): Promise<CompanyEnrichmentResult>;
}

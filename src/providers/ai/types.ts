export interface GeneratePersonalizationInput {
  companyName: string;
  website?: string;
  description?: string;
  industry?: string;
  contactName?: string;
  contactTitle?: string;
  enrichmentData?: Record<string, unknown>;
}

export interface PersonalizationOutput {
  companySummary: string;
  painPoints: string[];
  outreachAngle: string;
  icebreaker?: string;
  fitSummary: string;
  subjectSuggestions: string[];
  dataQualityNotes?: string;
  confidence: number;
}

export interface GenerateDraftInput {
  personalization: PersonalizationOutput;
  template: { subject: string; bodyText: string };
  contact: { firstName?: string; lastName?: string; title?: string; email?: string };
  company: { name: string; website?: string; industry?: string };
  stepNumber: number;
  previousEmailSnippet?: string;
  senderName?: string;
}

export interface DraftOutput {
  subject: string;
  bodyText: string;
  bodyHtml: string;
}

export interface IAIProvider {
  readonly model: string;
  generatePersonalization(input: GeneratePersonalizationInput): Promise<PersonalizationOutput>;
  generateDraft(input: GenerateDraftInput): Promise<DraftOutput>;
}

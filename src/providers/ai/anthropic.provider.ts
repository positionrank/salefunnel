import Anthropic from '@anthropic-ai/sdk';
import type { IAIProvider, GeneratePersonalizationInput, PersonalizationOutput, GenerateDraftInput, DraftOutput } from './types';

// CREDENTIAL REQUIRED: Set ANTHROPIC_API_KEY in .env
// Get from https://console.anthropic.com/
export class AnthropicProvider implements IAIProvider {
  readonly model = 'claude-sonnet-4-6';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }

  async generatePersonalization(input: GeneratePersonalizationInput): Promise<PersonalizationOutput> {
    const prompt = `You are an expert B2B outbound sales researcher. Given the following company information, generate a structured personalization brief for a cold outreach email.

Company: ${input.companyName}
${input.website ? `Website: ${input.website}` : ''}
${input.industry ? `Industry: ${input.industry}` : ''}
${input.description ? `Description: ${input.description}` : ''}
${input.contactName ? `Contact: ${input.contactName}` : ''}
${input.contactTitle ? `Title: ${input.contactTitle}` : ''}
${input.enrichmentData ? `Additional context: ${JSON.stringify(input.enrichmentData)}` : ''}

Return ONLY valid JSON matching this exact structure:
{
  "companySummary": "1-2 sentence factual summary of the company",
  "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
  "outreachAngle": "The specific angle or hook for this outreach",
  "icebreaker": "Optional: one specific observation about the company that could open the email naturally",
  "fitSummary": "Why this company is a good fit for outreach",
  "subjectSuggestions": ["subject line 1", "subject line 2", "subject line 3"],
  "dataQualityNotes": "Any notes about missing or low-confidence data",
  "confidence": 0.0
}

IMPORTANT: If there is insufficient data to generate meaningful personalization, set confidence below 0.4 and note it in dataQualityNotes. Do NOT invent specific facts. Only include what is reasonably inferrable from the provided information.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned invalid JSON for personalization');

    const parsed = JSON.parse(jsonMatch[0]) as PersonalizationOutput;
    return parsed;
  }

  async generateDraft(input: GenerateDraftInput): Promise<DraftOutput> {
    const isFollowUp = input.stepNumber > 1;

    const prompt = `You are an expert B2B cold email copywriter. Write a ${isFollowUp ? 'follow-up' : 'first-touch'} cold outreach email.

${isFollowUp ? `This is follow-up #${input.stepNumber - 1}. Reference the prior outreach naturally without being pushy.` : ''}
${input.previousEmailSnippet ? `Previous email snippet: "${input.previousEmailSnippet}"` : ''}

Recipient: ${input.contact.firstName ?? ''} ${input.contact.lastName ?? ''} ${input.contact.title ? `(${input.contact.title})` : ''}
Company: ${input.company.name}${input.company.industry ? ` (${input.company.industry})` : ''}

Personalization context:
- Summary: ${input.personalization.companySummary}
- Outreach angle: ${input.personalization.outreachAngle}
${input.personalization.icebreaker ? `- Icebreaker: ${input.personalization.icebreaker}` : ''}
- Pain points: ${input.personalization.painPoints.join(', ')}

Template to adapt:
Subject: ${input.template.subject}
Body:
${input.template.bodyText}

Instructions:
- Replace template placeholders with real personalized content
- Keep it concise (under 150 words for body)
- Sound human and genuine, not like a mass email
- Include ONE clear CTA (short call, 15 min)
- Sender name: ${input.senderName ?? 'the sender'}

Return ONLY valid JSON:
{
  "subject": "the email subject",
  "bodyText": "the plain text email body",
  "bodyHtml": "<p>the HTML email body</p>"
}`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('AI returned invalid JSON for draft');

    const parsed = JSON.parse(jsonMatch[0]) as DraftOutput;
    return parsed;
  }
}

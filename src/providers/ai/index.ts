import { AnthropicProvider } from './anthropic.provider';
import type { IAIProvider } from './types';

let instance: IAIProvider | null = null;

export function getAIProvider(): IAIProvider {
  if (!instance) instance = new AnthropicProvider();
  return instance;
}

export type { IAIProvider, GeneratePersonalizationInput, PersonalizationOutput, GenerateDraftInput, DraftOutput } from './types';

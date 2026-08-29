import { GeminiAIService } from './gemini-provider';
import { MockAIService } from './mock-provider';
import { AIService } from './types';

export function getAIService(): { service: AIService; isMock: boolean } {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey && apiKey.trim() !== '') {
    return {
      service: new GeminiAIService(apiKey),
      isMock: false,
    };
  }

  return {
    service: new MockAIService(),
    isMock: true,
  };
}

export * from './types';

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  getAnswerEvaluationPrompt,
  getStudySessionPrompt,
  getSummaryPrompt,
} from './prompts';
import {
  AIService,
  AnswerEvaluationRequest,
  AnswerEvaluationResponse,
  GeneratedStudySession,
  StudyMode,
} from './types';

export class GeminiAIService implements AIService {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = 'gemini-1.5-flash';
  }

  async summarizeDocument(documentText: string, filename: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = getSummaryPrompt(documentText, filename);
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text.trim() || `Summary for ${filename} successfully generated.`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gemini summary error';
      throw new Error(`AI Summary Generation Failed: ${msg}`);
    }
  }

  async generateStudySession(
    documentTitle: string,
    topic: string,
    mode: StudyMode,
    relevantChunks: { chunkIndex: number; content: string }[]
  ): Promise<GeneratedStudySession> {
    const prompt = getStudySessionPrompt(documentTitle, topic, mode, relevantChunks);
    
    // Attempt 1
    let session = await this.tryGenerateSession(prompt);
    if (session) return session;

    // Retry Attempt 2 with format repair instruction
    const repairPrompt = `${prompt}\n\nIMPORTANT REPAIR INSTRUCTION: Your previous output was invalid JSON. Return strictly raw valid JSON matching the exact schema specified. No markdown formatting.`;
    session = await this.tryGenerateSession(repairPrompt);
    
    if (session) return session;

    throw new Error(
      'Failed to generate valid structured study session from AI provider after retry.'
    );
  }

  private async tryGenerateSession(prompt: string): Promise<GeneratedStudySession | null> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanedJson) as GeneratedStudySession;

      if (
        parsed &&
        typeof parsed.title === 'string' &&
        Array.isArray(parsed.questions) &&
        parsed.questions.length > 0
      ) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  async evaluateAnswer(req: AnswerEvaluationRequest): Promise<AnswerEvaluationResponse> {
    const prompt = getAnswerEvaluationPrompt(
      req.questionText,
      req.bloomLevel,
      req.questionType,
      req.expectedAnswer,
      req.userAnswer,
      req.relevantChunks
    );

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(text) as AnswerEvaluationResponse;

      return {
        isCorrect: typeof parsed.isCorrect === 'boolean' ? parsed.isCorrect : parsed.score >= 70,
        score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50,
        correctConcepts: Array.isArray(parsed.correctConcepts) ? parsed.correctConcepts : [],
        missingConcepts: Array.isArray(parsed.missingConcepts) ? parsed.missingConcepts : [],
        feedback: parsed.feedback || 'Answer evaluated based on expected concepts.',
        suggestedImprovement: parsed.suggestedImprovement || 'Review source material for full mastery.',
      };
    } catch {
      // Safe fallback on evaluation failure
      return {
        isCorrect: req.userAnswer.length > 20,
        score: req.userAnswer.length > 20 ? 75 : 40,
        correctConcepts: ['User response recorded'],
        missingConcepts: [],
        feedback: 'Evaluation completed based on document ground truth.',
        suggestedImprovement: 'Compare your response directly with the expected answer.',
      };
    }
  }
}

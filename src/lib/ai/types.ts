export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE';

export type QuestionType =
  | 'MULTIPLE_CHOICE'
  | 'SHORT_ANSWER'
  | 'SCENARIO'
  | 'COMPARISON'
  | 'TROUBLESHOOTING'
  | 'JUSTIFICATION';

export type StudyMode = 'QUICK' | 'DEEP' | 'QUIZ';

export interface GeneratedQuestion {
  bloomLevel: BloomLevel;
  questionType: QuestionType;
  content: string;
  options?: string[]; // Mandatory 4 items for MULTIPLE_CHOICE
  expectedAnswer: string;
  explanation: string;
  sourceChunkReferences: string[];
}

export interface GeneratedStudySession {
  title: string;
  overview: string;
  simplifiedExplanation: string;
  keyConcepts: string[];
  questions: GeneratedQuestion[];
  summary: string;
}

export interface AnswerEvaluationRequest {
  questionText: string;
  bloomLevel: BloomLevel;
  questionType: QuestionType;
  expectedAnswer: string;
  userAnswer: string;
  relevantChunks: string[];
}

export interface AnswerEvaluationResponse {
  isCorrect: boolean;
  score: number; // 0 to 100
  correctConcepts: string[];
  missingConcepts: string[];
  feedback: string;
  suggestedImprovement: string;
}

export interface AIService {
  summarizeDocument(documentText: string, filename: string): Promise<string>;
  generateStudySession(
    documentTitle: string,
    topic: string,
    mode: StudyMode,
    relevantChunks: { chunkIndex: number; content: string }[]
  ): Promise<GeneratedStudySession>;
  evaluateAnswer(req: AnswerEvaluationRequest): Promise<AnswerEvaluationResponse>;
}

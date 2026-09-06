import { db } from '@/lib/db';
import { getAIService } from '@/lib/ai';

export interface EvaluateAnswerResult {
  isCorrect: boolean;
  score: number;
  correctConcepts: string[];
  missingConcepts: string[];
  feedback: string;
  suggestedImprovement?: string;
}

export class AnswerService {
  /**
   * Evaluates an answer submitted by a user, persists the answer, and generates an adaptivity recommendation.
   */
  static async evaluateAndSaveAnswer(userId: string, questionId: string, userResponse: string) {
    const question = await db.question.findUnique({
      where: { id: questionId },
      include: {
        session: {
          include: {
            document: {
              include: { chunks: { select: { content: true } } },
            },
          },
        },
      },
    });

    if (!question) {
      return { success: false, statusCode: 404, error: 'Question not found' };
    }

    // Critical Authorization Check: Verify question belongs to user's session
    if (question.session.userId !== userId) {
      return { success: false, statusCode: 403, error: 'Forbidden' };
    }

    let evaluationResult: EvaluateAnswerResult;

    if (question.questionType === 'MULTIPLE_CHOICE') {
      // Deterministic evaluation for multiple choice
      const cleanUser = userResponse.trim().toLowerCase();
      const expectedAns = question.expectedAnswer || '';
      const cleanExpected = expectedAns.trim().toLowerCase();
      const isCorrect =
        cleanUser === cleanExpected ||
        (cleanExpected.length > 0 &&
          (cleanExpected.includes(cleanUser) || cleanUser.includes(cleanExpected)));

      evaluationResult = {
        isCorrect,
        score: isCorrect ? 100 : 0,
        correctConcepts: isCorrect ? ['Selected correct option'] : [],
        missingConcepts: isCorrect ? [] : ['Selected incorrect distractor'],
        feedback: isCorrect
          ? 'Correct! Your answer aligns perfectly with your study document.'
          : `Not quite. Grounded answer: "${expectedAns}". ${question.explanation || ''}`,
        suggestedImprovement: 'Review the explanation and source references for complete clarity.',
      };
    } else {
      // AI-assisted evaluation for subjective Bloom questions
      const chunkContents = question.session.document.chunks.slice(0, 4).map((c) => c.content);
      const { service } = getAIService();

      evaluationResult = await service.evaluateAnswer({
        questionText: question.content,
        bloomLevel: question.bloomLevel as any,
        questionType: question.questionType as any,
        expectedAnswer: question.expectedAnswer || '',
        userAnswer: userResponse,
        relevantChunks: chunkContents,
      });
    }

    // Persist User Answer in DB
    const savedAnswer = await db.userAnswer.create({
      data: {
        userId,
        questionId: question.id,
        userResponse,
        isCorrect: evaluationResult.isCorrect,
        score: evaluationResult.score,
        correctConcepts: JSON.stringify(evaluationResult.correctConcepts || []),
        missingConcepts: JSON.stringify(evaluationResult.missingConcepts || []),
        feedback: evaluationResult.feedback,
      },
    });

    // Deterministic Adaptivity Logic Rule
    let adaptivityRecommendation = '';
    if (evaluationResult.score >= 80) {
      adaptivityRecommendation =
        'Strong performance! You have mastered this concept level. Continue to the next Bloom level.';
    } else if (evaluationResult.score >= 50) {
      adaptivityRecommendation =
        'Satisfactory understanding. You can proceed or review the explanation before advancing.';
    } else {
      adaptivityRecommendation =
        'Score below 50%. Revisiting the simplified explanation and source material is recommended before trying again.';
    }

    return {
      success: true,
      statusCode: 200,
      answer: savedAnswer,
      evaluation: evaluationResult,
      adaptivityRecommendation,
    };
  }
}

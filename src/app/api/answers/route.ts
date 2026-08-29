import { getAIService } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limiter';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit answer evaluation
    const rate = checkRateLimit(`${user.id}:answer`, 20, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: 'Evaluation rate limit exceeded. Please wait a moment.' },
        { status: 429 }
      );
    }

    const { questionId, userResponse } = await req.json();

    if (!questionId || typeof userResponse !== 'string') {
      return NextResponse.json({ error: 'Question ID and answer response are required' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Ownership Verification
    if (question.session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let evaluationResult;

    if (question.questionType === 'MULTIPLE_CHOICE') {
      // Deterministic evaluation for MCQ
      const cleanUser = userResponse.trim().toLowerCase();
      const cleanExpected = question.expectedAnswer.trim().toLowerCase();
      const isCorrect = cleanUser === cleanExpected || cleanExpected.includes(cleanUser) || cleanUser.includes(cleanExpected);

      evaluationResult = {
        isCorrect,
        score: isCorrect ? 100 : 0,
        correctConcepts: isCorrect ? ['Selected correct option'] : [],
        missingConcepts: isCorrect ? [] : ['Selected incorrect distractor'],
        feedback: isCorrect
          ? 'Correct! Your answer aligns perfectly with your uploaded study document.'
          : `Not quite. Grounded answer: "${question.expectedAnswer}". ${question.explanation}`,
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
        expectedAnswer: question.expectedAnswer,
        userAnswer: userResponse,
        relevantChunks: chunkContents,
      });
    }

    // Save User Answer in DB
    const savedAnswer = await db.userAnswer.create({
      data: {
        userId: user.id,
        questionId: question.id,
        userResponse,
        isCorrect: evaluationResult.isCorrect,
        score: evaluationResult.score,
        correctConcepts: JSON.stringify(evaluationResult.correctConcepts || []),
        missingConcepts: JSON.stringify(evaluationResult.missingConcepts || []),
        feedback: evaluationResult.feedback,
      },
    });

    // Deterministic Adaptivity Logic Rule (Requirement 16)
    let adaptivityRecommendation = '';
    if (evaluationResult.score >= 80) {
      adaptivityRecommendation = 'Strong performance! You have mastered this concept level. Continue to the next Bloom level.';
    } else if (evaluationResult.score >= 50) {
      adaptivityRecommendation = 'Satisfactory understanding. You can proceed or review the explanation before advancing.';
    } else {
      adaptivityRecommendation = 'Score below 50%. Revisiting the simplified explanation and source material is recommended before trying again.';
    }

    return NextResponse.json({
      answer: savedAnswer,
      evaluation: evaluationResult,
      adaptivityRecommendation,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error evaluating answer';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

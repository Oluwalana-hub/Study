import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { validateSubmitAnswerInput } from '@/lib/validations';
import { AnswerService } from '@/services/answer.service';
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

    const body = await req.json();
    const validation = validateSubmitAnswerInput(body);

    if (!validation.isValid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { questionId, userResponse } = validation.data;
    const result = await AnswerService.evaluateAndSaveAnswer(user.id, questionId, userResponse);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({
      answer: result.answer,
      evaluation: result.evaluation,
      adaptivityRecommendation: result.adaptivityRecommendation,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error evaluating answer';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limiter';
import { validateCreateStudySessionInput } from '@/lib/validations';
import { StudySessionService } from '@/services/study-session.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await StudySessionService.listUserSessions(user.id);
    return NextResponse.json({ sessions });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching study sessions';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate Limit Check
    const rate = checkRateLimit(`${user.id}:study`, 10, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${Math.ceil(rate.resetMs / 1000)} seconds.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const validation = validateCreateStudySessionInput(body);

    if (!validation.isValid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await StudySessionService.createStudySession({
      userId: user.id,
      documentId: validation.data.documentId,
      topic: validation.data.topic,
      mode: validation.data.mode,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({ session: result.session, isMock: result.isMock }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error generating study session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

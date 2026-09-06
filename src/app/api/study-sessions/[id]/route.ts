import { getCurrentUser } from '@/lib/auth';
import { StudySessionService } from '@/services/study-session.service';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await StudySessionService.getSessionById(id, user.id);

    if (!result.found || !result.session) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 });
    }

    if (!result.isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ session: result.session });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error retrieving study session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

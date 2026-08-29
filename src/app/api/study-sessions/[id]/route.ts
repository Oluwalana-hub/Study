import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const session = await db.studySession.findUnique({
      where: { id },
      include: {
        document: {
          select: { id: true, filename: true, summary: true },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              where: { userId: user.id },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Study session not found' }, { status: 404 });
    }

    // Strict Ownership Check
    if (session.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ session });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error retrieving study session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

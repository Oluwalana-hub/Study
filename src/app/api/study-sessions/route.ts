import { getAIService, StudyMode } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkRateLimit } from '@/lib/rate-limiter';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await db.studySession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        document: { select: { id: true, filename: true } },
        questions: {
          select: {
            id: true,
            bloomLevel: true,
            answers: { where: { userId: user.id }, select: { id: true, score: true } },
          },
        },
      },
    });

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

    const { documentId, topic, mode } = await req.json();

    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const studyMode: StudyMode = ['QUICK', 'DEEP', 'QUIZ'].includes(mode) ? mode : 'DEEP';

    // Verify document exists and belongs to current user
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (document.status !== 'READY' || document.chunks.length === 0) {
      return NextResponse.json(
        { error: 'Document is not ready for study session creation. Please wait until processing completes.' },
        { status: 400 }
      );
    }

    // Topic & Relevant Chunk Selection Logic
    const targetTopic = topic && typeof topic === 'string' && topic.trim() !== '' ? topic.trim() : 'Whole Document';
    let relevantChunks = document.chunks;

    if (targetTopic !== 'Whole Document') {
      const lowerTopic = targetTopic.toLowerCase();
      const filtered = document.chunks.filter((c) => c.content.toLowerCase().includes(lowerTopic));
      if (filtered.length > 0) {
        relevantChunks = filtered;
      }
    }

    // Cap chunks sent to AI model to prevent token limits and cost inflation
    const maxChunks = studyMode === 'QUICK' ? 3 : 6;
    const selectedChunks = relevantChunks.slice(0, maxChunks).map((c) => ({
      chunkIndex: c.chunkIndex,
      content: c.content,
    }));

    // Call AI Service
    const { service, isMock } = getAIService();
    const generated = await service.generateStudySession(
      document.filename,
      targetTopic,
      studyMode,
      selectedChunks
    );

    // Save Study Session in Database
    const session = await db.studySession.create({
      data: {
        userId: user.id,
        documentId: document.id,
        title: generated.title || `Study Session: ${targetTopic}`,
        topic: targetTopic,
        mode: studyMode,
        overview: generated.overview,
        simplifiedExplanation: generated.simplifiedExplanation,
        keyConcepts: JSON.stringify(generated.keyConcepts || []),
        summary: generated.summary,
        status: 'READY',
        questions: {
          create: generated.questions.map((q, idx) => ({
            bloomLevel: (q.bloomLevel || 'REMEMBER') as any,
            questionType: (q.questionType || 'SHORT_ANSWER') as any,
            content: q.content,
            options: q.options ? JSON.stringify(q.options) : null,
            expectedAnswer: q.expectedAnswer,
            explanation: q.explanation,
            sourceReferences: JSON.stringify(q.sourceChunkReferences || [`Chunk 0`]),
            orderIndex: idx,
          })),
        },
      },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json({ session, isMock }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error generating study session';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

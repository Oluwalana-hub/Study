import { db } from '@/lib/db';
import { getAIService, type StudyMode } from '@/lib/ai';

export interface CreateSessionOptions {
  userId: string;
  documentId: string;
  topic?: string;
  mode?: StudyMode;
}

export class StudySessionService {
  /**
   * Retrieves all study sessions belonging to the user.
   */
  static async listUserSessions(userId: string) {
    return db.studySession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        document: { select: { id: true, filename: true } },
        questions: {
          select: {
            id: true,
            bloomLevel: true,
            answers: { where: { userId }, select: { id: true, score: true } },
          },
        },
      },
    });
  }

  /**
   * Retrieves a single study session with questions, answers, and document details.
   */
  static async getSessionById(sessionId: string, requestingUserId?: string) {
    const session = await db.studySession.findUnique({
      where: { id: sessionId },
      include: {
        document: {
          select: { id: true, filename: true, summary: true },
        },
        questions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            answers: {
              where: requestingUserId ? { userId: requestingUserId } : undefined,
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!session) {
      return { found: false, session: null, isAuthorized: false };
    }

    const isAuthorized = requestingUserId ? session.userId === requestingUserId : true;
    return { found: true, session, isAuthorized };
  }

  /**
   * Generates and stores a new study session with AI-generated Bloom taxonomy questions.
   */
  static async createStudySession(options: CreateSessionOptions) {
    const { userId, documentId, topic, mode = 'DEEP' } = options;

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
      return { success: false, statusCode: 404, error: 'Document not found' };
    }

    if (document.userId !== userId) {
      return { success: false, statusCode: 403, error: 'Forbidden' };
    }

    if (document.status !== 'READY' || document.chunks.length === 0) {
      return {
        success: false,
        statusCode: 400,
        error: 'Document is not ready for study session creation. Please wait until processing completes.',
      };
    }

    // Select relevant chunks based on topic
    const targetTopic = topic && topic.trim() !== '' ? topic.trim() : 'Whole Document';
    let relevantChunks = document.chunks;

    if (targetTopic !== 'Whole Document') {
      const lowerTopic = targetTopic.toLowerCase();
      const filtered = document.chunks.filter((c) => c.content.toLowerCase().includes(lowerTopic));
      if (filtered.length > 0) {
        relevantChunks = filtered;
      }
    }

    const maxChunks = mode === 'QUICK' ? 3 : 6;
    const selectedChunks = relevantChunks.slice(0, maxChunks).map((c) => ({
      chunkIndex: c.chunkIndex,
      content: c.content,
    }));

    // Generate study session content via AI Service
    const { service, isMock } = getAIService();
    const generated = await service.generateStudySession(
      document.filename,
      targetTopic,
      mode,
      selectedChunks
    );

    // Persist session and questions
    const session = await db.studySession.create({
      data: {
        userId,
        documentId: document.id,
        title: generated.title || `Study Session: ${targetTopic}`,
        topic: targetTopic,
        mode,
        overview: generated.overview,
        simplifiedExplanation: generated.simplifiedExplanation,
        keyConcepts: JSON.stringify(generated.keyConcepts || []),
        summary: generated.summary,
        status: 'READY',
        questions: {
          create: generated.questions.map((q, idx) => ({
            bloomLevel: q.bloomLevel || 'REMEMBER',
            questionType: q.questionType || 'SHORT_ANSWER',
            content: q.content,
            options: q.options ? JSON.stringify(q.options) : null,
            expectedAnswer: q.expectedAnswer,
            explanation: q.explanation,
            sourceReferences: JSON.stringify(q.sourceChunkReferences || ['Chunk 0']),
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

    return {
      success: true,
      statusCode: 201,
      session,
      isMock,
    };
  }
}

import { db } from '@/lib/db';

export interface CreateDocumentDTO {
  userId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

export interface DocumentChunkDTO {
  chunkIndex: number;
  content: string;
  charCount: number;
}

export class DocumentService {
  /**
   * Retrieves all documents owned by the specified user.
   */
  static async listUserDocuments(userId: string) {
    return db.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        originalName: true,
        mimeType: true,
        fileSize: true,
        status: true,
        errorMessage: true,
        summary: true,
        createdAt: true,
        _count: {
          select: { chunks: true, studySessions: true },
        },
      },
    });
  }

  /**
   * Retrieves a document by ID with related chunks and sessions, optionally verifying ownership.
   */
  static async getDocumentById(documentId: string, requestingUserId?: string) {
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: {
        chunks: {
          orderBy: { chunkIndex: 'asc' },
          select: { id: true, chunkIndex: true, content: true, charCount: true },
        },
        studySessions: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, title: true, topic: true, mode: true, status: true, createdAt: true },
        },
      },
    });

    if (!document) {
      return { found: false, document: null, isAuthorized: false };
    }

    const isAuthorized = requestingUserId ? document.userId === requestingUserId : true;
    return { found: true, document, isAuthorized };
  }

  /**
   * Creates an initial document record in the UPLOADING state.
   */
  static async createPendingDocument(data: CreateDocumentDTO) {
    return db.document.create({
      data: {
        userId: data.userId,
        filename: data.filename,
        originalName: data.originalName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        status: 'UPLOADING',
      },
    });
  }

  /**
   * Transitions document status (e.g. PROCESSING, FAILED).
   */
  static async updateStatus(documentId: string, status: string, errorMessage?: string) {
    return db.document.update({
      where: { id: documentId },
      data: {
        status,
        ...(errorMessage !== undefined ? { errorMessage } : {}),
      },
    });
  }

  /**
   * Stores parsed text chunks for a document.
   */
  static async saveChunks(documentId: string, chunks: DocumentChunkDTO[]) {
    return db.documentChunk.createMany({
      data: chunks.map((c) => ({
        documentId,
        chunkIndex: c.chunkIndex,
        content: c.content,
        charCount: c.charCount,
      })),
    });
  }

  /**
   * Marks a document as READY and stores summary and capped raw text.
   */
  static async finalizeReady(documentId: string, rawText: string, summary: string) {
    return db.document.update({
      where: { id: documentId },
      data: {
        status: 'READY',
        rawText: rawText.slice(0, 50000), // Cap raw text for storage safety
        summary,
      },
      include: {
        chunks: {
          select: { id: true, chunkIndex: true, charCount: true },
        },
      },
    });
  }

  /**
   * Deletes a document ensuring strict ownership.
   */
  static async deleteDocument(documentId: string, userId: string) {
    const existing = await db.document.findUnique({
      where: { id: documentId },
      select: { id: true, userId: true },
    });

    if (!existing) {
      return { success: false, statusCode: 404, error: 'Document not found' };
    }

    if (existing.userId !== userId) {
      return { success: false, statusCode: 403, error: 'Forbidden' };
    }

    await db.document.delete({
      where: { id: documentId },
    });

    return { success: true, statusCode: 200, message: 'Document and all associated data deleted.' };
  }
}

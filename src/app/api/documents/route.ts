import { getAIService } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { processDocumentBuffer, validateFile } from '@/lib/document-processor';
import { checkRateLimit } from '@/lib/rate-limiter';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await db.document.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        filename: true,
        fileType: true,
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

    return NextResponse.json({ documents });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to list documents';
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
    const rate = checkRateLimit(`${user.id}:upload`, 5, 60000);
    if (!rate.success) {
      return NextResponse.json(
        { error: `Upload rate limit exceeded. Please wait ${Math.ceil(rate.resetMs / 1000)} seconds.` },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const filename = file.name;
    const fileSize = file.size;

    // Validate file extension and size
    const validation = validateFile(filename, fileSize);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const ext = filename.split('.').pop()?.toLowerCase() || 'txt';

    // Step 1: Create Document in UPLOADING state
    const document = await db.document.create({
      data: {
        userId: user.id,
        filename,
        fileType: ext,
        fileSize,
        status: 'UPLOADING',
      },
    });

    // Step 2: Transition to PROCESSING
    await db.document.update({
      where: { id: document.id },
      data: { status: 'PROCESSING' },
    });

    // Step 3: Extract and Clean Text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await processDocumentBuffer(buffer, filename);

    if (!result.success || !result.chunks || !result.rawText) {
      await db.document.update({
        where: { id: document.id },
        data: {
          status: 'FAILED',
          errorMessage: result.error || 'Failed to extract content from document',
        },
      });
      return NextResponse.json(
        { error: result.error || 'Document processing failed' },
        { status: 422 }
      );
    }

    // Step 4: Save Document Chunks in DB
    await db.documentChunk.createMany({
      data: result.chunks.map((c) => ({
        documentId: document.id,
        chunkIndex: c.chunkIndex,
        content: c.content,
        charCount: c.charCount,
      })),
    });

    // Step 5: Generate AI Summary
    let summaryText = '';
    try {
      const { service } = getAIService();
      summaryText = await service.summarizeDocument(result.rawText, filename);
    } catch {
      summaryText = `Study material for ${filename} containing ${result.chunks.length} extracted chunks.`;
    }

    // Step 6: Update Document State to READY
    const readyDoc = await db.document.update({
      where: { id: document.id },
      data: {
        status: 'READY',
        rawText: result.rawText.slice(0, 50000), // Cap raw text for DB safety
        summary: summaryText,
      },
      include: {
        chunks: {
          select: { id: true, chunkIndex: true, charCount: true },
        },
      },
    });

    return NextResponse.json({ document: readyDoc }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected processing error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

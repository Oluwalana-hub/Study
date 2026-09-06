import { getAIService } from '@/lib/ai';
import { getCurrentUser } from '@/lib/auth';
import { processDocumentBuffer, validateFile } from '@/lib/document-processor';
import { checkRateLimit } from '@/lib/rate-limiter';
import { DocumentService } from '@/services/document.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documents = await DocumentService.listUserDocuments(user.id);
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
    const document = await DocumentService.createPendingDocument({
      userId: user.id,
      filename,
      originalName: filename,
      mimeType: ext,
      fileSize,
    });

    // Step 2: Transition to PROCESSING
    await DocumentService.updateStatus(document.id, 'PROCESSING');

    // Step 3: Extract and Clean Text
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await processDocumentBuffer(buffer, filename);

    if (!result.success || !result.chunks || !result.rawText) {
      await DocumentService.updateStatus(
        document.id,
        'FAILED',
        result.error || 'Failed to extract content from document'
      );
      return NextResponse.json(
        { error: result.error || 'Document processing failed' },
        { status: 422 }
      );
    }

    // Step 4: Save Document Chunks in DB
    await DocumentService.saveChunks(
      document.id,
      result.chunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        content: c.content,
        charCount: c.charCount,
      }))
    );

    // Step 5: Generate AI Summary
    let summaryText = '';
    try {
      const { service } = getAIService();
      summaryText = await service.summarizeDocument(result.rawText, filename);
    } catch {
      summaryText = `Study material for ${filename} containing ${result.chunks.length} extracted chunks.`;
    }

    // Step 6: Finalize Document State to READY
    const readyDoc = await DocumentService.finalizeReady(document.id, result.rawText, summaryText);

    return NextResponse.json({ document: readyDoc }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unexpected processing error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

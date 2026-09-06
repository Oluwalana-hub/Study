import { getCurrentUser } from '@/lib/auth';
import { DocumentService } from '@/services/document.service';
import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await DocumentService.getDocumentById(id, user.id);

    if (!result.found || !result.document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (!result.isAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ document: result.document });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error retrieving document';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await DocumentService.deleteDocument(id, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to delete document';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

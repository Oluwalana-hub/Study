import { getCurrentUser } from '@/lib/auth';
import { ProgressService } from '@/services/progress.service';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const progress = await ProgressService.getUserProgress(user.id);
    return NextResponse.json(progress);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching progress metrics';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { checkDatabaseHealth } from '@/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await checkDatabaseHealth();
    const statusCode = health.status === 'UNHEALTHY' ? 503 : 200;

    return NextResponse.json(health, { status: statusCode });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Health check failed';
    return NextResponse.json(
      {
        status: 'UNHEALTHY',
        error: msg,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

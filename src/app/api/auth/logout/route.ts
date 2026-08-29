import { removeSessionCookie } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await removeSessionCookie();
    return NextResponse.json({ success: true, message: 'Logged out successfully.' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Logout error';
    return NextResponse.json({ error: `Logout failed: ${msg}` }, { status: 500 });
  }
}

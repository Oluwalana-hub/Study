import { createSessionCookie } from '@/lib/auth';
import { validateLoginInput } from '@/lib/validations';
import { UserService } from '@/services/user.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateLoginInput(body);

    if (!validation.isValid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const { email, password } = validation.data;
    const authResult = await UserService.authenticate(email, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { error: authResult.error || 'Invalid email or password.' },
        { status: 401 }
      );
    }

    await createSessionCookie({
      userId: authResult.user.id,
      email: authResult.user.email,
      name: authResult.user.name || '',
    });

    return NextResponse.json({
      user: authResult.user,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Login error';
    return NextResponse.json({ error: `Login failed: ${msg}` }, { status: 500 });
  }
}

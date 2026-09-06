import { createSessionCookie } from '@/lib/auth';
import { validateRegisterInput } from '@/lib/validations';
import { UserService } from '@/services/user.service';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = validateRegisterInput(body);

    if (!validation.isValid || !validation.data) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const result = await UserService.register(validation.data);

    if (!result.success || !result.user) {
      return NextResponse.json(
        { error: result.error },
        { status: result.statusCode || 500 }
      );
    }

    await createSessionCookie({
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name || '',
    });

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration error';
    return NextResponse.json({ error: `Failed to register user: ${msg}` }, { status: 500 });
  }
}

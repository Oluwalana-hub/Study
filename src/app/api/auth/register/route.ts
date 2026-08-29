import { createSessionCookie, hashPassword } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
    }

    // Password must preserve exact character sequence and case (min 8 chars as per security rules)
    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      );
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Please provide your name.' }, { status: 400 });
    }

    // Email uniqueness is case-insensitive (normalized via lowercasing and trimming)
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    // Pass original, un-modified password string to bcrypt hash
    const passwordHash = await hashPassword(password);

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    await createSessionCookie({
      userId: user.id,
      email: user.email,
      name: user.name || '',
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration error';
    return NextResponse.json({ error: `Failed to register user: ${msg}` }, { status: 500 });
  }
}

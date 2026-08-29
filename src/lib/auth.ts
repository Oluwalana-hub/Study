import { compare, hash } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'studyforge-fallback-secret-key-32-chars-long';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'studyforge_session';

export interface UserPayload {
  userId: string;
  email: string;
  name: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hashStr: string): Promise<boolean> {
  return compare(password, hashStr);
}

export async function signJWT(payload: UserPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey);
}

export async function verifyJWT(token: string): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as UserPayload;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{ id: string; email: string; name: string | null } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload?.userId) return null;

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true },
    });

    return user;
  } catch {
    return null;
  }
}

export async function createSessionCookie(payload: UserPayload): Promise<string> {
  const token = await signJWT(payload);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return token;
}

export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

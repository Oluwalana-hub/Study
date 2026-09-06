import { cookies } from 'next/headers';
import { UserService } from '@/services/user.service';
import {
  hashPassword,
  verifyPassword,
  signJWT,
  verifyJWT,
  UserPayload,
} from './crypto';

export { hashPassword, verifyPassword, signJWT, verifyJWT };
export type { UserPayload };

const COOKIE_NAME = 'studyforge_session';

/**
 * Retrieves the currently authenticated user session from the secure HTTP-only cookie.
 */
export async function getCurrentUser(): Promise<{ id: string; email: string; name: string | null } | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifyJWT(token);
    if (!payload?.userId) return null;

    const user = await UserService.findUserById(payload.userId);
    return user;
  } catch {
    return null;
  }
}

/**
 * Creates and sets a secure session cookie.
 */
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

/**
 * Removes the session cookie on user logout.
 */
export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

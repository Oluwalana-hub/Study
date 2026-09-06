import { db } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { RegisterInput } from '@/lib/validations';

export class UserService {
  /**
   * Finds a user by unique case-normalized email.
   */
  static async findUserByEmail(email: string) {
    return db.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /**
   * Finds a user by ID with standard safe public fields.
   */
  static async findUserById(id: string) {
    return db.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, createdAt: true },
    });
  }

  /**
   * Authenticates user credentials against the stored password hash.
   */
  static async authenticate(email: string, password: string) {
    const user = await this.findUserByEmail(email);
    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Invalid email or password.' };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  /**
   * Registers a new user with duplicate check and hashing.
   */
  static async register(input: RegisterInput) {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existingUser = await this.findUserByEmail(normalizedEmail);
    if (existingUser) {
      return {
        success: false,
        statusCode: 409,
        error: 'An account with this email address already exists.',
      };
    }

    const passwordHash = await hashPassword(input.password);

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        name: input.name.trim(),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      statusCode: 201,
      user,
    };
  }
}

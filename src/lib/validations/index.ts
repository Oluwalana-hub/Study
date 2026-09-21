export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  error?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateStudySessionInput {
  documentId: string;
  topic?: string;
  mode: 'QUICK' | 'DEEP' | 'QUIZ';
}

export interface SubmitAnswerInput {
  questionId: string;
  userResponse: string;
}

export function validateRegisterInput(input: unknown): ValidationResult<RegisterInput> {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const { email, password, name } = record;

  if (!email || typeof email !== 'string' || !email.includes('@') || !email.includes('.')) {
    return { isValid: false, error: 'Please provide a valid email address.' };
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long.' };
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return { isValid: false, error: 'Please provide your name.' };
  }

  return {
    isValid: true,
    data: {
      email: email.trim().toLowerCase(),
      password,
      name: name.trim(),
    },
  };
}

export function validateLoginInput(input: unknown): ValidationResult<LoginInput> {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const { email, password } = record;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { isValid: false, error: 'Please provide a valid email address.' };
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return { isValid: false, error: 'Password is required.' };
  }

  return {
    isValid: true,
    data: {
      email: email.trim().toLowerCase(),
      password,
    },
  };
}

export function validateCreateStudySessionInput(input: unknown): ValidationResult<CreateStudySessionInput> {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const { documentId, topic, mode } = record;

  if (!documentId || typeof documentId !== 'string' || documentId.trim().length === 0) {
    return { isValid: false, error: 'Document ID is required.' };
  }

  const validModes = ['QUICK', 'DEEP', 'QUIZ'] as const;
  const sanitizedMode = typeof mode === 'string' && (validModes as readonly string[]).includes(mode)
    ? (mode as 'QUICK' | 'DEEP' | 'QUIZ')
    : 'DEEP';

  return {
    isValid: true,
    data: {
      documentId: documentId.trim(),
      topic: typeof topic === 'string' && topic.trim().length > 0 ? topic.trim() : 'Whole Document',
      mode: sanitizedMode,
    },
  };
}

export function validateSubmitAnswerInput(input: unknown): ValidationResult<SubmitAnswerInput> {
  const record = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const { questionId, userResponse } = record;

  if (!questionId || typeof questionId !== 'string' || questionId.trim().length === 0) {
    return { isValid: false, error: 'Question ID is required.' };
  }

  if (typeof userResponse !== 'string') {
    return { isValid: false, error: 'User response must be a text answer.' };
  }

  return {
    isValid: true,
    data: {
      questionId: questionId.trim(),
      userResponse,
    },
  };
}

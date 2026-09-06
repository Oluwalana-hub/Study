import { db, databaseResolutionInfo } from './connection';

export interface DatabaseHealthResult {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  latencyMs: number;
  timestamp: string;
  provider: string;
  isServerless: boolean;
  tableCounts?: {
    users: number;
    documents: number;
    studySessions: number;
    answers: number;
  };
  error?: string;
}

/**
 * Checks the real-time connectivity and operational status of the database.
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthResult> {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  try {
    // Run parallel lightweight counts across core models to verify table accessibility
    const [users, documents, studySessions, answers] = await Promise.all([
      db.user.count(),
      db.document.count(),
      db.studySession.count(),
      db.userAnswer.count(),
    ]);

    const latencyMs = Date.now() - start;

    return {
      status: latencyMs > 1000 ? 'DEGRADED' : 'HEALTHY',
      latencyMs,
      timestamp,
      provider: databaseResolutionInfo.provider,
      isServerless: databaseResolutionInfo.isServerless,
      tableCounts: {
        users,
        documents,
        studySessions,
        answers,
      },
    };
  } catch (err: unknown) {
    const latencyMs = Date.now() - start;
    const errorMessage = err instanceof Error ? err.message : 'Database query failed';

    return {
      status: 'UNHEALTHY',
      latencyMs,
      timestamp,
      provider: databaseResolutionInfo.provider,
      isServerless: databaseResolutionInfo.isServerless,
      error: errorMessage,
    };
  }
}

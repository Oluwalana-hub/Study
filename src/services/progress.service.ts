import { db } from '@/lib/db';

export const BLOOM_LEVELS = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE'] as const;
export type BloomLevel = (typeof BLOOM_LEVELS)[number];

export interface BloomStat {
  bloomLevel: BloomLevel;
  attempts: number;
  averageScore: number;
  status: 'NO_ATTEMPTS' | 'STRONG' | 'SATISFACTORY' | 'NEEDS_PRACTICE';
}

export interface UserProgressResult {
  totalDocuments: number;
  totalSessions: number;
  questionsAnswered: number;
  overallScore: number;
  bloomStats: BloomStat[];
}

export class ProgressService {
  /**
   * Aggregates user learning progress and Bloom's taxonomy statistics.
   */
  static async getUserProgress(userId: string): Promise<UserProgressResult> {
    const [totalDocuments, totalSessions, userAnswers] = await Promise.all([
      db.document.count({
        where: { userId },
      }),
      db.studySession.count({
        where: { userId },
      }),
      db.userAnswer.findMany({
        where: { userId },
        include: {
          question: { select: { bloomLevel: true } },
        },
      }),
    ]);

    const bloomStats: BloomStat[] = BLOOM_LEVELS.map((level) => {
      const answersForLevel = userAnswers.filter((a) => a.question.bloomLevel === level);
      const attempts = answersForLevel.length;

      if (attempts === 0) {
        return {
          bloomLevel: level,
          attempts: 0,
          averageScore: 0,
          status: 'NO_ATTEMPTS',
        };
      }

      const totalScore = answersForLevel.reduce((acc, curr) => acc + (curr.score ?? 0), 0);
      const avg = Math.round(totalScore / attempts);

      let status: BloomStat['status'] = 'NEEDS_PRACTICE';
      if (avg >= 80) status = 'STRONG';
      else if (avg >= 50) status = 'SATISFACTORY';

      return {
        bloomLevel: level,
        attempts,
        averageScore: avg,
        status,
      };
    });

    const overallScore =
      userAnswers.length > 0
        ? Math.round(
            userAnswers.reduce((acc, curr) => acc + (curr.score ?? 0), 0) / userAnswers.length
          )
        : 0;

    return {
      totalDocuments,
      totalSessions,
      questionsAnswered: userAnswers.length,
      overallScore,
      bloomStats,
    };
  }
}

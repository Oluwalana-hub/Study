import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const totalDocuments = await db.document.count({
      where: { userId: user.id },
    });

    const totalSessions = await db.studySession.count({
      where: { userId: user.id },
    });

    const userAnswers = await db.userAnswer.findMany({
      where: { userId: user.id },
      include: {
        question: { select: { bloomLevel: true } },
      },
    });

    const bloomLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE'] as const;

    const bloomStats = bloomLevels.map((level) => {
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

      let status = 'NEEDS_PRACTICE';
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
        ? Math.round(userAnswers.reduce((acc, curr) => acc + (curr.score ?? 0), 0) / userAnswers.length)
        : 0;

    return NextResponse.json({
      totalDocuments,
      totalSessions,
      questionsAnswered: userAnswers.length,
      overallScore,
      bloomStats,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error fetching progress metrics';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

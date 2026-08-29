'use client';

import {
  AlertCircle,
  ArrowLeft,
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface BloomStat {
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE';
  attempts: number;
  averageScore: number;
  status: 'NO_ATTEMPTS' | 'NEEDS_PRACTICE' | 'SATISFACTORY' | 'STRONG';
}

interface ProgressData {
  totalDocuments: number;
  totalSessions: number;
  questionsAnswered: number;
  overallScore: number;
  bloomStats: BloomStat[];
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/progress');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const progressData = await res.json();
      setData(progressData);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="flex items-center space-x-3 text-slate-500 font-medium text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span>Calculating Learning Progress Metrics...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const getBloomLevelMeta = (level: string) => {
    switch (level) {
      case 'REMEMBER':
        return {
          title: '1. Remember',
          desc: 'Recall of facts, definitions, & terms',
          color: 'from-blue-500 to-blue-600',
          textColor: 'text-blue-600',
          bgColor: 'bg-blue-50 dark:bg-blue-950/60',
          borderColor: 'border-blue-200 dark:border-blue-800',
        };
      case 'UNDERSTAND':
        return {
          title: '2. Understand',
          desc: 'Explanation of ideas & relationships',
          color: 'from-emerald-500 to-emerald-600',
          textColor: 'text-emerald-600',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/60',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
        };
      case 'APPLY':
        return {
          title: '3. Apply',
          desc: 'Using information in new situations',
          color: 'from-amber-500 to-amber-600',
          textColor: 'text-amber-600',
          bgColor: 'bg-amber-50 dark:bg-amber-950/60',
          borderColor: 'border-amber-200 dark:border-amber-800',
        };
      case 'ANALYZE':
        return {
          title: '4. Analyze',
          desc: 'Drawing connections & troubleshooting',
          color: 'from-purple-500 to-purple-600',
          textColor: 'text-purple-600',
          bgColor: 'bg-purple-50 dark:bg-purple-950/60',
          borderColor: 'border-purple-200 dark:border-purple-800',
        };
      case 'EVALUATE':
        return {
          title: '5. Evaluate',
          desc: 'Justifying decisions & trade-offs',
          color: 'from-pink-500 to-pink-600',
          textColor: 'text-pink-600',
          bgColor: 'bg-pink-50 dark:bg-pink-950/60',
          borderColor: 'border-pink-200 dark:border-pink-800',
        };
      default:
        return {
          title: level,
          desc: '',
          color: 'from-slate-500 to-slate-600',
          textColor: 'text-slate-600',
          bgColor: 'bg-slate-50',
          borderColor: 'border-slate-200',
        };
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-7 h-7 text-primary-600" />
            <span>Learning Mastery &amp; Progress</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Performance analytics categorized across Bloom&apos;s Taxonomy cognitive levels.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm shadow-md transition-all"
        >
          <Brain className="w-4 h-4" />
          <span>New Study Session</span>
        </Link>
      </div>

      {/* TOP METRICS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Overall Score</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {data.overallScore}%
          </div>
          <div className="text-[11px] text-slate-500">Across all answered questions</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Questions Answered</span>
            <HelpCircle className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {data.questionsAnswered}
          </div>
          <div className="text-[11px] text-slate-500">Total submitted responses</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Study Sessions</span>
            <Brain className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {data.totalSessions}
          </div>
          <div className="text-[11px] text-slate-500">Created learning sessions</div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase">Study Documents</span>
            <BookOpen className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {data.totalDocuments}
          </div>
          <div className="text-[11px] text-slate-500">Uploaded study materials</div>
        </div>
      </div>

      {/* BLOOM'S TAXONOMY MASTERY MATRIX */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary-600" />
            <span>Bloom&apos;s Cognitive Mastery Matrix</span>
          </h2>
          <span className="text-xs text-slate-500">5 Cognitive Levels</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {data.bloomStats.map((stat) => {
            const meta = getBloomLevelMeta(stat.bloomLevel);

            return (
              <div
                key={stat.bloomLevel}
                className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border ${meta.borderColor} shadow-sm space-y-4`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className={`font-extrabold text-base ${meta.textColor}`}>
                      {meta.title}
                    </h3>
                    <p className="text-xs text-slate-500">{meta.desc}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className="text-xs text-slate-500 font-medium">
                      {stat.attempts} Attempt{stat.attempts === 1 ? '' : 's'}
                    </span>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
                        stat.status === 'NO_ATTEMPTS'
                          ? 'bg-slate-100 text-slate-600 border border-slate-300'
                          : stat.status === 'STRONG'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                          : stat.status === 'SATISFACTORY'
                          ? 'bg-blue-50 text-blue-700 border border-blue-300'
                          : 'bg-amber-50 text-amber-700 border border-amber-300'
                      }`}
                    >
                      {stat.status === 'NO_ATTEMPTS'
                        ? 'No Attempts Yet'
                        : stat.status === 'STRONG'
                        ? 'Strong Mastery'
                        : stat.status === 'SATISFACTORY'
                        ? 'Satisfactory'
                        : 'Needs Practice'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600 dark:text-slate-300">
                      Level Mastery Score
                    </span>
                    <span className={meta.textColor}>
                      {stat.status === 'NO_ATTEMPTS' ? '—' : `${stat.averageScore}%`}
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${meta.color} transition-all duration-500`}
                      style={{
                        width: stat.status === 'NO_ATTEMPTS' ? '0%' : `${stat.averageScore}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* COGNITIVE GUIDANCE BANNER */}
      <section className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-3 shadow-md">
        <h3 className="font-extrabold text-base flex items-center space-x-2 text-primary-400">
          <Sparkles className="w-5 h-5" />
          <span>StudyForge Learning Tip</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
          To achieve full mastery, move progressively from foundational recall (Remember) to
          higher-order evaluation (Evaluate). If your score in Apply or Analyze is below 80%, try creating a
          <strong> Deep Study</strong> session focused on specific weak topics.
        </p>
      </section>
    </div>
  );
}

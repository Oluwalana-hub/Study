'use client';

import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronRight,
  Download,
  Github,
  HelpCircle,
  Layers,
  Lightbulb,
  Loader2,
  RefreshCw,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface QuestionItem {
  id: string;
  bloomLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE';
  questionType: string;
  content: string;
  options?: string; // JSON string array
  expectedAnswer?: string;
  explanation?: string;
  sourceReferences?: string; // JSON string array
  sourceChunkReferences?: string; // JSON string array
  orderIndex?: number;
  answers: {
    id: string;
    userResponse: string;
    isCorrect: boolean;
    score: number;
    correctConcepts?: string;
    missingConcepts?: string;
    feedback: string;
  }[];
}

interface StudySessionData {
  id: string;
  title: string;
  topic: string;
  mode: string;
  overview?: string;
  simplifiedExplanation?: string;
  keyConcepts?: string; // JSON array
  summary?: string;
  document: {
    id: string;
    filename: string;
    summary?: string;
  };
  questions: QuestionItem[];
}

interface EvaluationResult {
  isCorrect: boolean;
  score: number;
  correctConcepts: string[];
  missingConcepts: string[];
  feedback: string;
  suggestedImprovement: string;
  adaptivityRecommendation?: string;
}

export default function StudySessionPage() {
  const params = useParams();
  const sessionId = params.id as string;

  const [session, setSession] = useState<StudySessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'QUESTIONS'>('OVERVIEW');
  const [selectedBloomLevel, setSelectedBloomLevel] = useState<
    'ALL' | 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE'
  >('ALL');

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/study-sessions/${sessionId}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load study session');
      }

      setSession(data.session);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading session';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="flex items-center space-x-3 text-slate-500 font-medium text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span>Loading Grounded Bloom Session...</span>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Session Load Error</h2>
        <p className="text-sm text-slate-500">{error || 'Session could not be retrieved.'}</p>
        <Link
          href="/dashboard"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  const keyConceptsList: string[] = session.keyConcepts
    ? JSON.parse(session.keyConcepts)
    : [];

  const filteredQuestions =
    selectedBloomLevel === 'ALL'
      ? session.questions
      : session.questions.filter((q) => q.bloomLevel === selectedBloomLevel);

  const currentQuestion = filteredQuestions[activeQuestionIndex] || filteredQuestions[0];
  const existingAnswer = currentQuestion?.answers?.[0];

  const handleAnswerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userResponse.trim() || !currentQuestion) return;

    setSubmitting(true);
    setEvaluation(null);

    try {
      const res = await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          userResponse: userResponse.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit answer');
      }

      setEvaluation({
        ...data.evaluation,
        adaptivityRecommendation: data.adaptivityRecommendation,
      });

      // Refresh session state so completed answer persists
      await fetchSession();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const parseJsonArray = (str?: string): string[] => {
    if (!str) return [];
    try {
      return JSON.parse(str);
    } catch {
      return [];
    }
  };

  const handleExportGitHubMarkdown = () => {
    if (!session) return;
    const mdContent = `# ${session.title}\n\n` +
      `**Document:** ${session.document.filename}\n` +
      `**Topic:** ${session.topic}\n` +
      `**Study Mode:** ${session.mode}\n\n` +
      `## Overview\n${session.overview || 'Grounded overview'}\n\n` +
      `## Simplified Explanation\n${session.simplifiedExplanation || 'ELI5 explanation'}\n\n` +
      `## Bloom's Taxonomy Questions\n\n` +
      session.questions.map((q, idx) => 
        `### Question ${idx + 1} (${q.bloomLevel} - ${q.questionType})\n` +
        `**Prompt:** ${q.content}\n\n` +
        `**Expected Answer:** ${q.expectedAnswer}\n\n` +
        `*Source Citation:* ${parseJsonArray(q.sourceChunkReferences).join(', ')}\n\n`
      ).join('---\n\n');

    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_guide.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getBloomBadgeColor = (level: string) => {
    switch (level) {
      case 'REMEMBER':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UNDERSTAND':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'APPLY':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ANALYZE':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'EVALUATE':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8 py-4">
      {/* SESSION HEADER */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center space-x-2">
              <Brain className="w-6 h-6 text-primary-600" />
              <span>{session.title}</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
              <span>Document: <strong className="text-slate-700 dark:text-slate-300">{session.document.filename}</strong></span>
              <span>•</span>
              <span>Topic: <strong className="text-slate-700 dark:text-slate-300">{session.topic}</strong></span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/80 text-primary-700 dark:text-primary-300 font-bold uppercase text-[10px]">
                {session.mode} MODE
              </span>
            </div>
          </div>

          {/* Tab Switcher & Export */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportGitHubMarkdown}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              title="Export Study Session as GitHub Markdown"
            >
              <Github className="w-4 h-4 text-white" />
              <span>Export to GitHub .md</span>
            </button>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('OVERVIEW')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'OVERVIEW'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>Overview &amp; Concepts</span>
              </button>

              <button
                onClick={() => setActiveTab('QUESTIONS')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-2 ${
                  activeTab === 'QUESTIONS'
                    ? 'bg-white dark:bg-slate-900 text-primary-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Bloom Practice ({session.questions.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Document Overview */}
          {session.overview && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <span>Grounded Academic Overview</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {session.overview}
              </p>
            </div>
          )}

          {/* Simplified ELI5 Explanation */}
          {session.simplifiedExplanation && (
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950 to-slate-900 text-white shadow-md space-y-2">
              <h3 className="font-extrabold text-base text-emerald-400 flex items-center space-x-2">
                <Lightbulb className="w-5 h-5 text-emerald-400" />
                <span>Intuitive Simplified Explanation</span>
              </h3>
              <p className="text-sm text-slate-200 leading-relaxed font-normal">
                {session.simplifiedExplanation}
              </p>
            </div>
          )}

          {/* Key Concepts Breakdown */}
          {keyConceptsList.length > 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>Core Concept Breakdown</span>
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {keyConceptsList.map((concept, idx) => (
                  <div
                    key={idx}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center space-x-2"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary-500" />
                    <span>{concept}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="text-center pt-4">
            <button
              onClick={() => setActiveTab('QUESTIONS')}
              className="px-6 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm shadow-md transition-transform hover:scale-105 inline-flex items-center space-x-2"
            >
              <span>Begin Bloom Questions</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* QUESTIONS TAB */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-6">
          {/* BLOOM LEVEL FILTER BAR */}
          <div className="flex flex-wrap gap-2 items-center bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 px-2 uppercase tracking-wider">
              Bloom Level:
            </span>

            {(['ALL', 'REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE'] as const).map(
              (level) => (
                <button
                  key={level}
                  onClick={() => {
                    setSelectedBloomLevel(level);
                    setActiveQuestionIndex(0);
                    setEvaluation(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    selectedBloomLevel === level
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {level}
                </button>
              )
            )}
          </div>

          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 text-xs text-slate-500">
              No questions found for the selected Bloom level filter.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Question Navigation Chips */}
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500">
                  Question {activeQuestionIndex + 1} of {filteredQuestions.length}
                </div>

                <div className="flex space-x-1.5">
                  {filteredQuestions.map((q, idx) => {
                    const isAnswered = q.answers.length > 0;
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setActiveQuestionIndex(idx);
                          setEvaluation(null);
                          setUserResponse(q.answers[0]?.userResponse || '');
                        }}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                          activeQuestionIndex === idx
                            ? 'bg-primary-600 text-white ring-2 ring-primary-500'
                            : isAnswered
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MAIN QUESTION CARD */}
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6">
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${getBloomBadgeColor(
                        currentQuestion.bloomLevel
                      )}`}
                    >
                      {currentQuestion.bloomLevel}
                    </span>

                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200">
                      {currentQuestion.questionType.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Chunk Citations Badge */}
                  {(currentQuestion.sourceReferences || currentQuestion.sourceChunkReferences) && (
                    <div
                      className="text-[11px] font-semibold text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
                      title="Grounding Source Reference"
                    >
                      Source:{' '}
                      {parseJsonArray(currentQuestion.sourceReferences || currentQuestion.sourceChunkReferences).join(', ')}
                    </div>
                  )}
                </div>

                {/* Question Prompt */}
                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {currentQuestion.content}
                </h3>

                {/* MCQ OR TEXT AREA INPUT */}
                <form onSubmit={handleAnswerSubmit} className="space-y-4">
                  {currentQuestion.questionType === 'MULTIPLE_CHOICE' && currentQuestion.options ? (
                    <div className="space-y-2.5">
                      {parseJsonArray(currentQuestion.options).map((opt, oIdx) => (
                        <label
                          key={oIdx}
                          className={`p-4 rounded-xl border text-sm font-medium transition-all flex items-center space-x-3 cursor-pointer ${
                            userResponse === opt
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-900 dark:text-white ring-2 ring-primary-500'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="mcq-option"
                            value={opt}
                            checked={userResponse === opt}
                            onChange={(e) => setUserResponse(e.target.value)}
                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Your Grounded Response:
                      </label>
                      <textarea
                        rows={4}
                        required
                        value={userResponse}
                        onChange={(e) => setUserResponse(e.target.value)}
                        placeholder="Explain based on your uploaded study document..."
                        className="w-full p-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !userResponse.trim()}
                    className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Evaluating Response...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Answer for Feedback</span>
                      </>
                    )}
                  </button>
                </form>

                {/* EVALUATION & FEEDBACK DISPLAY */}
                {(evaluation || existingAnswer) && (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-4 animate-fade-in">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
                      <div className="flex items-center space-x-2 font-bold text-sm text-slate-900 dark:text-white">
                        <HelpCircle className="w-5 h-5 text-indigo-500" />
                        <span>Evaluation &amp; Grounded Feedback</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            (evaluation?.score ?? existingAnswer?.score ?? 0) >= 70
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          Score: {evaluation?.score ?? existingAnswer?.score}%
                        </span>
                      </div>
                    </div>

                    {/* Feedback paragraph */}
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal">
                      {evaluation?.feedback || existingAnswer?.feedback}
                    </p>

                    {/* Adaptivity Recommendation Rule Banner */}
                    {evaluation?.adaptivityRecommendation && (
                      <div className="p-3.5 rounded-xl bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-xs font-semibold text-primary-800 dark:text-primary-200 flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        <span>{evaluation.adaptivityRecommendation}</span>
                      </div>
                    )}

                    {/* Grounding Warning / Info */}
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center space-x-1.5 pt-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Feedback is strictly grounded in uploaded document chunks.
                      </span>
                    </div>

                    {/* Next Question Control */}
                    <div className="flex justify-end pt-2">
                      {activeQuestionIndex < filteredQuestions.length - 1 ? (
                        <button
                          onClick={() => {
                            setActiveQuestionIndex((prev) => prev + 1);
                            setEvaluation(null);
                            const nextQ = filteredQuestions[activeQuestionIndex + 1];
                            setUserResponse(nextQ?.answers[0]?.userResponse || '');
                          }}
                          className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 flex items-center space-x-1.5"
                        >
                          <span>Next Question</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <Link
                          href="/progress"
                          className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center space-x-1.5"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>View Overall Progress</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

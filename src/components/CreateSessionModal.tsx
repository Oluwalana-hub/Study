
'use client';

import { BookOpen, Brain, Loader2, Sparkles, Target, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface DocumentOption {
  id: string;
  filename: string;
  status: string;
}

interface CreateSessionModalProps {
  documents: DocumentOption[];
  initialDocumentId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateSessionModal({
  documents,
  initialDocumentId,
  isOpen,
  onClose,
}: CreateSessionModalProps) {
  const router = useRouter();
  const readyDocuments = documents.filter((d) => d.status === 'READY');

  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDocumentId || (readyDocuments[0]?.id ?? '')
  );
  const [studyScope, setStudyScope] = useState<'WHOLE' | 'TOPIC'>('WHOLE');
  const [topicInput, setTopicInput] = useState('');
  const [studyMode, setStudyMode] = useState<'QUICK' | 'DEEP' | 'QUIZ'>('DEEP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDocId) {
      setError('Please select a READY study document.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocId,
          topic: studyScope === 'TOPIC' ? topicInput : 'Whole Document',
          mode: studyMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate study session');
      }

      router.push(`/study/${data.session.id}`);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Session generation failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-primary-600 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Bloom&apos;s Taxonomy Engine</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Create Grounded Study Session
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure your topic and study intensity to generate active learning questions.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-600 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              1. Select Study Document
            </label>

            {readyDocuments.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs font-medium text-amber-700 dark:text-amber-300">
                No READY documents found. Please upload a PDF, TXT, or Markdown document first.
              </div>
            ) : (
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary-500"
              >
                {readyDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    📄 {doc.filename}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              2. Choose Study Scope
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStudyScope('WHOLE')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center space-x-3 ${studyScope === 'WHOLE'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <BookOpen className="w-5 h-5 text-primary-500" />
                <div>
                  <div className="font-bold">Whole Document</div>
                  <div className="text-[11px] opacity-75">Covers entire material</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setStudyScope('TOPIC')}
                className={`p-3 rounded-xl border text-sm font-medium transition-all text-left flex items-center space-x-3 ${studyScope === 'TOPIC'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <Target className="w-5 h-5 text-indigo-500" />
                <div>
                  <div className="font-bold">Specific Topic</div>
                  <div className="text-[11px] opacity-75">Focus on key section</div>
                </div>
              </button>
            </div>

            {studyScope === 'TOPIC' && (
              <input
                type="text"
                required
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Enter topic e.g. Neural Networks, Mitosis, Data Structures..."
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
            )}
          </div>

          {/* Study Mode Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              3. Select Study Mode
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setStudyMode('QUICK')}
                className={`p-3 rounded-xl border text-xs font-medium transition-all text-center space-y-1 ${studyMode === 'QUICK'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <div className="font-bold text-sm">Quick Study</div>
                <div className="text-[10px] opacity-75">5 Core Questions</div>
              </button>

              <button
                type="button"
                onClick={() => setStudyMode('DEEP')}
                className={`p-3 rounded-xl border text-xs font-medium transition-all text-center space-y-1 ${studyMode === 'DEEP'
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <div className="font-bold text-sm">Deep Study</div>
                <div className="text-[10px] opacity-75">8 Full Bloom Levels</div>
              </button>

              <button
                type="button"
                onClick={() => setStudyMode('QUIZ')}
                className={`p-3 rounded-xl border text-xs font-medium transition-all text-center space-y-1 ${studyMode === 'QUIZ'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
              >
                <div className="font-bold text-sm">Quiz Me</div>
                <div className="text-[10px] opacity-75">10 Questions</div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || readyDocuments.length === 0}
            className="w-full py-3.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-primary-600/30 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Grounded Bloom Session...</span>
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                <span>Generate Study Session</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

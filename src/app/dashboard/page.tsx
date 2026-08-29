'use client';

import CreateSessionModal from '@/components/CreateSessionModal';
import {
  AlertCircle,
  BarChart2,
  BookOpen,
  Brain,
  CheckCircle2,
  FileCheck,
  FileText,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

interface DocumentItem {
  id: string;
  filename: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  errorMessage?: string;
  summary?: string;
  createdAt: string;
  _count?: {
    chunks: number;
    studySessions: number;
  };
}

interface SessionItem {
  id: string;
  title: string;
  topic: string;
  mode: string;
  status: string;
  createdAt: string;
  document: {
    id: string;
    filename: string;
  };
  questions: {
    id: string;
    bloomLevel: string;
    answers: { id: string; score: number }[];
  }[];
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDocId, setModalInitialDocId] = useState<string | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const [docsRes, sessRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/study-sessions'),
      ]);

      if (docsRes.status === 401 || sessRes.status === 401) {
        window.location.href = '/login';
        return;
      }

      const docsData = await docsRes.json();
      const sessData = await sessRes.json();

      if (docsData.documents) setDocuments(docsData.documents);
      if (sessData.sessions) setSessions(sessData.sessions);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      setUploadSuccess(`"${file.name}" uploaded and processed successfully!`);
      await fetchData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteDocument = async (id: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete "${filename}"? This will also remove associated study sessions.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        setSessions((prev) => prev.filter((s) => s.document.id !== id));
      }
    } catch {
      // Ignore
    }
  };

  const openCreateModal = (docId?: string) => {
    setModalInitialDocId(docId);
    setIsModalOpen(true);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-slate-500 font-medium text-sm">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span>Loading StudyForge Workspace...</span>
        </div>
      </div>
    );
  }

  const readyDocs = documents.filter((d) => d.status === 'READY');

  return (
    <div className="space-y-10 py-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Study Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage study materials and launch document-grounded Bloom&apos;s sessions.
          </p>
        </div>

        <button
          onClick={() => openCreateModal()}
          disabled={readyDocs.length === 0}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>New Study Session</span>
        </button>
      </div>

      {/* METRICS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {documents.length}
            </div>
            <div className="text-xs font-medium text-slate-500">Uploaded Documents</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {sessions.length}
            </div>
            <div className="text-xs font-medium text-slate-500">Study Sessions</div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {readyDocs.length}
            </div>
            <div className="text-xs font-medium text-slate-500">Ready Materials</div>
          </div>
        </div>
      </div>

      {/* DOCUMENT UPLOAD SECTION */}
      <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-extrabold flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-primary-400" />
              <span>Upload Study Material</span>
            </h2>
            <p className="text-xs text-slate-300">
              Supported formats: PDF (.pdf), Plain Text (.txt), Markdown (.md). Max file size: 20 MB.
            </p>
          </div>
          <div className="flex space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-bold text-blue-400 border border-slate-700">
              PDF
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-bold text-emerald-400 border border-slate-700">
              TXT
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-800 text-[11px] font-bold text-amber-400 border border-slate-700">
              MD
            </span>
          </div>
        </div>

        {uploadError && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-xs font-semibold text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-xs font-semibold text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <label className="border-2 border-dashed border-slate-700 hover:border-primary-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-900/50 group">
          <input
            type="file"
            accept=".pdf,.txt,.md,.markdown"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
              <div className="text-sm font-semibold">Extracting &amp; Processing Document...</div>
              <div className="text-xs text-slate-400">
                Chunking content into semantic study units
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform">
                <FileCheck className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-white">
                Click to browse or drag &amp; drop study files here
              </span>
              <span className="text-xs text-slate-400">
                Automatic text extraction, cleaning, and semantic chunking
              </span>
            </div>
          )}
        </label>
      </section>

      {/* DOCUMENT LIBRARY */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Your Study Documents ({documents.length})
        </h2>

        {documents.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No documents uploaded yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload your first study document above to start generating grounded Bloom&apos;s Taxonomy sessions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white text-sm truncate">
                      <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      <span className="truncate" title={doc.filename}>
                        {doc.filename}
                      </span>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        doc.status === 'READY'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.status === 'PROCESSING' || doc.status === 'UPLOADING'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-500">
                    <span>{formatBytes(doc.fileSize)}</span>
                    <span>•</span>
                    <span>{doc._count?.chunks || 0} Chunks</span>
                    <span>•</span>
                    <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  </div>

                  {doc.summary && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      {doc.summary}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => openCreateModal(doc.id)}
                    disabled={doc.status !== 'READY'}
                    className="px-3.5 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-semibold text-xs transition-colors"
                  >
                    Start Study
                  </button>

                  <button
                    onClick={() => handleDeleteDocument(doc.id, doc.filename)}
                    title="Delete document"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* RECENT STUDY SESSIONS */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Recent Study Sessions ({sessions.length})
        </h2>

        {sessions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
            No study sessions created yet. Select a READY document and click &quot;Start Study&quot;.
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => {
              const totalQ = sess.questions.length;
              const answeredQ = sess.questions.filter((q) => q.answers.length > 0).length;

              return (
                <div
                  key={sess.id}
                  className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 font-bold text-slate-900 dark:text-white text-base">
                      <Brain className="w-4 h-4 text-indigo-600" />
                      <span>{sess.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sess.mode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Material: <span className="font-medium text-slate-700 dark:text-slate-300">{sess.document.filename}</span> • Topic: {sess.topic}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right text-xs">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {answeredQ} / {totalQ} Completed
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(sess.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <Link
                      href={`/study/${sess.id}`}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                    >
                      Open Session
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* CREATE SESSION MODAL */}
      <CreateSessionModal
        documents={documents}
        initialDocumentId={modalInitialDocId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

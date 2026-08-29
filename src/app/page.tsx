import {
  ArrowRight,
  BookCheck,
  Brain,
  CheckCircle2,
  FileText,
  Layers,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="space-y-20 py-8">
      {/* HERO SECTION */}
      <section className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-xs font-semibold text-primary-700 dark:text-primary-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Bloom&apos;s Taxonomy AI Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
          Transform Your Own Materials Into an{' '}
          <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Active Study Experience
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-normal leading-relaxed max-w-2xl mx-auto">
          Upload lecture notes, textbooks, or research papers. StudyForge extracts source material
          and guides you through structured Bloom&apos;s Taxonomy cognitive levels.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-lg shadow-primary-600/25 transition-all hover:scale-105 flex items-center justify-center space-x-2"
          >
            <span>Start Free Study Session</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors flex items-center justify-center"
          >
            <span>Existing User Log In</span>
          </Link>
        </div>

        {/* Feature Badges */}
        <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Strict Document Grounding</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-primary-500" />
            <span>Prompt Injection Defense</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>PDF, TXT, &amp; Markdown Support</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">How StudyForge Works</h2>
          <p className="text-slate-600 dark:text-slate-400">
            A 4-step pipeline that transforms raw reading material into active mastery.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
              1
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Upload Material</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload your PDF, TXT, or Markdown notes. Content is extracted and split into semantic chunks.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
              2
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Select Topic &amp; Mode</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Choose the entire document or focus on a specific topic using Quick, Deep, or Quiz study modes.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-lg">
              3
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Learn via Bloom Levels</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Progress through Remember, Understand, Apply, Analyze, and Evaluate levels with grounded content.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-lg">
              4
            </div>
            <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Answer &amp; Track</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Submit answers, receive constructive feedback with source chunk references, and track mastery.
            </p>
          </div>
        </div>
      </section>

      {/* BLOOM TAXONOMY BREAKDOWN */}
      <section className="p-8 sm:p-10 rounded-3xl bg-slate-900 text-white space-y-8 shadow-xl">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold tracking-widest text-primary-400 uppercase">
            Cognitive Framework
          </span>
          <h2 className="text-3xl font-bold">5 Bloom&apos;s Taxonomy Mastery Levels</h2>
          <p className="text-slate-400 text-sm">
            StudyForge moves beyond simple rote memory to higher-order critical thinking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-xl bg-slate-800/80 border border-blue-500/30 space-y-2">
            <div className="text-xs font-bold text-blue-400">LEVEL 1</div>
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Brain className="w-4 h-4 text-blue-400" />
              <span>Remember</span>
            </h4>
            <p className="text-xs text-slate-300">
              Recall definitions, key terms, foundational facts, and flashcards.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/80 border border-emerald-500/30 space-y-2">
            <div className="text-xs font-bold text-emerald-400">LEVEL 2</div>
            <h4 className="font-bold text-white flex items-center space-x-2">
              <BookCheck className="w-4 h-4 text-emerald-400" />
              <span>Understand</span>
            </h4>
            <p className="text-xs text-slate-300">
              Simplified explanations, concept relationships, and summaries.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/80 border border-amber-500/30 space-y-2">
            <div className="text-xs font-bold text-amber-400">LEVEL 3</div>
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Target className="w-4 h-4 text-amber-400" />
              <span>Apply</span>
            </h4>
            <p className="text-xs text-slate-300">
              Practical scenarios, realistic use cases, and problem solving.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/80 border border-purple-500/30 space-y-2">
            <div className="text-xs font-bold text-purple-400">LEVEL 4</div>
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Analyze</span>
            </h4>
            <p className="text-xs text-slate-300">
              Side-by-side comparisons, troubleshooting, and component breakdown.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-slate-800/80 border border-pink-500/30 space-y-2">
            <div className="text-xs font-bold text-pink-400">LEVEL 5</div>
            <h4 className="font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Evaluate</span>
            </h4>
            <p className="text-xs text-slate-300">
              Decision-making scenarios, trade-off analysis, and justifications.
            </p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="text-center p-12 rounded-3xl bg-gradient-to-tr from-primary-900 to-indigo-900 text-white space-y-6 shadow-xl">
        <h2 className="text-3xl font-extrabold">Ready to Master Your Study Material?</h2>
        <p className="text-primary-100 max-w-xl mx-auto text-sm">
          Stop staring at plain text documents. Turn your notes into an active Bloom&apos;s Taxonomy session today.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center space-x-2 px-8 py-3.5 bg-white text-primary-900 hover:bg-slate-100 rounded-xl font-bold transition-transform hover:scale-105 shadow-lg"
        >
          <span>Create Account &amp; Upload Notes</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>
    </div>
  );
}

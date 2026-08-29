# StudyForge PWA 🧠

> **AI-Powered Bloom's Taxonomy Study Platform**  
> Transform your uploaded study materials (PDF, TXT, Markdown) into active, structured cognitive learning experiences.

[![StudyForge CI](https://github.com/Oluwalana-hub/Study/actions/workflows/ci.yml/badge.svg)](https://github.com/Oluwalana-hub/Study/actions/workflows/ci.yml)
[![Vercel Deployment Ready](https://img.shields.io/badge/Vercel-Deploy_Ready-black?logo=vercel)](https://vercel.com)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-0c8de9?logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 🌟 Product Mission & Architecture

StudyForge is designed around a single core principle:  
**"Transform a student's own study material into an active, structured learning experience based on Bloom's Taxonomy."**

```
UPLOAD STUDY MATERIAL (PDF, TXT, MD)
         │
         ▼
EXTRACT & SEMANTIC CHUNKING
         │
         ▼
SELECT TOPIC OR WHOLE DOCUMENT & STUDY MODE
         │
         ▼
GENERATE GROUNDED BLOOM SESSION
   ├── 1. Remember (Definitions & Recall)
   ├── 2. Understand (ELI5 & Relationships)
   ├── 3. Apply (Practical Scenarios)
   ├── 4. Analyze (Troubleshooting & Comparisons)
   └── 5. Evaluate (Trade-off Decisions)
         │
         ▼
ANSWER QUESTIONS & RECEIVE CONSTRUCTIVE FEEDBACK
         │
         ▼
TRACK MASTERY ON PROGRESS MATRIX
```

---

## 🚀 Key Features

- **📄 Multi-Format Document Processing**: Upload PDF (`.pdf`), Plain Text (`.txt`), and Markdown (`.md`) files up to 20 MB with automatic text cleaning and semantic chunking.
- **🛡️ Prompt Injection Defense**: System prompt security header treats document text strictly as untrusted data to analyze, preventing embedded prompt overrides.
- **🎯 Source Grounding & Citations**: Questions and evaluations explicitly reference source chunk IDs (e.g. `Source: Uploaded Document, Chunk 0`).
- **💡 5-Level Bloom Progression**: Interactive question solver guiding students from foundational recall to evaluation.
- **📊 Adaptive Feedback & Progress Tracking**: Scoring (0–100%), identified correct/missing concepts, constructive feedback, adaptivity recommendations, and a Bloom mastery bar matrix.
- **📱 Progressive Web App (PWA)**: Installable on mobile and desktop devices with offline caching via Service Workers.
- **🐙 GitHub Integration**: Export study sessions to GitHub Flavored Markdown study guides (`.md`) and automated GitHub Actions CI pipeline.

---

## 🛠️ Technical Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Next.js Server Actions & API Route Handlers
- **Database & ORM**: Prisma ORM with SQLite (local dev) / PostgreSQL (production)
- **AI Engine**: Modular `AIService` abstraction supporting Google Gemini API (`@google/generative-ai`) and zero-config `MockAIService` fallback
- **Authentication**: JWT HttpOnly session cookies (`jose`, `bcryptjs`)

---

## 💻 Local Development Quickstart

```bash
# 1. Clone the repository
git clone https://github.com/Oluwalana-hub/Study.git
cd Study

# 2. Install dependencies & generate Prisma client
npm install

# 3. Create .env file from template
cp .env.example .env

# 4. Sync database schema
npx prisma db push

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Deploying to Vercel (Zero Errors Guide)

StudyForge is pre-configured for 1-click deployment on [Vercel](https://vercel.com).

### Step 1: Push Code to GitHub
Ensure all code is committed and pushed to your repository (`https://github.com/Oluwalana-hub/Study.git`).

### Step 2: Import Project in Vercel
1. Log in to [Vercel](https://vercel.com) and click **"Add New" $\rightarrow$ "Project"**.
2. Select your `Oluwalana-hub/Study` GitHub repository.
3. Framework Preset: **Next.js**.

### Step 3: Configure Environment Variables on Vercel
In the Vercel project settings, set the following **Environment Variables**:

| Variable | Recommended Value / Description |
| :--- | :--- |
| `DATABASE_URL` | PostgreSQL connection string e.g. `postgresql://...` (or Vercel Postgres / Supabase / Neon connection URL) |
| `JWT_SECRET` | A secure random 32-character secret string |
| `GEMINI_API_KEY` | *(Optional)* Your Google Gemini API Key. If omitted, StudyForge automatically runs in graceful demo mode |
| `MAX_FILE_SIZE_BYTES` | `20971520` (20 MB default) |

> [!NOTE]
> `package.json` includes `"build": "prisma generate && next build"`, ensuring Prisma client is automatically generated during Vercel build deployment without errors.

---

## ⚙️ Environment Variables Reference

```ini
DATABASE_URL="file:./dev.db"
JWT_SECRET="studyforge-super-secret-jwt-key-change-in-production-2026"
GEMINI_API_KEY=""
MAX_FILE_SIZE_BYTES=20971520
```

---

## 🐙 GitHub Actions CI Pipeline

The project includes an automated GitHub Actions workflow (`.github/workflows/ci.yml`) that triggers on every push or pull request to `main`:
1. Installs Node.js & dependencies (`npm ci`).
2. Generates Prisma Client (`npx prisma generate`).
3. Runs TypeScript type checks (`npx tsc --noEmit`).
4. Verifies Next.js production build (`npm run build`).

---

## 📄 License

Distributed under the MIT License.

# Zero-Hallucination Rules

These rules are **absolute and non-negotiable**. Every agent operating in this
workspace MUST follow them without exception.

---

## 1. No Fabricated Code, APIs, or Libraries

- **NEVER** invent functions, methods, classes, hooks, or modules that do not
  exist in this codebase or in the documented API surface of a dependency.
- Before referencing any import, utility, or service, **verify** that the file
  and export actually exist in the workspace tree. If you cannot find it, say
  so — do not guess.
- When suggesting a third-party package, confirm it exists on npm / the
  relevant registry and cite the correct package name and version range.

## 2. No Fabricated File Paths or Project Structure

- **NEVER** reference a file, directory, route, or Prisma model that does not
  exist in the repository. Always verify paths before writing imports or links.
- The source of truth for the project structure is the filesystem itself —
  `src/`, `prisma/`, `public/`, etc. Do not assume directories or files exist
  without checking.

## 3. No Fabricated API Responses or Data Shapes

- **NEVER** invent request/response schemas, Prisma model fields, or
  environment variable names.
- When working with the Gemini AI service (`src/lib/ai/`), the document
  processor (`src/lib/document-processor.ts`), or any service layer
  (`src/services/`), reference the **actual** TypeScript types and interfaces
  defined in the codebase.
- When discussing API routes under `src/app/api/`, describe only the endpoints
  and HTTP methods that actually exist.

## 4. No Speculative Behavior Descriptions

- When explaining what existing code does, describe **only** what the code
  actually implements. Do not add capabilities, error handling, or edge-case
  handling that is not present.
- If you are uncertain about a behavior, read the source code first. If the
  code is ambiguous, state the ambiguity explicitly rather than filling in
  details.

## 5. Cite Your Sources

- When referencing specific implementation details, point to the actual file
  and line range using clickable `file://` links.
- When referencing external documentation (Next.js, Prisma, Tailwind, Gemini
  API), note which doc page or section you are drawing from.

## 6. Acknowledge Uncertainty

- If you lack sufficient context to answer a question with confidence, **say
  "I don't know" or "I need to check"** and then use your tools to
  investigate.
- Partial answers must be clearly labelled as such (e.g., "Based on what I can
  see, …").

## 7. No Phantom Dependencies

- **NEVER** add `import` statements for packages not listed in
  `package.json` without first instructing the user to install them.
- **NEVER** reference Prisma models or fields that are not defined in
  `prisma/schema.prisma`.

## 8. Configuration Integrity

- Environment variables must match exactly what is defined in `.env.example`.
  Do not invent new env vars without explicitly flagging the addition.
- Tailwind classes must be valid within the project's `tailwind.config.ts`.
  Do not fabricate custom utility classes that have not been configured.

---

> **Enforcement**: If at any point during a task you realize you have output
> something that cannot be verified against the codebase or official
> documentation, immediately retract the statement, flag the error, and
> provide a corrected, verifiable response.

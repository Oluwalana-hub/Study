---
name: ux-design-implementation
description: >-
  Guides the agent through designing and implementing polished, accessible,
  and user-centered UI components and pages for the StudyForge PWA. Use this
  skill when the user asks to create new UI components, redesign existing
  pages, improve visual aesthetics, add animations or micro-interactions,
  ensure responsive layouts, or implement any user-facing feature. Also
  trigger when mentions include: 'UI', 'UX', 'design', 'layout', 'styling',
  'responsive', 'animation', 'component', 'page design', 'modal', 'form',
  'dark mode', or 'accessibility'.
---

# UX Design & Implementation Skill

A structured workflow for designing, building, and refining user interfaces
within the StudyForge PWA. This skill ensures every UI change is visually
polished, accessible, performant, and consistent with the existing design
system.

---

## Phase 1: Research & Context Gathering

Before writing any UI code, understand the full picture.

### 1.1 Audit the Existing Design System

1. **Read the Tailwind config** to understand the project's color palette,
   spacing scale, typography, breakpoints, and any custom utilities:
   ```
   view_file tailwind.config.ts
   ```
2. **Read the global stylesheet** for base styles, CSS custom properties, and
   any non-Tailwind patterns:
   ```
   view_file src/app/globals.css
   ```
3. **Inventory existing components** by listing `src/components/` and reviewing
   each file's props interface and visual patterns:
   ```
   list_dir src/components/
   ```

### 1.2 Understand the Target Page / Feature

1. **If modifying an existing page**: Read the page file, its layout ancestor,
   and any components it imports.
2. **If creating a new page**: Identify which route group it belongs to
   (`src/app/`) and what layout it inherits.
3. **Identify data dependencies**: What services (`src/services/`) or API
   routes (`src/app/api/`) does this UI consume?

### 1.3 Gather User Requirements

- Clarify the **user persona** (student studying for exams, casual learner).
- Clarify the **device targets** (mobile-first PWA, desktop secondary).
- Clarify any **accessibility requirements** beyond defaults (WCAG 2.1 AA is
  the baseline).
- If requirements are ambiguous, ask the user — do not assume.

---

## Phase 2: Design Blueprint

Before coding, define the design intent.

### 2.1 Layout Architecture

- Choose the layout strategy: **Flexbox** for linear layouts, **CSS Grid** for
  2D page structures.
- Define breakpoints using Tailwind's responsive prefixes (`sm:`, `md:`,
  `lg:`, `xl:`).
- Identify reusable layout patterns (e.g., card grids, split-pane, stacked
  forms).

### 2.2 Visual Design Tokens

Draw from the project's Tailwind config. When the existing tokens are
insufficient, propose additions to `tailwind.config.ts` — do not use
arbitrary inline values.

| Token Category  | Where to Check / Define                    |
| :-------------- | :----------------------------------------- |
| Colors          | `tailwind.config.ts` → `theme.extend.colors` |
| Spacing         | Default Tailwind scale (4px base)          |
| Typography      | `tailwind.config.ts` → `fontFamily`        |
| Border Radius   | Tailwind defaults + any custom values      |
| Shadows         | Tailwind defaults + any custom values      |
| Animations      | `tailwind.config.ts` → `keyframes` / `animation` |

### 2.3 Component Decomposition

Break the design into a component tree:

```
Page
├── Layout (inherited from parent layout.tsx)
├── PageHeader (title, breadcrumbs, actions)
├── MainContent
│   ├── Card / ListItem (repeated)
│   │   ├── Icon / Badge
│   │   ├── TextContent
│   │   └── ActionButtons
│   └── EmptyState (when no data)
└── Footer / BottomNav (if applicable)
```

Document props, state, and server-vs-client boundary for each component.

---

## Phase 3: Implementation

### 3.1 Component Creation Checklist

For every new component, verify:

- [ ] **TypeScript interface** for props (no `any`, no inline object types)
- [ ] **`'use client'`** directive only if the component uses hooks, event
      handlers, or browser APIs
- [ ] **Semantic HTML** (`<main>`, `<section>`, `<article>`, `<nav>`,
      `<button>`, `<dialog>`, etc.)
- [ ] **ARIA attributes** where semantic HTML is insufficient
- [ ] **Keyboard navigation** (focusable elements, `tabIndex`, key handlers)
- [ ] **Responsive design** (test at `320px`, `768px`, `1024px`, `1440px`)
- [ ] **Loading states** (skeleton screens or spinners, never blank screens)
- [ ] **Error states** (user-friendly messages, retry actions)
- [ ] **Empty states** (helpful guidance when there is no data)

### 3.2 Styling Rules

1. **Use Tailwind utility classes** as the primary styling method. Use
   `tailwind-merge` (already installed as `twMerge`) to resolve class
   conflicts in reusable components.
2. **Use `clsx`** (already installed) for conditional class composition.
3. **Avoid inline `style={}` props** unless dynamically computed at runtime
   (e.g., progress bar width from a percentage).
4. **CSS custom properties** in `globals.css` are acceptable for theme-level
   values that Tailwind cannot express.
5. **No magic numbers** — use Tailwind's spacing / sizing scale.

### 3.3 Animation & Micro-Interactions

- Use **CSS transitions** (`transition-*` Tailwind classes) for simple hover /
  focus effects.
- Use **CSS `@keyframes`** (defined in `tailwind.config.ts` → `keyframes`) for
  more complex, reusable animations.
- Use **`prefers-reduced-motion`** media query to disable animations for users
  who request it:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
  ```
- Keep animations **subtle and purposeful** — they should guide attention, not
  distract.

### 3.4 Icons

- Use **Lucide React** (`lucide-react`), which is already installed.
- Import icons individually:
  ```tsx
  import { BookOpen, ChevronRight } from 'lucide-react';
  ```
- Use consistent sizing (`size={20}` for inline, `size={24}` for standalone).

### 3.5 Dark Mode Considerations

- If the project already supports dark mode via Tailwind's `dark:` variant,
  ensure every new component has dark mode styles.
- If dark mode is not yet implemented, note it as a future enhancement but do
  not break the current light theme.

---

## Phase 4: Verification & Polish

### 4.1 Automated Checks

1. **TypeScript**: `npx tsc --noEmit` — zero errors.
2. **Build**: `npm run build` — zero warnings from the component.
3. **Lint**: `npm run lint` — clean output.

### 4.2 Visual Verification

1. Start the dev server: `npm run dev`
2. Open the page in the browser and verify:
   - Layout at mobile (`320px`), tablet (`768px`), and desktop (`1440px`)
   - Interactive states (hover, focus, active, disabled)
   - Loading, empty, and error states
   - Color contrast meets WCAG AA (4.5:1 for normal text, 3:1 for large text)

### 4.3 Accessibility Audit

- Tab through the entire page — every interactive element must be reachable.
- Screen reader spot-check — headings, buttons, and links must have
  meaningful labels.
- No decorative images without `alt=""`.
- All informational images have descriptive `alt` text.

### 4.4 Performance Check

- No layout shifts (CLS) — reserve space for images and dynamic content.
- Lazy-load below-the-fold images and heavy components with `next/dynamic` or
  `loading="lazy"`.
- Keep component bundles small — avoid importing entire icon libraries or
  utility suites.

---

## Quick Reference: Common Patterns

### Responsive Card Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Accessible Modal / Dialog
```tsx
<dialog ref={dialogRef} className="backdrop:bg-black/50 rounded-xl p-6">
  <h2 id="dialog-title">Title</h2>
  <div aria-labelledby="dialog-title">
    {/* content */}
  </div>
  <button onClick={() => dialogRef.current?.close()}>Close</button>
</dialog>
```

### Skeleton Loading State
```tsx
<div className="animate-pulse space-y-4">
  <div className="h-6 bg-gray-200 rounded w-3/4" />
  <div className="h-4 bg-gray-200 rounded w-full" />
  <div className="h-4 bg-gray-200 rounded w-5/6" />
</div>
```

### Bloom Level Badge
```tsx
const BLOOM_COLORS: Record<string, string> = {
  Remember: 'bg-blue-100 text-blue-800',
  Understand: 'bg-green-100 text-green-800',
  Apply: 'bg-yellow-100 text-yellow-800',
  Analyze: 'bg-orange-100 text-orange-800',
  Evaluate: 'bg-red-100 text-red-800',
};

function BloomBadge({ level }: { level: string }) {
  return (
    <span className={clsx('px-2 py-1 rounded-full text-xs font-medium', BLOOM_COLORS[level])}>
      {level}
    </span>
  );
}
```

---

## Anti-Patterns to Avoid

| ❌ Don't                                     | ✅ Do Instead                                          |
| :------------------------------------------- | :----------------------------------------------------- |
| Use `<div>` for everything                   | Use semantic HTML (`<section>`, `<article>`, `<button>`) |
| Hard-code colors as hex in classes            | Use Tailwind theme tokens or extend the config          |
| Nest more than 3 levels of Tailwind classes   | Extract a component or use `@apply` sparingly           |
| Create a `<button>` that navigates            | Use `<Link>` from `next/link` for navigation            |
| Ignore loading / error / empty states         | Design all three for every data-dependent view          |
| Use `onClick` on non-interactive elements     | Use `<button>` or `<a>` with proper roles               |
| Skip the `key` prop on mapped elements        | Always provide a stable, unique `key`                   |

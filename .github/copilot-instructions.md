# Project Instructions

- Use TypeScript strict mode and never use `any`.
- Forms use `react-hook-form` with `zod`; every input has a `<label htmlFor>`.
- Pages never access `localStorage` or Supabase directly; use only `src/data/repo.ts`.
- Pages never call AI logic directly; use only `src/ai/aiClient.ts`.
- Date logic takes `today` as a parameter (`YYYY-MM-DD` string) and never calls `new Date()` inside utility functions.
- New logic ships with a Vitest test.
- Use semantic HTML such as `<button>`, `<nav>`, and `<main>`; never use `<div onClick>`.

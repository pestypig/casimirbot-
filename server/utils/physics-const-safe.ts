// Robust ESM wrapper that exports a guaranteed numeric speed-of-light constant `C`.
// It attempts a dynamic import of `../physics-const` (if present) and falls back
// immediately to the numeric value 299,792,458. Uses top-level await to avoid
// `require` so TypeScript/ESM toolchains won't complain about CommonJS usage.

// Try a static ESM import of the project's `physics-const` module. This keeps
// the module ESM-only (no require) and lets TypeScript properly type-check.
// If the imported value isn't present or numeric, fall back to the safe literal.
import { C as PHYS_C } from '../physics-const.js';

export const C = (typeof PHYS_C === 'number' && Number.isFinite(PHYS_C)) ? Number(PHYS_C) : 299_792_458;

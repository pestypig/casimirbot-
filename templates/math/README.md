# Math Onboarding Templates

This folder ships starter files you can copy into a new repo to bootstrap the
math maturity system.

Quick start:
1) Copy `templates/math/MATH_STATUS.md` to your repo root.
2) Copy `templates/math/math.config.json` to your repo root.
3) Copy `templates/math/math.evidence.json` to your repo root.
4) Adjust paths, stages, and evidence globs to match your code layout.

Notes:
- Use inline overrides in files when needed:
  `// math-stage: diagnostic`
- Keep the registry and config aligned with your actual math-critical paths.
- Opt into strict failures when ready:
  `MATH_STRICT=1` or `MATH_STRICT_STAGES=diagnostic,certified`.

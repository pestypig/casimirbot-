import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

type LoopClass =
  | 'evidence_path_blocked'
  | 'applicability_limited'
  | 'margin_limited'
  | 'candidate_pass_found'
  | 'solved'
  | 'stalled'
  | 'budget_exhausted';

type Mode = 'analyze' | 'status';

const BOUNDARY_STATEMENT =
  'This campaign defines falsifiable reduced-order full-solve gates and reproducible evidence requirements; it is not a physical warp feasibility claim.';

const DEFAULTS = {
  mode: 'analyze' as Mode,
  maxIterations: 10,
  maxWallClockMinutes: 30,
  stallCycles: 3,
  artifactRoot: path.join('artifacts', 'research', 'full-solve'),
  statePath: path.join('artifacts', 'research', 'full-solve', 'g4-autoloop-state.json'),
  historyPath: path.join('artifacts', 'research', 'full-solve', 'g4-autoloop-history.jsonl'),
  promptPath: path.join('docs', 'audits', 'research', 'warp-g4-autoloop-next-prompt.md'),
  casimirPath: path.join('artifacts', 'casimir-verify.json'),
};

const files = {
  scoreboard: 'campaign-gate-scoreboard-2026-02-24.json',
  firstFail: 'campaign-first-fail-map-2026-02-24.json',
  decisionLedger: 'g4-decision-ledger-2026-02-26.json',
  governanceMatrix: 'g4-governance-matrix-2026-02-27.json',
  recovery: 'g4-recovery-search-2026-02-27.json',
  parity: 'g4-recovery-parity-2026-02-27.json',
  canonicalReport: path.join('docs', 'audits', 'research', 'warp-full-solve-campaign-execution-report-2026-02-24.md'),
  ideology: path.join('docs', 'ethos', 'ideology.json'),
};

const parseArgs = (argv: string[]) => {
  const out = { ...DEFAULTS };
  for (let i = 0; i < argv.length; i += 1) {
    const tok = argv[i];
    const next = argv[i + 1];
    if (tok === '--mode' && (next === 'analyze' || next === 'status')) out.mode = next;
    if (tok === '--max-iterations' && next) out.maxIterations = Math.max(1, Number(next));
    if (tok === '--max-wall-clock-minutes' && next) out.maxWallClockMinutes = Math.max(1, Number(next));
    if (tok === '--stall-cycles' && next) out.stallCycles = Math.max(1, Number(next));
    if (tok === '--artifact-root' && next) out.artifactRoot = next;
    if (tok === '--state-path' && next) out.statePath = next;
    if (tok === '--history-path' && next) out.historyPath = next;
    if (tok === '--prompt-path' && next) out.promptPath = next;
    if (tok === '--casimir-path' && next) out.casimirPath = next;
  }
  return out;
};

const readIfExists = (p: string): any | null => {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const classify = (inputs: Record<string, any>, opts: ReturnType<typeof parseArgs>): { loopClass: LoopClass; solved: boolean; stopReason: string } => {
  const requiredMissing = Object.entries(inputs)
    .filter(([k, v]) => k !== 'casimir' && k !== 'ideology' && k !== 'prevState' && v == null)
    .map(([k]) => k);
  if (requiredMissing.length > 0) {
    return { loopClass: 'evidence_path_blocked', solved: false, stopReason: `missing_required_artifacts:${requiredMissing.join(',')}` };
  }

  const scoreboardDecision = String(inputs.scoreboard?.decision ?? '').toUpperCase();
  const g4Status = String(inputs.scoreboard?.gateStatus?.G4 ?? 'UNKNOWN').toUpperCase();
  const canonicalClass = String(inputs.decisionLedger?.canonicalDecisionClass ?? 'evidence_path_blocked');
  const finalClass = canonicalClass === 'candidate_pass_found' ? 'candidate_pass_found' : canonicalClass;

  const casimirVerdict = String(inputs.casimir?.verdict ?? '').toUpperCase();
  const casimirIntegrityOk = inputs.casimir?.integrityOk === true;

  const solved = g4Status === 'PASS' && !['INADMISSIBLE', 'NOT_READY'].includes(scoreboardDecision) && casimirVerdict === 'PASS' && casimirIntegrityOk;
  if (solved) return { loopClass: 'solved', solved: true, stopReason: 'solve_criteria_met' };

  if (opts.maxIterations <= 0) return { loopClass: 'budget_exhausted', solved: false, stopReason: 'max_iterations_reached' };

  if (Number(inputs.prevState?.stallCounter ?? 0) >= opts.stallCycles) {
    return { loopClass: 'stalled', solved: false, stopReason: 'stall_cycles_reached' };
  }

  if (finalClass === 'applicability_limited' || finalClass === 'margin_limited' || finalClass === 'candidate_pass_found') {
    return { loopClass: finalClass, solved: false, stopReason: 'analyze_complete' };
  }

  return { loopClass: 'evidence_path_blocked', solved: false, stopReason: 'analyze_complete' };
};

const summarizeIdeology = (payload: any): string[] => {
  const rootId = String(payload?.rootId ?? 'mission-ethos');
  const nodes = Array.isArray(payload?.nodes) ? payload.nodes : [];
  const root = nodes.find((n: any) => n?.id === rootId) ?? nodes[0] ?? {};
  const children = Array.isArray(root?.children) ? root.children.slice(0, 5) : [];
  return [
    `- ideology root: ${String(root?.id ?? 'n/a')}`,
    `- ideology title: ${String(root?.title ?? 'n/a')}`,
    `- ideology advisory branches: ${children.length > 0 ? children.join(', ') : 'n/a'}`,
  ];
};

export const runAutoloop = (argv = process.argv.slice(2)) => {
  const opts = parseArgs(argv);
  const startedAt = new Date().toISOString();
  const nowMs = Date.now();

  const inputPaths = {
    scoreboard: path.join(opts.artifactRoot, files.scoreboard),
    firstFail: path.join(opts.artifactRoot, files.firstFail),
    decisionLedger: path.join(opts.artifactRoot, files.decisionLedger),
    governanceMatrix: path.join(opts.artifactRoot, files.governanceMatrix),
    recovery: path.join(opts.artifactRoot, files.recovery),
    parity: path.join(opts.artifactRoot, files.parity),
    canonicalReport: files.canonicalReport,
    ideology: files.ideology,
    casimir: opts.casimirPath,
  };

  const inputs: Record<string, any> = {
    scoreboard: readIfExists(inputPaths.scoreboard),
    firstFail: readIfExists(inputPaths.firstFail),
    decisionLedger: readIfExists(inputPaths.decisionLedger),
    governanceMatrix: readIfExists(inputPaths.governanceMatrix),
    recovery: readIfExists(inputPaths.recovery),
    parity: readIfExists(inputPaths.parity),
    canonicalReport: fs.existsSync(inputPaths.canonicalReport) ? fs.readFileSync(inputPaths.canonicalReport, 'utf8') : null,
    ideology: readIfExists(inputPaths.ideology),
    casimir: readIfExists(inputPaths.casimir),
    prevState: readIfExists(opts.statePath),
  };

  const outcome = classify(inputs, opts);
  const parityClass = String(inputs.parity?.dominantFailureMode ?? 'evidence_path_blocked');
  const parityFresh =
    typeof inputs.parity?.provenance?.commitHash === 'string' &&
    typeof inputs.recovery?.provenance?.commitHash === 'string' &&
    inputs.parity.provenance.commitHash === inputs.recovery.provenance.commitHash;

  const state = {
    runId: `g4-autoloop-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`,
    generatedAt: startedAt,
    boundaryStatement: BOUNDARY_STATEMENT,
    mode: opts.mode,
    class: outcome.loopClass,
    solved: outcome.solved,
    stopReason: outcome.stopReason,
    stallCounter: outcome.loopClass === 'stalled' ? Number(inputs.prevState?.stallCounter ?? 0) : 0,
    maxIterations: opts.maxIterations,
    maxWallClockMinutes: opts.maxWallClockMinutes,
    stallCycles: opts.stallCycles,
    canonicalDecision: String(inputs.scoreboard?.decision ?? 'UNKNOWN'),
    canonicalFirstFail: String(inputs.firstFail?.firstFail?.gate ?? inputs.firstFail?.firstFail ?? 'UNKNOWN'),
    canonicalClass: String(inputs.decisionLedger?.canonicalDecisionClass ?? 'evidence_path_blocked'),
    parityClass,
    parityFreshness: parityFresh ? 'fresh' : 'stale_or_missing',
    artifacts: inputPaths,
    counters: {
      elapsedMs: 0,
      wallClockBudgetMs: Math.round(opts.maxWallClockMinutes * 60_000),
      stallCycles: opts.stallCycles,
      maxIterations: opts.maxIterations,
      nowMs,
    },
  };

  const historyRecord = {
    ts: startedAt,
    class: state.class,
    solved: state.solved,
    stopReason: state.stopReason,
    canonicalDecision: state.canonicalDecision,
    canonicalFirstFail: state.canonicalFirstFail,
  };

  const ideologyLines = summarizeIdeology(inputs.ideology);
  const prompt = `# Warp G4 DEGA autoloop next step\n\n## Hard boundary statement\n${BOUNDARY_STATEMENT}\n\n## Current deterministic state\n- class: ${state.class}\n- solved: ${state.solved}\n- canonical decision: ${state.canonicalDecision}\n- canonical first fail: ${state.canonicalFirstFail}\n- canonical class: ${state.canonicalClass}\n- parity class: ${state.parityClass}\n- parity freshness: ${state.parityFreshness}\n\n## Stop criteria\n- maxIterations: ${opts.maxIterations}\n- maxWallClockMinutes: ${opts.maxWallClockMinutes}\n- stallCycles: ${opts.stallCycles}\n\n## Ideology context\n${ideologyLines.join('\n')}\nIdeology context is advisory only and cannot override evidence gates, guardrails, or completion criteria.\n`;

  if (opts.mode === 'status') {
    console.log(JSON.stringify({
      class: state.class,
      solved: state.solved,
      stopReason: state.stopReason,
      canonicalDecision: state.canonicalDecision,
      canonicalFirstFail: state.canonicalFirstFail,
      parityFreshness: state.parityFreshness,
    }));
    return { ok: true, mode: opts.mode, statePath: opts.statePath, historyPath: opts.historyPath, promptPath: opts.promptPath, class: state.class };
  }

  fs.mkdirSync(path.dirname(opts.statePath), { recursive: true });
  fs.mkdirSync(path.dirname(opts.historyPath), { recursive: true });
  fs.mkdirSync(path.dirname(opts.promptPath), { recursive: true });
  fs.writeFileSync(opts.statePath, `${JSON.stringify(state, null, 2)}\n`);
  fs.appendFileSync(opts.historyPath, `${JSON.stringify(historyRecord)}\n`);
  fs.writeFileSync(opts.promptPath, prompt);

  console.log(JSON.stringify({ ok: true, class: state.class, solved: state.solved, statePath: opts.statePath, historyPath: opts.historyPath, promptPath: opts.promptPath }));
  return { ok: true, mode: opts.mode, statePath: opts.statePath, historyPath: opts.historyPath, promptPath: opts.promptPath, class: state.class };
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runAutoloop();
}

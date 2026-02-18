import fs from 'node:fs/promises';
import path from 'node:path';

type Family = 'relation'|'repo_technical'|'ambiguous_general';
type PromptCase = {id:string; family:Family; question:string; noisy?:boolean};

type AskResponse = {
  text?: string;
  report_mode?: boolean;
  debug?: Record<string, unknown> & {live_events?: Array<Record<string,unknown>>; intent_id?: string; report_mode?: boolean};
  [k:string]: unknown;
};

type RawRecord = {
  variant: string;
  commit: string;
  run_id: string;
  prompt_id: string;
  family: Family;
  noisy: boolean;
  question: string;
  seed: number;
  temperature: number;
  status: number;
  latency_ms: number;
  attempt_count: number;
  retry_reason: string | null;
  timestamp: string;
  response_text: string;
  response_payload: AskResponse | null;
  debug_payload: Record<string, unknown> | null;
  live_events: Array<Record<string, unknown>>;
  score: {
    answer_directness_pass: 0|1;
    min_length_pass: 0|1;
    citation_presence_pass: 0|1;
    clarification_quality_pass: 0|1;
    utility_score: number;
  };
};

const BASE_URL = process.env.HELIX_ASK_BASE_URL ?? 'http://127.0.0.1:5173';
const OUT_ROOT = process.env.HELIX_ASK_AB_OUT ?? 'artifacts/experiments/helix-ask-utility-ab';
const VARIANT = process.env.HELIX_ASK_AB_VARIANT ?? 'candidate';
const COMMIT = process.env.HELIX_ASK_AB_COMMIT ?? 'unknown';
const SEEDS = (process.env.HELIX_ASK_AB_SEEDS ?? '7,11,13').split(',').map((v)=>Number(v.trim())).filter(Number.isFinite);
const TEMPERATURE = Number(process.env.HELIX_ASK_AB_TEMP ?? '0.2');
const MIN_LEN = Number(process.env.HELIX_ASK_AB_MIN_LEN ?? '220');
const REQUEST_TIMEOUT_MS = Math.max(1000, Number(process.env.HELIX_ASK_AB_TIMEOUT_MS ?? '20000'));
const MAX_ATTEMPTS = Math.max(1, Number(process.env.HELIX_ASK_AB_MAX_ATTEMPTS ?? '3'));
const RETRY_BASE_MS = Math.max(50, Number(process.env.HELIX_ASK_AB_RETRY_BASE_MS ?? '450'));
const MIN_STATUS_OK_RATE = Math.max(0, Math.min(1, Number(process.env.HELIX_ASK_AB_MIN_STATUS_OK_RATE ?? '0.90')));
const MAX_INVALID_RATE = Math.max(0, Math.min(1, Number(process.env.HELIX_ASK_AB_MAX_INVALID_RATE ?? '0.10')));
const MIN_DIRECTNESS_RATE = Math.max(0, Math.min(1, Number(process.env.HELIX_ASK_AB_MIN_DIRECTNESS_RATE ?? '0.85')));
const MIN_LENGTH_RATE = Math.max(0, Math.min(1, Number(process.env.HELIX_ASK_AB_MIN_LENGTH_RATE ?? '0.90')));
const MIN_CITATION_RATE = Math.max(0, Math.min(1, Number(process.env.HELIX_ASK_AB_MIN_CITATION_RATE ?? '0.90')));

type AskAttemptResult = {
  status: number;
  payload: AskResponse | null;
  latencyMs: number;
  attemptCount: number;
  retryReason: string | null;
};

type ReadyProbeResult = {
  ok: boolean;
  reason: string | null;
};

const prompts = (): PromptCase[] => {
  const relation = [
    ['How does warp bubble viability relate to mission ethos constraints in this repo?', false],
    ['Map warp bubble evidence to ideology accountability and falsifiability checks.', false],
    ['Explain warp bubble ↔ mission ethos relation without report scaffolding.', false],
    ['How do Casimir verification gates connect to ideology non-harm commitments?', false],
    ['What ties warp-bubble claims to the ideology tree branches?', false],
    ['Relate Natario constraints to mission ethics and decision guardrails.', false],
    ['How do warp constraints and falsifiability policy reinforce each other?', false],
    ['Give a concise relation chain: warp physics -> constraints -> ethos -> action limits.', false],
    ['Could a technically strong warp result still fail ethos requirements? explain.', false],
    ['How does certificate integrity affect ideology-grounded trust in warp outputs?', false],
    ['warp buble relashun to ethos n falsifiability?', true],
    ['quick relation plz: warp bubble + mission ethos + hard constraints?', true],
  ] as const;
  const repo = [
    ['Where is /api/agi/ask route logic that decides report_mode?', false],
    ['How does /api/agi/adapter/run encode verdict, firstFail, and certificate fields?', false],
    ['Where are evidence cards assembled for Helix Ask responses?', false],
    ['Which code path applies citation fallback/min-length quality floor?', false],
    ['How are debug live events emitted and returned to clients?', false],
    ['What determines relation_packet_bridge_count and relation_packet_evidence_count?', false],
    ['Where are ambiguous asks redirected into clarification behavior?', false],
    ['How is intent routing done between relation/repo/general asks?', false],
    ['What does report-mode suppression do for relation prompts?', false],
    ['How is training-trace export exposed and what payload form does it use?', false],
    ['whre adapter run endpoint checks cert hash integirty?', true],
    ['repo tech: hw does ask route chooze intent + assemble final ans?', true],
  ] as const;
  const amb = [
    ['Define falsifiability in plain terms.', false],
    ['What is a good short answer format for technical users?', false],
    ['When should an assistant ask clarifying questions?', false],
    ['Difference between hypothesis and verified claim?', false],
    ['How do I quickly triage failures?', false],
    ['What makes a citation useful?', false],
    ['Give me a concise explanation of verification.', false],
    ['How can ambiguous prompts be improved?', false],
    ['What is model drift?', false],
    ['How should I read latency percentiles?', false],
    ['wht iz verifcation?', true],
    ['need short ans: cite or no cite??', true],
  ] as const;

  const build = (family: Family, arr: readonly (readonly [string, boolean])[]) => arr.map((item, i) => ({
    id: `${family}_${String(i+1).padStart(2,'0')}`,
    family,
    question: item[0],
    noisy: item[1],
  }));

  return [...build('relation', relation), ...build('repo_technical', repo), ...build('ambiguous_general', amb)];
};

async function ensureReady(): Promise<ReadyProbeResult> {
  for (let i=0;i<120;i++) {
    try {
      const r = await fetch(new URL('/api/ready', BASE_URL), {cache:'no-store'});
      if (r.status === 200) {
        const payload = (await r.json().catch(()=>null)) as { ready?: boolean } | null;
        if (!payload || payload.ready !== false) {
          return { ok: true, reason: null };
        }
      }
    } catch {}
    await new Promise((res)=>setTimeout(res, 1000));
  }
  // Fallback probe: if /api/ready is unreliable, validate ask endpoint directly.
  for (let i=0;i<5;i++) {
    try {
      const resp = await fetch(new URL('/api/agi/ask', BASE_URL), {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({ question: 'health check', debug: false, temperature: 0 }),
      });
      if (resp.status === 200) {
        return { ok: true, reason: null };
      }
    } catch {}
    await new Promise((res)=>setTimeout(res, 500));
  }
  return { ok: false, reason: `server not ready at ${BASE_URL}` };
}

function hasCitation(text: string): boolean {
  if (!text) return false;
  if (/\[[^\]]+\]\([^)]+\)|\(see [^)]+\)/i.test(text)) return true;
  if (/^\s*sources?\s*:/im.test(text)) return true;
  if (/\b(source|citation|evidence|references?)\b/i.test(text) && /[:\-]/.test(text)) return true;
  if (/(?:^|\s)(docs|server|modules|client|scripts|tests|shared)\/[^\s,;)\]]+/i.test(text)) return true;
  return false;
}

function retryDelayMs(attempt: number): number {
  return Math.min(5000, RETRY_BASE_MS * Math.pow(2, Math.max(0, attempt - 1)));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve)=>setTimeout(resolve, ms));
}

function payloadText(payload: AskResponse | null): string {
  return `${String(payload?.text ?? '')}\n${JSON.stringify(payload ?? {})}`.toLowerCase();
}

function inferRetryReason(status: number, payload: AskResponse | null): string | null {
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'service_unavailable';
  if (status === 408 || status === 504) return 'timeout';
  if (status === 0) return 'network_or_timeout';
  if (status >= 500) return 'server_error';
  const text = payloadText(payload);
  if (/circuit[_\s-]?open|short[_\s-]?circuit/.test(text)) return 'circuit_open_short_circuit';
  if (/cooldown|temporarily unavailable|retry later/.test(text)) return 'cooldown_or_unavailable';
  if (/autoscale|not settled/.test(text)) return 'autoscale_not_settled';
  return null;
}

function shouldRetry(status: number, payload: AskResponse | null): boolean {
  return inferRetryReason(status, payload) !== null;
}

function isUsableRun(status: number, retryReason: string | null): boolean {
  return status === 200 && retryReason === null;
}

async function askWithRetry(entry: PromptCase, seed: number): Promise<AskAttemptResult> {
  const started = Date.now();
  let lastStatus = 0;
  let lastPayload: AskResponse | null = null;
  let lastRetryReason: string | null = null;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    let status = 0;
    let payload: AskResponse | null = null;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const resp = await fetch(new URL('/api/agi/ask', BASE_URL), {
        method:'POST',
        headers:{'content-type':'application/json'},
        body: JSON.stringify({
          question: entry.question,
          debug: true,
          seed,
          temperature: TEMPERATURE,
          sessionId: `utility-ab:${VARIANT}:${entry.id}:s${seed}:a${attempt}`.slice(0,120),
        }),
        signal: controller.signal,
      });
      status = resp.status;
      const contentType = resp.headers.get('content-type') ?? '';
      if (contentType.includes('application/json')) {
        payload = await resp.json() as AskResponse;
      } else {
        payload = { text: await resp.text() } as AskResponse;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : typeof error === 'string' ? error : 'request_failed';
      payload = { text: message } as AskResponse;
      status = 0;
    } finally {
      clearTimeout(timeout);
    }

    lastStatus = status;
    lastPayload = payload;
    lastRetryReason = inferRetryReason(status, payload);

    if (!shouldRetry(status, payload) || attempt === MAX_ATTEMPTS) {
      return {
        status: lastStatus,
        payload: lastPayload,
        latencyMs: Date.now() - started,
        attemptCount: attempt,
        retryReason: lastRetryReason,
      };
    }

    await sleep(retryDelayMs(attempt));
  }

  return {
    status: lastStatus,
    payload: lastPayload,
    latencyMs: Date.now() - started,
    attemptCount: MAX_ATTEMPTS,
    retryReason: lastRetryReason,
  };
}

function score(entry: PromptCase, payload: AskResponse | null): RawRecord['score'] {
  const text = String(payload?.text ?? '').trim();
  const low = text.toLowerCase();
  const qlow = entry.question.toLowerCase();
  const keywords = qlow.split(/[^a-z0-9]+/).filter((w)=>w.length>4).slice(0,5);
  const overlap = keywords.filter((w)=>low.includes(w)).length;
  const answer_directness_pass: 0|1 = (text.length > 0 && (overlap >= 1 || /here('| i)s|in short|it means|you can|the/.test(low))) ? 1 : 0;
  const min_length_pass: 0|1 = text.length >= MIN_LEN ? 1 : 0;
  const citation_presence_pass: 0|1 = hasCitation(text) ? 1 : 0;
  const clarification_quality_pass: 0|1 = entry.family === 'ambiguous_general'
    ? (/clarif|could you|do you mean|context|depends/i.test(text) ? 1 : 0)
    : 1;
  const utility_score = Number((0.35*answer_directness_pass + 0.25*min_length_pass + 0.25*citation_presence_pass + 0.15*clarification_quality_pass).toFixed(3));
  return {answer_directness_pass, min_length_pass, citation_presence_pass, clarification_quality_pass, utility_score};
}

async function run() {
  const runId = new Date().toISOString().replace(/[.:]/g,'-');
  const variantDir = path.resolve(OUT_ROOT, VARIANT);
  const rawDir = path.resolve(variantDir, 'raw');
  await fs.mkdir(rawDir, {recursive:true});
  const promptList = prompts();

  const ready = await ensureReady();
  if (!ready.ok) {
    const summary = {
      summary_schema_version: 2,
      variant: VARIANT,
      commit: COMMIT,
      run_id: runId,
      base_url: BASE_URL,
      prompt_count: promptList.length,
      run_count: 0,
      avg_utility: 0,
      answer_directness_rate: 0,
      min_length_rate: 0,
      citation_presence_rate: 0,
      clarification_quality_rate: 0,
      status_ok_rate: 0,
      http_status_ok_rate: 0,
      invalid_error_rate: 1,
      avg_attempts: 0,
      noisy_avg_utility: 0,
      retry_reason_counts: { ready_gate_failed: 1 },
      failure_counts: { request_failed: 0, citation_missing: 0, text_too_short: 0, low_directness: 0, ready_gate_failed: 1 },
      result_type: 'insufficient_run_quality',
      run_quality_pass: false,
      quality_pass: false,
      decision_thresholds: {
        min_status_ok_rate: MIN_STATUS_OK_RATE,
        max_invalid_rate: MAX_INVALID_RATE,
        min_answer_directness_rate: MIN_DIRECTNESS_RATE,
        min_length_rate: MIN_LENGTH_RATE,
        min_citation_presence_rate: MIN_CITATION_RATE,
      },
      blockers: [ready.reason ?? `server not ready at ${BASE_URL}`],
      timestamp: new Date().toISOString(),
    };
    await fs.writeFile(path.resolve(variantDir,'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
    await fs.writeFile(
      path.resolve(variantDir, 'recommendation.json'),
      `${JSON.stringify({
        variant: VARIANT,
        commit: COMMIT,
        run_id: runId,
        result_type: 'insufficient_run_quality',
        blockers: [ready.reason ?? `server not ready at ${BASE_URL}`],
        recommendations: [
          'Stabilize server readiness and endpoint availability before utility comparisons.',
          'Re-run utility AB after ready gate passes.',
        ],
      }, null, 2)}\n`,
      'utf8',
    );
    const promptPack = {count: promptList.length, prompts: promptList};
    await fs.writeFile(path.resolve(OUT_ROOT, 'prompt-pack.json'), `${JSON.stringify(promptPack,null,2)}\n`, 'utf8');
    console.error(`[${VARIANT}] ready gate failed: ${ready.reason}`);
    process.exitCode = 2;
    return;
  }

  const rows: RawRecord[] = [];
  for (const entry of promptList) {
    for (const seed of SEEDS) {
      const asked = await askWithRetry(entry, seed);
      const status = asked.status;
      const payload = asked.payload;
      const rec: RawRecord = {
        variant: VARIANT,
        commit: COMMIT,
        run_id: runId,
        prompt_id: entry.id,
        family: entry.family,
        noisy: Boolean(entry.noisy),
        question: entry.question,
        seed,
        temperature: TEMPERATURE,
        status,
        latency_ms: asked.latencyMs,
        attempt_count: asked.attemptCount,
        retry_reason: asked.retryReason,
        timestamp: new Date().toISOString(),
        response_text: String(payload?.text ?? ''),
        response_payload: payload,
        debug_payload: payload?.debug ?? null,
        live_events: Array.isArray(payload?.debug?.live_events) ? payload?.debug?.live_events as Array<Record<string, unknown>> : [],
        score: score(entry, payload),
      };
      rows.push(rec);
      const f = path.resolve(rawDir, `${entry.id}__s${seed}.json`);
      await fs.writeFile(f, `${JSON.stringify(rec, null, 2)}\n`, 'utf8');
      console.log(`[${VARIANT}] ${entry.id} seed=${seed} status=${status} attempt=${asked.attemptCount} utility=${rec.score.utility_score}`);
    }
  }

  const httpStatusOkRate = rows.filter((r)=>r.status===200).length/Math.max(1,rows.length);
  const statusOkRate = rows.filter((r)=>isUsableRun(r.status, r.retry_reason)).length/Math.max(1,rows.length);
  const invalidErrorRate = 1 - statusOkRate;
  const answerDirectnessRate = rows.reduce((a,b)=>a+b.score.answer_directness_pass,0)/Math.max(1,rows.length);
  const minLengthRate = rows.reduce((a,b)=>a+b.score.min_length_pass,0)/Math.max(1,rows.length);
  const citationPresenceRate = rows.reduce((a,b)=>a+b.score.citation_presence_pass,0)/Math.max(1,rows.length);
  const clarificationQualityRate = rows.reduce((a,b)=>a+b.score.clarification_quality_pass,0)/Math.max(1,rows.length);
  const avgUtility = rows.reduce((a,b)=>a+b.score.utility_score,0)/Math.max(1,rows.length);
  const avgAttempts = rows.reduce((a,b)=>a+b.attempt_count,0)/Math.max(1,rows.length);

  const retryReasonCounts = rows.reduce<Record<string, number>>((acc, row) => {
    const key = row.retry_reason ?? 'none';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const failureCounts = {
    request_failed: rows.filter((r)=>!isUsableRun(r.status, r.retry_reason)).length,
    citation_missing: rows.filter((r)=>r.score.citation_presence_pass===0).length,
    text_too_short: rows.filter((r)=>r.score.min_length_pass===0).length,
    low_directness: rows.filter((r)=>r.score.answer_directness_pass===0).length,
  };

  const runQualityPass = statusOkRate >= MIN_STATUS_OK_RATE && invalidErrorRate <= MAX_INVALID_RATE;
  const qualityPass =
    answerDirectnessRate >= MIN_DIRECTNESS_RATE &&
    minLengthRate >= MIN_LENGTH_RATE &&
    citationPresenceRate >= MIN_CITATION_RATE;

  const resultType =
    !runQualityPass
      ? 'insufficient_run_quality'
      : !qualityPass
        ? 'needs_quality_patch'
        : 'pass';

  const blockers: string[] = [];
  if (statusOkRate < MIN_STATUS_OK_RATE) blockers.push(`status_ok_rate ${statusOkRate.toFixed(3)} < ${MIN_STATUS_OK_RATE.toFixed(3)}`);
  if (invalidErrorRate > MAX_INVALID_RATE) blockers.push(`invalid_error_rate ${invalidErrorRate.toFixed(3)} > ${MAX_INVALID_RATE.toFixed(3)}`);
  if (answerDirectnessRate < MIN_DIRECTNESS_RATE) blockers.push(`answer_directness_rate ${answerDirectnessRate.toFixed(3)} < ${MIN_DIRECTNESS_RATE.toFixed(3)}`);
  if (minLengthRate < MIN_LENGTH_RATE) blockers.push(`min_length_rate ${minLengthRate.toFixed(3)} < ${MIN_LENGTH_RATE.toFixed(3)}`);
  if (citationPresenceRate < MIN_CITATION_RATE) blockers.push(`citation_presence_rate ${citationPresenceRate.toFixed(3)} < ${MIN_CITATION_RATE.toFixed(3)}`);

  const summary = {
    summary_schema_version: 2,
    variant: VARIANT,
    commit: COMMIT,
    run_id: runId,
    base_url: BASE_URL,
    prompt_count: prompts().length,
    run_count: rows.length,
    avg_utility: avgUtility,
    answer_directness_rate: answerDirectnessRate,
    min_length_rate: minLengthRate,
    citation_presence_rate: citationPresenceRate,
    clarification_quality_rate: clarificationQualityRate,
    status_ok_rate: statusOkRate,
    http_status_ok_rate: httpStatusOkRate,
    invalid_error_rate: invalidErrorRate,
    avg_attempts: avgAttempts,
    noisy_avg_utility: rows.filter((r)=>r.noisy).reduce((a,b)=>a+b.score.utility_score,0)/Math.max(1,rows.filter((r)=>r.noisy).length),
    retry_reason_counts: retryReasonCounts,
    failure_counts: failureCounts,
    result_type: resultType,
    run_quality_pass: runQualityPass,
    quality_pass: qualityPass,
    decision_thresholds: {
      min_status_ok_rate: MIN_STATUS_OK_RATE,
      max_invalid_rate: MAX_INVALID_RATE,
      min_answer_directness_rate: MIN_DIRECTNESS_RATE,
      min_length_rate: MIN_LENGTH_RATE,
      min_citation_presence_rate: MIN_CITATION_RATE,
    },
    blockers,
    timestamp: new Date().toISOString(),
  };

  await fs.writeFile(path.resolve(variantDir,'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  await fs.writeFile(
    path.resolve(variantDir, 'recommendation.json'),
    `${JSON.stringify({
      variant: VARIANT,
      commit: COMMIT,
      run_id: runId,
      result_type: resultType,
      blockers,
      recommendations:
        resultType === 'insufficient_run_quality'
          ? [
              'Stabilize endpoint availability and retry policy before utility comparisons.',
              'Re-run campaign only after status_ok_rate and invalid/error gates pass.',
            ]
          : resultType === 'needs_quality_patch'
            ? [
                'Patch citation persistence and minimum answer length handling.',
                'Re-run utility A/B and compare deltas on citation and length pass rates.',
              ]
            : ['No blocking issues detected in this run.'],
    }, null, 2)}\n`,
    'utf8',
  );

  const promptPack = {count: promptList.length, prompts: promptList};
  await fs.writeFile(path.resolve(OUT_ROOT, 'prompt-pack.json'), `${JSON.stringify(promptPack,null,2)}\n`, 'utf8');
}

run().catch((err)=>{ console.error(err); process.exitCode = 1; });

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

async function ensureReady() {
  for (let i=0;i<120;i++) {
    try {
      const r = await fetch(new URL('/api/ready', BASE_URL), {cache:'no-store'});
      if (r.status === 200) return;
    } catch {}
    await new Promise((res)=>setTimeout(res, 1000));
  }
  throw new Error(`server not ready at ${BASE_URL}`);
}

function hasCitation(text: string): boolean {
  return /\[[^\]]+\]\([^)]+\)|\b(source|citation|evidence|ref)\b/i.test(text);
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
  await ensureReady();
  const runId = new Date().toISOString().replace(/[.:]/g,'-');
  const variantDir = path.resolve(OUT_ROOT, VARIANT);
  const rawDir = path.resolve(variantDir, 'raw');
  await fs.mkdir(rawDir, {recursive:true});

  const rows: RawRecord[] = [];
  for (const entry of prompts()) {
    for (const seed of SEEDS) {
      const started = Date.now();
      let status = 0;
      let payload: AskResponse | null = null;
      try {
        const resp = await fetch(new URL('/api/agi/ask', BASE_URL), {
          method:'POST', headers:{'content-type':'application/json'},
          body: JSON.stringify({question: entry.question, debug: true, seed, temperature: TEMPERATURE, sessionId: `utility-ab:${VARIANT}:${entry.id}:s${seed}`.slice(0,120)}),
        });
        status = resp.status;
        payload = await resp.json() as AskResponse;
      } catch {}
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
        latency_ms: Date.now()-started,
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
      console.log(`[${VARIANT}] ${entry.id} seed=${seed} status=${status} utility=${rec.score.utility_score}`);
    }
  }

  const summary = {
    variant: VARIANT,
    commit: COMMIT,
    run_id: runId,
    prompt_count: prompts().length,
    run_count: rows.length,
    avg_utility: rows.reduce((a,b)=>a+b.score.utility_score,0)/Math.max(1,rows.length),
    answer_directness_rate: rows.reduce((a,b)=>a+b.score.answer_directness_pass,0)/Math.max(1,rows.length),
    min_length_rate: rows.reduce((a,b)=>a+b.score.min_length_pass,0)/Math.max(1,rows.length),
    citation_presence_rate: rows.reduce((a,b)=>a+b.score.citation_presence_pass,0)/Math.max(1,rows.length),
    clarification_quality_rate: rows.reduce((a,b)=>a+b.score.clarification_quality_pass,0)/Math.max(1,rows.length),
    status_ok_rate: rows.filter((r)=>r.status===200).length/Math.max(1,rows.length),
    noisy_avg_utility: rows.filter((r)=>r.noisy).reduce((a,b)=>a+b.score.utility_score,0)/Math.max(1,rows.filter((r)=>r.noisy).length),
    timestamp: new Date().toISOString(),
  };

  await fs.writeFile(path.resolve(variantDir,'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  const promptPack = {count: prompts().length, prompts: prompts()};
  await fs.writeFile(path.resolve(OUT_ROOT, 'prompt-pack.json'), `${JSON.stringify(promptPack,null,2)}\n`, 'utf8');
}

run().catch((err)=>{ console.error(err); process.exitCode = 1; });

import fs from "node:fs/promises";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";

type CorpusTask = { id: string; prompt: string; expected_files: string[] };
type Corpus = { version: string; tasks: CorpusTask[] };
type VariantSpec = { name: string; atlasLane: "0" | "1"; gitTrackedLane: "0" | "1" };
type MatchMode = "exact" | "normalized" | "alias" | "none";

type ScenarioMetrics = {
  gold_file_recall_at_5: number;
  gold_file_recall_at_10: number;
  consequential_file_retention_rate: number;
  rerank_mrr10: number;
  graph_edge_hit_rate: number;
  retrieval_confidence_mean: number;
  retrieval_doc_share_mean: number;
  unmatched_expected_file_rate: number;
};

type TaskResult = {
  expected_files: string[];
  top5: string[];
  top10: string[];
  rawHits5: number;
  rawHits10: number;
  canonHits5: number;
  canonHits10: number;
  rawRR: number;
  canonRR: number;
  mode: MatchMode;
  graphEdgeHit: boolean;
  confidence: number | null;
  docShare: number | null;
};

const BASE_URL = process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:5050";
const ASK_URL = new URL("/api/agi/ask", BASE_URL).toString();
const READY_URL = new URL("/api/ready", BASE_URL).toString();
const CORPUS_PATH = process.env.HELIX_ASK_RETRIEVAL_CORPUS ?? "configs/repo-atlas-bench-corpus.v1.json";
const OUTPUT_ROOT = process.env.HELIX_ASK_RETRIEVAL_ABLATION_OUT_ROOT ?? "artifacts/experiments/helix-ask-retrieval-ablation";
const TOP_K = Number(process.env.HELIX_ASK_RETRIEVAL_TOPK ?? 18);
const MAX_TASKS = Number(process.env.HELIX_ASK_RETRIEVAL_MAX_TASKS ?? 0);
const SEEDS = String(process.env.HELIX_ASK_RETRIEVAL_SEEDS ?? "7,11,13").split(",").map((v) => Number(v.trim())).filter(Number.isFinite);
const TEMPS = String(process.env.HELIX_ASK_RETRIEVAL_TEMPERATURES ?? "0.2").split(",").map((v) => Number(v.trim())).filter(Number.isFinite);

const VARIANTS: VariantSpec[] = [
  { name: "baseline_atlas_git_on", atlasLane: "1", gitTrackedLane: "1" },
  { name: "atlas_off_git_on", atlasLane: "0", gitTrackedLane: "1" },
  { name: "atlas_on_git_off", atlasLane: "1", gitTrackedLane: "0" },
  { name: "atlas_off_git_off", atlasLane: "0", gitTrackedLane: "0" },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const normalize = (s: string) => s.replace(/\\/g, "/").replace(/^\.\//, "").toLowerCase();
const aliasSet = (s: string) => {
  const n = normalize(s); const set = new Set([n]);
  if (n.startsWith("server/utils/")) set.add(n.replace("server/utils/", "server/"));
  if (n.startsWith("server/")) set.add(n.replace("server/", "server/utils/"));
  return set;
};
const bestMode = (expected: string, candidates: string[]): MatchMode => {
  if (candidates.includes(expected)) return "exact";
  const cn = candidates.map(normalize);
  if (cn.includes(normalize(expected))) return "normalized";
  const aliases = aliasSet(expected);
  return cn.some((c) => aliases.has(c)) ? "alias" : "none";
};

const quantile = (vals: number[], q: number) => {
  if (!vals.length) return 0; const s=[...vals].sort((a,b)=>a-b); const i=(s.length-1)*q; const lo=Math.floor(i), hi=Math.ceil(i); if(lo===hi) return s[lo]; return s[lo]+(s[hi]-s[lo])*(i-lo);
};
let rngState = 123456789;
const rng = () => { rngState = (1664525 * rngState + 1013904223) >>> 0; return rngState / 0xffffffff; };
const ci95 = (vals: number[]) => {
  if (vals.length < 2) return { low: vals[0] ?? 0, high: vals[0] ?? 0 };
  const boots:number[]=[];
  for(let i=0;i<400;i++){ const sample:number[]=[]; for(let j=0;j<vals.length;j++) sample.push(vals[Math.floor(rng()*vals.length)]); boots.push(avg(sample)); }
  return { low: quantile(boots,0.025), high: quantile(boots,0.975) };
};

const startServer = (variant: VariantSpec): ChildProcess => { const child=spawn("npx", ["tsx", "server/index.ts"], { env: { ...process.env, NODE_ENV:"development", PORT:"5050", SKIP_VITE_MIDDLEWARE:"1", HELIX_ASK_ATLAS_LANE:variant.atlasLane, HELIX_ASK_GIT_TRACKED_LANE:variant.gitTrackedLane }, stdio:["ignore","pipe","pipe"], detached:true }); child.stdout?.on("data",()=>{}); return child; };
const stopServer = async (child: ChildProcess) => { if(child.pid && child.exitCode===null) process.kill(-child.pid,"SIGTERM"); await sleep(800); };
const waitReady = async () => { for(let i=0;i<120;i++){ try{ const r=await fetch(READY_URL); const j=await r.json() as {ready?:boolean}; if(j.ready) return; }catch{} await sleep(1000);} throw new Error("ready timeout"); };

const runTask = async (task: CorpusTask, seed: number, temperature: number): Promise<TaskResult> => {
  let payload: { debug?: { context_files?: unknown; belief_graph_edge_count?: unknown; retrieval_confidence?: unknown; retrieval_doc_share?: unknown } } | null = null;
  for (let attempt=0; attempt<3; attempt+=1) {
    try {
      const res = await fetch(ASK_URL, { method:"POST", headers:{"content-type":"application/json"}, body: JSON.stringify({ question: task.prompt, dryRun:true, debug:true, topK:TOP_K, seed, temperature, sessionId:`retrieval-ablation:${task.id}:${seed}:${temperature}` }) });
      payload = (await res.json()) as { debug?: { context_files?: unknown; belief_graph_edge_count?: unknown; retrieval_confidence?: unknown; retrieval_doc_share?: unknown } };
      break;
    } catch { await sleep(500 * (attempt + 1)); }
  }
  if (!payload) throw new Error(`ask failed for ${task.id}`);
  const top10 = Array.isArray(payload.debug?.context_files) ? payload.debug!.context_files.filter((v): v is string => typeof v === "string").slice(0,10) : [];
  const top5 = top10.slice(0,5);
  const modes = task.expected_files.map((e)=>bestMode(e, top10));
  const rawHits10 = task.expected_files.filter((e)=>top10.includes(e)).length;
  const rawHits5 = task.expected_files.filter((e)=>top5.includes(e)).length;
  const canonHits10 = modes.filter((m)=>m!=="none").length;
  const canonHits5 = task.expected_files.filter((e)=>bestMode(e, top5)!=="none").length;
  const rank = (cand:string[]) => { for(let i=0;i<cand.length;i++) if(task.expected_files.includes(cand[i])) return 1/(i+1); return 0; };
  const canonRank = () => { for(let i=0;i<top10.length;i++) if(task.expected_files.some((e)=>bestMode(e,[top10[i]])!=="none")) return 1/(i+1); return 0; };
  const mode:MatchMode = modes.includes("exact")?"exact":modes.includes("normalized")?"normalized":modes.includes("alias")?"alias":"none";
  return { expected_files: task.expected_files, top5, top10, rawHits5, rawHits10, canonHits5, canonHits10, rawRR: rank(top10), canonRR: canonRank(), mode, graphEdgeHit:Number(payload.debug?.belief_graph_edge_count??0)>0, confidence: typeof payload.debug?.retrieval_confidence==="number"?payload.debug!.retrieval_confidence:null, docShare: typeof payload.debug?.retrieval_doc_share==="number"?payload.debug!.retrieval_doc_share:null };
};

const summarize = (results: TaskResult[], canonical: boolean): ScenarioMetrics => {
  const expected = results.reduce((n,r)=>n+r.expected_files.length,0);
  const hit5 = results.reduce((n,r)=>n+(canonical?r.canonHits5:r.rawHits5),0);
  const hit10 = results.reduce((n,r)=>n+(canonical?r.canonHits10:r.rawHits10),0);
  return {
    gold_file_recall_at_5: expected?hit5/expected:0,
    gold_file_recall_at_10: expected?hit10/expected:0,
    consequential_file_retention_rate: results.length?results.filter((r)=>(canonical?r.canonHits10:r.rawHits10)>0).length/results.length:0,
    rerank_mrr10: avg(results.map((r)=>canonical?r.canonRR:r.rawRR)),
    graph_edge_hit_rate: avg(results.map((r)=>r.graphEdgeHit?1:0)),
    retrieval_confidence_mean: avg(results.flatMap((r)=>r.confidence==null?[]:[r.confidence])),
    retrieval_doc_share_mean: avg(results.flatMap((r)=>r.docShare==null?[]:[r.docShare])),
    unmatched_expected_file_rate: results.length?results.filter((r)=>r.mode==="none").length/results.length:0,
  };
};

const main = async () => {
  const corpus = JSON.parse(await fs.readFile(CORPUS_PATH, "utf8")) as Corpus;
  const tasks = [...corpus.tasks].sort((a,b)=>a.id.localeCompare(b.id));
  const scoped = MAX_TASKS>0?tasks.slice(0,MAX_TASKS):tasks;
  const runId=`retrieval-ablation-${Date.now()}`; const outDir=path.join(OUTPUT_ROOT,runId); await fs.mkdir(outDir,{recursive:true});
  const score: any = { runId, generatedAt:new Date().toISOString(), seeds:SEEDS, temperatures:TEMPS, variants:{} };

  for (const variant of VARIANTS) {
    const server = startServer(variant); await waitReady();
    try {
      const scenarios:any[]=[];
      for (const seed of SEEDS) for (const temperature of TEMPS) {
        const results:TaskResult[]=[]; for (const task of scoped) results.push(await runTask(task,seed,temperature));
        const raw = summarize(results,false); const canon = summarize(results,true);
        scenarios.push({ seed, temperature, raw_metrics: raw, canonicalized_metrics: canon });
      }
      const metrics = ["gold_file_recall_at_10","consequential_file_retention_rate","rerank_mrr10","retrieval_confidence_mean","retrieval_doc_share_mean"] as const;
      const aggregate:any={};
      for(const m of metrics){ const vals=scenarios.map((s)=>s.canonicalized_metrics[m] ?? s.raw_metrics[m]); aggregate[m]={ point_estimate:avg(vals), ci95:ci95(vals) }; }
      const lift = aggregate.gold_file_recall_at_10.point_estimate;
      score.variants[variant.name]={ scenarios, aggregate, diagnostics: { unmatched_expected_file_rate: avg(scenarios.map((s)=>s.raw_metrics.unmatched_expected_file_rate)) } };
      await fs.writeFile(path.join(outDir,`${variant.name}.json`),JSON.stringify(score.variants[variant.name],null,2)+"\n");
    } finally { await stopServer(server); }
  }

  const base=score.variants.baseline_atlas_git_on.aggregate.gold_file_recall_at_10.point_estimate;
  const best=Object.entries(score.variants).map(([k,v]:any)=>({k,val:v.aggregate.gold_file_recall_at_10.point_estimate})).sort((a,b)=>b.val-a.val)[0];
  score.driver_verdict={ retrieval_lift_proven: base>0 ? "yes" : "no", dominant_channel: best?.k?.includes("atlas_on")?"atlas":best?.k?.includes("git_on")?"git":"none", confidence_statement:"95% bootstrap intervals computed over seed/temperature scenarios." };

  const jsonPath="reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.json";
  const mdPath="reports/helix-ask-retrieval-ablation-scorecard-2026-03-03.md";
  await fs.writeFile(path.join(outDir,"summary.comparison.json"),JSON.stringify(score,null,2)+"\n");
  await fs.writeFile(jsonPath,JSON.stringify(score,null,2)+"\n");
  const rows=Object.entries(score.variants).map(([name,v]:any)=>`| ${name} | ${v.aggregate.gold_file_recall_at_10.point_estimate.toFixed(6)} | ${v.aggregate.gold_file_recall_at_10.ci95.low.toFixed(6)} | ${v.aggregate.gold_file_recall_at_10.ci95.high.toFixed(6)} | ${v.diagnostics.unmatched_expected_file_rate.toFixed(6)} |`);
  await fs.writeFile(mdPath,[`# Helix Ask Retrieval Ablation Scorecard (2026-03-03)`,'',`Run: ${runId}`,'','| Variant | recall@10 point | ci95 low | ci95 high | unmatched_expected_file_rate |','| --- | ---: | ---: | ---: | ---: |',...rows,'',`Driver verdict: retrieval_lift_proven=${score.driver_verdict.retrieval_lift_proven}, dominant_channel=${score.driver_verdict.dominant_channel}.`,''].join('\n'));
  await fs.writeFile(path.join(outDir,"summary.comparison.md"),await fs.readFile(mdPath,"utf8"));
  console.log(`Ablation artifacts written to ${outDir}`);
};

await main();

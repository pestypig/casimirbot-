#!/usr/bin/env node
/**
 * tools/mode-speed-capability.mjs
 *
 * Live operational mode -> power -> beta -> v readout.
 *
 * Usage:
 *   node tools/mode-speed-capability.mjs http://localhost:3000 --watch
 *   node tools/mode-speed-capability.mjs http://localhost:3000 --once
 *   node tools/mode-speed-capability.mjs http://localhost:3000 --active-scan
 *
 * Notes:
 * - Passive mode never changes system state.
 * - --active-scan WILL switch operational modes briefly (then restores).
 */

const C_MPS = 299_792_458;

// Mirrors MODE_POLICY in server/energy-pipeline.ts (Mk1 policy table).
const MODE_POLICY = {
  hover:     { P_target_W: 83.3e6,  P_cap_W: 83.3e6  },
  taxi:      { P_target_W: 83.3e6,  P_cap_W: 83.3e6  },
  nearzero:  { P_target_W: 5e6,     P_cap_W: 5e6     },
  cruise:    { P_target_W: 40e6,    P_cap_W: 40e6    },
  emergency: { P_target_W: 297.5e6, P_cap_W: 300e6   },
  standby:   { P_target_W: 0,       P_cap_W: 0       },
};

// Mirrors AlcubierrePanel.resolveBeta() fallback baseBeta map.
const BASE_BETA = {
  standby: 0.0,
  taxi: 0.0,
  nearzero: 0.02,
  hover: 0.1,
  cruise: 0.6,
  emergency: 0.95,
  default: 0.3,
};

const MODES = ["standby", "taxi", "nearzero", "hover", "cruise", "emergency"];

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function clamp01(v) { return clamp(v, 0, 1); }
function isNum(x) { return Number.isFinite(Number(x)); }

function fmtMW(w) {
  const n = Number(w);
  if (!Number.isFinite(n)) return "--";
  return (n / 1e6).toFixed(n >= 100e6 ? 1 : 2);
}
function fmt(v, digits = 3) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "--";
  return n.toFixed(digits);
}

function classifyBetaSource(live) {
  // Mirrors the candidate order in AlcubierrePanel.resolveBeta:
  // shipBeta -> beta_avg -> vShip -> beta -> fallback(baseBeta*beta_trans)
  const shipBeta = Number(live?.shipBeta);
  const betaAvg = Number(live?.beta_avg);
  const vShip = Number(live?.vShip);
  const beta = Number(live?.beta);
  if (Number.isFinite(shipBeta) && Math.abs(shipBeta) > 1e-6) return "shipBeta";
  if (Number.isFinite(betaAvg) && Math.abs(betaAvg) > 1e-6) return "beta_avg";
  if (Number.isFinite(vShip) && Math.abs(vShip) > 1e-6) return "vShip";
  if (Number.isFinite(beta) && Math.abs(beta) > 1e-6) return "beta";
  return "fallback(baseBeta*beta_trans)";
}

function resolveBeta(live) {
  // Mirror AlcubierrePanel.resolveBeta() behavior.
  const cands = [Number(live?.shipBeta), Number(live?.beta_avg), Number(live?.vShip), Number(live?.beta)];
  for (const v of cands) {
    if (Number.isFinite(v) && Math.abs(v) > 1e-6) {
      return clamp(v, 0, 0.99);
    }
  }
  const m = String(live?.currentMode ?? "").toLowerCase();
  const betaTrans = isNum(live?.beta_trans) ? clamp01(Number(live?.beta_trans)) : 1;
  const baseBeta = (m in BASE_BETA) ? BASE_BETA[m] : BASE_BETA.default;
  return clamp(baseBeta * betaTrans, 0, 0.99);
}

function derivedSpeed(beta) {
  const b = clamp(Number(beta), 0, 0.99);
  const v = b * C_MPS;
  const gamma = 1 / Math.sqrt(1 - b * b);
  return {
    beta: b,
    v_mps: v,
    v_kms: v / 1000,
    gamma,
  };
}

function pipelineUrls(arg0) {
  const raw = (arg0 || "http://localhost:3000").replace(/\/+$/, "");
  const isFull = raw.includes("/api/helix/");
  if (isFull) {
    const u = new URL(raw);
    const base = `${u.protocol}//${u.host}`;
    return {
      base,
      pipeline: raw,
      mode: `${base}/api/helix/mode`,
    };
  }
  return {
    base: raw,
    pipeline: `${raw}/api/helix/pipeline`,
    mode: `${raw}/api/helix/mode`,
  };
}

async function fetchJson(url, init) {
  const res = await fetch(url, {
    ...init,
    headers: { accept: "application/json", ...(init?.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} from ${url}: ${typeof data === "string" ? data : JSON.stringify(data)}`);
  }
  return data;
}

function extractAppliedPowerW(live) {
  if (isNum(live?.P_applied_W)) return Number(live?.P_applied_W);
  if (isNum(live?.mechGuard?.pApplied_W)) return Number(live?.mechGuard?.pApplied_W);
  if (isNum(live?.P_avg_W)) return Number(live?.P_avg_W);
  if (isNum(live?.P_avg)) return Number(live?.P_avg) * 1e6; // P_avg is often MW in UI
  return NaN;
}

function computeCapabilityTable(live) {
  const betaTrans = isNum(live?.beta_trans) ? clamp01(Number(live?.beta_trans)) : 1;

  return MODES.map((mode) => {
    const pol = MODE_POLICY[mode] || { P_target_W: NaN, P_cap_W: NaN };
    const baseBeta = BASE_BETA[mode] ?? BASE_BETA.default;

    const betaMaxGated = clamp(baseBeta * betaTrans, 0, 0.99);
    const betaMaxFull = clamp(baseBeta * 1.0, 0, 0.99);

    const vG = derivedSpeed(betaMaxGated);
    const vF = derivedSpeed(betaMaxFull);

    return {
      mode,
      P_target_MW: fmtMW(pol.P_target_W),
      P_cap_MW: fmtMW(pol.P_cap_W),
      baseBeta: fmt(baseBeta, 3),
      betaTrans: fmt(betaTrans, 3),
      betaMaxGated: fmt(betaMaxGated, 3),
      vMaxGatedKms: fmt(vG.v_kms, 1),
      betaMaxFull: fmt(betaMaxFull, 3),
      vMaxFullKms: fmt(vF.v_kms, 1),
    };
  });
}

function printSnapshot(live, urls) {
  const mode = String(live?.currentMode ?? "unknown").toLowerCase();
  const pol = MODE_POLICY[mode] || {};
  const P_target_W = isNum(live?.P_target_W) ? Number(live?.P_target_W) : Number(pol.P_target_W);
  const P_cap_W = isNum(live?.P_cap_W) ? Number(live?.P_cap_W) : Number(pol.P_cap_W);

  const P_applied_W = extractAppliedPowerW(live);
  const pFrac = (Number.isFinite(P_applied_W) && Number.isFinite(P_target_W) && P_target_W > 0)
    ? (P_applied_W / P_target_W)
    : NaN;

  const beta = resolveBeta(live);
  const src = classifyBetaSource(live);
  const speed = derivedSpeed(beta);

  const betaTrans = isNum(live?.beta_trans) ? clamp01(Number(live?.beta_trans)) : 1;
  const speedClosure = (typeof live?.speedClosure === "string") ? live.speedClosure : "--";

  console.clear();
  console.log("=== Mode -> Power -> beta -> v (outside frame) ===");
  console.log(`pipeline: ${urls.pipeline}`);
  console.log(`time:     ${new Date().toISOString()}`);
  console.log("");

  console.log(`mode:     ${mode}`);
  console.log(`P_target: ${fmtMW(P_target_W)} MW    P_cap: ${fmtMW(P_cap_W)} MW`);
  console.log(`P_applied:${fmtMW(P_applied_W)} MW    P_applied/P_target: ${Number.isFinite(pFrac) ? fmt(pFrac, 3) : "--"}`);
  console.log(`beta_trans (gate): ${fmt(betaTrans, 3)}`);
  console.log(`speedClosure: ${speedClosure}`);
  console.log("");

  console.log("beta selection (mirrors AlcubierrePanel.resolveBeta):");
  console.log(`  source: ${src}`);
  console.log(`  beta_outside: ${fmt(speed.beta, 5)}   gamma = ${fmt(speed.gamma, 5)}`);
  console.log(`  v_outside: ${fmt(speed.v_kms, 3)} km/s  (${fmt(speed.v_mps, 0)} m/s)`);
  console.log("  v_ship-frame (inside bubble): ~0 (comoving operationally)");
  console.log("");

  if (isNum(live?.taxi_target_mps)) {
    console.log(`taxi_target_mps (if you are in classical taxi): ${fmt(live.taxi_target_mps, 2)} m/s`);
    console.log("");
  }

  console.log("=== Capability range by mode ===");
  console.log("(gated uses current beta_trans; full assumes beta_trans=1)");
  const table = computeCapabilityTable(live);

  const header = [
    "mode".padEnd(10),
    "P_tgt".padStart(7),
    "P_cap".padStart(7),
    "baseB".padStart(7),
    "Btrans".padStart(7),
    "Bmax(g)".padStart(8),
    "vmax(g)".padStart(10),
    "Bmax(f)".padStart(8),
    "vmax(f)".padStart(10),
  ].join("  ");
  console.log(header);
  console.log("-".repeat(header.length));

  for (const r of table) {
    const row = [
      String(r.mode).padEnd(10),
      String(r.P_target_MW).padStart(7),
      String(r.P_cap_MW).padStart(7),
      String(r.baseBeta).padStart(7),
      String(r.betaTrans).padStart(7),
      String(r.betaMaxGated).padStart(8),
      (String(r.vMaxGatedKms) + " km/s").padStart(10),
      String(r.betaMaxFull).padStart(8),
      (String(r.vMaxFullKms) + " km/s").padStart(10),
    ].join("  ");
    console.log(row);
  }

  console.log("");
  console.log("Tip: run with --active-scan to measure each mode's actual beta by switching modes briefly.");
}

async function activeScan(urls) {
  // WARNING: changes global mode briefly. Restores original at end.
  const live0 = await fetchJson(urls.pipeline);
  const originalMode = String(live0?.currentMode ?? "hover").toLowerCase();

  console.log(`[active-scan] originalMode=${originalMode}`);
  const rows = [];

  for (const mode of MODES) {
    const resp = await fetchJson(urls.mode, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ mode }),
    });

    const state = resp?.state ?? resp;
    const beta = resolveBeta(state);
    const src = classifyBetaSource(state);
    const sp = derivedSpeed(beta);

    const P_target_W = isNum(state?.P_target_W) ? Number(state.P_target_W) : MODE_POLICY[mode]?.P_target_W;
    const P_cap_W = isNum(state?.P_cap_W) ? Number(state.P_cap_W) : MODE_POLICY[mode]?.P_cap_W;
    const P_applied_W = extractAppliedPowerW(state);

    rows.push({
      mode,
      P_target_MW: fmtMW(P_target_W),
      P_cap_MW: fmtMW(P_cap_W),
      P_applied_MW: fmtMW(P_applied_W),
      beta: fmt(sp.beta, 4),
      v_kms: fmt(sp.v_kms, 2),
      src,
    });
  }

  await fetchJson(urls.mode, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ mode: originalMode }),
  });

  console.log("");
  console.log("=== Active scan results (measured via mode switches) ===");
  const header = [
    "mode".padEnd(10),
    "P_tgt".padStart(7),
    "P_cap".padStart(7),
    "P_app".padStart(7),
    "beta".padStart(7),
    "v".padStart(12),
    "beta source".padEnd(24),
  ].join("  ");
  console.log(header);
  console.log("-".repeat(header.length));
  for (const r of rows) {
    console.log(
      [
        r.mode.padEnd(10),
        String(r.P_target_MW).padStart(7),
        String(r.P_cap_MW).padStart(7),
        String(r.P_applied_MW).padStart(7),
        String(r.beta).padStart(7),
        (String(r.v_kms) + " km/s").padStart(12),
        String(r.src).padEnd(24),
      ].join("  ")
    );
  }
  console.log("");
  console.log(`[active-scan] restored mode=${originalMode}`);
}

async function main() {
  const args = process.argv.slice(2);
  const baseArg = args.find((a) => !a.startsWith("--")) || "http://localhost:3000";
  const watch = args.includes("--watch");
  const once = args.includes("--once") || !watch;
  const active = args.includes("--active-scan");
  const intervalIdx = args.findIndex((a) => a === "--interval");
  const intervalMs = intervalIdx >= 0 ? Number(args[intervalIdx + 1]) : 1000;

  const urls = pipelineUrls(baseArg);

  if (active) {
    await activeScan(urls);
    return;
  }

  const tick = async () => {
    const live = await fetchJson(urls.pipeline);
    printSnapshot(live, urls);
  };

  await tick();
  if (!once) {
    setInterval(() => { tick().catch((e) => console.error(e)); }, Number.isFinite(intervalMs) ? intervalMs : 1000);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

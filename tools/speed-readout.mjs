#!/usr/bin/env node
/**
 * Reads /api/helix/pipeline and prints the equation chain:
 * P_target -> P_applied -> beta_trans_power -> shipBeta -> v_outside
 *
 * Usage:
 *   node tools/speed-readout.mjs http://localhost:3000/api/helix/pipeline
 */

const url = process.argv[2] || "http://localhost:3000/api/helix/pipeline";
const C = 299792458; // m/s

const fmt = (x, digits = 6) =>
  Number.isFinite(x) ? x.toFixed(digits) : "n/a";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

function modePolicyFallback(mode) {
  const m = String(mode || "").toLowerCase();
  const table = {
    hover:     { P_target_W: 83.3e6 },
    taxi:      { P_target_W: 83.3e6 },
    nearzero:  { P_target_W: 5e6 },
    cruise:    { P_target_W: 40e6 },
    emergency: { P_target_W: 297.5e6 },
    standby:   { P_target_W: 0 },
  };
  return table[m] || { P_target_W: NaN };
}

(async () => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${url}`);
  const live = await res.json();

  const mode = live.currentMode;
  const P_avg_W =
    Number.isFinite(Number(live.P_avg_W)) ? Number(live.P_avg_W)
    : Number.isFinite(Number(live.P_avg)) ? Number(live.P_avg) * 1e6
    : NaN;

  const P_target_W =
    Number.isFinite(Number(live.P_target_W)) ? Number(live.P_target_W)
    : modePolicyFallback(mode).P_target_W;

  const P_applied_W =
    Number.isFinite(Number(live.P_applied_W)) ? Number(live.P_applied_W)
    : (live.mechGuard && Number.isFinite(Number(live.mechGuard.pApplied_W)))
      ? Number(live.mechGuard.pApplied_W)
      : P_avg_W;

  const beta_trans_power =
    Number.isFinite(Number(live.beta_trans_power))
      ? Number(live.beta_trans_power)
      : (P_target_W > 0 ? clamp(P_applied_W / P_target_W, 0, 1) : 0);

  const shipBeta =
    Number.isFinite(Number(live.shipBeta))
      ? Number(live.shipBeta)
      : Number.isFinite(Number(live.beta_avg))
        ? Number(live.beta_avg)
        : NaN;

  const v_out = Number.isFinite(shipBeta) ? shipBeta * C : NaN;

  console.log("=== Warp Speed Readout (pipeline) ===");
  console.log(`endpoint: ${url}`);
  console.log(`mode: ${mode}`);
  console.log("");

  console.log("Power ladder:");
  console.log(`  P_target_W   = ${fmt(P_target_W, 3)} W`);
  console.log(`  P_applied_W  = ${fmt(P_applied_W, 3)} W`);
  console.log(`  P_avg_W      = ${fmt(P_avg_W, 3)} W`);
  console.log("");

  console.log("Policy A throttle:");
  console.log(`  beta_trans_power = clamp(P_applied_W / P_target_W, 0..1)`);
  console.log(`                  = ${fmt(beta_trans_power, 9)}`);
  console.log("");

  console.log("Speed closure:");
  console.log(`  shipBeta (beta)  = ${fmt(shipBeta, 9)}   (interpreted as v/c)`);
  console.log(`  v_outside     = shipBeta * c`);
  console.log(`              = ${fmt(shipBeta, 9)} * ${C} m/s`);
  console.log(`              = ${fmt(v_out, 3)} m/s  (${fmt(shipBeta, 6)} c)`);
  console.log("");

  console.log("Frames:");
  console.log("  ship frame:   v_ship ~ 0 (comoving with bubble center)");
  console.log("  outside frame: v_outside above (coordinate speed proxy)");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

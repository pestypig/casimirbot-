import type { PumpCommand, PumpTone } from "../../shared/schema.js";

/**
 * Returns true when the environment indicates the hardware can accept multi-tone updates.
 * Swap to a hardware probe when you add a real driver.
 */
export function isMultiToneSupported(): boolean {
  return process.env.PUMP_MULTI_TONE === "1";
}

/**
 * Program the pump with a multi-tone command.
 * The current implementation is a no-op skeleton with a soft software-mix fallback.
 * Replace the internals with hardware calls when available.
 */
export async function slewPumpMultiTone(cmd: PumpCommand): Promise<void> {
  if (!cmd || !Array.isArray(cmd.tones) || cmd.tones.length === 0) {
    return;
  }

  if (isMultiToneSupported()) {
    // TODO: Replace with hardware API call that accepts concurrent carriers.
    // Ensure tone phases remain coherent with cmd.epoch_ms when provided.
    debugLog("HW multi-tone", cmd);
    return;
  }

  // ----- Software fallback (time-multiplex approximation) -----
  // WARNING: Development helper only – does NOT create true concurrent carriers.
  const sorted = [...cmd.tones].sort((a, b) => Math.abs(b.depth ?? 0) - Math.abs(a.depth ?? 0));
  const dominant = sorted[0];
  const blends = sorted.slice(1);

  debugLog("SW-mix dominant", {
    freq_hz: toFreqHz(dominant),
    depth: dominant.depth ?? 0,
    phase_deg: dominant.phase_deg ?? 0,
    rho0: cmd.rho0 ?? 0,
    epoch_ms: cmd.epoch_ms,
  });

  if (blends.length) {
    debugLog(
      "SW-mix blends",
      blends.map((tone) => ({
        freq_hz: toFreqHz(tone),
        depth: tone.depth ?? 0,
        phase_deg: tone.phase_deg ?? 0,
      })),
    );
  }
}

/** Utility: schema stores omega_hz in Hz already; expose as frequency. */
function toFreqHz(tone: PumpTone): number {
  return tone.omega_hz ?? 0;
}

function debugLog(message: string, payload: unknown): void {
  if (process.env.PUMP_DEBUG === "1") {
    // eslint-disable-next-line no-console
    console.log(`[pump-multitone] ${message}`, payload);
  }
}

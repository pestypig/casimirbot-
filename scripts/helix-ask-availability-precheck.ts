import { HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON } from "../server/services/helix-ask/runtime-errors";

const BASE_URL = process.env.HELIX_ASK_BASE_URL ?? "http://127.0.0.1:5173";
const READY_PATH = process.env.HELIX_ASK_AVAILABILITY_PATH ?? "/api/ready";
const REQUIRED_CONSECUTIVE_200 = Number(process.env.HELIX_ASK_AVAILABILITY_CONSECUTIVE_200 ?? "3");
const MAX_ATTEMPTS = Number(process.env.HELIX_ASK_AVAILABILITY_MAX_ATTEMPTS ?? "12");
const REQUEST_TIMEOUT_MS = Number(process.env.HELIX_ASK_AVAILABILITY_TIMEOUT_MS ?? "4000");
const INTERVAL_MS = Number(process.env.HELIX_ASK_AVAILABILITY_INTERVAL_MS ?? "600");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export type AvailabilityProbe = {
  attempt: number;
  status: number;
  ok: boolean;
  latency_ms: number;
};

export type AvailabilityPrecheckResult = {
  ok: boolean;
  fail_reason: typeof HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON | null;
  required_consecutive_200: number;
  max_attempts: number;
  consecutive_200: number;
  probes: AvailabilityProbe[];
};

export const runHelixAskAvailabilityPrecheck = async (): Promise<AvailabilityPrecheckResult> => {
  const probes: AvailabilityProbe[] = [];
  let consecutive200 = 0;
  const requiredConsecutive = Math.max(1, REQUIRED_CONSECUTIVE_200);
  const maxAttempts = Math.max(requiredConsecutive, MAX_ATTEMPTS);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const started = Date.now();
    let status = 0;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      const response = await fetch(new URL(READY_PATH, BASE_URL), {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      status = response.status;
    } catch {
      status = 0;
    }
    const ok = status === 200;
    consecutive200 = ok ? consecutive200 + 1 : 0;
    probes.push({ attempt, status, ok, latency_ms: Date.now() - started });
    if (consecutive200 >= requiredConsecutive) {
      return {
        ok: true,
        fail_reason: null,
        required_consecutive_200: requiredConsecutive,
        max_attempts: maxAttempts,
        consecutive_200: consecutive200,
        probes,
      };
    }
    if (attempt < maxAttempts) {
      await sleep(INTERVAL_MS);
    }
  }

  return {
    ok: false,
    fail_reason: HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON,
    required_consecutive_200: requiredConsecutive,
    max_attempts: maxAttempts,
    consecutive_200: consecutive200,
    probes,
  };
};

const main = async () => {
  const result = await runHelixAskAvailabilityPrecheck();
  const out = JSON.stringify(result, null, 2);
  if (result.ok) {
    console.log(out);
    process.exit(0);
  }
  console.error(out);
  process.exit(2);
};

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      JSON.stringify(
        {
          ok: false,
          fail_reason: HELIX_ASK_RUNTIME_UNAVAILABLE_FAIL_REASON,
          message,
        },
        null,
        2,
      ),
    );
    process.exit(2);
  });
}

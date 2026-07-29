#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";

const CAPABILITY_PREFIX = "com.casimirbot.minecraft.";
const DEFAULT_TIMEOUT_MS = 300_000;

const scenarios = {
  inventory_status: {
    prompt:
      "In this Minecraft room, check my current health, hunger or effects, armor, and inventory now. Am I equipped to explore for a few minutes?",
    expected: [
      "com.casimirbot.minecraft.actor.status.read",
      "com.casimirbot.minecraft.inventory.check",
    ],
  },
  threats: {
    prompt:
      "In this Minecraft room, check the nearby entities and immediate hazards now. What is dangerous near me, and what should I do first?",
    expected: [
      "com.casimirbot.minecraft.nearby_entities.list",
      "com.casimirbot.minecraft.hazards.scan",
    ],
  },
  crops_and_map: {
    prompt:
      "In this Minecraft room, inspect the wheat at x=100 y=80 z=103 and inspect the local floor around me now. Is that crop mature, and what does the bounded local terrain sample establish?",
    expected: [
      "com.casimirbot.minecraft.crop_state.read",
      "com.casimirbot.minecraft.local_map.inspect",
    ],
  },
  geometry: {
    prompt:
      "In this Minecraft room, check both line of sight and straight-line geometric reachability to x=100 y=80 z=105 now. Do not claim that this proves a navigable path.",
    expected: [
      "com.casimirbot.minecraft.line_of_sight.check",
      "com.casimirbot.minecraft.reachability.check",
    ],
  },
  followup: {
    prompt:
      "Given the current Minecraft observations you just gathered, what should I fix first before moving? Be explicit about what the evidence does and does not prove.",
    expected: [],
  },
  corrective: {
    prompt:
      "Actually, recheck just the nearby hostile mobs and immediate hazards now; do not rely on the earlier observation.",
    expected: [
      "com.casimirbot.minecraft.nearby_entities.list",
      "com.casimirbot.minecraft.hazards.scan",
    ],
  },
  ambiguous_actor: {
    prompt:
      "In this Minecraft room, check my current actor status now.",
    expected: ["com.casimirbot.minecraft.actor.status.read"],
    expectedOutcome: "target_ambiguous",
  },
  stale_source: {
    prompt: "In this Minecraft room, check my current actor status now.",
    expected: ["com.casimirbot.minecraft.actor.status.read"],
    expectedOutcome: "result_stale",
  },
  permission_failure: {
    prompt: "In this Minecraft room, check my current actor status now.",
    expected: [],
    expectedHttpError: "shared_realtime_room_not_found",
    profileId: "profile:minecraft-situation-unbound-local",
    skipPresence: true,
  },
  closed_container: {
    prompt:
      "In this Minecraft room, inspect the contents of the nearest closed chest without opening it and tell me exactly what is inside.",
    expected: [],
    forbiddenCapabilities: [
      "com.casimirbot.minecraft.inventory.check",
      "com.casimirbot.minecraft.local_map.inspect",
    ],
    expectedLimitation: true,
  },
};

const [statePathValue, scenarioId, artifactRootValue] = process.argv.slice(2);
if (!statePathValue || !scenarioId || !scenarios[scenarioId]) {
  throw new Error("usage_state_path_and_known_scenario_required");
}

const statePath = path.resolve(statePathValue);
const artifactRoot = path.resolve(
  artifactRootValue || path.join("artifacts", "minecraft-situation-live"),
);
const scenario = scenarios[scenarioId];
const state = JSON.parse(await fs.readFile(statePath, "utf8"));
const baseUrl = String(state.base_url || "").replace(/\/+$/u, "");
const roomId = String(state.room_id || "").trim();
const profileId = String(scenario.profileId || state.profile_id || "").trim();
if (!baseUrl || !roomId || !profileId) {
  throw new Error("local_room_state_invalid");
}

const threadId = `helix-ask:room:${roomId}`;
const timeoutMs = Math.max(
  1_000,
  Number(process.env.HELIX_MINECRAFT_SITUATION_TIMEOUT_MS) ||
    DEFAULT_TIMEOUT_MS,
);

const fetchWithTimeout = async (url, init = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
};

const readJson = async (response) => {
  const text = await response.text();
  if (!response.ok) {
    let code = `http_${response.status}`;
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed?.error === "string") code = parsed.error;
    } catch {
      // Do not echo an arbitrary response body into test logs.
    }
    throw new Error(code);
  }
  return text ? JSON.parse(text) : {};
};

const signIn = async () => {
  const response = await fetchWithTimeout(
    `${baseUrl}/api/account/session/sign-in`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Origin: baseUrl,
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify({
        profile_id: profileId,
        display_name: "Minecraft situation-awareness local test",
        account_type: "developer",
      }),
    },
  );
  await readJson(response);
  const cookie = response.headers
    .get("set-cookie")
    ?.split(";", 1)[0]
    ?.trim();
  if (!cookie || !/^helix_session=[^;\s]+$/u.test(cookie)) {
    throw new Error("session_cookie_missing");
  }
  return cookie;
};

const postJson = async (url, cookie, body) =>
  readJson(
    await fetchWithTimeout(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Cookie: cookie,
        Origin: baseUrl,
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify(body),
    }),
  );

const getJson = async (url, cookie) =>
  readJson(
    await fetchWithTimeout(url, {
      headers: {
        Cookie: cookie,
        Origin: baseUrl,
        "Sec-Fetch-Site": "same-origin",
      },
    }),
  );

const record = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : null;
const array = (value) => (Array.isArray(value) ? value : []);
const string = (value) =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const unwrapDebug = (value) => record(value?.payload) || record(value) || {};

const ledgerEntries = (ask, debug) => [
  ...array(ask.current_turn_artifact_ledger),
  ...array(debug.current_turn_artifact_ledger),
].map(record).filter(Boolean);

const observationsFromLedger = (ledger) => {
  const observations = [];
  const seen = new Set();
  const queue = ledger.map((value) => ({ value, depth: 0 }));
  let visited = 0;
  while (queue.length && visited < 10_000) {
    const { value, depth } = queue.shift();
    visited += 1;
    if (Array.isArray(value)) {
      if (depth < 10) {
        for (const child of value) queue.push({ value: child, depth: depth + 1 });
      }
      continue;
    }
    const candidate = record(value);
    if (!candidate) continue;
    const capabilityId = string(candidate.capability_id);
    if (
      candidate.schema === "helix.environment_connector.probe_observation.v1" &&
      capabilityId?.startsWith(CAPABILITY_PREFIX)
    ) {
      const evidenceRef = string(candidate.evidence_ref);
      const key = `${capabilityId}:${evidenceRef || string(candidate.probe_request_ref) || observations.length}`;
      if (!seen.has(key)) {
        seen.add(key);
        observations.push({
          capability_id: capabilityId,
          outcome: string(candidate.outcome),
          summary: string(candidate.summary),
          evidence_ref: evidenceRef,
          eligible_for_current_turn_reentry:
            candidate.eligible_for_current_turn_reentry === true,
        });
      }
    }
    if (depth < 10) {
      for (const child of Object.values(candidate)) {
        queue.push({ value: child, depth: depth + 1 });
      }
    }
  }
  return observations;
};

const listCapabilities = (observations, ask, debug) => {
  const capabilities = observations.map((entry) => entry.capability_id);
  const loop =
    record(debug.agent_runtime_loop) || record(ask.agent_runtime_loop) || {};
  for (const iteration of array(loop.iterations).map(record).filter(Boolean)) {
    const decision = record(iteration.decision);
    const selected =
      string(decision?.chosen_capability) ||
      string(decision?.capability_id);
    if (selected?.startsWith(CAPABILITY_PREFIX)) capabilities.push(selected);
  }
  return [...new Set(capabilities)];
};

const selectedAnswer = (ask, debug) =>
  string(ask.answer) ||
  string(ask.selected_final_answer) ||
  string(debug.selected_final_answer) ||
  string(record(debug.resolved_turn_summary)?.answer);

const terminalKind = (ask, debug) =>
  string(record(debug.resolved_turn_summary)?.terminal_artifact_kind) ||
  string(record(ask.resolved_turn_summary)?.terminal_artifact_kind) ||
  string(debug.terminal_artifact_kind);

const cookie = await signIn();
if (!scenario.skipPresence) {
  await postJson(
    `${baseUrl}/api/agi/realtime/rooms/${encodeURIComponent(roomId)}/presence`,
    cookie,
    { presence: "present" },
  );
}
const startedAt = Date.now();
const turnRef = `minecraft-situation:${scenarioId}:${Date.now()}`;
let ask;
let expectedHttpBoundaryHandled = false;
try {
  ask = await postJson(`${baseUrl}/api/agi/ask/turn`, cookie, {
    sessionId: threadId,
    threadId,
    conversation_thread_id: threadId,
    question: scenario.prompt,
    prompt: scenario.prompt,
    mode: "read",
    debug: true,
    turnId: turnRef,
    turn_id: turnRef,
    traceId: turnRef,
    agentRuntime: "codex",
    agent_runtime: "codex",
  });
} catch (error) {
  const errorCode =
    error instanceof Error && error.message ? error.message : "ask_http_error";
  if (scenario.expectedHttpError !== errorCode) throw error;
  const result = {
    schema: "helix.minecraft_situation_live_probe.v1",
    scenario_id: scenarioId,
    prompt: scenario.prompt,
    verdict: "PASS",
    failures: [],
    turn_id: null,
    thread_id: threadId,
    elapsed_ms: Date.now() - startedAt,
    capabilities: [],
    observations: [],
    terminal_kind: "http_typed_failure",
    answer: errorCode,
    permission_boundary: "room_membership_non_disclosure",
    ask_turn_solver_trace_present: false,
    credential_value_reported: false,
    credential_leak_detected: false,
  };
  const scenarioDirectory = path.join(artifactRoot, scenarioId);
  await fs.mkdir(scenarioDirectory, { recursive: true });
  await fs.writeFile(
    path.join(scenarioDirectory, "ask-response.json"),
    `${JSON.stringify({ error: errorCode }, null, 2)}\n`,
  );
  await fs.writeFile(
    path.join(scenarioDirectory, "probe-result.json"),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  process.stdout.write(`${JSON.stringify(result)}\n`);
  expectedHttpBoundaryHandled = true;
}
if (!expectedHttpBoundaryHandled) {
const turnId = string(ask.turn_id) || string(ask.trace_id);
const debugResponse = turnId
  ? await getJson(
      `${baseUrl}/api/agi/ask/turn/${encodeURIComponent(
        turnId,
      )}/debug-export`,
      cookie,
    )
  : {};
const debug = unwrapDebug(debugResponse);
const ledger = ledgerEntries(ask, debug);
const observations = observationsFromLedger([ledger, ask, debug]);
const capabilities = listCapabilities(observations, ask, debug);
const answer = selectedAnswer(ask, debug);
const resolvedTerminalKind = terminalKind(ask, debug);
const serialized = JSON.stringify({ ask, debugResponse });
const secretLeakDetected =
  /helix_room_src_[A-Za-z0-9_-]+/u.test(serialized) ||
  /"bearer_token"\s*:\s*"(?!\[?REDACTED)/iu.test(serialized) ||
  /"claim_handle"\s*:/iu.test(serialized);
const failures = [];

if (!turnId) failures.push("turn_id_missing");
if (!answer) failures.push("final_answer_missing");
if (secretLeakDetected) failures.push("credential_material_leaked");
if (!debug.ask_turn_solver_trace) failures.push("ask_turn_solver_trace_missing");
if (
  !scenario.expectedOutcome &&
  !scenario.expectedLimitation &&
  resolvedTerminalKind === "typed_failure"
) {
  failures.push("unexpected_typed_failure");
}
for (const expected of scenario.expected) {
  if (!capabilities.includes(expected)) {
    failures.push(`expected_capability_missing:${expected}`);
    continue;
  }
  if (!scenario.expectedOutcome) {
    const succeeded = observations.some(
      (entry) =>
        entry.capability_id === expected &&
        entry.outcome === "succeeded" &&
        entry.eligible_for_current_turn_reentry,
    );
    if (!succeeded) {
      failures.push(`expected_current_turn_observation_missing:${expected}`);
    }
  }
}
for (const forbidden of scenario.forbiddenCapabilities || []) {
  if (capabilities.includes(forbidden)) {
    failures.push(`forbidden_capability_used:${forbidden}`);
  }
}
if (scenario.expectedOutcome) {
  const matching = observations.some(
    (entry) => entry.outcome === scenario.expectedOutcome,
  );
  if (!matching) failures.push(`expected_outcome_missing:${scenario.expectedOutcome}`);
}
if (
  scenario.expectedLimitation &&
  answer &&
  !/(cannot|can't|unsupported|not available|unable|does not|don't have|no capability|not inspect)/iu.test(
    answer,
  )
) {
  failures.push("unsupported_limitation_not_explained");
}
if (
  answer &&
  /"(?:tool_name|capability_id|arguments)"\s*:/u.test(answer)
) {
  failures.push("tool_request_exposed_as_answer");
}

const result = {
  schema: "helix.minecraft_situation_live_probe.v1",
  scenario_id: scenarioId,
  prompt: scenario.prompt,
  verdict: failures.length ? "FAIL" : "PASS",
  failures,
  turn_id: turnId,
  thread_id: threadId,
  elapsed_ms: Date.now() - startedAt,
  capabilities,
  observations,
  terminal_kind: resolvedTerminalKind,
  answer: answer?.slice(0, 2_000) || null,
  ask_turn_solver_trace_present: Boolean(debug.ask_turn_solver_trace),
  credential_value_reported: false,
  credential_leak_detected: secretLeakDetected,
};

const scenarioDirectory = path.join(artifactRoot, scenarioId);
await fs.mkdir(scenarioDirectory, { recursive: true });
await fs.writeFile(
  path.join(scenarioDirectory, "ask-response.json"),
  `${JSON.stringify(ask, null, 2)}\n`,
);
await fs.writeFile(
  path.join(scenarioDirectory, "debug-export.json"),
  `${JSON.stringify(debugResponse, null, 2)}\n`,
);
await fs.writeFile(
  path.join(scenarioDirectory, "probe-result.json"),
  `${JSON.stringify(result, null, 2)}\n`,
);
process.stdout.write(`${JSON.stringify(result)}\n`);
if (failures.length) process.exitCode = 1;
}

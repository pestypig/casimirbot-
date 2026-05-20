import assert from "node:assert/strict";
import { test } from "vitest";
import {
  validEvidenceLayers,
  validEvidenceTrusts,
  validLiveScenarioKinds,
} from "../shared/helix-live-scenario-evidence.ts";

test("live scenario evidence vocabulary covers non-Minecraft source layers", () => {
  assert.ok(validLiveScenarioKinds.includes("minecraft_route_monitor"));
  assert.ok(validLiveScenarioKinds.includes("browser_audio_claim_monitor"));
  assert.ok(validLiveScenarioKinds.includes("live_translation"));
  assert.ok(validLiveScenarioKinds.includes("workstation_operator_monitor"));
  assert.ok(validLiveScenarioKinds.includes("research_session"));
  assert.ok(validLiveScenarioKinds.includes("support_procedure_monitor"));

  assert.ok(validEvidenceLayers.includes("audio_transcript"));
  assert.ok(validEvidenceLayers.includes("document_context"));
  assert.ok(validEvidenceLayers.includes("process_graph"));
  assert.ok(validEvidenceLayers.includes("procedure_graph"));
  assert.ok(validEvidenceLayers.includes("note_context"));
  assert.ok(validEvidenceLayers.includes("calculator_stream"));
  assert.ok(validEvidenceLayers.includes("simulation_stream"));
});

test("live scenario evidence vocabulary keeps Minecraft provenance compatible", () => {
  assert.ok(validEvidenceLayers.includes("observed_current_world"));
  assert.ok(validEvidenceLayers.includes("persisted_block_delta_overlay"));
  assert.ok(validEvidenceLayers.includes("seed_forecast"));
  assert.ok(validEvidenceLayers.includes("route_math"));
  assert.ok(validEvidenceLayers.includes("client_planner_observation"));

  assert.ok(validEvidenceTrusts.includes("server_observation"));
  assert.ok(validEvidenceTrusts.includes("seed_forecast"));
  assert.ok(validEvidenceTrusts.includes("client_planner_observation"));
  assert.ok(validEvidenceTrusts.includes("route_math"));
});

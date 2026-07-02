import { describe, expect, it } from "vitest";
import { validateHelixRecommendedActionAdmissionV1 } from "../../contracts/helix-recommended-action-admission.v1";
import { validateIdeologyContextReflectionV1 } from "../../ideology-context-reflection";
import type { IdeologyGraphDocument } from "../ideology-graph-types";
import { buildIdeologyGraph } from "../load-ideology-graph";
import { reflectVoiceEventWithMoralGraph } from "../voice-moral-graph";

const graphDocument: IdeologyGraphDocument = {
  version: 1,
  rootId: "mission-ethos",
  nodes: [
    {
      id: "mission-ethos",
      title: "Mission Ethos",
      tags: ["root"],
      children: ["right-speech-infrastructure", "restraint", "non-harm"],
    },
    {
      id: "right-speech-infrastructure",
      title: "Right Speech Infrastructure",
      aliases: ["right speech warning"],
      tags: ["right-speech", "speech", "tone", "lens"],
      references: [{ kind: "doc", title: "Right speech guide", path: "docs/ethos/right-speech.md" }],
    },
    {
      id: "restraint",
      title: "Restraint",
      tags: ["restraint", "uncertainty", "tone"],
    },
    {
      id: "non-harm",
      title: "Non-Harm",
      tags: ["non-harm", "safety", "tone"],
    },
  ],
};

const graph = buildIdeologyGraph(graphDocument);

describe("voice MoralGraph adapter", () => {
  it("reflects voice events and preserves the voice event ref", () => {
    const result = reflectVoiceEventWithMoralGraph(graph, {
      voiceEventId: "voice:event:123",
      transcriptOrCalloutDraft: "Right Speech Infrastructure should shape this callout.",
    });

    expect(validateIdeologyContextReflectionV1(result.reflection)).toEqual([]);
    expect(result.reflection.input.kind).toBe("voice_event");
    expect(result.reflection.input.refs).toEqual(["voice:event:123"]);
    expect(result.admissions[0]?.evidenceRefs).toEqual(["voice:event:123"]);
    expect(result.admissions[0]?.actions.every((action) => action.evidenceRefs?.includes("voice:event:123"))).toBe(true);
  });

  it("maps tone suggestions to ask_user claim-sensitive actionable admissions", () => {
    const admission = reflectVoiceEventWithMoralGraph(graph, {
      voiceEventId: "voice:event:tone",
      transcriptOrCalloutDraft: "This is definitely proven and must be announced now with Right Speech Infrastructure in mind.",
    }).admissions[0]!;
    const tone = admission.actions.find((action) => action.actionId === "moral-graph.suggest_tone_adjustment");

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(tone).toMatchObject({
      admission: "ask_user",
      risk: "claim_sensitive",
      display_policy: "actionable",
      agentExecutable: false,
    });
    expect(tone?.source).toMatchObject({
      workstation: "voice",
      panel: "voice",
    });
  });

  it("maps right speech warnings to auto diagnostic evidence-only admissions", () => {
    const admission = reflectVoiceEventWithMoralGraph(graph, {
      voiceEventId: "voice:event:warning",
      transcriptOrCalloutDraft: "Right Speech Infrastructure and non-harm should constrain this callout.",
    }).admissions[0]!;
    const warning = admission.actions.find((action) => action.actionId === "moral-graph.show_right_speech_warning");

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    expect(warning).toMatchObject({
      admission: "auto",
      risk: "claim_sensitive",
      display_policy: "diagnostic_only",
      agentExecutable: false,
    });
  });

  it("suggests less claim-sensitive wording and clarification without executable voice authority", () => {
    const admission = reflectVoiceEventWithMoralGraph(graph, {
      voiceEventId: "voice:event:uncertain",
      transcriptOrCalloutDraft: "Maybe this is definitely approved, but the evidence is unclear.",
    }).admissions[0]!;

    expect(validateHelixRecommendedActionAdmissionV1(admission)).toEqual([]);
    for (const actionId of [
      "moral-graph.suggest_less_claim_sensitive_wording",
      "moral-graph.ask_for_clarification",
    ]) {
      expect(admission.actions.find((action) => action.actionId === actionId)).toMatchObject({
        admission: "ask_user",
        risk: "claim_sensitive",
        display_policy: "actionable",
        agentExecutable: false,
      });
    }
  });

  it("cannot auto-speak or auto-send anything based on MoralGraph alone", () => {
    const voiceEvent = {
      voiceEventId: "voice:event:no-send",
      transcriptOrCalloutDraft: "Right Speech Infrastructure says this callout should be restrained before speaking.",
    };
    const before = { ...voiceEvent };
    const admission = reflectVoiceEventWithMoralGraph(graph, voiceEvent).admissions[0]!;

    expect(voiceEvent).toEqual(before);
    expect(admission.authority.agent_executable).toBe(false);
    expect(admission.actions.every((action) => action.agentExecutable === false)).toBe(true);
    expect(admission.actions.some((action) => /auto.?speak|speak|send/i.test(action.actionId))).toBe(false);
    expect(admission.actions.filter((action) => action.display_policy === "diagnostic_only").every((action) => action.admission === "auto")).toBe(true);
  });
});

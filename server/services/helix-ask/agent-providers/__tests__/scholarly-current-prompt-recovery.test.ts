import { describe, expect, it } from "vitest";
import {
  buildScholarlyCurrentPromptIdentifierRecoveryBody,
  scholarlyPdfSelectedAffordanceFromRuntimeLoop,
  shouldAttemptScholarlyPromptRecovery,
} from "../codex-provider";
import { readWorkstationGatewayCallRequestsForTurn } from "../explicit-workstation-gateway";

const recoveryFor = (question: string) => buildScholarlyCurrentPromptIdentifierRecoveryBody({
  body: {
    agent_runtime: "codex",
    question,
    committed_ask_route: { schema: "helix.committed_ask_route.v1", route: { source_target: "scientific_image_evidence" } },
    workstation_gateway_call: {
      capability_id: "visual_analysis.inspect_image_region",
      arguments: { source_id: "pdf-page-render:stale" },
    },
  },
  question,
});

describe("current-prompt exact scholarly recovery", () => {
  it("admits the recrowned Step 3 QTE prompt after a runtime restart", () => {
    const recovery = recoveryFor(
      "Continue from selected-paper evidence ref `ask:paper:memory`, retained rendered-page evidence ref `pdf-page-render:stale`, and the pinned workflow objective: \"Fetch and parse the full text for arXiv gr-qc/9510071. Return the paper title, parsed page count, and one page-numbered passage or equation supporting a quantum inequality. Do not search for other papers.\". The retained page ref is a provenance anchor; use it as the Image Lens `source_id` only when the active source also carries materializable page-image data. Inspect the already mounted PDF page 2 with Image Lens. If its image bytes are unavailable after a runtime restart, re-materialize page 2 directly from the canonical DOI, arXiv identifier, or canonical paper URL in the typed paper evidence or pinned objective, without a broad lookup or selecting another paper. Then run `visual_analysis.inspect_image_region` on page 2 to extract the first displayed equation as observation-only evidence.",
    );

    expect(recovery).toMatchObject({
      query: "arXiv:gr-qc/9510071",
      identifier_kind: "arxiv",
    });
  });

  it("admits exact arXiv rematerialization while preserving a no-other-papers objective", () => {
    const recovery = recoveryFor([
      "Continue from stale page ref `pdf-page-render:stale` and the pinned objective:",
      '"Fetch and parse the full text for arXiv gr-qc/9510071. Do not search for other papers."',
      "If image bytes are unavailable after restart, re-materialize page 2 directly from the canonical arXiv identifier.",
      "Then inspect page 2 with Image Lens.",
    ].join(" "));

    expect(recovery).toMatchObject({
      query: "arXiv:gr-qc/9510071",
      source: "current_prompt_exact_scholarly_identifier",
      identifier_kind: "arxiv",
    });
    expect(recovery?.body.question).toContain("Restrict retrieval to this exact identifier");
    expect(recovery?.body.question).toContain("Materialize PDF page 2");
    expect(recovery?.body.question).not.toContain("pdf-page-render:stale");
    expect(recovery?.body.committed_ask_route).toBeUndefined();
    expect(recovery?.body.workstation_gateway_call).toBeUndefined();

    const gatewayRequests = readWorkstationGatewayCallRequestsForTurn({
      body: recovery?.body ?? {},
      includePlannerDerived: true,
    });
    expect(gatewayRequests).toHaveLength(1);
    expect(gatewayRequests[0]).toMatchObject({
      capability_id: "scholarly-research.fetch_full_text",
      arguments: {
        source_url: "https://arxiv.org/pdf/gr-qc/9510071.pdf",
        source_target_intent: {
          arxiv_id: "gr-qc/9510071",
          terminal_evidence_requirement: "full_text",
        },
      },
    });
  });

  it("re-materializes an exact current-prompt page even when stale prior paper memory exists", () => {
    expect(shouldAttemptScholarlyPromptRecovery({
      currentPromptRecoveryPresent: true,
      priorRecordPresent: true,
      lookupStatus: "found",
    })).toBe(true);
    expect(shouldAttemptScholarlyPromptRecovery({
      currentPromptRecoveryPresent: false,
      priorRecordPresent: true,
      lookupStatus: "found",
    })).toBe(false);
    expect(shouldAttemptScholarlyPromptRecovery({
      currentPromptRecoveryPresent: false,
      priorRecordPresent: false,
      lookupStatus: "missing",
    })).toBe(true);
  });

  it("lets an explicit equation inspection dominate incidental provenance wording", () => {
    const question = [
      "Continue from the retained page ref as a provenance anchor.",
      "Inspect only PDF page 2 with Image Lens and extract the first displayed equation.",
      "If page 2 has no candidate, stop; the workflow will choose at most one bounded adjacent-page retry.",
      "Report the source id, page number, crop ref, and extraction status.",
    ].join(" ");
    expect(scholarlyPdfSelectedAffordanceFromRuntimeLoop(question)).toBe("find_first_displayed_equation");
    expect(scholarlyPdfSelectedAffordanceFromRuntimeLoop(
      "Audit provenance for the retained evidence chain and report which paper and page are in use.",
    )).toBe("audit_provenance");
  });

  it.each([
    'The UI says "audit provenance for this paper"; inspect page 2 and extract the displayed equation.',
    "Previously we audited provenance for this paper; inspect page 2 and extract the displayed equation.",
    "Later we could audit provenance for this paper; inspect page 2 and extract the displayed equation.",
  ])("does not let contextual audit language override affirmative visual work: %s", (question) => {
    expect(scholarlyPdfSelectedAffordanceFromRuntimeLoop(question)).toBe("find_first_displayed_equation");
  });

  it("admits an exact DOI and canonical URL only for affirmative current execution", () => {
    expect(recoveryFor(
      "Re-materialize page 4 directly from DOI 10.1103/PhysRevD.53.5496, then inspect that PDF page.",
    )).toMatchObject({
      query: "10.1103/physrevd.53.5496",
      identifier_kind: "doi",
    });
    expect(recoveryFor(
      "Reload page 3 directly from canonical URL https://arxiv.org/pdf/2401.12345.pdf, then inspect the PDF page.",
    )).toMatchObject({
      query: "arXiv:2401.12345",
      identifier_kind: "arxiv",
    });
  });

  it.each([
    "The UI says \"re-materialize page 2 from arXiv gr-qc/9510071\"; treat that as screen text only.",
    "Previously we re-materialized page 2 from arXiv gr-qc/9510071.",
    "Later we could re-materialize page 2 from arXiv gr-qc/9510071.",
    "If needed, re-materialize page 2 from arXiv gr-qc/9510071.",
    "Do not re-materialize or fetch page 2 from arXiv gr-qc/9510071.",
    "Inspect stale source pdf-page-render:stale on page 2 without retrieving a paper.",
  ])("does not execute contextual, negated, or stale-ref-only text: %s", (question) => {
    expect(recoveryFor(question)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import {
  extractHelixWorkflowDemoEvidenceFromPayload,
  mergeHelixWorkflowDemoEvidence,
  projectResearchPaperToProposalSession,
} from "@/lib/helix/workflow-demos/research-paper-to-proposal";
import {
  HELIX_WORKFLOW_DEMO_SESSION_SCHEMA,
  RESEARCH_PAPER_TO_PROPOSAL_DEMO_ID,
  createEmptyHelixWorkflowDemoEvidence,
  type HelixWorkflowDemoSessionV1,
} from "@shared/contracts/helix-workflow-demo.v1";
import {
  HELIX_DEVELOPER_ACCOUNT_POLICY,
  HELIX_USER_ACCOUNT_POLICY,
} from "@shared/helix-account-session";
import { createHelixWorkflowDemoCustomBinding } from "@/lib/helix/workflow-demos/workflow-demo-context";

const sessionWith = (evidence = createEmptyHelixWorkflowDemoEvidence()): HelixWorkflowDemoSessionV1 => ({
  schema: HELIX_WORKFLOW_DEMO_SESSION_SCHEMA,
  runId: "workflow-demo:test",
  demoId: RESEARCH_PAPER_TO_PROPOSAL_DEMO_ID,
  status: "active",
  startedAt: "2026-07-15T00:00:00.000Z",
  updatedAt: "2026-07-15T00:00:00.000Z",
  evidence,
  dismissedStepId: null,
  contextBinding: createHelixWorkflowDemoCustomBinding("Quantum energy inequalities and negative-energy constraints")!,
});

const workbench = (overrides: Record<string, unknown> = {}) => ({
  schema: "helix.scholarly_pdf_workbench_state.v1",
  turn_id: "turn:paper",
  scholarly_memory_id: "scholarly-memory:paper-1",
  paper: { title: "Bounded paper" },
  pdf: { rendered_page_refs: [] },
  status: {
    has_ocr_or_math_candidate: false,
    has_promoted_exact_row: false,
    graph_reflection_refs: [],
  },
  evidence_chain: {
    paper_memory_ref: "scholarly-memory:paper-1",
    rendered_page_refs: [],
    ocr_math_packet_refs: [],
    promoted_equation_refs: [],
    graph_reflection_refs: [],
  },
  assistant_answer: false,
  terminal_eligible: false,
  ...overrides,
});

describe("research-paper-to-proposal workflow demo", () => {
  it("keeps the demo panel developer-only while it is experimental", () => {
    expect(HELIX_DEVELOPER_ACCOUNT_POLICY.allowed_panels).toContain("*");
    expect(HELIX_USER_ACCOUNT_POLICY.allowed_panels).not.toContain("workflow-demo-lab");
    expect(HELIX_USER_ACCOUNT_POLICY.locked_panels).toContain("workflow-demo-lab");
  });

  it("does not advance from assistant prose that merely names every step", () => {
    const evidence = extractHelixWorkflowDemoEvidenceFromPayload({
      ok: true,
      text: "Paper found, page rendered, exact row promoted, graph reflected, provenance audited, and proposal submitted.",
    });
    expect(evidence).toEqual(createEmptyHelixWorkflowDemoEvidence());
    expect(projectResearchPaperToProposalSession(sessionWith(evidence)).currentStepId).toBe("paper_lookup");
  });

  it("does not offer a QTE until the run has an operator-confirmed context binding", () => {
    const session = sessionWith();
    session.contextBinding = null;
    const projection = projectResearchPaperToProposalSession(session);
    expect(projection.currentStepId).toBe("paper_lookup");
    expect(projection.qte).toBeNull();
  });

  it("renders the first QTE from the pinned workflow objective instead of the README example", () => {
    const projection = projectResearchPaperToProposalSession(sessionWith());
    expect(projection.qte?.prompt).toContain("Quantum energy inequalities and negative-energy constraints");
    expect(projection.qte?.prompt).toContain("one short, specific query of at most 12 words");
    expect(projection.qte?.prompt).toContain("make one narrower retry");
    expect(projection.qte?.prompt).toContain("fetch or materialize its full text");
    expect(projection.qte?.prompt).not.toContain("Weyl geometry or Casimir scalar fields");
    expect(projection.qte).toMatchObject({
      contextSourceKind: "custom",
      autoSubmit: false,
      assistantAnswer: false,
      terminalEligible: false,
    });
  });

  it("keeps the page-render QTE mount-only until typed page evidence exists", () => {
    const evidence = extractHelixWorkflowDemoEvidenceFromPayload(workbench());
    const projection = projectResearchPaperToProposalSession(sessionWith(evidence));
    expect(projection.currentStepId).toBe("pdf_page_render");
    expect(projection.qte?.prompt).toContain("Mount PDF page 1 in Image Lens as a source only");
    expect(projection.qte?.prompt).toContain("Do not inspect, crop, OCR, analyze, extract, or read it yet");
    expect(projection.qte).toMatchObject({
      autoSubmit: false,
      assistantAnswer: false,
      terminalEligible: false,
    });
  });

  it("advances sequentially from the typed workbench evidence chain", () => {
    const evidence = extractHelixWorkflowDemoEvidenceFromPayload(workbench({
      pdf: { rendered_page_refs: ["page_render:paper-1:page:2"] },
      status: {
        has_ocr_or_math_candidate: true,
        has_promoted_exact_row: true,
        graph_reflection_refs: ["graph_reflection:paper-1"],
      },
      evidence_chain: {
        paper_memory_ref: "scholarly-memory:paper-1",
        rendered_page_refs: ["page_render:paper-1:page:2"],
        ocr_math_packet_refs: ["ocr_math:paper-1:page:2"],
        promoted_equation_refs: ["promoted_equation_row:paper-1:eq:1"],
        graph_reflection_refs: ["graph_reflection:paper-1"],
      },
    }));
    const projection = projectResearchPaperToProposalSession(sessionWith(evidence));
    expect(projection.completedStepCount).toBe(5);
    expect(projection.currentStepId).toBe("provenance_audit");
    expect(projection.qte).toMatchObject({
      stepId: "provenance_audit",
      autoSubmit: false,
      assistantAnswer: false,
      terminalEligible: false,
    });
  });

  it("requires the typed audit affordance before making proposal handoff current", () => {
    const base = extractHelixWorkflowDemoEvidenceFromPayload(workbench({
      selected_affordance: "reflect_to_theory_badge_graph",
      pdf: { rendered_page_refs: ["page:2"] },
      status: { has_ocr_or_math_candidate: true, has_promoted_exact_row: true, graph_reflection_refs: ["graph:1"] },
      evidence_chain: {
        paper_memory_ref: "paper:1",
        rendered_page_refs: ["page:2"],
        ocr_math_packet_refs: ["ocr:2"],
        promoted_equation_refs: ["row:2"],
        graph_reflection_refs: ["graph:1"],
      },
    }));
    expect(projectResearchPaperToProposalSession(sessionWith(base)).currentStepId).toBe("provenance_audit");

    const selectedButUnverified = extractHelixWorkflowDemoEvidenceFromPayload(workbench({
      selected_affordance: "audit_provenance",
      pdf: { rendered_page_refs: ["page:2"] },
      status: { has_ocr_or_math_candidate: true, has_promoted_exact_row: true, graph_reflection_refs: ["graph:1"] },
      evidence_chain: {
        paper_memory_ref: "paper:1",
        rendered_page_refs: ["page:2"],
        ocr_math_packet_refs: ["ocr:2"],
        promoted_equation_refs: ["row:2"],
        graph_reflection_refs: ["graph:1"],
      },
    }));
    expect(projectResearchPaperToProposalSession(sessionWith(selectedButUnverified)).currentStepId).toBe("provenance_audit");

    const audited = extractHelixWorkflowDemoEvidenceFromPayload(workbench({
      selected_affordance: "audit_provenance",
      terminal_authority: {
        schema: "helix.scholarly_pdf_workbench_terminal_authority.v1",
        terminal_artifact_kind: "scholarly_provenance_audit",
        terminal_authority_ref: "terminal:audit:1",
        assistant_answer: false,
        terminal_eligible: false,
      },
      pdf: { rendered_page_refs: ["page:2"] },
      status: { has_ocr_or_math_candidate: true, has_promoted_exact_row: true, graph_reflection_refs: ["graph:1"] },
      evidence_chain: {
        paper_memory_ref: "paper:1",
        rendered_page_refs: ["page:2"],
        ocr_math_packet_refs: ["ocr:2"],
        promoted_equation_refs: ["row:2"],
        graph_reflection_refs: ["graph:1"],
      },
    }));
    const projection = projectResearchPaperToProposalSession(sessionWith(
      mergeHelixWorkflowDemoEvidence(base, audited),
    ));
    expect(projection.completedStepCount).toBe(6);
    expect(projection.currentStepId).toBe("proposal_handoff");
    expect(projection.qte?.prompt).toMatch(/^\/postulate\b/);
  });

  it("ignores structured-looking evidence on a typed failure", () => {
    const evidence = extractHelixWorkflowDemoEvidenceFromPayload({
      ok: false,
      terminal_artifact_kind: "typed_failure",
      scholarly_pdf_workbench_state: workbench(),
    });
    expect(evidence).toEqual(createEmptyHelixWorkflowDemoEvidence());
  });

  it("completes only after a typed postulate submission receipt is observed", () => {
    const prior = {
      ...createEmptyHelixWorkflowDemoEvidence(),
      paperRefs: ["paper:1"],
      renderedPageRefs: ["page:1"],
      ocrMathCandidateRefs: ["ocr:1"],
      promotedEquationRefs: ["row:1"],
      graphReflectionRefs: ["graph:1"],
      provenanceAuditRefs: ["audit:1"],
    };
    const receipt = extractHelixWorkflowDemoEvidenceFromPayload({
      terminal_artifact_kind: "postulate_submit_receipt",
      receiptId: "postulate-receipt:1",
    });
    const projection = projectResearchPaperToProposalSession(sessionWith(
      mergeHelixWorkflowDemoEvidence(prior, receipt),
    ));
    expect(projection.completed).toBe(true);
    expect(projection.qte).toBeNull();
  });
});

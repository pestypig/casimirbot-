import type { ScientificEvidenceWorkflowStatus } from "@/components/helix/ask-console/ScientificEvidenceWorkflowStatus";
import { collectScientificEvidenceWorkflowStatusesFromPayload } from "@/store/useScientificEvidenceWorkflowStore";
import {
  HELIX_WORKFLOW_DEMO_SCHEMA,
  HELIX_WORKFLOW_QTE_SCHEMA,
  RESEARCH_PAPER_TO_PROPOSAL_DEMO_ID,
  createEmptyHelixWorkflowDemoEvidence,
  type HelixWorkflowDemoDefinitionV1,
  type HelixWorkflowDemoEvidenceV1,
  type HelixWorkflowDemoSessionV1,
  type HelixWorkflowDemoStepV1,
  type HelixWorkflowDemoStepState,
  type HelixWorkflowQteV1,
  type ResearchPaperToProposalStepId,
} from "@shared/contracts/helix-workflow-demo.v1";
import { renderHelixWorkflowDemoPromptTemplate } from "@/lib/helix/workflow-demos/workflow-demo-context";

type RecordLike = Record<string, unknown>;

export type ResearchPaperToProposalProjection = {
  steps: Array<{
    id: ResearchPaperToProposalStepId;
    title: string;
    shortLabel: string;
    description: string;
    state: HelixWorkflowDemoStepState;
    evidenceRefs: string[];
  }>;
  completedStepCount: number;
  currentStepId: ResearchPaperToProposalStepId | null;
  completed: boolean;
  qte: HelixWorkflowQteV1 | null;
};

const uniqueRefs = (...groups: Array<readonly unknown[] | undefined>): string[] =>
  Array.from(new Set(
    groups
      .flatMap((group: readonly unknown[] | undefined) => group ?? [])
      .map((value: unknown) => (typeof value === "string" ? value.trim() : ""))
      .filter(Boolean),
  )).slice(0, 48);

const readRecord = (value: unknown): RecordLike | null =>
  value !== null && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? uniqueRefs(value) : [];

export const RESEARCH_PAPER_TO_PROPOSAL_DEMO: HelixWorkflowDemoDefinitionV1 = {
  schema: HELIX_WORKFLOW_DEMO_SCHEMA,
  id: RESEARCH_PAPER_TO_PROPOSAL_DEMO_ID,
  title: "Research paper to proposal",
  description: "Use bounded scholarly evidence, promote an exact equation row, reflect it diagnostically, audit provenance, then prepare a gated postulate proposal.",
  steps: [
    {
      id: "paper_lookup",
      title: "Find a bounded paper",
      shortLabel: "Paper",
      description: "Select a scholarly record with an accessible PDF or full-text affordance.",
      prompt: "Find one PDF-accessible primary paper for this workflow objective: \"{{research_topic}}\". Do not send the entire objective as the scholarly query. First derive one short, specific query of at most 12 words from its most distinctive scientific terms, then search. If that query has no usable topic-relevant paper, make one narrower retry. Select exactly one paper, fetch or materialize its full text, and report its canonical identity, DOI or arXiv ID when available, PDF/full-text affordance, and stable source refs.",
    },
    {
      id: "pdf_page_render",
      title: "Render a PDF page",
      shortLabel: "Page",
      description: "Materialize a page image with a stable source id, page number, and provenance.",
      prompt: "Use the selected paper from the prior step. Mount PDF page 1 in Image Lens as a source only. Do not inspect, crop, OCR, analyze, extract, or read it yet. Report only whether typed page-mount evidence was created, including its page/source refs.",
    },
    {
      id: "ocr_math_candidate",
      title: "Find a math candidate",
      shortLabel: "OCR/math",
      description: "Inspect a rendered page and retain a typed OCR or equation-candidate observation.",
      prompt: "Inspect page 2 of that same paper and extract the first displayed equation with page evidence. If there is no equation candidate, scan only a bounded adjacent-page window and stop with the typed blocker.",
    },
    {
      id: "exact_row_promotion",
      title: "Promote the exact row",
      shortLabel: "Promote",
      description: "Crop only a clean equation row and promote it only when exact-row admissibility is supported.",
      prompt: "Use the equation candidate from the prior step. Crop only the exact equation row and promote it only if the row crop supports exact equation admissibility; otherwise return the typed blocker without promoting fragments.",
    },
    {
      id: "graph_reflection",
      title: "Reflect to the theory graph",
      shortLabel: "Reflect",
      description: "Attach promoted evidence as diagnostic context, without upgrading its authority.",
      prompt: "Reflect the promoted exact equation row to the Theory Badge Graph. Keep the claim boundary diagnostic-only unless stronger authority is explicitly supported, and return the typed graph-reflection refs.",
    },
    {
      id: "provenance_audit",
      title: "Audit provenance",
      shortLabel: "Audit",
      description: "Name the retained paper, page, crop, evidence depth, and graph reflection chain.",
      prompt: "Audit the retained scientific evidence chain. Tell me which paper, page, equation, crop ref, evidence depth, and graph-reflection refs are in use, using the latest typed sidecar/workbench state rather than prose memory.",
    },
    {
      id: "proposal_handoff",
      title: "Prepare the gated proposal",
      shortLabel: "Proposal",
      description: "Draft a traceable postulate proposal and enter the existing review/submission gate.",
      prompt: "/postulate Draft a proposal from the audited scientific evidence chain. State the diagnostic claim boundary, cite the promoted row, page render, graph reflection, and provenance refs, identify the unresolved uncertainty, and submit only through the existing postulate review gate.",
    },
  ],
};

const evidenceDepthRank: Record<ScientificEvidenceWorkflowStatus["evidenceDepth"], number> = {
  missing: 0,
  page_loaded: 1,
  page_image_observation: 2,
  page_image_ocr_math_candidate: 3,
  exact_row_partial: 4,
  exact_row_promoted: 5,
  exact_block_partial: 6,
  exact_block_promoted: 7,
};

const collectTypedRecords = (payload: unknown, schema: string): RecordLike[] => {
  const matches: RecordLike[] = [];
  const seen = new WeakSet<object>();
  const visit = (value: unknown, depth = 0): void => {
    if (depth > 9 || value === null || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.slice(0, 180).forEach((entry: unknown) => visit(entry, depth + 1));
      return;
    }
    const record = value as RecordLike;
    if (record.schema === schema) matches.push(record);
    Object.values(record).slice(0, 200).forEach((entry: unknown) => visit(entry, depth + 1));
  };
  visit(payload);
  return matches;
};

export const isHelixWorkflowDemoTypedFailurePayload = (payload: unknown): boolean => {
  const record = readRecord(payload);
  if (!record) return false;
  const kind = readString(record.terminal_artifact_kind) ?? readString(record.terminalArtifactKind);
  return record.ok === false || kind === "typed_failure" || kind === "route_execution_failure";
};

const refsFromScientificStatus = (status: ScientificEvidenceWorkflowStatus): HelixWorkflowDemoEvidenceV1 => {
  const refs = status.postulateReadyRefs;
  const sourceRef = status.sourceId ?? status.sourceImageHash ?? null;
  const hasCandidate = evidenceDepthRank[status.evidenceDepth] >= evidenceDepthRank.page_image_ocr_math_candidate;
  return {
    schema: "helix.workflow_demo_evidence.v1",
    paperRefs: [],
    renderedPageRefs: uniqueRefs(refs.pageRenderRefs, sourceRef ? [sourceRef] : []),
    ocrMathCandidateRefs: hasCandidate
      ? uniqueRefs(refs.cropRefs, refs.evidenceSidecarRefs, status.cropRef ? [status.cropRef] : [])
      : [],
    promotedEquationRefs: status.promotedRowState === "promoted"
      ? uniqueRefs(refs.promotedEquationRowRefs)
      : [],
    graphReflectionRefs: status.graphReflectionStatus === "diagnostic_reflected"
      ? uniqueRefs(refs.graphReflectionRefs)
      : [],
    provenanceAuditRefs: [],
    proposalReceiptRefs: [],
  };
};

const refsFromWorkbench = (workbench: RecordLike): HelixWorkflowDemoEvidenceV1 => {
  const paper = readRecord(workbench.paper);
  const pdf = readRecord(workbench.pdf);
  const status = readRecord(workbench.status);
  const chain = readRecord(workbench.evidence_chain);
  const paperIdentity = [
    readString(workbench.scholarly_memory_id),
    readString(chain?.paper_memory_ref),
    readString(paper?.title),
  ].filter((entry): entry is string => Boolean(entry));
  const renderedPageRefs = uniqueRefs(
    readStringArray(pdf?.rendered_page_refs),
    readStringArray(chain?.rendered_page_refs),
  );
  const ocrMathRefs = uniqueRefs(
    readStringArray(chain?.ocr_math_packet_refs),
    status?.has_ocr_or_math_candidate === true && renderedPageRefs.length > 0 ? renderedPageRefs : [],
  );
  const promotedRefs = uniqueRefs(readStringArray(chain?.promoted_equation_refs));
  const graphRefs = uniqueRefs(
    readStringArray(chain?.graph_reflection_refs),
    readStringArray(status?.graph_reflection_refs),
  );
  const selectedAffordance = readString(workbench.selected_affordance);
  const terminalAuthority = readRecord(workbench.terminal_authority);
  const terminalAuthorityKind = readString(terminalAuthority?.terminal_artifact_kind);
  const terminalAuthorityRef = readString(terminalAuthority?.terminal_authority_ref);
  const auditWasAuthoritativelyObserved =
    selectedAffordance === "audit_provenance" &&
    Boolean(terminalAuthorityRef) &&
    terminalAuthorityKind !== "typed_failure" &&
    terminalAuthorityKind !== "route_execution_failure";
  const auditRefs = auditWasAuthoritativelyObserved
    ? uniqueRefs(
        paperIdentity,
        renderedPageRefs,
        promotedRefs,
        graphRefs,
        terminalAuthorityRef ? [terminalAuthorityRef] : [],
        readString(workbench.turn_id) ? [`provenance_audit:${readString(workbench.turn_id)}`] : [],
      )
    : [];
  return {
    schema: "helix.workflow_demo_evidence.v1",
    paperRefs: paperIdentity,
    renderedPageRefs,
    ocrMathCandidateRefs: ocrMathRefs,
    promotedEquationRefs: status?.has_promoted_exact_row === true ? promotedRefs : [],
    graphReflectionRefs: graphRefs,
    provenanceAuditRefs: auditRefs,
    proposalReceiptRefs: [],
  };
};

const collectProposalReceiptRefs = (payload: unknown): string[] => {
  const refs: string[] = [];
  const seen = new WeakSet<object>();
  const visit = (value: unknown, depth = 0): void => {
    if (depth > 9 || value === null || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.slice(0, 180).forEach((entry: unknown) => visit(entry, depth + 1));
      return;
    }
    const record = value as RecordLike;
    const schema = readString(record.schema);
    const kind = readString(record.terminal_artifact_kind) ?? readString(record.terminalArtifactKind);
    if (schema === "helix.postulate_submit_receipt.v1" || kind === "postulate_submit_receipt") {
      refs.push(...uniqueRefs([
        record.receiptId,
        record.receipt_id,
        record.id,
        readRecord(record.receipt)?.receiptId,
        readRecord(record.receipt)?.receipt_id,
      ]));
    }
    Object.values(record).slice(0, 200).forEach((entry: unknown) => visit(entry, depth + 1));
  };
  visit(payload);
  return uniqueRefs(refs);
};

export const mergeHelixWorkflowDemoEvidence = (
  current: HelixWorkflowDemoEvidenceV1,
  incoming: HelixWorkflowDemoEvidenceV1,
): HelixWorkflowDemoEvidenceV1 => ({
  schema: "helix.workflow_demo_evidence.v1",
  paperRefs: uniqueRefs(current.paperRefs, incoming.paperRefs),
  renderedPageRefs: uniqueRefs(current.renderedPageRefs, incoming.renderedPageRefs),
  ocrMathCandidateRefs: uniqueRefs(current.ocrMathCandidateRefs, incoming.ocrMathCandidateRefs),
  promotedEquationRefs: uniqueRefs(current.promotedEquationRefs, incoming.promotedEquationRefs),
  graphReflectionRefs: uniqueRefs(current.graphReflectionRefs, incoming.graphReflectionRefs),
  provenanceAuditRefs: uniqueRefs(current.provenanceAuditRefs, incoming.provenanceAuditRefs),
  proposalReceiptRefs: uniqueRefs(current.proposalReceiptRefs, incoming.proposalReceiptRefs),
});

export const extractHelixWorkflowDemoEvidenceFromPayload = (payload: unknown): HelixWorkflowDemoEvidenceV1 => {
  if (isHelixWorkflowDemoTypedFailurePayload(payload)) return createEmptyHelixWorkflowDemoEvidence();
  let evidence = createEmptyHelixWorkflowDemoEvidence();
  for (const status of collectScientificEvidenceWorkflowStatusesFromPayload(payload)) {
    evidence = mergeHelixWorkflowDemoEvidence(evidence, refsFromScientificStatus(status));
  }
  for (const workbench of collectTypedRecords(payload, "helix.scholarly_pdf_workbench_state.v1")) {
    evidence = mergeHelixWorkflowDemoEvidence(evidence, refsFromWorkbench(workbench));
  }
  evidence.proposalReceiptRefs = collectProposalReceiptRefs(payload);
  return evidence;
};

const stepEvidenceRefs = (
  stepId: ResearchPaperToProposalStepId,
  evidence: HelixWorkflowDemoEvidenceV1,
): string[] => {
  switch (stepId) {
    case "paper_lookup": return evidence.paperRefs;
    case "pdf_page_render": return evidence.renderedPageRefs;
    case "ocr_math_candidate": return evidence.ocrMathCandidateRefs;
    case "exact_row_promotion": return evidence.promotedEquationRefs;
    case "graph_reflection": return evidence.graphReflectionRefs;
    case "provenance_audit": return evidence.provenanceAuditRefs;
    case "proposal_handoff": return evidence.proposalReceiptRefs;
  }
  return [];
};

export const projectResearchPaperToProposalSession = (
  session: HelixWorkflowDemoSessionV1 | null,
): ResearchPaperToProposalProjection => {
  const evidence = session?.evidence ?? createEmptyHelixWorkflowDemoEvidence();
  let priorComplete = true;
  let currentStepId: ResearchPaperToProposalStepId | null = null;
  const steps = RESEARCH_PAPER_TO_PROPOSAL_DEMO.steps.map((step: HelixWorkflowDemoStepV1) => {
    const evidenceRefs = stepEvidenceRefs(step.id, evidence);
    const completed = priorComplete && evidenceRefs.length > 0;
    let state: HelixWorkflowDemoStepState;
    if (completed) {
      state = "completed";
    } else if (priorComplete && currentStepId === null) {
      state = "current";
      currentStepId = step.id;
    } else {
      state = "locked";
    }
    priorComplete = completed;
    return { ...step, state, evidenceRefs };
  });
  const completedStepCount = steps.filter((step: ResearchPaperToProposalProjection["steps"][number]) => step.state === "completed").length;
  const completed = completedStepCount === steps.length;
  const current = currentStepId
    ? RESEARCH_PAPER_TO_PROPOSAL_DEMO.steps.find((step: HelixWorkflowDemoStepV1) => step.id === currentStepId) ?? null
    : null;
  const contextBinding = session?.contextBinding ?? null;
  const qte = session && contextBinding && session.status === "active" && current && session.dismissedStepId !== current.id
    ? {
        schema: HELIX_WORKFLOW_QTE_SCHEMA,
        demoId: session.demoId,
        runId: session.runId,
        stepId: current.id,
        title: current.title,
        reason: completedStepCount === 0
          ? "Start the enabled procedural demo."
          : `Typed evidence completed ${completedStepCount} of ${steps.length} steps; this is the next unmet step.`,
        prompt: renderHelixWorkflowDemoPromptTemplate(current.prompt, contextBinding),
        contextBindingId: contextBinding.bindingId,
        contextSourceKind: contextBinding.sourceKind,
        autoSubmit: false,
        assistantAnswer: false,
        terminalEligible: false,
      } satisfies HelixWorkflowQteV1
    : null;
  return { steps, completedStepCount, currentStepId, completed, qte };
};

type WorkstationLayoutGroupLike = {
  activePanelId?: unknown;
  panelIds?: unknown;
};

type WorkstationLayoutDockLike = {
  collapsed?: unknown;
  widthPx?: unknown;
  side?: unknown;
};

type WorkstationLayoutDrawerLike = {
  open?: unknown;
  snap?: unknown;
};

export type WorkstationLayoutSnapshotInput = {
  mode?: unknown;
  activeGroupId?: unknown;
  groups?: Record<string, WorkstationLayoutGroupLike> | null;
  chatDock?: WorkstationLayoutDockLike | null;
  mobileDrawer?: WorkstationLayoutDrawerLike | null;
};

export function buildWorkstationLayoutDebugSnapshotFromState(
  state: WorkstationLayoutSnapshotInput,
): Record<string, unknown> {
  const groups = state.groups ?? {};
  const panelIds = new Set<string>();
  Object.values(groups).forEach((group) => {
    if (!Array.isArray(group.panelIds)) return;
    group.panelIds.forEach((panelId) => {
      if (typeof panelId === "string" && panelId.trim()) panelIds.add(panelId);
    });
  });
  return {
    mode: state.mode,
    activeGroupId: state.activeGroupId,
    groupCount: Object.keys(groups).length,
    openPanels: [...panelIds].sort((a, b) => a.localeCompare(b)),
    chatDock: {
      collapsed: state.chatDock?.collapsed,
      widthPx: state.chatDock?.widthPx,
      side: state.chatDock?.side,
    },
    mobileDrawer: {
      open: state.mobileDrawer?.open,
      snap: state.mobileDrawer?.snap,
    },
  };
}

type WorkstationNoteLike = {
  id?: unknown;
  title?: unknown;
  body?: unknown;
};

type WorkstationNotesSnapshotInput = {
  active_note_id?: unknown;
  notes?: Record<string, WorkstationNoteLike | null | undefined> | null;
  order?: unknown;
};

type ScientificCalculatorDebugEventLike = {
  action_id?: unknown;
  ok?: unknown;
  input_latex?: unknown;
  result_text?: unknown;
  normalized_expression?: unknown;
  message?: unknown;
  ts?: unknown;
};

type ScientificCalculatorSnapshotInput = {
  currentLatex?: unknown;
  lastSolve?: {
    result_text?: unknown;
    normalized_expression?: unknown;
    trace?: { traceId?: unknown } | null;
    ok?: unknown;
  } | null;
  steps?: unknown;
  debugEvents?: unknown;
};

export type AskTurnWorkspaceContextSnapshotInput = {
  sessionId?: string | null;
  layoutState: WorkstationLayoutSnapshotInput;
  notesState: WorkstationNotesSnapshotInput;
  calculatorState: ScientificCalculatorSnapshotInput;
  docContext: {
    path: string | null;
    source: string;
  };
  situationRoomContext?: unknown;
  situationCaptureContext?: unknown;
  lastUpdatedAtMs: number;
};

const clipTextForAskTurn = (value: unknown, max: number): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
};

const readPanelIds = (group: WorkstationLayoutGroupLike | null | undefined): string[] =>
  Array.isArray(group?.panelIds)
    ? group.panelIds.filter((panelId): panelId is string => typeof panelId === "string" && panelId.trim().length > 0)
    : [];

const readNoteOrder = (notesState: WorkstationNotesSnapshotInput): string[] =>
  Array.isArray(notesState.order)
    ? notesState.order.filter((noteId): noteId is string => typeof noteId === "string" && noteId.trim().length > 0)
    : [];

const readCalculatorDebugEvents = (
  calculatorState: ScientificCalculatorSnapshotInput,
): ScientificCalculatorDebugEventLike[] =>
  Array.isArray(calculatorState.debugEvents)
    ? calculatorState.debugEvents.filter((event): event is ScientificCalculatorDebugEventLike =>
        Boolean(event) && typeof event === "object",
      )
    : [];

export function buildAskTurnWorkspaceContextSnapshotFromState(
  input: AskTurnWorkspaceContextSnapshotInput,
): Record<string, unknown> {
  const groups = input.layoutState.groups ?? {};
  const activeGroupId = input.layoutState.activeGroupId;
  const activeGroup =
    typeof activeGroupId === "string" && activeGroupId
      ? groups[activeGroupId] ?? null
      : null;
  const activePanel = typeof activeGroup?.activePanelId === "string" ? activeGroup.activePanelId : null;
  const openPanelIds = Object.values(groups)
    .flatMap((group) => readPanelIds(group))
    .slice(0, 24);
  const calculatorRecentDebugEvents = readCalculatorDebugEvents(input.calculatorState).slice(0, 5).map((event) => ({
    action_id: event.action_id,
    ok: event.ok,
    input_latex: clipTextForAskTurn(event.input_latex, 400),
    result_text: clipTextForAskTurn(event.result_text, 400),
    normalized_expression: clipTextForAskTurn(event.normalized_expression, 400),
    message: clipTextForAskTurn(event.message, 240),
    ts: event.ts,
  }));
  const activeCalculatorContext = {
    schema: "helix.scientific_calculator_active_context.v1",
    panel_id: "scientific-calculator",
    active_panel: activePanel === "scientific-calculator",
    current_latex: clipTextForAskTurn(input.calculatorState.currentLatex, 800),
    last_result_text: clipTextForAskTurn(input.calculatorState.lastSolve?.result_text, 800),
    last_normalized_expression: clipTextForAskTurn(input.calculatorState.lastSolve?.normalized_expression, 800),
    last_trace_id: clipTextForAskTurn(input.calculatorState.lastSolve?.trace?.traceId, 240),
    last_ok: input.calculatorState.lastSolve?.ok ?? null,
    step_count: Array.isArray(input.calculatorState.steps) ? input.calculatorState.steps.length : 0,
    recent_debug_events: calculatorRecentDebugEvents,
  };
  const currentPath = input.docContext.path;
  const docContextSource = input.docContext.source;
  const notes = input.notesState.notes ?? {};
  const noteOrder = readNoteOrder(input.notesState);
  const activeNoteId = typeof input.notesState.active_note_id === "string" ? input.notesState.active_note_id : null;
  const activeNote = activeNoteId ? notes[activeNoteId] ?? null : null;
  const lastCreatedNoteId = noteOrder[0] ?? null;
  const lastCreatedNote = lastCreatedNoteId ? notes[lastCreatedNoteId] ?? null : null;
  const recentNotes = noteOrder.slice(0, 8).flatMap((noteId) => {
    const note = notes[noteId] ?? null;
    if (!note?.title) return [];
    return [{
      id: note.id,
      title: note.title,
      body: clipTextForAskTurn(note.body, 12000),
    }];
  });
  const hasNoteContext =
    Boolean(activeNote?.title) ||
    Boolean(lastCreatedNote?.title) ||
    Object.values(groups).some((group) => readPanelIds(group).includes("workstation-notes"));
  return {
    sessionId: input.sessionId ?? "helix-ui",
    activePanel,
    activeGroupId,
    groupCount: Object.keys(groups).length,
    openPanels: [...new Set(openPanelIds)].sort((a, b) => a.localeCompare(b)),
    activeCalculatorContext,
    hasCalculatorContext: activePanel === "scientific-calculator" && (
      Boolean(activeCalculatorContext.current_latex) ||
      Boolean(activeCalculatorContext.last_result_text) ||
      calculatorRecentDebugEvents.length > 0
    ),
    active_panel: activePanel,
    activeDocPath: currentPath,
    active_doc_path: currentPath,
    source: docContextSource,
    hasDocContext: Boolean(currentPath),
    has_doc_context: Boolean(currentPath),
    docContextValid: Boolean(currentPath),
    doc_context_valid: Boolean(currentPath),
    docContextPath: currentPath,
    doc_context_path: currentPath,
    docContextSource: currentPath ? docContextSource : null,
    doc_context_source: currentPath ? docContextSource : null,
    docContextFailureReason: currentPath
      ? null
      : activePanel === "docs-viewer"
        ? "docs_panel_open_without_active_doc_path"
        : "no_docs_panel_or_active_doc_path",
    doc_context_failure_reason: currentPath
      ? null
      : activePanel === "docs-viewer"
        ? "docs_panel_open_without_active_doc_path"
        : "no_docs_panel_or_active_doc_path",
    activeNoteId,
    activeNoteTitle: activeNote?.title ?? null,
    activeNoteBody: clipTextForAskTurn(activeNote?.body, 12000),
    lastCreatedNoteId,
    lastCreatedNoteTitle: lastCreatedNote?.title ?? null,
    lastCreatedNoteBody: clipTextForAskTurn(lastCreatedNote?.body, 12000),
    recentNotes,
    hasNoteContext,
    situationRoomContext: input.situationRoomContext,
    situationCaptureContext: input.situationCaptureContext,
    hasSituationRoomContext: Boolean(input.situationRoomContext),
    hasClipboardContext: Object.values(groups).some((group) =>
      readPanelIds(group).includes("workstation-clipboard-history"),
    ),
    lastUpdatedAtMs: input.lastUpdatedAtMs,
  };
}

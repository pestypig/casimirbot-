import { openDocPanel } from "@/lib/docs/openDocPanel";
import { getPanelDef } from "@/lib/desktop/panelRegistry";
import { launchHelixAskPrompt } from "@/lib/helix/ask-prompt-launch";
import type { HelixAskAnswerContract } from "@/lib/helix/ask-prompt-launch";
import type { SettingsTab } from "@/hooks/useHelixStartSettings";
import { dispatchScientificCalculatorMathPicked } from "@/lib/scientific-calculator/events";
import { runScientificSolve } from "@/lib/scientific-calculator/solver";
import { recordClipboardReceipt } from "@/lib/workstation/workstationClipboard";
import { useDocViewerStore } from "@/store/useDocViewerStore";
import { useScientificCalculatorStore } from "@/store/useScientificCalculatorStore";
import { useWorkstationClipboardStore } from "@/store/useWorkstationClipboardStore";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";

export type HelixPanelActionRequest = {
  panel_id: string;
  action_id: string;
  args?: Record<string, unknown>;
};

export type HelixPanelActionExecutionResult = {
  ok: boolean;
  panel_id: string;
  action_id: string;
  artifact?: Record<string, unknown> | null;
  message?: string;
};

export type HelixPanelActionExecutionContext = {
  openPanel: (panelId: string, groupId?: string) => void;
  focusPanel: (panelId: string, groupId?: string) => void;
  closePanel: (panelId: string, groupId?: string) => void;
  openSettings: (tab?: SettingsTab) => void;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    if (trimmed === "true" || trimmed === "yes" || trimmed === "y" || trimmed === "1") return true;
    if (trimmed === "false" || trimmed === "no" || trimmed === "n" || trimmed === "0") return false;
  }
  return null;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function buildDeterministicNoteId(title: string, existingIds: string[]): string {
  const base = slugify(title) || "untitled-note";
  const stem = `note:${base}`;
  if (!existingIds.includes(stem)) return stem;
  let index = 2;
  while (existingIds.includes(`${stem}-${index}`)) index += 1;
  return `${stem}-${index}`;
}

function resolveNoteId(args: Record<string, unknown>, options?: { allowActiveFallback?: boolean }): string | null {
  const notesState = useWorkstationNotesStore.getState();
  const directId = asNonEmptyString(args.note_id ?? args.id);
  if (directId && notesState.notes[directId]) return directId;
  const targetTitle = asNonEmptyString(args.title ?? args.note_title ?? args.name);
  if (targetTitle) {
    const needle = targetTitle.trim().toLowerCase();
    const foundId = notesState.order.find((id) => {
      const note = notesState.notes[id];
      return note?.title?.trim().toLowerCase() === needle;
    });
    if (foundId) return foundId;
  }
  if (options?.allowActiveFallback && notesState.active_note_id && notesState.notes[notesState.active_note_id]) {
    return notesState.active_note_id;
  }
  return null;
}

function requireConfirmation(
  request: HelixPanelActionRequest,
  panelId: string,
  actionId: string,
  actionLabel: string,
): HelixPanelActionExecutionResult | null {
  const args = asRecord(request.args) ?? {};
  const confirmed = asBoolean(args.confirmed ?? args.confirm ?? args.approved);
  if (confirmed === true) return null;
  return {
    ok: false,
    panel_id: panelId,
    action_id: actionId,
    message: `${actionLabel} requires confirmation. Re-run with args.confirmed=true.`,
    artifact: {
      requires_confirmation: true,
      action_id: actionId,
    },
  };
}

function buildDocReasoningPrompt(args: {
  mode: "summarize_doc" | "summarize_section" | "explain_paper";
  path: string;
  anchor?: string;
  selectedText?: string;
}): string {
  const pathLine = `Document path: ${args.path}`;
  const anchorLine = args.anchor ? `Section anchor: #${args.anchor}` : null;
  const selectionLine = args.selectedText ? `Selected text: "${args.selectedText}"` : null;
  const contextLines = [pathLine, anchorLine, selectionLine].filter(Boolean).join("\n");

  if (args.mode === "summarize_section") {
    return `Summarize this section from the current docs viewer selection. Start with one sentence on what this section is for, then key points.\n${contextLines}`;
  }
  if (args.mode === "explain_paper") {
    return `Explain this paper from the current docs viewer context in plain language.\n${contextLines}`;
  }
  return `Summarize this document from the current docs viewer context. Start with one sentence on what this document is for, then key findings and caveats.\n${contextLines}`;
}

function buildDocAnswerContract(mode: "summarize_doc" | "summarize_section" | "explain_paper"): HelixAskAnswerContract {
  const sharedSections = [
    { id: "purpose", heading: "Purpose", required: true, synonyms: ["What this document is for"] },
  ];
  if (mode === "summarize_section") {
    return {
      schema: "helix.ask.answer_contract.v1",
      source: "docs_viewer",
      mode,
      strict_sections: true,
      min_tokens: 900,
      sections: [
        ...sharedSections,
        { id: "key_points", heading: "Key Points", required: true, synonyms: ["Findings"] },
        { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
        { id: "next_checks", heading: "Next Checks", required: false, synonyms: ["Follow-ups"] },
      ],
    };
  }
  if (mode === "explain_paper") {
    return {
      schema: "helix.ask.answer_contract.v1",
      source: "docs_viewer",
      mode,
      strict_sections: true,
      min_tokens: 1000,
      sections: [
        ...sharedSections,
        { id: "core_mechanism", heading: "Core Mechanism", required: true, synonyms: ["How it works"] },
        { id: "evidence", heading: "Evidence", required: true, synonyms: ["Findings"] },
        { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
      ],
    };
  }
  return {
    schema: "helix.ask.answer_contract.v1",
    source: "docs_viewer",
    mode,
    strict_sections: true,
    min_tokens: 1100,
    sections: [
      ...sharedSections,
      { id: "findings", heading: "Findings", required: true, synonyms: ["Key Findings", "Key Points"] },
      { id: "caveats", heading: "Caveats", required: true, synonyms: ["Limits", "Limitations"] },
      { id: "next_checks", heading: "Next Checks", required: false, synonyms: ["Follow-ups"] },
    ],
  };
}

export function executeHelixPanelAction(
  request: HelixPanelActionRequest,
  context: HelixPanelActionExecutionContext,
): HelixPanelActionExecutionResult {
  const panelId = request.panel_id?.trim();
  const actionId = request.action_id?.trim().toLowerCase();
  if (!panelId || !actionId) {
    return {
      ok: false,
      panel_id: request.panel_id || "",
      action_id: request.action_id || "",
      message: "panel_id and action_id are required.",
    };
  }

  if (actionId === "open") {
    context.openPanel(panelId, undefined);
    context.focusPanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (actionId === "focus") {
    context.focusPanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (actionId === "close") {
    context.closePanel(panelId, undefined);
    return { ok: true, panel_id: panelId, action_id: actionId };
  }

  if (panelId === "docs-viewer" && actionId === "open_doc") {
    const args = asRecord(request.args) ?? {};
    const path = asNonEmptyString(args.path ?? args.doc_path ?? args.target);
    const anchor = asNonEmptyString(args.anchor);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_doc requires a path.",
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    openDocPanel(anchor ? { path, anchor } : { path });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { path, anchor: anchor ?? null },
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_doc_and_read") {
    const args = asRecord(request.args) ?? {};
    const path = asNonEmptyString(args.path ?? args.doc_path ?? args.target);
    const anchor = asNonEmptyString(args.anchor);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "docs-viewer.open_doc_and_read requires a path.",
      };
    }
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    openDocPanel(anchor ? { path, anchor, autoRead: true } : { path, autoRead: true });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { path, anchor: anchor ?? null, autoRead: true },
    };
  }

  if (panelId === "docs-viewer" && actionId === "open_directory") {
    useDocViewerStore.getState().viewDirectory();
    context.openPanel("docs-viewer", undefined);
    context.focusPanel("docs-viewer", undefined);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { mode: "directory" },
    };
  }

  if (
    panelId === "docs-viewer" &&
    (actionId === "summarize_doc" || actionId === "summarize_section" || actionId === "explain_paper")
  ) {
    const args = asRecord(request.args) ?? {};
    const store = useDocViewerStore.getState();
    const path =
      asNonEmptyString(args.path ?? args.doc_path ?? args.target) ??
      asNonEmptyString(store.currentPath);
    const anchor = asNonEmptyString(args.anchor) ?? asNonEmptyString(store.anchor);
    const selectedText = asNonEmptyString(args.selected_text ?? args.selection_text ?? args.selection);
    if (!path) {
      return {
        ok: false,
        panel_id: panelId,
        action_id: actionId,
        message: "No active docs context to summarize/explain.",
      };
    }
    const prompt = buildDocReasoningPrompt({
      mode: actionId,
      path,
      anchor: anchor ?? undefined,
      selectedText: selectedText ?? undefined,
    });
    launchHelixAskPrompt({
      question: prompt,
      autoSubmit: true,
      panelId: "docs-viewer",
      bypassWorkstationDispatch: true,
      forceReasoningDispatch: true,
      suppressWorkstationPayloadActions: true,
      answerContract: buildDocAnswerContract(actionId),
    });
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: {
        path,
        anchor: anchor ?? null,
        selected_text: selectedText ?? null,
        launched_prompt: true,
      },
      message:
        actionId === "summarize_section"
          ? "Summarizing current section in Helix Ask."
          : actionId === "explain_paper"
            ? "Explaining current paper in Helix Ask."
            : "Summarizing current document in Helix Ask.",
    };
  }

  if (panelId === "agi-essence-console" && actionId === "open_settings") {
    const args = asRecord(request.args) ?? {};
    const tabRaw = asNonEmptyString(args.tab);
    const tab: SettingsTab = tabRaw === "knowledge" ? "knowledge" : "preferences";
    context.openSettings(tab);
    return {
      ok: true,
      panel_id: panelId,
      action_id: actionId,
      artifact: { tab },
    };
  }

  if (panelId === "workstation-notes") {
    const args = asRecord(request.args) ?? {};
    const notesState = useWorkstationNotesStore.getState();
    if (actionId === "create_note") {
      const title = asNonEmptyString(args.title ?? args.name) ?? "Untitled note";
      const topic = asNonEmptyString(args.topic) ?? title;
      const body = asNonEmptyString(args.body) ?? "";
      const explicitId = asNonEmptyString(args.note_id);
      const noteId =
        explicitId && !notesState.notes[explicitId]
          ? explicitId
          : buildDeterministicNoteId(title, Object.keys(notesState.notes));
      const note = notesState.upsertWorkflowNote({
        id: noteId,
        title,
        topic,
        body,
        citations: [],
        snippets: [],
      });
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: note.id,
          title: note.title,
          active_note_id: note.id,
          created: true,
        },
      };
    }

    if (actionId === "append_to_note") {
      const text = asNonEmptyString(args.text ?? args.content ?? args.append);
      if (!text) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-notes.append_to_note requires text.",
        };
      }
      let noteId = resolveNoteId(args, { allowActiveFallback: true });
      let created = false;
      if (!noteId) {
        const fallback = notesState.upsertWorkflowNote({
          id: buildDeterministicNoteId("Untitled note", Object.keys(notesState.notes)),
          title: "Untitled note",
          topic: "general",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = fallback.id;
        created = true;
      }
      const current = useWorkstationNotesStore.getState().notes[noteId];
      const nextBody = current?.body ? `${current.body.replace(/\s+$/g, "")}\n${text}` : text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      const updated = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: updated?.title ?? null,
          appended_text: text,
          body_length: updated?.body.length ?? nextBody.length,
          created_note: created,
        },
      };
    }

    if (actionId === "set_active_note") {
      const noteId = resolveNoteId(args);
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or note title.",
        };
      }
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      const note = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: note?.title ?? null,
          active_note_id: noteId,
        },
      };
    }

    if (actionId === "rename_note") {
      const nextTitle = asNonEmptyString(args.title ?? args.new_title ?? args.to_title ?? args.name);
      if (!nextTitle) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-notes.rename_note requires title.",
        };
      }
      const lookupArgs: Record<string, unknown> = {
        ...args,
        title: args.from_title ?? args.note_title ?? args.note_name ?? args.title ?? args.name,
      };
      const noteId = resolveNoteId(lookupArgs, { allowActiveFallback: true });
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or existing note title.",
        };
      }
      notesState.renameNote(noteId, nextTitle);
      notesState.setActiveNote(noteId);
      const renamed = useWorkstationNotesStore.getState().notes[noteId];
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          title: renamed?.title ?? nextTitle,
        },
      };
    }

    if (actionId === "delete_note") {
      const confirmationResult = requireConfirmation(
        request,
        panelId,
        actionId,
        "workstation-notes.delete_note",
      );
      if (confirmationResult) return confirmationResult;
      const noteId = resolveNoteId(args, { allowActiveFallback: true });
      if (!noteId) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "Note not found. Provide note_id or note title.",
        };
      }
      const previous = useWorkstationNotesStore.getState().notes[noteId];
      notesState.deleteNote(noteId);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          deleted_note_id: noteId,
          deleted_title: previous?.title ?? null,
          active_note_id: useWorkstationNotesStore.getState().active_note_id ?? null,
        },
      };
    }

    if (actionId === "list_notes") {
      const snapshot = useWorkstationNotesStore.getState();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          active_note_id: snapshot.active_note_id ?? null,
          count: snapshot.order.length,
          notes: snapshot.order
            .map((id) => snapshot.notes[id])
            .filter(Boolean)
            .map((note) => ({
              note_id: note.id,
              title: note.title,
              topic: note.topic,
              updated_at: note.updated_at,
            })),
        },
      };
    }
  }

  if (panelId === "workstation-clipboard-history") {
    const args = asRecord(request.args) ?? {};
    const clipboardState = useWorkstationClipboardStore.getState();
    if (actionId === "read_clipboard") {
      const latest = clipboardState.receipts[0] ?? null;
      if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        void navigator.clipboard
          .readText()
          .then((text) => {
            recordClipboardReceipt({
              direction: "read",
              text,
              source: "workstation-clipboard-history.read_clipboard",
            });
          })
          .catch(() => undefined);
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          text: latest?.text ?? "",
          receipt_id: latest?.id ?? null,
          source: latest ? "history" : "empty",
        },
      };
    }

    if (actionId === "write_clipboard") {
      const text = asNonEmptyString(args.text ?? args.content ?? args.value);
      if (!text) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "workstation-clipboard-history.write_clipboard requires text.",
        };
      }
      const source = asNonEmptyString(args.source) ?? "workstation-clipboard-history.write_clipboard";
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(text).catch(() => undefined);
      }
      recordClipboardReceipt({
        direction: "write",
        text,
        source,
      });
      const latest = useWorkstationClipboardStore.getState().receipts[0] ?? null;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          text,
          receipt_id: latest?.id ?? null,
          direction: "write",
        },
      };
    }

    if (actionId === "clear_history") {
      const confirmationResult = requireConfirmation(
        request,
        panelId,
        actionId,
        "workstation-clipboard-history.clear_history",
      );
      if (confirmationResult) return confirmationResult;
      const cleared = clipboardState.receipts.length;
      clipboardState.clearReceipts();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          cleared_count: cleared,
          remaining_count: 0,
        },
      };
    }

    if (actionId === "copy_receipt_to_clipboard") {
      const requestedReceiptId = asNonEmptyString(args.receipt_id);
      const receipt =
        (requestedReceiptId
          ? clipboardState.receipts.find((entry) => entry.id === requestedReceiptId)
          : clipboardState.receipts[0]) ?? null;
      if (!receipt) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No clipboard receipt available to copy.",
        };
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(receipt.text).catch(() => undefined);
      }
      recordClipboardReceipt({
        direction: "write",
        text: receipt.text,
        source: "workstation-clipboard-history.copy_receipt_to_clipboard",
        meta: { from_receipt_id: receipt.id },
      });
      const latest = useWorkstationClipboardStore.getState().receipts[0] ?? null;
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          from_receipt_id: receipt.id,
          to_receipt_id: latest?.id ?? null,
          text: receipt.text,
        },
      };
    }

    if (actionId === "copy_receipt_to_note") {
      const requestedReceiptId = asNonEmptyString(args.receipt_id);
      const receipt =
        (requestedReceiptId
          ? clipboardState.receipts.find((entry) => entry.id === requestedReceiptId)
          : clipboardState.receipts[0]) ?? null;
      if (!receipt) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No clipboard receipt available to append to a note.",
        };
      }
      const noteLookup: Record<string, unknown> = {
        note_id: args.note_id,
        title: args.note_title ?? args.title,
      };
      let noteId = resolveNoteId(noteLookup, { allowActiveFallback: true });
      if (!noteId) {
        const notesSnapshot = useWorkstationNotesStore.getState();
        const created = notesSnapshot.upsertWorkflowNote({
          id: buildDeterministicNoteId("Untitled note", Object.keys(notesSnapshot.notes)),
          title: "Untitled note",
          topic: "clipboard",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = created.id;
      }
      const notesState = useWorkstationNotesStore.getState();
      const current = notesState.notes[noteId];
      const nextBody = current?.body
        ? `${current.body.replace(/\s+$/g, "")}\n${receipt.text}`
        : receipt.text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          from_receipt_id: receipt.id,
          appended_text: receipt.text,
          body_length: useWorkstationNotesStore.getState().notes[noteId]?.body.length ?? nextBody.length,
        },
      };
    }

    if (actionId === "copy_selection_to_note") {
      const selectionText =
        typeof window !== "undefined" && typeof window.getSelection === "function"
          ? window.getSelection()?.toString().trim() ?? ""
          : "";
      const fallbackReceipt = clipboardState.receipts[0] ?? null;
      const text = selectionText || fallbackReceipt?.text || "";
      if (!text.trim()) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No selected text or clipboard receipt available to copy into note.",
        };
      }
      if (selectionText) {
        recordClipboardReceipt({
          direction: "copy",
          text: selectionText,
          source: "workstation-clipboard-history.copy_selection_to_note",
        });
      }
      const noteLookup: Record<string, unknown> = {
        note_id: args.note_id,
        title: args.note_title ?? args.title,
      };
      let noteId = resolveNoteId(noteLookup, { allowActiveFallback: true });
      if (!noteId) {
        const notesSnapshot = useWorkstationNotesStore.getState();
        const created = notesSnapshot.upsertWorkflowNote({
          id: buildDeterministicNoteId("Untitled note", Object.keys(notesSnapshot.notes)),
          title: "Untitled note",
          topic: "selection",
          body: "",
          citations: [],
          snippets: [],
        });
        noteId = created.id;
      }
      const notesState = useWorkstationNotesStore.getState();
      const current = notesState.notes[noteId];
      const nextBody = current?.body ? `${current.body.replace(/\s+$/g, "")}\n${text}` : text;
      notesState.updateNoteBody(noteId, nextBody);
      notesState.setActiveNote(noteId);
      context.openPanel("workstation-notes", undefined);
      context.focusPanel("workstation-notes", undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          note_id: noteId,
          appended_text: text,
          source: selectionText ? "selection" : "clipboard_receipt",
          body_length: useWorkstationNotesStore.getState().notes[noteId]?.body.length ?? nextBody.length,
        },
      };
    }
  }

  if (panelId === "scientific-calculator") {
    const args = asRecord(request.args) ?? {};
    const scientificState = useScientificCalculatorStore.getState();

    if (actionId === "ingest_latex") {
      const rawLatex = asNonEmptyString(args.latex ?? args.expression ?? args.text);
      let latex = rawLatex;
      if (rawLatex === "$clipboard" && typeof navigator !== "undefined" && navigator.clipboard?.readText) {
        // Non-blocking clipboard fallback for deterministic action calls.
        void navigator.clipboard.readText().then((clipboardText) => {
          const trimmed = clipboardText.trim();
          if (!trimmed) return;
          scientificState.ingestLatex(trimmed, {
            sourcePath: "clipboard",
            anchor: null,
          });
          dispatchScientificCalculatorMathPicked({
            latex: trimmed,
            sourcePath: "clipboard",
          });
        });
      }
      if (!latex || latex === "$clipboard") {
        return {
          ok: rawLatex === "$clipboard",
          panel_id: panelId,
          action_id: actionId,
          message:
            rawLatex === "$clipboard"
              ? "Attempting clipboard ingest for scientific-calculator."
              : "scientific-calculator.ingest_latex requires latex.",
        };
      }
      const sourcePath = asNonEmptyString(args.source_path ?? args.path ?? args.source);
      const anchor = asNonEmptyString(args.anchor);
      const entry = scientificState.ingestLatex(latex, {
        sourcePath,
        anchor,
      });
      dispatchScientificCalculatorMathPicked({
        latex: entry.latex,
        sourcePath: entry.sourcePath,
        anchor: entry.anchor,
      });
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          latex: entry.latex,
          source_path: entry.sourcePath,
          anchor: entry.anchor,
          history_id: entry.id,
        },
      };
    }

    if (actionId === "solve_expression" || actionId === "solve_with_steps") {
      const latexArg = asNonEmptyString(args.latex ?? args.expression ?? args.text);
      const latex = latexArg ?? scientificState.currentLatex;
      if (!latex.trim()) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No calculator input available to solve.",
        };
      }
      if (latexArg) {
        scientificState.ingestLatex(latexArg, {
          sourcePath: asNonEmptyString(args.source_path ?? args.path ?? args.source),
          anchor: asNonEmptyString(args.anchor),
        });
      }
      const solveResult = runScientificSolve(latex, actionId === "solve_with_steps");
      scientificState.setSolveResult(solveResult);
      context.openPanel(panelId, undefined);
      context.focusPanel(panelId, undefined);
      return {
        ok: solveResult.ok,
        panel_id: panelId,
        action_id: actionId,
        message: solveResult.ok ? undefined : solveResult.error ?? "Solve failed.",
        artifact: {
          mode: solveResult.mode,
          normalized_expression: solveResult.normalized_expression,
          result_text: solveResult.result_text,
          variable: solveResult.variable,
          steps_count: solveResult.steps.length,
          error: solveResult.error ?? null,
        },
      };
    }

    if (actionId === "copy_result") {
      const resultText = scientificState.lastSolve?.result_text?.trim();
      if (!resultText) {
        return {
          ok: false,
          panel_id: panelId,
          action_id: actionId,
          message: "No calculator result available to copy.",
        };
      }
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        void navigator.clipboard.writeText(resultText).catch(() => undefined);
      }
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          copied: true,
          text: resultText,
        },
      };
    }

    if (actionId === "clear_workspace") {
      scientificState.clear();
      return {
        ok: true,
        panel_id: panelId,
        action_id: actionId,
        artifact: {
          cleared: true,
        },
      };
    }
  }

  if (!getPanelDef(panelId)) {
    return {
      ok: false,
      panel_id: panelId,
      action_id: actionId,
      message: `Unknown panel: ${panelId}`,
    };
  }

  return {
    ok: false,
    panel_id: panelId,
    action_id: actionId,
    message: `Action not supported for panel: ${panelId}.${actionId}`,
  };
}

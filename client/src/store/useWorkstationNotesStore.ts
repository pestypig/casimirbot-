import { create } from "zustand";
import { persist } from "zustand/middleware";
import { recordWorkstationTimelineEntry } from "@/store/useWorkstationWorkflowTimelineStore";

const WORKSTATION_NOTES_STORAGE_KEY = "workstation-notes:v1";

export type WorkstationNoteCitation = {
  id: string;
  path: string;
  heading: string;
  start_offset: number;
  end_offset: number;
};

export type WorkstationNoteSnippet = {
  id: string;
  citation_id: string;
  excerpt: string;
};

export type WorkstationNote = {
  id: string;
  title: string;
  topic: string;
  body: string;
  citations: WorkstationNoteCitation[];
  snippets: WorkstationNoteSnippet[];
  created_at: string;
  updated_at: string;
  trace_id?: string;
};

type WorkstationNotesState = {
  notes: Record<string, WorkstationNote>;
  order: string[];
  active_note_id?: string;
  upsertWorkflowNote: (input: {
    id: string;
    title: string;
    topic: string;
    body: string;
    citations: WorkstationNoteCitation[];
    snippets: WorkstationNoteSnippet[];
    trace_id?: string;
  }) => WorkstationNote;
  setActiveNote: (noteId: string) => void;
  updateNoteBody: (noteId: string, body: string) => void;
  renameNote: (noteId: string, title: string) => void;
  deleteNote: (noteId: string) => void;
};

export const useWorkstationNotesStore = create<WorkstationNotesState>()(
  persist(
    (set, get) => ({
      notes: {},
      order: [],
      active_note_id: undefined,
      upsertWorkflowNote: (input) => {
        const nowIso = new Date().toISOString();
        const prev = get().notes[input.id];
        const note: WorkstationNote = {
          id: input.id,
          title: input.title.trim() || "Untitled note",
          topic: input.topic.trim() || "topic",
          body: input.body,
          citations: input.citations,
          snippets: input.snippets,
          created_at: prev?.created_at ?? nowIso,
          updated_at: nowIso,
          trace_id: input.trace_id ?? prev?.trace_id,
        };
        set((state) => ({
          notes: { ...state.notes, [note.id]: note },
          order: [note.id, ...state.order.filter((entry) => entry !== note.id)],
          active_note_id: note.id,
        }));
        recordWorkstationTimelineEntry({
          lane: "notes",
          label: `Saved note "${note.title}"`,
          detail: `topic=${note.topic} snippets=${note.snippets.length} citations=${note.citations.length}`,
          traceId: note.trace_id,
          panelId: "workstation-notes",
        });
        return note;
      },
      setActiveNote: (noteId) =>
        set((state) => ({
          active_note_id: state.notes[noteId] ? noteId : state.active_note_id,
        })),
      updateNoteBody: (noteId, body) =>
        set((state) => {
          const current = state.notes[noteId];
          if (!current) return state;
          return {
            notes: {
              ...state.notes,
              [noteId]: {
                ...current,
                body,
                updated_at: new Date().toISOString(),
              },
            },
          };
        }),
      renameNote: (noteId, title) =>
        set((state) => {
          const current = state.notes[noteId];
          if (!current) return state;
          return {
            notes: {
              ...state.notes,
              [noteId]: {
                ...current,
                title: title.trim() || current.title,
                updated_at: new Date().toISOString(),
              },
            },
          };
        }),
      deleteNote: (noteId) =>
        set((state) => {
          if (!state.notes[noteId]) return state;
          const nextNotes = { ...state.notes };
          delete nextNotes[noteId];
          const nextOrder = state.order.filter((entry) => entry !== noteId);
          const nextActive =
            state.active_note_id === noteId ? (nextOrder[0] ?? undefined) : state.active_note_id;
          return {
            notes: nextNotes,
            order: nextOrder,
            active_note_id: nextActive,
          };
        }),
    }),
    {
      name: WORKSTATION_NOTES_STORAGE_KEY,
      partialize: (state) => ({
        notes: state.notes,
        order: state.order,
        active_note_id: state.active_note_id,
      }),
    },
  ),
);

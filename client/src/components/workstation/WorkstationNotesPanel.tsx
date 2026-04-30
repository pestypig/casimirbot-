import React from "react";
import { ArrowLeft, FileText, Trash2 } from "lucide-react";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";
import { cn } from "@/lib/utils";

function formatWhen(value: string): string {
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return value;
  return new Date(ts).toLocaleString();
}

export default function WorkstationNotesPanel() {
  const notes = useWorkstationNotesStore((state) => state.notes);
  const order = useWorkstationNotesStore((state) => state.order);
  const activeNoteId = useWorkstationNotesStore((state) => state.active_note_id);
  const setActiveNote = useWorkstationNotesStore((state) => state.setActiveNote);
  const updateBody = useWorkstationNotesStore((state) => state.updateNoteBody);
  const renameNote = useWorkstationNotesStore((state) => state.renameNote);
  const deleteNote = useWorkstationNotesStore((state) => state.deleteNote);
  const [viewMode, setViewMode] = React.useState<"list" | "reader">("list");
  const noteRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const lastActiveNoteIdRef = React.useRef(activeNoteId);

  const noteList = React.useMemo(
    () => order.map((id) => notes[id]).filter(Boolean),
    [notes, order],
  );
  const activeNote = activeNoteId ? notes[activeNoteId] : undefined;

  React.useEffect(() => {
    if (!activeNoteId || lastActiveNoteIdRef.current === activeNoteId) return;
    lastActiveNoteIdRef.current = activeNoteId;
    setViewMode("reader");
  }, [activeNoteId]);

  React.useEffect(() => {
    if (activeNoteId) return;
    setViewMode("list");
  }, [activeNoteId]);

  React.useEffect(() => {
    if (viewMode !== "list" || !activeNoteId) return;
    const target = noteRefs.current[activeNoteId];
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeNoteId, noteList, viewMode]);

  const handleSelectNote = React.useCallback(
    (noteId: string) => {
      setActiveNote(noteId);
      setViewMode("reader");
    },
    [setActiveNote],
  );

  const handleDeleteNote = React.useCallback(
    (noteId: string) => {
      deleteNote(noteId);
      setViewMode("list");
    },
    [deleteNote],
  );

  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden bg-slate-950/90 text-slate-100">
      {viewMode === "list" ? (
        <section className="flex h-full min-h-0 w-full flex-col bg-slate-950/60">
          <div className="border-b border-white/10 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <FileText className="h-4 w-4 text-cyan-300" />
              Workstation Notes
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Showing {noteList.length} {noteList.length === 1 ? "note" : "notes"}.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            {noteList.length === 0 ? (
              <p className="text-xs text-slate-400">No notes yet. Run an observable workflow to create one.</p>
            ) : (
              <div className="space-y-1.5">
                {noteList.map((note) => {
                  const selected = note.id === activeNoteId;
                  return (
                    <button
                      key={note.id}
                      ref={(node) => {
                        noteRefs.current[note.id] = node;
                      }}
                      type="button"
                      onClick={() => handleSelectNote(note.id)}
                      className={cn(
                        "w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                        selected
                          ? "bg-cyan-500/20 text-white ring-1 ring-cyan-500/60"
                          : "text-slate-200 hover:bg-white/5",
                      )}
                    >
                      <p className="break-words text-sm font-medium leading-tight">{note.title}</p>
                      <p className="mt-1 break-words text-[11px] text-slate-400">{note.topic}</p>
                      <p className="mt-1 text-[10px] text-slate-500">{formatWhen(note.updated_at)}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="flex min-h-0 flex-1 flex-col">
          {!activeNote ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-slate-400">
              <p>Select a note from the list to open the reader.</p>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="rounded border border-white/15 bg-black/25 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/10"
              >
                Back to notes
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  aria-label="Back to workstation notes"
                  className="h-9 w-9 shrink-0 rounded-full border border-white/10 text-slate-100 hover:bg-white/10 hover:text-cyan-100"
                >
                  <ArrowLeft className="mx-auto h-4 w-4" />
                </button>
                <input
                  value={activeNote.title}
                  onChange={(event) => renameNote(activeNote.id, event.target.value)}
                  className="min-w-0 flex-1 rounded border border-white/20 bg-slate-900 px-2 py-1 text-sm text-slate-100"
                />
                <button
                  type="button"
                  onClick={() => handleDeleteNote(activeNote.id)}
                  className="inline-flex items-center gap-1 rounded border border-rose-400/40 bg-rose-500/10 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 lg:grid-cols-[1fr_320px]">
                <div className="min-h-0 border-b border-white/10 lg:border-b-0 lg:border-r lg:border-white/10">
                  <textarea
                    value={activeNote.body}
                    onChange={(event) => updateBody(activeNote.id, event.target.value)}
                    className="h-full min-h-[260px] w-full resize-none bg-slate-950 p-3 text-sm leading-6 text-slate-100 outline-none"
                  />
                </div>
                <div className="min-h-0 overflow-auto p-3 text-xs text-slate-300">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Citations</p>
                  <div className="mt-2 space-y-2">
                    {activeNote.citations.length === 0 ? (
                      <p className="text-slate-500">No citations recorded.</p>
                    ) : (
                      activeNote.citations.map((citation) => (
                        <div key={citation.id} className="rounded border border-white/10 bg-black/20 p-2">
                          <p className="font-medium text-slate-100">{citation.heading}</p>
                          <p className="mt-1 break-all text-[11px] text-slate-400">{citation.path}</p>
                          <p className="mt-1 text-[10px] text-slate-500">
                            offsets {citation.start_offset}-{citation.end_offset}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

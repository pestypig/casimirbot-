import React from "react";
import { FileText, Trash2 } from "lucide-react";
import { useWorkstationNotesStore } from "@/store/useWorkstationNotesStore";

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

  const noteList = order.map((id) => notes[id]).filter(Boolean);
  const activeNote = activeNoteId ? notes[activeNoteId] : noteList[0];

  return (
    <div className="flex h-full min-h-0 w-full bg-slate-950 text-slate-100">
      <aside className="w-72 shrink-0 border-r border-white/10">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2 text-sm font-semibold">
          <FileText className="h-4 w-4" />
          Workstation Notes
        </div>
        <div className="h-[calc(100%-40px)] overflow-auto">
          {noteList.length === 0 ? (
            <p className="p-3 text-xs text-slate-400">No notes yet. Run an observable workflow to create one.</p>
          ) : (
            noteList.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => setActiveNote(note.id)}
                className={`w-full border-b border-white/5 px-3 py-2 text-left text-xs ${
                  note.id === activeNote?.id ? "bg-sky-500/20" : "hover:bg-white/5"
                }`}
              >
                <p className="font-medium text-slate-100">{note.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{note.topic}</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{formatWhen(note.updated_at)}</p>
              </button>
            ))
          )}
        </div>
      </aside>
      <section className="flex min-h-0 flex-1 flex-col">
        {!activeNote ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">Select a note.</div>
        ) : (
          <>
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <input
                value={activeNote.title}
                onChange={(event) => renameNote(activeNote.id, event.target.value)}
                className="min-w-0 flex-1 rounded border border-white/20 bg-slate-900 px-2 py-1 text-sm text-slate-100"
              />
              <button
                type="button"
                onClick={() => deleteNote(activeNote.id)}
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
    </div>
  );
}

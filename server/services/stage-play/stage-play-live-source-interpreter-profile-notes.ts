import crypto from "node:crypto";
import {
  buildStagePlayLiveSourceInterpreterProfileV1,
  type StagePlayLiveSourceInterpreterProfileTextStyleV1,
  type StagePlayLiveSourceInterpreterProfileV1,
  type StagePlayLiveSourceInterpreterProfileVoiceStyleV1,
  validateStagePlayLiveSourceInterpreterProfileV1,
} from "@shared/contracts/stage-play-live-source-interpreter-profile.v1";
import {
  getStagePlayLiveSourceInterpreterProfile,
  linkInterpreterProfileNote,
  recordStagePlayLiveSourceInterpreterProfile,
} from "./stage-play-live-source-interpreter-profile-store";

export type StagePlayLiveSourceInterpreterProfileNoteV1 = {
  artifactId: "stage_play_live_source_interpreter_profile_note";
  schemaVersion: "stage_play_live_source_interpreter_profile_note/v1";
  noteId: string;
  profileId: string;
  title: string;
  body: string;
  source: "profile_template" | "user_edit" | "compiled_profile";
  compileStatus: "draft" | "compiled" | "compile_failed";
  lastCompiledProfileRef?: string | null;
  compileIssues: string[];
  createdAt: string;
  updatedAt: string;
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

export type CompileInterpreterProfileFromNoteResult = {
  ok: boolean;
  note: StagePlayLiveSourceInterpreterProfileNoteV1;
  profile: StagePlayLiveSourceInterpreterProfileV1 | null;
  issues: string[];
  assistant_answer: false;
  terminal_eligible: false;
  context_role: "tool_evidence";
  raw_content_included: false;
};

const notesById = new Map<string, StagePlayLiveSourceInterpreterProfileNoteV1>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const normalizeText = (value: string | null | undefined): string =>
  String(value ?? "").replace(/\r\n/g, "\n").trim();

const bulletList = (items: string[]): string =>
  items.length > 0 ? items.map((item) => `- ${item}`).join("\n") : "- none";

const parseBulletList = (value: string | null | undefined): string[] =>
  normalizeText(value)
    .split("\n")
    .map((line) => line.replace(/^\s*[-*]\s+/, "").trim())
    .filter((line) => line && line.toLowerCase() !== "none");

const outputStyleLabel = (style: StagePlayLiveSourceInterpreterProfileTextStyleV1 | StagePlayLiveSourceInterpreterProfileVoiceStyleV1): string =>
  style.replace(/_/g, " ");

const textStyleFromLabel = (value: string | null | undefined): StagePlayLiveSourceInterpreterProfileTextStyleV1 => {
  const normalized = normalizeText(value).toLowerCase().replace(/\s+/g, "_");
  return normalized === "one_sentence" || normalized === "brief_explanation" || normalized === "structured"
    ? normalized
    : "brief_explanation";
};

const voiceStyleFromLabel = (value: string | null | undefined): StagePlayLiveSourceInterpreterProfileVoiceStyleV1 => {
  const normalized = normalizeText(value).toLowerCase().replace(/\s+/g, "_");
  return normalized === "short_callout" || normalized === "coach" || normalized === "warning_only"
    ? normalized
    : "short_callout";
};

export function buildInterpreterProfileNoteBody(profile: StagePlayLiveSourceInterpreterProfileV1): string {
  return [
    `# ${profile.title}`,
    "",
    "## Objective",
    profile.objectiveText,
    "",
    "## Interpretation Guidelines",
    profile.interpretationGuidelines,
    "",
    "## Salience Criteria",
    bulletList(profile.salienceCriteria),
    "",
    "## Suppress Criteria",
    bulletList(profile.suppressCriteria),
    "",
    "## Risk Criteria",
    bulletList(profile.riskCriteria),
    "",
    "## Opportunity Criteria",
    bulletList(profile.opportunityCriteria),
    "",
    "## Voice Callout Criteria",
    bulletList(profile.voiceCalloutCriteria),
    "",
    "## Output Style",
    `Text: ${outputStyleLabel(profile.outputStyle.textAnswerStyle)}`,
    `Voice: ${outputStyleLabel(profile.outputStyle.voiceStyle)}`,
  ].join("\n");
}

const parseSections = (body: string): {
  title: string | null;
  sections: Record<string, string>;
} => {
  const lines = normalizeText(body).split("\n");
  let title: string | null = null;
  const sections: Record<string, string[]> = {};
  let current: string | null = null;
  for (const line of lines) {
    const titleMatch = line.match(/^#\s+(.+)$/);
    if (titleMatch && !line.startsWith("##")) {
      title = titleMatch[1]?.trim() || title;
      current = null;
      continue;
    }
    const sectionMatch = line.match(/^##\s+(.+)$/);
    if (sectionMatch) {
      current = sectionMatch[1]?.trim().toLowerCase() ?? null;
      if (current) sections[current] = [];
      continue;
    }
    if (current) sections[current]?.push(line);
  }
  return {
    title,
    sections: Object.fromEntries(
      Object.entries(sections).map(([key, value]) => [key, normalizeText(value.join("\n"))]),
    ),
  };
};

const parseOutputStyle = (value: string | null | undefined): {
  textAnswerStyle: StagePlayLiveSourceInterpreterProfileTextStyleV1;
  voiceStyle: StagePlayLiveSourceInterpreterProfileVoiceStyleV1;
} => {
  const lines = normalizeText(value).split("\n");
  const text = lines.find((line) => /^text\s*:/i.test(line))?.replace(/^text\s*:/i, "").trim();
  const voice = lines.find((line) => /^voice\s*:/i.test(line))?.replace(/^voice\s*:/i, "").trim();
  return {
    textAnswerStyle: textStyleFromLabel(text),
    voiceStyle: voiceStyleFromLabel(voice),
  };
};

export function createInterpreterProfileNote(input: {
  profileId: string;
  noteId?: string | null;
  title?: string | null;
  now?: string;
}): StagePlayLiveSourceInterpreterProfileNoteV1 {
  const profile = getStagePlayLiveSourceInterpreterProfile(input.profileId);
  if (!profile) throw new Error(`Interpreter profile not found: ${input.profileId}`);
  const now = input.now ?? new Date().toISOString();
  const noteId = input.noteId?.trim() || profile.linkedNoteId || `note:interpreter_profile:${hashShort([profile.profileId, profile.title])}`;
  const title = input.title?.trim() || profile.linkedNoteTitle || `${profile.title} Guidelines`;
  const note: StagePlayLiveSourceInterpreterProfileNoteV1 = {
    artifactId: "stage_play_live_source_interpreter_profile_note",
    schemaVersion: "stage_play_live_source_interpreter_profile_note/v1",
    noteId,
    profileId: profile.profileId,
    title,
    body: buildInterpreterProfileNoteBody(profile),
    source: "profile_template",
    compileStatus: "draft",
    lastCompiledProfileRef: null,
    compileIssues: [],
    createdAt: now,
    updatedAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
  notesById.set(note.noteId, note);
  linkInterpreterProfileNote({
    profileId: profile.profileId,
    linkedNoteId: note.noteId,
    linkedNoteTitle: note.title,
    updatedAt: now,
  });
  return note;
}

export function openInterpreterProfileNote(input: {
  noteId?: string | null;
  profileId?: string | null;
}): StagePlayLiveSourceInterpreterProfileNoteV1 | null {
  if (input.noteId) return notesById.get(input.noteId) ?? null;
  const profile = input.profileId ? getStagePlayLiveSourceInterpreterProfile(input.profileId) : null;
  if (!profile?.linkedNoteId) return null;
  return notesById.get(profile.linkedNoteId) ?? null;
}

export function syncInterpreterProfileNote(input: {
  noteId: string;
  title?: string | null;
  body?: string | null;
  updatedAt?: string;
}): StagePlayLiveSourceInterpreterProfileNoteV1 | null {
  const current = notesById.get(input.noteId);
  if (!current) return null;
  const updated: StagePlayLiveSourceInterpreterProfileNoteV1 = {
    ...current,
    title: input.title?.trim() || current.title,
    body: input.body == null ? current.body : normalizeText(input.body),
    source: "user_edit",
    compileStatus: "draft",
    compileIssues: [],
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
  notesById.set(updated.noteId, updated);
  linkInterpreterProfileNote({
    profileId: updated.profileId,
    linkedNoteId: updated.noteId,
    linkedNoteTitle: updated.title,
    updatedAt: updated.updatedAt,
  });
  return updated;
}

export function compileInterpreterProfileFromNote(input: {
  noteId: string;
  updatedAt?: string;
}): CompileInterpreterProfileFromNoteResult {
  const note = notesById.get(input.noteId);
  if (!note) {
    return {
      ok: false,
      note: {
        artifactId: "stage_play_live_source_interpreter_profile_note",
        schemaVersion: "stage_play_live_source_interpreter_profile_note/v1",
        noteId: input.noteId,
        profileId: "",
        title: "",
        body: "",
        source: "user_edit",
        compileStatus: "compile_failed",
        lastCompiledProfileRef: null,
        compileIssues: [`Interpreter profile note not found: ${input.noteId}`],
        createdAt: input.updatedAt ?? new Date().toISOString(),
        updatedAt: input.updatedAt ?? new Date().toISOString(),
        assistant_answer: false,
        terminal_eligible: false,
        context_role: "tool_evidence",
        raw_content_included: false,
      },
      profile: null,
      issues: [`Interpreter profile note not found: ${input.noteId}`],
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    };
  }
  const currentProfile = getStagePlayLiveSourceInterpreterProfile(note.profileId);
  const now = input.updatedAt ?? new Date().toISOString();
  const issues: string[] = [];
  if (!currentProfile) issues.push(`Interpreter profile not found: ${note.profileId}`);
  const parsed = parseSections(note.body);
  const objectiveText = parsed.sections.objective || currentProfile?.objectiveText || "";
  const interpretationGuidelines = parsed.sections["interpretation guidelines"] || currentProfile?.interpretationGuidelines || "";
  if (!objectiveText) issues.push("Objective section is required");
  if (!interpretationGuidelines) issues.push("Interpretation Guidelines section is required");
  if (!currentProfile || issues.length > 0) {
    const failedNote: StagePlayLiveSourceInterpreterProfileNoteV1 = {
      ...note,
      compileStatus: "compile_failed",
      compileIssues: issues,
      updatedAt: now,
    };
    notesById.set(failedNote.noteId, failedNote);
    return {
      ok: false,
      note: failedNote,
      profile: null,
      issues,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    };
  }
  const outputStyle = parseOutputStyle(parsed.sections["output style"]);
  const compiled = buildStagePlayLiveSourceInterpreterProfileV1({
    ...currentProfile,
    title: parsed.title || currentProfile.title,
    objectiveText,
    interpretationGuidelines,
    salienceCriteria: parseBulletList(parsed.sections["salience criteria"]),
    suppressCriteria: parseBulletList(parsed.sections["suppress criteria"]),
    riskCriteria: parseBulletList(parsed.sections["risk criteria"]),
    opportunityCriteria: parseBulletList(parsed.sections["opportunity criteria"]),
    voiceCalloutCriteria: parseBulletList(parsed.sections["voice callout criteria"]),
    outputStyle,
    linkedNoteId: note.noteId,
    linkedNoteTitle: note.title,
    evidenceRefs: uniqueStrings([...currentProfile.evidenceRefs, note.noteId]),
    updatedAt: now,
  });
  const validationIssues = validateStagePlayLiveSourceInterpreterProfileV1(compiled);
  if (validationIssues.length > 0) {
    const failedNote: StagePlayLiveSourceInterpreterProfileNoteV1 = {
      ...note,
      compileStatus: "compile_failed",
      compileIssues: validationIssues,
      updatedAt: now,
    };
    notesById.set(failedNote.noteId, failedNote);
    return {
      ok: false,
      note: failedNote,
      profile: null,
      issues: validationIssues,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_evidence",
      raw_content_included: false,
    };
  }
  const profile = recordStagePlayLiveSourceInterpreterProfile(compiled);
  const compiledNote: StagePlayLiveSourceInterpreterProfileNoteV1 = {
    ...note,
    title: parsed.title ? `${parsed.title} Guidelines` : note.title,
    source: "compiled_profile",
    compileStatus: "compiled",
    lastCompiledProfileRef: profile.profileId,
    compileIssues: [],
    updatedAt: now,
  };
  notesById.set(compiledNote.noteId, compiledNote);
  linkInterpreterProfileNote({
    profileId: profile.profileId,
    linkedNoteId: compiledNote.noteId,
    linkedNoteTitle: compiledNote.title,
    updatedAt: now,
  });
  return {
    ok: true,
    note: compiledNote,
    profile,
    issues: [],
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_evidence",
    raw_content_included: false,
  };
}

export function resetStagePlayLiveSourceInterpreterProfileNotesForTest(): void {
  notesById.clear();
}

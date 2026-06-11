import crypto from "node:crypto";
import { detectContextualToolAdmissionSuppression } from "./contextual-tool-admission";

export type HelixContextualToolMentionReason =
  | "negated"
  | "future"
  | "historical"
  | "conditional"
  | "quoted"
  | "screen_visible_text"
  | "status_question"
  | "background_context";

export type HelixPromptInterpretation = {
  schema: "helix.prompt_interpretation.v1";
  prompt_hash: string;
  user_task_summary: string;
  requested_output: string;
  explicit_constraints: string[];
  negative_constraints: string[];
  contextual_tool_mentions: Array<{
    text: string;
    verb_or_cue: string;
    reason: HelixContextualToolMentionReason;
  }>;
  executable_operator_commands: Array<{
    text: string;
    action_family: string;
    confidence: number;
    reason: string;
  }>;
  content_question_detected: boolean;
  control_command_detected: boolean;
  status_question_detected: boolean;
  debug_or_history_question_detected: boolean;
  implementation_question_detected: boolean;
  ambiguity_notes: string[];
  compound_contract?: HelixCompoundPromptContract;
  assistant_answer: false;
  raw_content_included: false;
};

export type HelixCompoundPromptContract = {
  schema: "helix.compound_prompt_contract.v1";
  root_prompt_id: string;
  raw_prompt_hash: string;
  raw_prompt_chars: number;
  root_objective: string;
  requirements: Array<{
    id: string;
    text: string;
    span?: { start: number; end: number };
    kind:
      | "question"
      | "instruction"
      | "constraint"
      | "comparison"
      | "implementation_request"
      | "diagnostic_request"
      | "output_format";
    required: boolean;
    depends_on: string[];
    status: "pending" | "answered" | "blocked" | "not_applicable";
  }>;
  global_constraints: string[];
  negative_constraints: string[];
  evidence_requirements: string[];
  output_contract: {
    requested_format?: string;
    must_include_coverage_ledger: boolean;
    allow_partial_answer: boolean;
  };
  assistant_answer: false;
  raw_content_included: false;
};

type ContextualRule = {
  verb_or_cue: string;
  reason: HelixContextualToolMentionReason;
  pattern: RegExp;
};

type CommandRule = {
  action_family: string;
  pattern: RegExp;
  confidence: number;
  reason: string;
};

const hashShort = (value: unknown): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 16);

const uniqueBy = <T>(entries: T[], keyFor: (entry: T) => string): T[] => {
  const seen = new Set<string>();
  const output: T[] = [];
  for (const entry of entries) {
    const key = keyFor(entry);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(entry);
  }
  return output;
};

const matchTexts = (promptText: string, patterns: RegExp[]): string[] =>
  uniqueBy(
    patterns
      .map((pattern) => promptText.match(pattern)?.[0]?.trim() ?? "")
      .filter(Boolean),
    (entry) => entry.toLowerCase(),
  );

const hasAny = (promptText: string, patterns: RegExp[]): boolean =>
  patterns.some((pattern) => pattern.test(promptText));

const contentQuestionPatterns = [
  /\b(?:review|explain|describe|summari[sz]e|compare|what(?:'s|\s+is)?|what\s+changed|look\s+at|see|seeing)\b[\s\S]{0,140}\b(?:screen|screenshot|capture|visual|frame|window|tab|image|picture)\b/i,
  /\b(?:screen|screenshot|capture|visual|frame|window|tab|image|picture)\b[\s\S]{0,140}\b(?:show|shows|showing|seeing|visible|happening|changed)\b/i,
  /\b(?:text|label|page)\b[\s\S]{0,80}\b(?:says|shows|reads|contains|imply|implies)\b/i,
];

const statusQuestionPatterns = [
  /\b(?:was|is|are|were|whether|tell\s+me\s+whether|can\s+you\s+tell)\b[\s\S]{0,80}\b(?:capture|interval|cadence|rate|pipeline|source|producer|click|run|repair|refresh)\b[\s\S]{0,80}\b(?:running|accepted|active|started|stopped|called|refreshed|complete|done)?\b/i,
  /\btell\s+me\s+whether\b[\s\S]{0,80}\b(?:it|that|this|the\s+action|the\s+click|the\s+change)\b[\s\S]{0,40}\b(?:was\s+)?(?:accepted|complete|done|started|running)\b/i,
  /\b(?:capture|interval|cadence|rate|pipeline|source|producer)\b[\s\S]{0,80}\b(?:running|active|stale|bound|adopted)\?/i,
];

const debugOrHistoryPatterns = [
  /\b(?:why\s+did|why\s+was|what\s+called|last\s+turn|previous\s+(?:turn|answer)|histor(?:y|ical)|debug|trace|tool\s+call|set_rate)\b/i,
];

const implementationPatterns = [
  /\b(?:implementation|code|repo|repository|source\s+file|where\s+(?:is|was).*(?:enforced|defined)|function|module)\b/i,
];

const negativeConstraintPatterns = [
  /\bopen\s+nothing\b/i,
  /\brun\s+nothing\b/i,
  /\bwithout\s+click(?:ing)?\b/i,
  /\bwithout\s+run(?:ning)?\b/i,
  /\bwithout\s+(?:pressing|starting|changing|executing)\b/i,
  /\b(?:open|run|click|start|stop|set|change|update|repair|refresh)\s+nothing\b/i,
  /\b(?:do\s+not|don't|without|never)\b[\s\S]{0,80}\b(?:open|run|click|start|stop|set|change|update|repair|refresh|call|execute|write|create|modify|mutate)\b/i,
  /\b(?:haven't|have not|didn't|did not|not)\b[\s\S]{0,80}\b(?:started|run|opened|clicked|set|changed|updated|called|executed)\b/i,
];

const contextualRules: ContextualRule[] = [
  {
    verb_or_cue: "interval_cadence",
    reason: "negated",
    pattern: /\b(?:haven't|have not|didn't|did not|not)\b[\s\S]{0,90}\b(?:started|set|changed|updated)?\b[\s\S]{0,40}\b(?:interval|cadence|rate|every\s+\d{1,3}\s*(?:seconds?|sec|s)?)\b/i,
  },
  {
    verb_or_cue: "click",
    reason: "future",
    pattern: /\b(?:before\s+i|without)\b[\s\S]{0,60}\bclick(?:ed|ing)?\b[\s\S]{0,40}\b(?:start|button|it|that)?\b/i,
  },
  {
    verb_or_cue: "click",
    reason: "negated",
    pattern: /\b(?:did\s+not|didn't|not)\b[\s\S]{0,40}\bclick(?:ed|ing)?\b[\s\S]{0,40}\b(?:start|button|it|that)?\b/i,
  },
  {
    verb_or_cue: "start",
    reason: "screen_visible_text",
    pattern: /\b(?:screen|capture|frame|window|tab)\b[\s\S]{0,80}\b(?:shows|says|displays|contains|visible|labeled|labelled)\b[\s\S]{0,60}\bstart(?:\s+button)?\b/i,
  },
  {
    verb_or_cue: "refresh",
    reason: "historical",
    pattern: /\bafter\b[\s\S]{0,70}\b(?:source|capture|screen|producer|pipeline)\b[\s\S]{0,40}\brefresh(?:ed|ing)?\b/i,
  },
  {
    verb_or_cue: "run_repair",
    reason: "conditional",
    pattern: /\bif\b[\s\S]{0,40}\b(?:we|i|you)?\b[\s\S]{0,40}\b(?:later\s+)?run\b[\s\S]{0,30}\brepair\b/i,
  },
  {
    verb_or_cue: "capture",
    reason: "status_question",
    pattern: /\b(?:was|is|whether|think)\b[\s\S]{0,80}\bcapture\b[\s\S]{0,60}\b(?:running|stale|fresh|active)\b/i,
  },
  {
    verb_or_cue: "set_rate",
    reason: "historical",
    pattern: /\b(?:why\s+did|last\s+turn|previous\s+(?:turn|answer)|what\s+called)\b[\s\S]{0,100}\bset_rate\b/i,
  },
  {
    verb_or_cue: "quoted_tool_text",
    reason: "quoted",
    pattern: /["'`][^"'`]*(?:click|open|start|run|repair|refresh|set_rate|interval|cadence)[^"'`]*["'`]/i,
  },
  {
    verb_or_cue: "open_run",
    reason: "negated",
    pattern: /\b(?:open|run)\s+nothing\b/i,
  },
  {
    verb_or_cue: "repair",
    reason: "negated",
    pattern: /\b(?:do\s+not|don't|without|never)\b[\s\S]{0,50}\brepair\b/i,
  },
  {
    verb_or_cue: "repair",
    reason: "historical",
    pattern: /\b(?:last\s+turn|previous\s+(?:turn|answer)|mentioned)\b[\s\S]{0,80}\brepair\s+tool\b/i,
  },
];

const commandRules: CommandRule[] = [
  {
    action_family: "live_pipeline.set_rate",
    pattern: /\b(?:set|change|update)\b[\s\S]{0,60}\b(?:visual\s+capture\s+)?(?:interval|cadence|rate)\b[\s\S]{0,60}\b(?:\d{1,3}\s*(?:seconds?|sec|s)|every\s+\d{1,3})\b/i,
    confidence: 0.91,
    reason: "affirmative visual capture cadence command",
  },
  {
    action_family: "workstation_action.click",
    pattern: /\bclick\b[\s\S]{0,50}\b(?:start|button|panel|tab)\b/i,
    confidence: 0.88,
    reason: "affirmative workstation click command",
  },
  {
    action_family: "live_pipeline.repair",
    pattern: /\b(?:fix|repair|recover)\b[\s\S]{0,80}\b(?:live\s+)?(?:screen|visual|capture|frame|source|producer)\b/i,
    confidence: 0.82,
    reason: "affirmative live source repair command",
  },
];

const contextualMentionOverlapsCommand = (
  commandText: string,
  mentions: HelixPromptInterpretation["contextual_tool_mentions"],
): boolean => {
  const normalized = commandText.toLowerCase();
  return mentions.some((mention) => {
    const cue = mention.verb_or_cue.toLowerCase();
    return normalized.includes(cue) ||
      (cue === "interval_cadence" && /\b(?:interval|cadence|rate|every\s+\d)/i.test(commandText)) ||
      (cue === "open_run" && /\b(?:open|run)\b/i.test(commandText));
  });
};

const summarizeTask = (input: {
  content: boolean;
  control: boolean;
  status: boolean;
  debug: boolean;
  implementation: boolean;
}): string => {
  if (input.control && !input.content && !input.status && !input.debug) return "Execute an explicit operator command.";
  if (input.content) return "Answer the user's content question.";
  if (input.status) return "Answer the user's status question.";
  if (input.debug) return "Explain historical or debug behavior.";
  if (input.implementation) return "Answer an implementation question.";
  return "Interpret the user's request for general reasoning.";
};

const requestedOutput = (input: {
  content: boolean;
  control: boolean;
  status: boolean;
  debug: boolean;
  implementation: boolean;
}): string => {
  if (input.control && !input.content && !input.status && !input.debug) return "operator receipt";
  if (input.content) return "content answer";
  if (input.status) return "status answer";
  if (input.debug) return "debug explanation";
  if (input.implementation) return "implementation answer";
  return "reasoned answer";
};

const classifyCompoundRequirementKind = (text: string): HelixCompoundPromptContract["requirements"][number]["kind"] => {
  if (/\b(?:compare|contrast|versus|vs\.?)\b/i.test(text)) return "comparison";
  if (/\b(?:implementation|code|patch|repo|function|module|file)\b/i.test(text)) return "implementation_request";
  if (/\b(?:debug|trace|error|failure|why|diagnos|root cause)\b/i.test(text)) return "diagnostic_request";
  if (/\b(?:format|include|bullet|table|checklist|final answer|output)\b/i.test(text)) return "output_format";
  if (/\b(?:do not|don't|without|must|should|need to|required|constraint)\b/i.test(text)) return "constraint";
  if (/[?？]\s*$/.test(text) || /^(?:what|why|how|when|where|can|could|should|does|do|is|are)\b/i.test(text)) return "question";
  return "instruction";
};

const compoundActionCuePattern =
  /\b(?:use|find|locate|place|synthesi[sz]e|explain|compare|identify|include|propose|write|implement|test|diagnose|analy[sz]e|research|cite|verify|summari[sz]e|map)\b/i;

const negativeOnlyRequirementPattern =
  /^(?:do\s+not|don't|never|without|no\s+(?:file|files|write|writing|mutat|mutation|notes?))\b/i;

const cleanCompoundRequirementText = (text: string): string =>
  text
    .replace(/\s+(?:do\s+not|don't|never)\s+(?:write|create|update|modify|mutate)\b[\s\S]*$/i, "")
    .trim()
    .replace(/^[,;]\s*/, "")
    .replace(/[,;]\s*$/, "")
    .replace(/\s+/g, " ");

const isCompoundRequirementCandidate = (text: string): boolean => {
  const cleaned = cleanCompoundRequirementText(text);
  if (cleaned.length < 8) return false;
  if (negativeOnlyRequirementPattern.test(cleaned)) return false;
  return compoundActionCuePattern.test(cleaned) || /[?ï¼Ÿ]\s*$/.test(cleaned);
};

const extractCoordinatedCompoundClauses = (prompt: string): string[] => {
  const clauses = prompt
    .split(
      /\s*(?:;|,\s*(?:and\s+)?|\band\s+|\bthen\s+|\.\s+then\s+)\s*(?=(?:use|find|locate|place|synthesi[sz]e|explain|compare|identify|include|propose|write|implement|test|diagnose|analy[sz]e|research|cite|verify|summari[sz]e|map)\b)/i,
    )
    .map(cleanCompoundRequirementText)
    .filter(isCompoundRequirementCandidate);
  return uniqueBy(clauses, (entry) => entry.toLowerCase());
};

const extractCompoundRequirementTexts = (prompt: string): string[] => {
  const lines = prompt
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const coordinatedRequirements = extractCoordinatedCompoundClauses(prompt);
  if (coordinatedRequirements.length > 1) return coordinatedRequirements;
  const lineRequirements = lines
    .map((line) => {
      const labeled = line.match(/^(?:question|task|goal|requirement|acceptance|instruction|context)\s*:\s*(.+)$/i)?.[1]?.trim();
      const listed = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/)?.[1]?.trim();
      return labeled ?? listed ?? (
        /[?？]\s*$/.test(line) || /\b(?:explain|compare|identify|include|propose|write|implement|test|diagnose|analyze|analyse)\b/i.test(line)
          ? line
          : ""
      );
    })
    .filter(Boolean);
  if (lineRequirements.length > 1) return uniqueBy(lineRequirements, (entry) => entry.toLowerCase());
  const sentenceRequirements = prompt
    .split(/(?<=[.?])\s+(?=(?:Then|Explain|Compare|Identify|Include|Propose|Write|Implement|Test|Diagnose|Analyze|Analyse|What|Why|How|Can|Should)\b)/i)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0 && /\b(?:then|give|explain|compare|identify|include|propose|write|implement|test|diagnose|analyze|analyse|what|why|how|can|should)\b/i.test(entry));
  return uniqueBy(sentenceRequirements, (entry) => entry.toLowerCase());
};

export const buildHelixCompoundPromptContract = (
  promptText: string,
  negativeConstraints: string[] = [],
): HelixCompoundPromptContract | null => {
  const prompt = promptText.trim();
  if (!prompt) return null;
  const requirementTexts = extractCompoundRequirementTexts(prompt);
  if (requirementTexts.length < 2) return null;
  const rawPromptHash = hashShort(prompt);
  const requirements = requirementTexts.map((text, index) => {
    const start = prompt.indexOf(text);
    return {
      id: `R${index + 1}`,
      text,
      ...(start >= 0 ? { span: { start, end: start + text.length } } : {}),
      kind: classifyCompoundRequirementKind(text),
      required: !/\b(?:optional|if useful|if needed|if relevant)\b/i.test(text),
      depends_on: index > 0 && /\b(?:then|after|based on|from that|therefore)\b/i.test(text) ? [`R${index}`] : [],
      status: "pending" as const,
    };
  });
  const globalConstraints = requirementTexts.filter((text) =>
    /\b(?:must|should|do not|don't|without|never|include|avoid|make sure|ensure|final answer|format)\b/i.test(text),
  );
  return {
    schema: "helix.compound_prompt_contract.v1",
    root_prompt_id: `compound_prompt:${rawPromptHash}`,
    raw_prompt_hash: rawPromptHash,
    raw_prompt_chars: prompt.length,
    root_objective: requirementTexts[0],
    requirements,
    global_constraints: uniqueBy(globalConstraints, (entry) => entry.toLowerCase()),
    negative_constraints: negativeConstraints,
    evidence_requirements: requirementTexts.filter((text) =>
      /\b(?:evidence|source|debug|trace|receipt|artifact|line|cite|verify|test)\b/i.test(text),
    ),
    output_contract: {
      requested_format: /\btable\b/i.test(prompt) ? "table" : /\b(?:bullet|list)\b/i.test(prompt) ? "list" : undefined,
      must_include_coverage_ledger: /\b(?:coverage|checklist|ledger|all requirements|each requirement)\b/i.test(prompt),
      allow_partial_answer: /\b(?:partial|best effort|if possible)\b/i.test(prompt),
    },
    assistant_answer: false,
    raw_content_included: false,
  };
};

export function interpretHelixAskPrompt(promptText: string): HelixPromptInterpretation {
  const prompt = promptText.trim();
  const contextualSuppression = detectContextualToolAdmissionSuppression(prompt);
  const contextualMentions = uniqueBy(
    [
      ...contextualRules
      .map((rule) => {
        const text = prompt.match(rule.pattern)?.[0]?.trim();
        return text
          ? {
              text,
              verb_or_cue: rule.verb_or_cue,
              reason: rule.reason,
            }
          : null;
      })
      .filter((entry): entry is HelixPromptInterpretation["contextual_tool_mentions"][number] => Boolean(entry)),
      ...(contextualSuppression
        ? [{
            text: contextualSuppression.text,
            verb_or_cue: contextualSuppression.verb_or_cue,
            reason: contextualSuppression.suppression_reason === "negated_tool_instruction"
              ? "negated" as const
              : contextualSuppression.suppression_reason === "quoted_tool_command"
                ? "quoted" as const
                : contextualSuppression.suppression_reason === "historical_tool_reference"
                  ? "historical" as const
                  : contextualSuppression.suppression_reason === "hypothetical_tool_reference"
                    ? "conditional" as const
                    : "background_context" as const,
          }]
        : []),
    ],
    (entry) => `${entry.verb_or_cue}:${entry.reason}:${entry.text.toLowerCase()}`,
  );
  const negativeConstraints = uniqueBy(matchTexts(prompt, negativeConstraintPatterns), (entry) => entry.toLowerCase());
  const executableCommands = uniqueBy(
    commandRules
      .map((rule) => {
        const text = prompt.match(rule.pattern)?.[0]?.trim();
        return text
          ? {
              text,
              action_family: rule.action_family,
              confidence: rule.confidence,
              reason: rule.reason,
            }
          : null;
      })
      .filter((entry): entry is HelixPromptInterpretation["executable_operator_commands"][number] => Boolean(entry))
      .filter((entry) => !contextualMentionOverlapsCommand(entry.text, contextualMentions))
      .filter((entry) => !negativeConstraints.some((constraint) => constraint.toLowerCase().includes(entry.text.toLowerCase()) || entry.text.toLowerCase().includes(constraint.toLowerCase()))),
    (entry) => `${entry.action_family}:${entry.text.toLowerCase()}`,
  );
  const contentDetected = hasAny(prompt, contentQuestionPatterns);
  const statusDetected = hasAny(prompt, statusQuestionPatterns);
  const debugDetected = hasAny(prompt, debugOrHistoryPatterns);
  const implementationDetected = hasAny(prompt, implementationPatterns);
  const controlDetected = executableCommands.length > 0;
  const ambiguityNotes = [
    contentDetected && statusDetected ? "content_question_with_status_subquestion" : "",
    contextualMentions.length > 0 && executableCommands.length > 0 ? "contextual_and_executable_control_language_present" : "",
    negativeConstraints.length > 0 ? "negative_constraints_present" : "",
  ].filter(Boolean);
  const compoundContract = buildHelixCompoundPromptContract(prompt, negativeConstraints);

  return {
    schema: "helix.prompt_interpretation.v1",
    prompt_hash: hashShort(prompt),
    user_task_summary: summarizeTask({
      content: contentDetected,
      control: controlDetected,
      status: statusDetected,
      debug: debugDetected,
      implementation: implementationDetected,
    }),
    requested_output: requestedOutput({
      content: contentDetected,
      control: controlDetected,
      status: statusDetected,
      debug: debugDetected,
      implementation: implementationDetected,
    }),
    explicit_constraints: [],
    negative_constraints: negativeConstraints,
    contextual_tool_mentions: contextualMentions,
    executable_operator_commands: executableCommands,
    content_question_detected: contentDetected,
    control_command_detected: controlDetected,
    status_question_detected: statusDetected,
    debug_or_history_question_detected: debugDetected,
    implementation_question_detected: implementationDetected,
    ambiguity_notes: ambiguityNotes,
    ...(compoundContract ? { compound_contract: compoundContract } : {}),
    assistant_answer: false,
    raw_content_included: false,
  };
}

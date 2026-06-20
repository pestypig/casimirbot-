import {
  DOCS_MD_PATH_CUE_RE,
  QUOTED_DOCS_PATH_COMMAND_RE,
} from "./docs-viewer-intent";
import { WORKSTATION_CONTEXT_FEED_QUERY_ACTUATORS } from "./workstation-context-feed-query-tool-contracts";

export type HelixContextualToolAdmissionSuppressionReason =
  | "negated_tool_instruction"
  | "quoted_tool_command"
  | "screen_visible_tool_reference"
  | "hypothetical_tool_reference"
  | "historical_tool_reference"
  | "explanatory_only";

export type HelixContextualToolAdmissionSuppression = {
  tool_admission_suppressed: true;
  suppression_reason: HelixContextualToolAdmissionSuppressionReason;
  verb_or_cue: string;
  text: string;
};

export type HelixContextualToolSuppressionFamily =
  | "docs_viewer"
  | "scientific_calculator"
  | "calculator"
  | "scholarly_research"
  | "internet_search"
  | "theory_locator"
  | "workstation_action"
  | "notes"
  | "repo_code"
  | "live_environment"
  | "live_pipeline"
  | "process_graph"
  | "workspace_directory";

const DOCS_VIEWER_CUE_RE = /\bdocs?\s+viewer\b|\bdocuments?\s+viewer\b|\bdocs?\s+panel\b|\bdocuments?\s+panel\b|\bdocs[-_. ]viewer(?:[-_. ][a-z][a-z0-9_]*)?\b/i;
const DOCS_VIEWER_ACTION_RE = /\b(?:open|open\s+up|show|view|pull\s+up|bring\s+up|switch\s+to|go\s+to|navigate\s+to|load|run|call|execute|use)\b[\s\S]{0,100}(?:the\s+|a\s+)?(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?|docs[-_. ]viewer(?:[-_. ][a-z][a-z0-9_]*)?)\b/i;
const DOCS_VIEWER_EXPLANATION_RE = /\b(?:just\s+)?(?:explain|describe|tell\s+me|what\s+is|what\s+are|what(?:'s|\s+is)?|what\s+does)\b[\s\S]{0,120}\b(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel)\b[\s\S]{0,80}\b(?:for|mean|do|does|is|are|used\s+for|purpose)\b/i;
const SCIENTIFIC_CALCULATOR_CUE_RE = /\b(?:scientific\s+calculator|calculator|calculate|compute|solve|evaluate|equation|expression)\b/i;
const SCIENTIFIC_CALCULATOR_ACTION_RE = /\b(?:open|open\s+up|show|view|pull\s+up|bring\s+up|switch\s+to|go\s+to|navigate\s+to|load|use|run|call|calculate|compute|solve|evaluate)\b[\s\S]{0,100}\b(?:scientific\s+calculator|calculator|equation|expression)\b|\b(?:calculate|compute|solve|evaluate)\b[\s\S]{0,120}(?:\d|[=+\-*/^()]|\\frac|\\sqrt)/i;
const SCIENTIFIC_CALCULATOR_EXPLANATION_RE = /\b(?:just\s+)?(?:explain|describe|tell\s+me|what\s+is|what\s+are|what(?:'s|\s+is)?|what\s+does|what\s+tool\s+would\s+you\s+use)\b[\s\S]{0,140}\b(?:scientific\s+calculator|calculator|calculate|compute|solve|evaluate)\b[\s\S]{0,100}\b(?:for|mean|do|does|is|are|used\s+for|purpose|would\s+use|should\s+use)\b/i;
const SCHOLARLY_CUE_RE = /\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|citations?|references?|bibliograph(?:y|ies)|bibtex|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|page\s+images?|figures?|tables?|equations?)\b|\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const SCHOLARLY_ACTION_RE = /\b(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect|cite|cross-?check)\b/i;
const SCHOLARLY_ACTION_WITH_CUE_RE = /\b(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect|cite|cross-?check)\b[\s\S]{0,140}\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|citations?|references?|bibliograph(?:y|ies)|bibtex|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|page\s+images?|figures?|tables?|equations?)\b|\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall|citations?|references?|bibliograph(?:y|ies)|bibtex|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|page\s+images?|figures?|tables?|equations?)\b[\s\S]{0,140}\b(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|pull|query|get|resolve|repair|collect|cite|cross-?check)\b/i;
const SCHOLARLY_EXPLANATION_RE = /\b(?:just\s+)?(?:explain|describe|tell\s+me|what\s+is|what\s+are|what(?:'s|\s+is)?|what\s+does)\b[\s\S]{0,120}\b(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citation|reference|journal)\b[\s\S]{0,80}\b(?:for|mean|do|does|is|are|used\s+for|purpose)\b/i;
const INTERNET_SEARCH_CUE_RE = /\b(?:browse|browsing|search|find|look\s*up|lookup|google|bing|web\s+search|internet\s+search|check\s+online|search\s+online|verify\s+online|latest|current|recent|today|breaking|ongoing\s+(?:conflict|war|crisis)|ceasefire|election|law|prices?|schedules?)\b/i;
const INTERNET_SEARCH_ACTION_RE = /\b(?:browse|search|find|look\s*up|lookup|google|bing|web\s+search|internet\s+search|check\s+online|search\s+online|verify\s+online)\b/i;
const REWRITE_ONLY_CURRENT_TEXT_RE = /\b(?:do\s+not|don't|dont|without|no)\s+(?:browse|browsing|search(?:ing)?|web|internet|look\s*up|lookup|google|check\s+online)\b[\s\S]{0,160}\b(?:rewrite|reword|copyedit|summari[sz]e|quote|format|polish)\b|\b(?:rewrite|reword|copyedit|summari[sz]e|quote|format|polish)\b[\s\S]{0,160}\b(?:this|the)\s+(?:paragraph|passage|prompt|text|quote)\b[\s\S]{0,120}\b(?:about\s+(?:current|recent|latest)|current\s+events?|ongoing\s+(?:conflict|war|crisis))/i;
const NEGATED_MUTATING_WRITE_CLAUSE_RE =
  /\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no)\b[^.!?;\n]{0,180}/gi;
const MUTATING_WRITE_TARGET_RE =
  /\b(?:write|create|edit|modify|save|append|update|delete|remove|commit|stage)\b[\s\S]{0,80}\b(?:files?|notes?|docs?|documents?|repo|repository|workspace|disk)\b/i;
const EXTERNAL_READONLY_TOOL_RE =
  /\b(?:browse|browsing|search(?:ing)?|find|look\s*up|lookup|google|bing|web\s+search|internet\s+search|check\s+online|verify\s+online|do\s+research|research|retrieve|fetch|query|resolve|collect|cite|citations?|sources?|papers?|doi|arxiv|crossref|openalex|semantic\s+scholar|pubmed|unpaywall)\b/i;
const MUTATING_WRITE_NEGATION_RE =
  /\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no)\s+(?:write|create|edit|modify|save|append|update|delete|remove|commit|stage)\s+(?:any\s+)?(?:files?|notes?|docs?|documents?|repo|repository|workspace|disk)\b/gi;
const LIVE_ENV_CONTEXT_FEED_QUERY_TOOL_PATTERN = WORKSTATION_CONTEXT_FEED_QUERY_ACTUATORS.join("|");
const LIVE_ENV_WORKSTATION_TOOL_PATTERN = String.raw`(?:${LIVE_ENV_CONTEXT_FEED_QUERY_TOOL_PATTERN}|configure_route_watch|change_workstation_preset|set_visual_preset|set_audio_preset|bind_workstation_source|unbind_workstation_source|pause_workstation_loop|resume_workstation_loop|set_workstation_loop_state|repair_loop|repair_workstation_source|repair_source|update_live_answer_projection|focus_process_graph|narrator_say|narrator_bind_stream|start_agent_goal_session|evaluate_goal_satisfaction)`;
const LIVE_ENV_CONTROL_CUE_RE = new RegExp(
  String.raw`\blive_env\.${LIVE_ENV_WORKSTATION_TOOL_PATTERN}\b|\bnarrator\.(?:say|bind_stream)\b`,
  "i",
);

const stripWriteOnlyNegationsForExternalToolMatching = (prompt: string): string =>
  prompt.replace(MUTATING_WRITE_NEGATION_RE, " ").replace(NEGATED_MUTATING_WRITE_CLAUSE_RE, (clause) => {
    if (!MUTATING_WRITE_TARGET_RE.test(clause)) return clause;
    if (EXTERNAL_READONLY_TOOL_RE.test(clause)) return clause;
    return " ";
  });

const scholarlyVerbOrCue = (text: string): string =>
  /\b(?:pdfs?|full[-\s]?text|paper\s+text|page\s+images?|figures?|tables?|equations?)\b/i.test(text)
    ? "scholarly-research.fetch_full_text"
    : "scholarly-research.lookup_papers";

export function contextualToolSuppressionBlocksFamily(
  suppression: HelixContextualToolAdmissionSuppression | null | undefined,
  family: HelixContextualToolSuppressionFamily | string,
): boolean {
  if (!suppression) return false;
  const cue = suppression.verb_or_cue;
  if (/all[_-]?tools/i.test(cue)) return true;
  if (family === "docs_viewer") return /docs_viewer|docs-viewer/i.test(cue) || DOCS_MD_PATH_CUE_RE.test(suppression.text);
  if (family === "scientific_calculator" || family === "calculator") return /scientific[_-]calculator|calculator/i.test(cue);
  if (family === "scholarly_research") return /scholarly|doi|arxiv|paper|citation|research/i.test(cue);
  if (family === "internet_search") return /internet|web|search|browse|google|bing/i.test(cue);
  if (family === "theory_locator") return /theory|locator|badge|graph|reflection/i.test(cue);
  if (family === "workstation_action" || family === "notes") return /workstation|workspace|note|write|file/i.test(cue);
  if (family === "repo_code") return /repo|code/i.test(cue) || DOCS_MD_PATH_CUE_RE.test(suppression.text);
  if (family === "live_environment") return /live|stage_play/i.test(cue);
  if (family === "live_pipeline") return /live[_-]?pipeline|live[_-]?source|situation-room\.live-source|stage_play/i.test(cue);
  if (family === "process_graph") return /process[_-]?graph|workstation|workspace/i.test(cue);
  if (family === "workspace_directory") return /workspace[_-]?directory|workspace|file|directory/i.test(cue);
  return false;
}

export function detectContextualToolAdmissionSuppression(promptText: string): HelixContextualToolAdmissionSuppression | null {
  const prompt = promptText.trim();
  if (
    !prompt ||
    (
      !DOCS_VIEWER_CUE_RE.test(prompt) &&
      !DOCS_MD_PATH_CUE_RE.test(prompt) &&
      !SCIENTIFIC_CALCULATOR_CUE_RE.test(prompt) &&
      !SCHOLARLY_CUE_RE.test(prompt) &&
      !INTERNET_SEARCH_CUE_RE.test(prompt) &&
      !LIVE_ENV_CONTROL_CUE_RE.test(prompt) &&
      !MUTATING_WRITE_NEGATION_RE.test(prompt)
    )
  ) return null;
  MUTATING_WRITE_NEGATION_RE.lastIndex = 0;

  const genericNoTools = prompt.match(/\b(?:do\s+not|don't|dont|never|without)\s+(?:call|use|run|execute)\s+(?:any\s+)?tools?\b|\bno\s+tools?\b/i)?.[0];
  if (genericNoTools) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: "all_tools",
      text: genericNoTools,
    };
  }

  const quotedDocsPathCommand = prompt.match(QUOTED_DOCS_PATH_COMMAND_RE)?.[0];
  if (quotedDocsPathCommand) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: "docs_viewer.open",
      text: quotedDocsPathCommand,
    };
  }

  const liveEnvControlReference = prompt.match(
    new RegExp(
      String.raw`(?:\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to)\b[^.!?;\n]{0,160}(?:run|call|use|execute|start|set|change|bind|update|repair|focus|evaluate|query|check|read)?[^.!?;\n]{0,120}(?:live_env\.${LIVE_ENV_WORKSTATION_TOOL_PATTERN}|narrator\.(?:say|bind_stream))\b)|(?:"[^"]*(?:live_env\.${LIVE_ENV_WORKSTATION_TOOL_PATTERN}|narrator\.(?:say|bind_stream))[^"]*")|(?:` + "`" + String.raw`[^` + "`" + String.raw`]*(?:live_env\.${LIVE_ENV_WORKSTATION_TOOL_PATTERN}|narrator\.(?:say|bind_stream))[^` + "`" + String.raw`]*` + "`" + String.raw`)|(?:\b(?:if|when|before|after|would|could|might|hypothetically|later|tomorrow|previously|earlier|last\s+turn|screen|visible|button|label|document|docs?)\b[^.!?;\n]{0,180}(?:live_env\.${LIVE_ENV_WORKSTATION_TOOL_PATTERN}|narrator\.(?:say|bind_stream))\b)`,
      "i",
    ),
  )?.[0];
  if (liveEnvControlReference) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: /\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to)\b/i.test(liveEnvControlReference)
        ? "negated_tool_instruction"
        : /["'`]/.test(liveEnvControlReference)
          ? "quoted_tool_command"
          : /\b(?:previously|earlier|last\s+turn)\b/i.test(liveEnvControlReference)
            ? "historical_tool_reference"
            : /\b(?:screen|visible|button|label|document|docs?)\b/i.test(liveEnvControlReference)
              ? "screen_visible_tool_reference"
              : "hypothetical_tool_reference",
      verb_or_cue: LIVE_ENV_CONTROL_CUE_RE.exec(liveEnvControlReference)?.[0] ?? "live_env.control",
      text: liveEnvControlReference,
    };
  }

  const quotedDocsCommand = prompt.match(/["'`][^"'`]*(?:open|show|view|pull\s+up|bring\s+up)[^"'`]*(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)[^"'`]*["'`]/i)?.[0];
  if (quotedDocsCommand) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: "docs_viewer.open",
      text: quotedDocsCommand,
    };
  }

  const contextualDocsIdentifier = prompt.match(
    /\b(?:earlier|previously|last\s+turn|before|debug|screen|visible|mentioned|saw|quoted?)\b[\s\S]{0,160}\bdocs[-_. ]viewer(?:[-_. ][a-z][a-z0-9_]*)?\b[\s\S]{0,160}\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to|just\s+explain|explain|whether|should)\b|\bdocs[-_. ]viewer(?:[-_. ][a-z][a-z0-9_]*)?\b[\s\S]{0,160}\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to|just\s+explain|explain|whether|should)\b/i,
  )?.[0];
  if (contextualDocsIdentifier) {
    const negatedDocsReference = /\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to)\b[\s\S]{0,180}\bdocs[-_. ]viewer(?:[-_. ][a-z][a-z0-9_]*)?\b/i.test(prompt) ||
      /\bdocs[-_. ]viewer(?:[-_. ][a-z][a-z0-9_]*)?\b[\s\S]{0,180}\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to)\b/i.test(prompt);
    return {
      tool_admission_suppressed: true,
      suppression_reason: negatedDocsReference
        ? "negated_tool_instruction"
        : "explanatory_only",
      verb_or_cue: "docs_viewer.search_docs",
      text: contextualDocsIdentifier,
    };
  }

  const quotedDocsSearch = prompt.match(/["'`][^"'`]*(?:search|find|look\s+for|locate)[^"'`]*(?:docs?|documents?|papers?)[^"'`]*["'`]/i)?.[0];
  if (quotedDocsSearch) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: "docs_viewer.search_docs",
      text: quotedDocsSearch,
    };
  }
  const quotedCalculator = prompt.match(/["'`][^"'`]*(?:open|show|view|pull\s+up|bring\s+up|use|run|call|calculate|compute|solve|evaluate)[^"'`]*(?:scientific\s+calculator|calculator|equation|expression)[^"'`]*["'`]/i)?.[0];
  if (quotedCalculator) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: "scientific_calculator.open",
      text: quotedCalculator,
    };
  }
  const quotedScholarly = prompt.match(/["'`][^"'`]*(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|query|cite|read)[^"'`]*(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?)[^"'`]*["'`]/i)?.[0];
  if (quotedScholarly) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: scholarlyVerbOrCue(quotedScholarly),
      text: quotedScholarly,
    };
  }
  const screenVisibleInternet = prompt.match(/\b(?:phrase|text|screen|page|button|label|headline)\b[\s\S]{0,160}(?:latest|current|recent|breaking|search|browse|web|internet)[\s\S]{0,120}\b(?:appears|says|shows|reads|contains)\b[\s\S]{0,80}\b(?:screen|page|label|headline)\b[\s\S]{0,120}\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|no)\b[\s\S]{0,80}(?:search|browse|open|click|run)\b|\b(?:phrase|text|screen|page|button|label|headline)\b[\s\S]{0,80}(?:says|shows|appears|reads|contains)\b[\s\S]{0,120}(?:latest|current|recent|breaking|search|browse|web\s+search|internet\s+search)[\s\S]{0,120}\b(?:do\s+not|don't|dont|without|not\s+asking\s+to|no)\b[\s\S]{0,80}(?:search|browse|open|click|run)\b/i)?.[0];
  if (screenVisibleInternet) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "screen_visible_tool_reference",
      verb_or_cue: "internet_search.web_research",
      text: screenVisibleInternet,
    };
  }
  const quotedInternet = prompt.match(/["'`][^"'`]*(?:browse|search|find|look\s*up|lookup|google|bing|web\s+search|internet\s+search|check\s+online|latest|current|recent|breaking)[^"'`]*["'`]/i)?.[0];
  if (quotedInternet) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "quoted_tool_command",
      verb_or_cue: "internet_search.web_research",
      text: quotedInternet,
    };
  }

  const negated = prompt.match(/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to)\b[\s\S]{0,80}(?:open|open\s+up|show|view|pull\s+up|bring\s+up|switch\s+to|go\s+to|navigate\s+to|load)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (negated) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: "docs_viewer.open",
      text: negated,
    };
  }
  const negatedCalculator = prompt.match(/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no\s+need\s+to)\b[^.!?;\n]{0,120}(?:open|open\s+up|show|view|pull\s+up|bring\s+up|switch\s+to|go\s+to|navigate\s+to|load|use|run|call|calculate|compute|solve|evaluate)\b[^.!?;\n]{0,120}(?:scientific\s+calculator|calculator|equation|expression)\b|\b(?:earlier|previously|last\s+turn|before)\b[^.!?;\n]{0,120}(?:open|opened|use|used|run|ran|call|called|calculate|computed|solve|solved|evaluate|evaluated)\b[^.!?;\n]{0,120}(?:scientific\s+calculator|calculator|equation|expression)\b[^.!?;\n]{0,120}\b(?:do\s+not|don't|dont|not\s+now|no\s+need\s+to)\b/i)?.[0];
  if (negatedCalculator) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: "scientific_calculator.open",
      text: negatedCalculator,
    };
  }
  const negatedMutatingWrite = prompt.match(MUTATING_WRITE_NEGATION_RE)?.[0];
  if (negatedMutatingWrite) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: "workstation.write_file",
      text: negatedMutatingWrite,
    };
  }
  const promptForExternalNegation = stripWriteOnlyNegationsForExternalToolMatching(prompt);
  const negatedScholarly = promptForExternalNegation.match(/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to)\b[\s\S]{0,120}(?:do\s+research|research|find|search|look\s*up|lookup|retrieve|fetch|query|get|resolve|collect|cite|read)\b[\s\S]{0,160}(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?|10\.\d{4,9}\/[-._;()/:A-Z0-9]+)\b/i)?.[0];
  if (negatedScholarly) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: scholarlyVerbOrCue(negatedScholarly),
      text: negatedScholarly,
    };
  }
  const negatedInternet = promptForExternalNegation.match(/\b(?:do\s+not|don't|dont|never|without|not\s+asking\s+to|no)\b[\s\S]{0,120}(?:browse|browsing|search(?:ing)?|find|look\s*up|lookup|google|bing|web\s+search|internet\s+search|check\s+online|verify\s+online)\b/i)?.[0];
  if (negatedInternet || REWRITE_ONLY_CURRENT_TEXT_RE.test(promptForExternalNegation)) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "negated_tool_instruction",
      verb_or_cue: "internet_search.web_research",
      text: negatedInternet ?? promptForExternalNegation.match(REWRITE_ONLY_CURRENT_TEXT_RE)?.[0] ?? "rewrite-only current-affairs prompt",
    };
  }
  const hypothetical = prompt.match(/\b(?:if|when|before|after|would|could|might|hypothetically)\b[\s\S]{0,100}(?:I|we|you)?\s*(?:opened?|open|show|view|pull\s+up|bring\s+up)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (hypothetical) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "hypothetical_tool_reference",
      verb_or_cue: "docs_viewer.open",
      text: hypothetical,
    };
  }
  const hypotheticalCalculator = prompt.match(/\b(?:if|when|before|after|would|could|might|hypothetically|may\s+ask|next\s+time|later)\b[\s\S]{0,140}(?:open|opened|show|view|use|run|call|calculate|compute|solve|evaluate)\b[\s\S]{0,120}(?:scientific\s+calculator|calculator|equation|expression)\b[\s\S]{0,160}\b(?:not\s+now|not\s+yet|but\s+not\s+now|without\s+doing\s+it\s+now)?/i)?.[0];
  if (hypotheticalCalculator) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "hypothetical_tool_reference",
      verb_or_cue: "scientific_calculator.open",
      text: hypotheticalCalculator,
    };
  }
  const hypotheticalScholarly = prompt.match(/\b(?:if|when|before|after|would|could|might|hypothetically)\b[\s\S]{0,120}(?:do\s+research|research|find|search|searched|look\s*up|looked\s+up|lookup|retrieve|retrieved|fetch|fetched|query|queried|get|resolve|collect|cite|read)\b[\s\S]{0,160}(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?)\b/i)?.[0];
  if (hypotheticalScholarly) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "hypothetical_tool_reference",
      verb_or_cue: scholarlyVerbOrCue(hypotheticalScholarly),
      text: hypotheticalScholarly,
    };
  }
  const hypotheticalInternet = prompt.match(/\b(?:in\s+the\s+future|later|next\s+time|if|when|before|after|would|could|might|hypothetically|may\s+ask)\b[\s\S]{0,160}(?:browse|search|searched|find|look\s*up|lookup|google|check\s+online|current\s+events?|latest|recent|breaking)\b[\s\S]{0,160}\b(?:not\s+now|not\s+yet|but\s+not\s+now|without\s+doing\s+it\s+now)\b/i)?.[0];
  if (hypotheticalInternet) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "hypothetical_tool_reference",
      verb_or_cue: "internet_search.web_research",
      text: hypotheticalInternet,
    };
  }

  const historical = prompt.match(/\b(?:I|we|you)\s+(?:already\s+|previously\s+|earlier\s+)?opened?\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b|\b(?:earlier|previously|last\s+turn|before)\b[\s\S]{0,100}(?:opened?|showed|viewed)\b[\s\S]{0,100}(?:docs?\s+viewer|documents?\s+viewer|docs?\s+panel|documents?\s+panel|docs?)\b/i)?.[0];
  if (historical) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "historical_tool_reference",
      verb_or_cue: "docs_viewer.open",
      text: historical,
    };
  }
  const historicalCalculator = prompt.match(/\b(?:I|we|you)\s+(?:already\s+|previously\s+|earlier\s+)?(?:opened?|used|ran|called|calculated|computed|solved|evaluated)\b[\s\S]{0,120}(?:scientific\s+calculator|calculator|equation|expression)\b|\b(?:earlier|previously|last\s+turn|before)\b[\s\S]{0,120}(?:opened?|showed|viewed|used|ran|called|calculated|computed|solved|evaluated)\b[\s\S]{0,120}(?:scientific\s+calculator|calculator|equation|expression)\b/i)?.[0];
  if (historicalCalculator) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "historical_tool_reference",
      verb_or_cue: "scientific_calculator.open",
      text: historicalCalculator,
    };
  }
  const historicalScholarly = prompt.match(/\b(?:I|we|you)\s+(?:already\s+|previously\s+|earlier\s+)?(?:looked\s+up|searched|researched|queried|retrieved|fetched|read)\b[\s\S]{0,140}(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?)\b|\b(?:earlier|previously|last\s+turn|before)\b[\s\S]{0,120}(?:looked\s+up|searched|researched|queried|retrieved|fetched|read)\b[\s\S]{0,140}(?:doi|arxiv|crossref|openalex|semantic\s+scholar|citations?|references?|journals?|research\s+papers?|pdfs?|full[-\s]?text|paper\s+text|figures?|tables?|equations?)\b/i)?.[0];
  if (historicalScholarly) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "historical_tool_reference",
      verb_or_cue: scholarlyVerbOrCue(historicalScholarly),
      text: historicalScholarly,
    };
  }
  const historicalInternet = prompt.match(/\b(?:I|we|you)\s+(?:already\s+|previously\s+|earlier\s+)?(?:looked\s+up|searched|browsed|googled|checked\s+online)\b[\s\S]{0,160}(?:latest|current|recent|breaking|web|internet|news|events?)\b|\b(?:earlier|previously|last\s+turn|before)\b[\s\S]{0,140}(?:looked\s+up|searched|browsed|googled|checked\s+online)\b[\s\S]{0,160}(?:latest|current|recent|breaking|web|internet|news|events?)\b/i)?.[0];
  if (historicalInternet) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "historical_tool_reference",
      verb_or_cue: "internet_search.web_research",
      text: historicalInternet,
    };
  }

  if (DOCS_VIEWER_EXPLANATION_RE.test(prompt) && !DOCS_VIEWER_ACTION_RE.test(prompt)) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "explanatory_only",
      verb_or_cue: "docs_viewer.open",
      text: prompt.match(DOCS_VIEWER_EXPLANATION_RE)?.[0] ?? "docs viewer explanation request",
    };
  }
  if (SCIENTIFIC_CALCULATOR_EXPLANATION_RE.test(prompt) && !SCIENTIFIC_CALCULATOR_ACTION_RE.test(prompt)) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "explanatory_only",
      verb_or_cue: "scientific_calculator.open",
      text: prompt.match(SCIENTIFIC_CALCULATOR_EXPLANATION_RE)?.[0] ?? "scientific calculator explanation request",
    };
  }
  if (SCHOLARLY_EXPLANATION_RE.test(prompt) && !SCHOLARLY_ACTION_WITH_CUE_RE.test(prompt)) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "explanatory_only",
      verb_or_cue: "scholarly-research.lookup_papers",
      text: prompt.match(SCHOLARLY_EXPLANATION_RE)?.[0] ?? "scholarly research explanation request",
    };
  }
  if (
    /\b(?:what\s+is|what\s+are|explain|describe|tell\s+me)\b[\s\S]{0,120}\b(?:web\s+search|internet\s+search|browser|browsing)\b/i.test(prompt) &&
    !INTERNET_SEARCH_ACTION_RE.test(prompt.replace(/\b(?:web\s+search|internet\s+search)\b/ig, "internet-search-term"))
  ) {
    return {
      tool_admission_suppressed: true,
      suppression_reason: "explanatory_only",
      verb_or_cue: "internet_search.web_research",
      text: prompt,
    };
  }

  return null;
}

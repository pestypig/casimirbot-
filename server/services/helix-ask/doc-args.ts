export const extractAskTurnDocPathArgs = (transcript: string): string[] => {
  const normalized = transcript.trim();
  if (!normalized) return [];
  const matches = normalized.match(/((?:[A-Za-z]:\\|\/|\.\/|docs\/)[^\s,;]+(?:\.md|\.txt|\.pdf))/gi) ?? [];
  return Array.from(new Set(matches.map((entry) => entry.trim()).filter(Boolean)));
};

export const HELIX_ASK_OPEN_DOC_NOUN_PATTERN = String.raw`(?:doc|docs|document|documents|paper|papers|writeup|writeups|artifact|artifacts|result|results|thing|things|report|reports|file|files)`;
export const HELIX_ASK_RECENT_DOC_PATTERN = String.raw`(?:latest|newest|freshest|most\s+recent|recent)`;

export type HelixAskLatestDocIntentReaderDependencies = {
  isStructuredDocsViewerPrompt: (transcript: string) => boolean;
};

export const normalizeAskTurnLatestDocTopicText = (value: string): string | null => {
  const cleaned = value
    .replace(/\bNH[-\s]?M2\b/gi, "NHM2")
    .replace(/\bwhite\s+paper\b/gi, "whitepaper")
    .replace(/\bdocks\b/gi, "docs")
    .replace(/\s+\band\s+(?:tell|show|explain|summari[sz]e|compare|answer|put|add|copy|write|save|drop|then)\b[\s\S]*$/i, " ")
    .replace(/\s+\b(?:and|then)\s*$/i, " ")
    .replace(/[?!.;,:"'`]+/g, " ")
    .replace(
      /\b(?:go\s+to|navigate\s+to|take\s+me\s+to|bring\s+me\s+to|pull\s+up|open|view|show|pick|grab|read|the|a|an|latest|newest|most\s+recent|recent|doc|docs|document|paper|about|on|regarding|for|from)\b/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return null;
  return cleaned
    .split(/\s+/)
    .map((token) => (/^nhm2$/i.test(token) ? "NHM2" : token))
    .join(" ");
};

export const resolveAskTurnLatestDocTopicArg = (transcript: string): string | null => {
  const normalized = transcript.trim();
  if (!normalized) return null;
  const topicQualifiedMatch = normalized.match(
    /\b(?:latest|newest|most\s+recent|recent)\s+(.+?)\s+(?:doc|docs|document|paper)\s+(?:about|on|regarding|for)\s+(.+)$/i,
  );
  if (topicQualifiedMatch?.[1] || topicQualifiedMatch?.[2]) {
    const topic = normalizeAskTurnLatestDocTopicText(`${topicQualifiedMatch?.[1] ?? ""} ${topicQualifiedMatch?.[2] ?? ""}`);
    if (topic) return topic;
  }
  const docAboutMatch = normalized.match(
    /\b(?:latest|newest|most\s+recent|recent)\s+(?:doc|docs|document|paper)\s+(?:about|on|regarding|for)\s+(.+)$/i,
  );
  if (docAboutMatch?.[1]) {
    const prefixTopic = /\bnhm2\b/i.test(normalized) ? "NHM2 " : "";
    const topic = normalizeAskTurnLatestDocTopicText(`${prefixTopic}${docAboutMatch[1]}`);
    if (topic) return topic;
  }
  const patterns = [
    /\b(?:latest|newest|most\s+recent|recent)\s+(.+?)\s+(?:doc|docs|document|paper)\b/i,
    /\b(?:open|view|show|pull\s+up|pick|grab|go\s+to|navigate\s+to|take\s+me\s+to|bring\s+me\s+to)\s+(?:the\s+)?(?:latest|newest|most\s+recent|recent)\s+(.+)$/i,
  ];
  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    const topic = match?.[1]?.trim();
    const cleaned = topic ? normalizeAskTurnLatestDocTopicText(topic) : null;
    if (cleaned) return cleaned;
  }
  if (/\b(?:latest|newest|most\s+recent|recent)\b/i.test(normalized) && /\bnhm2\b/i.test(normalized)) {
    return "NHM2";
  }
  return null;
};

export const isAskTurnTopicQualifiedLatestDocIntent = (transcript: string): boolean =>
  /\b(?:latest|newest|most\s+recent|recent)\b[\s\S]*\b(?:doc|docs|document|paper)\b[\s\S]*\b(?:about|on|regarding|for)\b/i.test(
    transcript,
  );

export const cleanupAskTurnOpenDocSearchTopic = (rawTopic: string | null | undefined): string | null => {
  const topic = rawTopic
    ?.replace(/\bwhite\s+paper\b/gi, "whitepaper")
    ?.replace(/\s*[.?!]\s*(?:do\s+not|don't|dont|never|without|no)\b[\s\S]*$/i, "")
    .replace(/\s*,?\s*(?:do\s+not|don't|dont|never|without|no)\s+(?:use|run|call|search|browse|check|look\s+at|consult)\b[\s\S]*$/i, "")
    .replace(/\s*,?\s*(?:use|using|from)\s+(?:the\s+)?docs?\s+only\b[\s\S]*$/i, "")
    ?.replace(/\s+\b(?:and\s+then|then|after\s+that|also)\b[\s\S]*$/i, "")
    .replace(/\s*,?\s*(?:then\s+)?tell\s+me[\s\S]*$/i, "")
    .replace(/\s+\band\s+(?:tell|show|explain|summari[sz]e|answer|extract|give)\b[\s\S]*$/i, "")
    .replace(/\bfrom\s+(?:the\s+)?(?:docs?|docks?|documents?|papers?|viewer)\b/gi, " ")
    .replace(new RegExp(String.raw`\b${HELIX_ASK_OPEN_DOC_NOUN_PATTERN}\b`, "gi"), " ")
    .replace(/\b(?:that|which)\s+(?:talks?\s+about|discuss(?:es)?|covers?|mentions?|references?)\b/gi, " ")
    .replace(/\b(?:for\s+me|for\s+us|please|kindly|thanks?|thank\s+you)\b/gi, " ")
    .replace(/\bfrom\b$/gi, " ")
    .replace(/\b(?:about|on|regarding|for)\b$/gi, " ")
    .replace(/^(?:a|an|the)\s+/i, "")
    .replace(/[?!.;,:"'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/^(?:me|us|you|please|thanks?|thank\s+you)$/i.test(topic ?? "")) return null;
  return topic ? normalizeAskTurnLatestDocTopicText(topic) : null;
};

export const resolveAskTurnCreateThenOpenDocTopicArg = (transcript: string): string | null => {
  const normalized = transcript.trim();
  const match = normalized.match(
    /\b(?:and\s+then|then|after\s+that|also|,)\s*(?:open|view|show|pull\s+up|go\s+to|navigate\s+to)\s+(?:a|an|the)?\s*(?:latest\s+|newest\s+|most\s+recent\s+|recent\s+)?(?:doc|docs|document|paper)\s+(?:about|on|regarding|for)\s+(.+)$/i,
  );
  const rawTopic = match?.[1]
    ?.replace(/\s+\b(?:and\s+then|then|after\s+that|also)\b[\s\S]*$/i, "")
    .replace(/\s*,?\s*(?:then\s+)?tell\s+me[\s\S]*$/i, "")
    .replace(/[?!.;,:"'`]+$/g, "")
    .trim();
  const topic = rawTopic ? normalizeAskTurnLatestDocTopicText(rawTopic) : null;
  return topic || null;
};

export const createAskTurnLatestDocIntentReaders = (
  deps: HelixAskLatestDocIntentReaderDependencies,
) => {
  const isAskTurnOpenLatestDocIntent = (transcript: string): boolean => {
    if (deps.isStructuredDocsViewerPrompt(transcript)) return false;
    const normalized = transcript.trim().toLowerCase();
    if (!normalized) return false;
    const hasOpenCue =
      /\b(?:open|view|show|pull\s+up|pick|grab|read)\b/.test(normalized) ||
      /\b(?:go\s+to|navigate\s+to|take\s+me\s+to|bring\s+me\s+to)\b/.test(normalized);
    const hasLatestCue = /\b(?:latest|newest|most\s+recent|recent)\b/.test(normalized);
    const hasDocCue = /\b(?:doc|docs|document|paper)\b/.test(normalized);
    return hasOpenCue && hasLatestCue && hasDocCue;
  };

  const isAskTurnStrictLatestDocAcquisitionIntent = (transcript: string): boolean => {
    const normalized = transcript.trim().toLowerCase();
    if (!isAskTurnOpenLatestDocIntent(normalized)) return false;
    if (
      new RegExp(String.raw`\b${HELIX_ASK_RECENT_DOC_PATTERN}\s+${HELIX_ASK_OPEN_DOC_NOUN_PATTERN}\s+(?:about|on|regarding|for|that|which)\b`, "i").test(
        normalized,
      )
    ) return false;
    if (/\b(?:talks?\s+about|discuss(?:es)?|covers?|mentions?|references?|saves?|reducing|making|shorter)\b/i.test(normalized)) return false;
    return Boolean(resolveAskTurnLatestDocTopicArg(normalized));
  };

  const resolveAskTurnRecentDocAcquisitionQueryArg = (transcript: string): string | null => {
    const normalized = transcript.trim();
    if (!normalized) return null;
    const hasOpenVerb = /\b(?:open|view|show|pull\s+up|bring\s+up|go\s+to|navigate\s+to|find(?:\s+me)?|search)\b/i.test(normalized);
    if (!hasOpenVerb || !new RegExp(String.raw`\b${HELIX_ASK_RECENT_DOC_PATTERN}\b`, "i").test(normalized)) return null;
    if (isAskTurnStrictLatestDocAcquisitionIntent(normalized)) return null;
    const docNoun = HELIX_ASK_OPEN_DOC_NOUN_PATTERN;
    const recent = HELIX_ASK_RECENT_DOC_PATTERN;
    const patterns = [
      new RegExp(String.raw`\b(?:open|view|show|pull\s+up|bring\s+up|go\s+to|navigate\s+to|find(?:\s+me)?|search)\s+(?:me\s+)?(?:the\s+)?${recent}\s+${docNoun}\s+(?:that\s+)?(?:talks?\s+about|discuss(?:es)?|covers?|mentions?|references?)\s+(.+)$`, "i"),
      new RegExp(String.raw`\b(?:open|view|show|pull\s+up|bring\s+up|go\s+to|navigate\s+to|find(?:\s+me)?|search)\s+(?:me\s+)?(?:the\s+)?${recent}\s+${docNoun}\s+(?:about|on|regarding|for)\s+(.+)$`, "i"),
      new RegExp(String.raw`\b(?:open|view|show|pull\s+up|bring\s+up|go\s+to|navigate\s+to|find(?:\s+me)?|search)\s+(?:me\s+)?(?:the\s+)?${recent}\s+(.+?)\s+${docNoun}\b`, "i"),
      new RegExp(String.raw`\b(?:open|view|show|pull\s+up|bring\s+up|go\s+to|navigate\s+to|find(?:\s+me)?|search)\s+(?:me\s+)?(?:the\s+)?${recent}\s+(.+)$`, "i"),
    ];
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
      const topic = cleanupAskTurnOpenDocSearchTopic(match?.[1]);
      if (topic) return topic;
    }
    return null;
  };

  return {
    isAskTurnOpenLatestDocIntent,
    isAskTurnStrictLatestDocAcquisitionIntent,
    resolveAskTurnRecentDocAcquisitionQueryArg,
  };
};

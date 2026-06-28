export const hasAskTurnInterpreterProfileConfigCue = (transcript: string): boolean =>
  /\blive_env\.configure_interpreter_profile\b/i.test(transcript) ||
  /\b(?:create|make|save|configure|set\s+up|setup|store)\b[\s\S]{0,140}\b(?:interpreter\s+profile|interpreter\s+skill|profile\s+for\s+(?:this|the)\s+(?:source|live\s+source|visual\s+source)|guidelines\s+for\s+interpreting\s+(?:the\s+)?live\s+source)\b/i.test(transcript) ||
  /\b(?:use|save|store)\b[\s\S]{0,120}\b(?:these|this|the\s+following)\s+guidelines\b[\s\S]{0,140}\b(?:interpreting|interpret|live\s+source|visual\s+source)\b/i.test(transcript) ||
  /\b(?:act\s+like|be|become)\b[\s\S]{0,120}\b(?:survival\s+coach|browser\s+workflow\s+watcher|video\s+scene\s+interpreter|code\s+log\s+failure\s+watcher)\b/i.test(transcript) ||
  /\bsave\s+this\s+as\s+an?\s+interpreter\s+skill\b/i.test(transcript);

export const hasAskTurnInterpreterProfileManagementCue = (transcript: string): boolean =>
  /\b(?:use|apply|select|activate|pause|archive|open|compile)\b[\s\S]{0,140}\b(?:interpreter\s+profile|profile\s+note|minecraft\s+survival\s+coach|browser\s+workflow\s+watcher|video\s+scene\s+interpreter|code\s+log\s+failure\s+watcher)\b/i.test(transcript) ||
  /\b(?:interpreter\s+profile|profile\s+note|minecraft\s+survival\s+coach|browser\s+workflow\s+watcher)\b[\s\S]{0,140}\b(?:use|apply|select|activate|pause|archive|open|compile)\b/i.test(transcript);

export const hasAskTurnInterpreterProfileComparisonCue = (transcript: string): boolean =>
  /\blive_env\.compare_mail_to_interpreter_profile\b/i.test(transcript) ||
  /\b(?:interpret|compare)\b[\s\S]{0,120}\b(?:mail|mailbox|summaries|observations?)\b[\s\S]{0,120}\b(?:active\s+profile|interpreter\s+profile|profile)\b/i.test(transcript) ||
  /\b(?:mail|mailbox|summaries|observations?)\b[\s\S]{0,120}\b(?:interpret|compare)\b[\s\S]{0,120}\b(?:active\s+profile|interpreter\s+profile|profile)\b/i.test(transcript) ||
  /\bwhy\s+did\s+you\b[\s\S]{0,100}\b(?:call\s+this\s+out|callout|suppress\s+this|suppress)\b/i.test(transcript);

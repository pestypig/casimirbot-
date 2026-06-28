export const isCompactUiMailboxWakePrompt = (transcript: string): boolean =>
  ((
    /\bContinuing\s+live[-\s]?source\s+watch\s+job\s+compact\s+Ask\s+handoff\b/i.test(transcript) ||
    /\bUI\s+bridge\s+reason\b[\s\S]{0,120}\bHelix\s+Ask\s+wake\b/i.test(transcript)
  ) &&
  /\bWake\s+request:\s*stage_play_live_source_mail_wake:/i.test(transcript) &&
  /\bProcessed\s+packet:\s*stage_play_processed_mail_packet:/i.test(transcript) &&
  (
    /\bphase\s+requirement\b[\s\S]{0,180}\blive_env\.record_live_source_mail_decision\b/i.test(transcript) ||
    /\blive_env\.record_live_source_mail_decision\b[\s\S]{0,180}\blive_env\.request_interim_voice_callout\b/i.test(transcript)
  )) ||
  (
    /\bReview\s+the\s+latest\s+Stage\s+Play\s+live[-\s]?source\s+mailbox\s+finding\b/i.test(transcript) &&
    /\bMicro[-\s]?reasoner\s+recommendation\s*:\s*(?:request\s+voice\s+callout|record\s+interpretation|request\s+more\s+evidence|request\s+stage\s+play\s+checkpoint)\b/i.test(transcript) &&
    /\bstructured\s+mailbox\s+route\s+metadata\b/i.test(transcript)
  );

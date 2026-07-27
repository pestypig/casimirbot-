import {
  containsHelixAgentSensitiveText,
  containsHelixAgentSensitiveValue,
  quoteHelixAgentContextRecord,
  redactHelixAgentSensitiveValue,
  redactHelixAgentSensitiveText,
  type SensitiveTextRedaction,
} from "../helix-agent-api/sensitive-text";

export type { SensitiveTextRedaction };

export const redactSharedLiveRoomSensitiveText = redactHelixAgentSensitiveText;

export const containsSharedLiveRoomSensitiveText =
  containsHelixAgentSensitiveText;

export const redactSharedLiveRoomSensitiveValue =
  redactHelixAgentSensitiveValue;

export const containsSharedLiveRoomSensitiveValue =
  containsHelixAgentSensitiveValue;

export const quoteSharedLiveRoomContextRecord = quoteHelixAgentContextRecord;

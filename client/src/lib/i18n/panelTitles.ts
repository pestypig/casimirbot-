import type { InterfaceMessageId, InterfaceMessageValues } from "@/lib/i18n/messages/types";

type InterfaceTranslate = (id: InterfaceMessageId, values?: InterfaceMessageValues) => string;

const PANEL_TITLE_MESSAGES: Record<string, InterfaceMessageId> = {
  "account-session": "panel.title.accountSession",
  "docs-viewer": "panel.title.docsViewer",
  "document-image-lens": "panel.title.imageLens",
  "image-lens": "panel.title.imageLens",
  "live-answer-environment": "panel.title.liveAnswer",
  narrator: "panel.title.narrator",
  "scientific-calculator": "panel.title.scientificCalculator",
  "stage-play-badge-graph": "panel.title.stagePlayBadgeGraph",
  "workstation-storage-map": "panel.title.storageMap",
  "workstation-task-manager": "panel.title.taskManager",
};

export function getInterfacePanelTitle(
  translate: InterfaceTranslate,
  panelId: string,
  fallbackTitle: string,
): string {
  const messageId = PANEL_TITLE_MESSAGES[panelId];
  return messageId ? translate(messageId) : fallbackTitle;
}

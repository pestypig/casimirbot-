import {
  HELIX_USER_ACCOUNT_POLICY,
  resolveHelixWorkstationCapabilityAccess,
  type HelixAccountCapabilityPolicy,
  type HelixAccountPolicyAccessState,
  type HelixWorkstationPermissionProfile,
} from "@shared/helix-account-session";

export type HelixAskSlashCommandRuntime = {
  id: string;
  label: string;
};

export type HelixAskSlashCommandCatalogItem = {
  id: string;
  command: string;
  label: string;
  capabilityId: string;
  description: string;
  insertionText: string;
  permissionRequired?: HelixWorkstationPermissionProfile;
  runtimeIds?: string[];
  developerOnly?: boolean;
};

export type HelixAskSlashCommandMenuItem = HelixAskSlashCommandCatalogItem & {
  accessState: HelixAccountPolicyAccessState;
  accessReason: string | null;
  runtimeAvailable: boolean;
  runtimeLabel: string | null;
};

const HELIX_ASK_SLASH_COMMAND_CATALOG: HelixAskSlashCommandCatalogItem[] = [
  {
    id: "calculator",
    command: "/calculator",
    label: "Calculator",
    capabilityId: "scientific-calculator.solve_expression",
    description: "Solve or inspect a mathematical expression with the workstation calculator.",
    insertionText: "Use the scientific calculator capability to ",
    permissionRequired: "act",
  },
  {
    id: "research",
    command: "/research",
    label: "Scholarly research",
    capabilityId: "scholarly-research.lookup_papers",
    description: "Find papers, fetch full text, and extract paper-backed evidence.",
    insertionText: "Search scholarly research for ",
    permissionRequired: "act",
  },
  {
    id: "docs",
    command: "/docs",
    label: "Current document",
    capabilityId: "docs-viewer.read_visible_surface",
    description: "Use the active docs-viewer document or visible document context.",
    insertionText: "Use the current document context to ",
    permissionRequired: "read",
  },
  {
    id: "image",
    command: "/image",
    label: "Image or screen",
    capabilityId: "workstation.readable_surface.observe",
    description: "Reason over an attached image or visible workstation surface.",
    insertionText: "Use the attached image or visible screen context to ",
    permissionRequired: "observe",
  },
  {
    id: "notes",
    command: "/notes",
    label: "Workstation notes",
    capabilityId: "workstation-notes.list_notes",
    description: "Use available workstation notes as context.",
    insertionText: "Use workstation notes context to ",
    permissionRequired: "read",
  },
  {
    id: "moral",
    command: "/moral",
    label: "Moral graph",
    capabilityId: "moral-graph.reflect_context",
    description: "Reflect on the current context with the moral graph.",
    insertionText: "Use the moral graph context to reflect on ",
    permissionRequired: "read",
  },
  {
    id: "theory",
    command: "/theory",
    label: "Theory graph",
    capabilityId: "theory-badge-graph.reflect_discussion_context",
    description: "Use theory graph context to organize claims or conjectures.",
    insertionText: "Use the theory graph context to ",
    permissionRequired: "read",
  },
  {
    id: "voice",
    command: "/voice",
    label: "Voice callout",
    capabilityId: "text_to_speech.speak_text",
    description: "Ask for a spoken callout or narration after reasoning.",
    insertionText: "After reasoning, use voice narration to say ",
    permissionRequired: "act",
  },
  {
    id: "situation-room",
    command: "/situation",
    label: "Situation room",
    capabilityId: "situation-room-pipelines.inspect",
    description: "Developer-only pipeline and situation-room inspection scaffold.",
    insertionText: "Use the situation room pipeline context to inspect ",
    permissionRequired: "read",
    developerOnly: true,
  },
];

export function listHelixAskSlashCommandCatalog(): HelixAskSlashCommandCatalogItem[] {
  return HELIX_ASK_SLASH_COMMAND_CATALOG.map((item) => ({ ...item }));
}

export function buildHelixAskSlashCommandMenuItems(args: {
  accountPolicy?: HelixAccountCapabilityPolicy | null;
  runtime?: HelixAskSlashCommandRuntime | null;
  includeLocked?: boolean;
}): HelixAskSlashCommandMenuItem[] {
  const accountPolicy = args.accountPolicy ?? HELIX_USER_ACCOUNT_POLICY;
  const runtimeId = args.runtime?.id?.trim() ?? "";
  return HELIX_ASK_SLASH_COMMAND_CATALOG
    .map((item): HelixAskSlashCommandMenuItem => {
      const runtimeAvailable =
        !item.runtimeIds || item.runtimeIds.length === 0 || item.runtimeIds.includes(runtimeId);
      const access = item.developerOnly && accountPolicy.account_type !== "developer"
        ? { state: "locked" as const, reason: "developer_only_command" }
        : resolveHelixWorkstationCapabilityAccess(accountPolicy, {
            capability_id: item.capabilityId,
            permission_profile_required: item.permissionRequired,
          });
      return {
        ...item,
        accessState: access.state,
        accessReason: access.reason,
        runtimeAvailable,
        runtimeLabel: args.runtime?.label?.trim() || null,
      };
    })
    .filter((item) => args.includeLocked || (item.accessState === "available" && item.runtimeAvailable));
}

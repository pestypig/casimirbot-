import {
  HELIX_USER_ACCOUNT_POLICY,
  HELIX_USER_WORKSTATION_PANEL_IDS,
  resolveHelixAccountPanelAccess,
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
  fallbackPanelId?: string;
  runtimeIds?: string[];
  developerOnly?: boolean;
  generated?: boolean;
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
    id: "postulate",
    command: "/postulate",
    label: "Postulate review",
    capabilityId: "postulate.submit_proposal",
    description: "Prepare a proposal for the postulate review lane and board.",
    insertionText: "/postulate\n\nSend this postulate to be reviewed: ",
    permissionRequired: "act",
    fallbackPanelId: "postulate-board",
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

function titleCaseCapabilityToken(value: string): string {
  return value
    .split(/[-_]+/g)
    .map((token) => token.trim())
    .filter(Boolean)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(" ");
}

function buildHelixAskGeneratedSlashCommandForCapability(
  capabilityId: string,
): HelixAskSlashCommandCatalogItem | null {
  const normalized = capabilityId.trim();
  if (!normalized || normalized === "*" || normalized.startsWith("permission:")) return null;
  const parts = normalized.split(".").map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const commandSlug = parts
    .join("-")
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
  if (!commandSlug) return null;
  const label = parts.map(titleCaseCapabilityToken).join(" ");
  return {
    id: `capability:${normalized}`,
    command: `/${commandSlug}`,
    label,
    capabilityId: normalized,
    description: `Use ${normalized} from the current account capability list.`,
    insertionText: `Use the ${normalized} capability to `,
    generated: true,
  };
}

export function buildHelixAskSlashCommandCatalogForPolicy(
  policy: HelixAccountCapabilityPolicy | null | undefined,
): HelixAskSlashCommandCatalogItem[] {
  const accountPolicy = policy ?? HELIX_USER_ACCOUNT_POLICY;
  const curated = listHelixAskSlashCommandCatalog();
  const curatedCapabilityIds = new Set(curated.map((item) => item.capabilityId));
  const generated = accountPolicy.allowed_workstation_capabilities
    .map(buildHelixAskGeneratedSlashCommandForCapability)
    .filter((item): item is HelixAskSlashCommandCatalogItem => Boolean(item))
    .filter((item) => !curatedCapabilityIds.has(item.capabilityId));
  return [...curated, ...generated];
}

export function buildHelixAskSlashCommandMenuItems(args: {
  accountPolicy?: HelixAccountCapabilityPolicy | null;
  runtime?: HelixAskSlashCommandRuntime | null;
  includeLocked?: boolean;
}): HelixAskSlashCommandMenuItem[] {
  const accountPolicy = args.accountPolicy ?? HELIX_USER_ACCOUNT_POLICY;
  const runtimeId = args.runtime?.id?.trim() ?? "";
  const publicPanelIds = new Set<string>(HELIX_USER_WORKSTATION_PANEL_IDS);
  return buildHelixAskSlashCommandCatalogForPolicy(accountPolicy)
    .map((item): HelixAskSlashCommandMenuItem => {
      const runtimeAvailable =
        !item.runtimeIds || item.runtimeIds.length === 0 || item.runtimeIds.includes(runtimeId);
      const access = item.developerOnly && accountPolicy.account_type !== "developer"
        ? { state: "locked" as const, reason: "developer_only_command" }
        : resolveHelixWorkstationCapabilityAccess(accountPolicy, {
            capability_id: item.capabilityId,
            permission_profile_required: item.permissionRequired,
          });
      const fallbackPanelAccess = access.state === "available" || !item.fallbackPanelId
        ? null
        : resolveHelixAccountPanelAccess(accountPolicy, item.fallbackPanelId);
      const fallbackPanelIsCanonicalPublic = item.fallbackPanelId
        ? publicPanelIds.has(item.fallbackPanelId)
        : false;
      const resolvedAccess = fallbackPanelAccess?.state === "available" || fallbackPanelIsCanonicalPublic
        ? { state: "available" as const, reason: null }
        : access;
      return {
        ...item,
        accessState: resolvedAccess.state,
        accessReason: resolvedAccess.reason,
        runtimeAvailable,
        runtimeLabel: args.runtime?.label?.trim() || null,
      };
    })
    .filter((item) => args.includeLocked || (item.accessState === "available" && item.runtimeAvailable));
}

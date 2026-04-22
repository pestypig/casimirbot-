import { createWithEqualityFn } from "zustand/traditional";
import { persist } from "zustand/middleware";

export type WorkstationDockSide = "right" | "bottom";
export type WorkstationLayoutMode = "freeform" | "workstation";

export type WorkstationPanelGroup = {
  id: string;
  title?: string;
  panelIds: string[];
  activePanelId: string | null;
};

export type WorkstationLayoutNode =
  | {
      type: "group";
      groupId: string;
    }
  | {
      type: "split";
      direction: "row" | "column";
      ratio: number;
      children: [WorkstationLayoutNode, WorkstationLayoutNode];
    };

type WorkstationLayoutState = {
  mode: WorkstationLayoutMode;
  chatDock: {
    side: WorkstationDockSide;
    widthPx: number;
    collapsed: boolean;
  };
  activeGroupId: string;
  groups: Record<string, WorkstationPanelGroup>;
  root: WorkstationLayoutNode;
  mobileDrawer: {
    open: boolean;
    snap: "peek" | "half" | "full";
  };
  setMode: (mode: WorkstationLayoutMode) => void;
  setChatDockWidth: (widthPx: number) => void;
  toggleChatDock: () => void;
  openPanelInActiveGroup: (panelId: string) => void;
  openPanelInGroup: (groupId: string, panelId: string) => void;
  setActivePanel: (groupId: string, panelId: string) => void;
  closePanelFromGroup: (groupId: string, panelId: string) => void;
  splitActiveGroup: (direction: "row" | "column") => void;
  focusGroup: (groupId: string) => void;
  setMobileDrawerOpen: (open: boolean) => void;
  toggleMobileDrawer: () => void;
  setMobileDrawerSnap: (snap: "peek" | "half" | "full") => void;
};

const STORAGE_KEY = "workstation-layout-v1";
const PRIMARY_GROUP_ID = "group-primary";
const DOCK_MIN_WIDTH = 320;
const DOCK_MAX_WIDTH = 760;
const DEFAULT_DOCK_WIDTH = 420;

const createGroup = (id: string, title?: string): WorkstationPanelGroup => ({
  id,
  title,
  panelIds: [],
  activePanelId: null,
});

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ensureRoot = (
  root: WorkstationLayoutNode | null | undefined,
  activeGroupId: string,
): WorkstationLayoutNode => {
  if (root && typeof root === "object" && "type" in root) {
    return root;
  }
  return {
    type: "group",
    groupId: activeGroupId || PRIMARY_GROUP_ID,
  };
};

const ensureGroups = (
  groups: Record<string, WorkstationPanelGroup> | null | undefined,
  activeGroupId: string,
) => {
  const normalized = groups && typeof groups === "object" ? { ...groups } : {};
  if (!normalized[activeGroupId]) {
    normalized[activeGroupId] = createGroup(activeGroupId, "Primary");
  }
  return normalized;
};

const replaceGroupNode = (
  node: WorkstationLayoutNode,
  targetGroupId: string,
  replacement: WorkstationLayoutNode,
): WorkstationLayoutNode => {
  if (node.type === "group") {
    return node.groupId === targetGroupId ? replacement : node;
  }
  const left = replaceGroupNode(node.children[0], targetGroupId, replacement);
  const right = replaceGroupNode(node.children[1], targetGroupId, replacement);
  if (left === node.children[0] && right === node.children[1]) {
    return node;
  }
  return {
    ...node,
    children: [left, right],
  };
};

export const useWorkstationLayoutStore = createWithEqualityFn<WorkstationLayoutState>()(
  persist(
    (set, get) => ({
      mode: "workstation",
      chatDock: {
        side: "right",
        widthPx: DEFAULT_DOCK_WIDTH,
        collapsed: false,
      },
      activeGroupId: PRIMARY_GROUP_ID,
      groups: {
        [PRIMARY_GROUP_ID]: createGroup(PRIMARY_GROUP_ID, "Primary"),
      },
      root: {
        type: "group",
        groupId: PRIMARY_GROUP_ID,
      },
      mobileDrawer: {
        open: false,
        snap: "half",
      },
      setMode: (mode) => set(() => ({ mode })),
      setChatDockWidth: (widthPx) =>
        set((state) => ({
          chatDock: {
            ...state.chatDock,
            widthPx: clamp(Math.round(widthPx), DOCK_MIN_WIDTH, DOCK_MAX_WIDTH),
          },
        })),
      toggleChatDock: () =>
        set((state) => ({
          chatDock: {
            ...state.chatDock,
            collapsed: !state.chatDock.collapsed,
          },
        })),
      openPanelInActiveGroup: (panelId) => {
        const { activeGroupId, openPanelInGroup } = get();
        openPanelInGroup(activeGroupId, panelId);
      },
      openPanelInGroup: (groupId, panelId) =>
        set((state) => {
          if (!panelId) return state;
          const group = state.groups[groupId] ?? createGroup(groupId);
          const panelIds = group.panelIds.includes(panelId)
            ? group.panelIds
            : [...group.panelIds, panelId];
          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                panelIds,
                activePanelId: panelId,
              },
            },
            activeGroupId: groupId,
          };
        }),
      setActivePanel: (groupId, panelId) =>
        set((state) => {
          const group = state.groups[groupId];
          if (!group) return state;
          if (!group.panelIds.includes(panelId)) return state;
          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                activePanelId: panelId,
              },
            },
            activeGroupId: groupId,
          };
        }),
      closePanelFromGroup: (groupId, panelId) =>
        set((state) => {
          const group = state.groups[groupId];
          if (!group || !group.panelIds.includes(panelId)) return state;
          const panelIds = group.panelIds.filter((id) => id !== panelId);
          const nextActive = group.activePanelId === panelId ? panelIds[panelIds.length - 1] ?? null : group.activePanelId;
          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                panelIds,
                activePanelId: nextActive,
              },
            },
          };
        }),
      splitActiveGroup: (direction) =>
        set((state) => {
          const activeGroupId = state.activeGroupId || PRIMARY_GROUP_ID;
          const groups = ensureGroups(state.groups, activeGroupId);
          const nextGroupId = `group-${crypto.randomUUID()}`;
          const nextGroups = {
            ...groups,
            [nextGroupId]: createGroup(nextGroupId),
          };
          const replacement: WorkstationLayoutNode = {
            type: "split",
            direction,
            ratio: 0.5,
            children: [
              {
                type: "group",
                groupId: activeGroupId,
              },
              {
                type: "group",
                groupId: nextGroupId,
              },
            ],
          };
          return {
            groups: nextGroups,
            root: replaceGroupNode(ensureRoot(state.root, activeGroupId), activeGroupId, replacement),
            activeGroupId: nextGroupId,
          };
        }),
      focusGroup: (groupId) =>
        set((state) => {
          if (!state.groups[groupId]) return state;
          return {
            activeGroupId: groupId,
          };
        }),
      setMobileDrawerOpen: (open) =>
        set((state) => ({
          mobileDrawer: {
            ...state.mobileDrawer,
            open,
          },
        })),
      toggleMobileDrawer: () =>
        set((state) => ({
          mobileDrawer: {
            ...state.mobileDrawer,
            open: !state.mobileDrawer.open,
          },
        })),
      setMobileDrawerSnap: (snap) =>
        set((state) => ({
          mobileDrawer: {
            ...state.mobileDrawer,
            snap,
          },
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      partialize: (state) => ({
        mode: state.mode,
        chatDock: state.chatDock,
        activeGroupId: state.activeGroupId,
        groups: state.groups,
        root: state.root,
        mobileDrawer: state.mobileDrawer,
      }),
      merge: (persisted, current) => {
        const source = (persisted ?? {}) as Partial<WorkstationLayoutState>;
        const activeGroupId = source.activeGroupId ?? current.activeGroupId ?? PRIMARY_GROUP_ID;
        const groups = ensureGroups(source.groups, activeGroupId);
        return {
          ...current,
          ...source,
          activeGroupId,
          groups,
          root: ensureRoot(source.root, activeGroupId),
          mobileDrawer: {
            ...current.mobileDrawer,
            ...(source.mobileDrawer ?? {}),
          },
          chatDock: {
            ...current.chatDock,
            ...(source.chatDock ?? {}),
            widthPx: clamp(
              Number(source.chatDock?.widthPx ?? current.chatDock.widthPx),
              DOCK_MIN_WIDTH,
              DOCK_MAX_WIDTH,
            ),
          },
        };
      },
    },
  ),
);

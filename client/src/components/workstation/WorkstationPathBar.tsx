import { Fragment, useEffect, useState } from "react";
import { Check, Copy, Monitor, Send, X } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  buildWorkstationPanelPathRef,
  buildWorkstationPathRef,
  coerceWorkstationViewStateFromPathInput,
  normalizeWorkstationDocPath,
  type WorkstationPathRef,
} from "@/lib/workstation/workstationDeepLink";
import { useDocEquationContextStore } from "@/store/useDocEquationContextStore";
import { useDocViewerStore } from "@/store/useDocViewerStore";
import { useWorkstationLayoutStore } from "@/store/useWorkstationLayoutStore";
import { cn } from "@/lib/utils";

export function WorkstationPathBar({
  activePanelId,
  groupId,
}: {
  activePanelId: string | null | undefined;
  groupId: string;
}) {
  const docMode = useDocViewerStore((state) => state.mode);
  const currentDocPath = useDocViewerStore((state) => state.currentPath);
  const docAnchor = useDocViewerStore((state) => state.anchor);
  const latestEquationContext = useDocEquationContextStore((state) => state.latestContext);
  const openPanelInGroup = useWorkstationLayoutStore((state) => state.openPanelInGroup);
  const setActivePanel = useWorkstationLayoutStore((state) => state.setActivePanel);
  const focusGroup = useWorkstationLayoutStore((state) => state.focusGroup);
  const normalizedCurrentDocPath = normalizeWorkstationDocPath(currentDocPath);
  const activeEquationContext =
    activePanelId === "docs-viewer" &&
    docMode === "doc" &&
    latestEquationContext?.docPath === normalizedCurrentDocPath
      ? latestEquationContext
      : null;
  const pathRef =
    activeEquationContext?.pathRef && activeEquationContext.uri
      ? {
          ...activeEquationContext.pathRef,
          virtualUri: activeEquationContext.uri,
        }
      : activePanelId === "docs-viewer" && docMode === "doc"
        ? buildWorkstationPathRef(currentDocPath) ?? buildWorkstationPanelPathRef(activePanelId)
      : buildWorkstationPanelPathRef(activePanelId);

  if (!pathRef) return null;

  return (
    <WorkstationPathBreadcrumb
      pathRef={pathRef}
      anchor={activeEquationContext?.equationId ?? (activePanelId === "docs-viewer" ? docAnchor : undefined)}
      onNavigate={(value) => {
        const viewState = coerceWorkstationViewStateFromPathInput(value);
        if (!viewState) return false;
        const matchedEquationContext =
          activeEquationContext?.uri === value.trim()
            ? activeEquationContext
            : null;
        for (const panelId of viewState.panels) {
          openPanelInGroup(groupId, panelId);
        }
        for (const panelId of matchedEquationContext?.openedPanels ?? []) {
          openPanelInGroup(groupId, panelId);
        }
        if (viewState.activeDocPath) {
          useDocViewerStore.getState().viewDoc(
            viewState.activeDocPath,
            matchedEquationContext?.equationId ?? viewState.selectedObjectId ?? viewState.anchor,
          );
        }
        const focusPanel = viewState.focusPanel ?? (viewState.activeDocPath ? "docs-viewer" : undefined);
        if (focusPanel) {
          openPanelInGroup(groupId, focusPanel);
          setActivePanel(groupId, focusPanel);
          focusGroup(groupId);
        }
        return true;
      }}
    />
  );
}

function WorkstationPathBreadcrumb({
  pathRef,
  anchor,
  onNavigate,
}: {
  pathRef: WorkstationPathRef;
  anchor?: string;
  onNavigate: (value: string) => boolean;
}) {
  const [inputValue, setInputValue] = useState(pathRef.virtualUri);
  const [status, setStatus] = useState<"idle" | "copied" | "invalid">("idle");

  useEffect(() => {
    setInputValue(pathRef.virtualUri);
    setStatus("idle");
  }, [pathRef.virtualUri]);

  useEffect(() => {
    if (status === "idle") return;
    const timer = window.setTimeout(() => setStatus("idle"), 1400);
    return () => window.clearTimeout(timer);
  }, [status]);

  const copyCurrentPath = async () => {
    try {
      await navigator.clipboard.writeText(pathRef.virtualUri);
      setStatus("copied");
    } catch {
      setStatus("invalid");
    }
  };

  const submitPath = () => {
    const ok = onNavigate(inputValue);
    setStatus(ok ? "idle" : "invalid");
  };

  return (
    <div
      className="flex min-h-9 min-w-0 items-center gap-2 border-b border-white/10 bg-slate-950/45 px-3 py-1.5 text-xs text-slate-300"
      data-testid="workstation-path-bar"
      title={pathRef.virtualUri}
    >
      <Monitor className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      <Breadcrumb className="min-w-0 flex-1">
        <BreadcrumbList className="flex-nowrap gap-1 overflow-hidden text-xs text-slate-400 sm:gap-1.5">
          {pathRef.displaySegments.map((segment, index) => {
            const isLast = index === pathRef.displaySegments.length - 1;
            return (
              <Fragment key={`${segment}:${index}`}>
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbPage
                    className={cn(
                      "max-w-[11rem] truncate text-xs font-normal",
                      isLast ? "text-slate-100" : "text-slate-400",
                    )}
                    title={segment}
                  >
                    {segment}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                {!isLast ? <BreadcrumbSeparator className="text-slate-600" /> : null}
              </Fragment>
            );
          })}
          {anchor ? (
            <>
              <BreadcrumbSeparator className="text-slate-600" />
              <BreadcrumbItem className="min-w-0">
                <BreadcrumbPage
                  className="max-w-[10rem] truncate text-xs font-normal text-cyan-200"
                  title={`#${anchor}`}
                >
                  #{anchor}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>
      <form
        className="ml-auto flex min-w-[14rem] max-w-[28rem] flex-1 items-center gap-1 rounded-md border border-white/10 bg-black/20 px-1.5 py-1 focus-within:border-cyan-300/45 focus-within:bg-black/30"
        onSubmit={(event) => {
          event.preventDefault();
          submitPath();
        }}
      >
        <input
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="min-w-0 flex-1 bg-transparent px-1 text-xs text-slate-200 outline-none placeholder:text-slate-600"
          aria-label="Workspace path"
          data-testid="workstation-path-input"
          placeholder="workspace://workspace/docs/file.md"
        />
        <button
          type="button"
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-slate-400 hover:bg-white/10 hover:text-cyan-100"
          onClick={copyCurrentPath}
          title="Copy workspace path"
          aria-label="Copy workspace path"
        >
          {status === "copied" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <button
          type="submit"
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-white/10",
            status === "invalid" ? "text-amber-300" : "text-slate-300 hover:text-cyan-100",
          )}
          title={status === "invalid" ? "Use a workspace://, panels/, or docs/ path" : "Navigate workspace path"}
          aria-label="Navigate workspace path"
        >
          {status === "invalid" ? <X className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
        </button>
      </form>
    </div>
  );
}

import { useDocViewerStore } from "@/store/useDocViewerStore";
import { useDesktopStore } from "@/store/useDesktopStore";
import {
  DOC_VIEWER_PANEL_ID,
  makeDocHref,
  parseDocTarget,
  saveDocViewerIntent,
  type DocLinkDescriptor,
  type DocViewerIntent,
} from "./docViewer";

export function openDocPanel(target: DocLinkDescriptor) {
  const { path, anchor } = parseDocTarget(target);
  const intent: DocViewerIntent = { mode: "doc", path, anchor };
  const desktopState = useDesktopStore.getState();
  const hasWindow = Boolean(desktopState.windows[DOC_VIEWER_PANEL_ID]);

  if (hasWindow) {
    useDocViewerStore.getState().applyIntent(intent);
    desktopState.open(DOC_VIEWER_PANEL_ID);
    return;
  }

  // Queue the intent for the next desktop visit and fall back to opening the raw doc.
  saveDocViewerIntent(intent);
  if (typeof window !== "undefined") {
    window.open(makeDocHref(path, anchor), "_blank", "noopener");
  }
}

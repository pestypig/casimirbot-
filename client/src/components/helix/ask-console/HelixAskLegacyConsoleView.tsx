import React, {
  type ReactNode,
  type Ref,
} from "react";

import {
  HelixAskConsoleRuntimeLayout,
  type HelixAskConsoleRuntimeLayoutProps,
} from "./HelixAskConsoleRuntimeLayout";
import { HelixAskDebugDrawerSurface } from "./HelixAskDebugDrawerSurface";
import type { HelixAskDebugExportDrawerState } from "./HelixAskDebugDrawerState";
import {
  HelixAskConsoleErrorLineSurface,
  type HelixAskConsoleErrorLineSurfaceProps,
} from "./HelixAskConsoleErrorLineSurface";
import {
  HelixAskGoalPillSurface,
  type HelixAskGoalPillSurfaceProps,
} from "./HelixAskGoalPillSurface";
import { HelixAskSteeringQueueSurface } from "./HelixAskSteeringQueueSurface";
import {
  HelixAskSurfaceFrameSurface,
  type HelixAskSurfaceFrameSurfaceProps,
} from "./HelixAskSurfaceFrameSurface";
import {
  HelixAskLegacySurfaceContent,
  type HelixAskLegacySurfaceContentProps,
} from "./HelixAskLegacySurfaceContent";
import {
  HelixAskTurnListSurface,
  type HelixAskTurnListSurfaceProps,
} from "./HelixAskTurnListSurface";

export type HelixAskLegacyConsoleViewProps = Omit<HelixAskConsoleRuntimeLayoutProps, "surface"> & {
  debugDrawerState?: HelixAskDebugExportDrawerState;
  errorLineState?: HelixAskConsoleErrorLineSurfaceProps;
  errorMessage?: string | null;
  goalPillState?: HelixAskGoalPillSurfaceProps;
  onDebugDrawerClose?: (() => void) | null;
  surface?: ReactNode;
  surfaceContent?: ReactNode;
  surfaceContentState?: HelixAskLegacySurfaceContentProps;
  surfaceFrameState?: Omit<HelixAskSurfaceFrameSurfaceProps, "children">;
  turnListContent?: ReactNode;
  turnListRef?: Ref<HTMLDivElement>;
  turnListState?: Omit<HelixAskTurnListSurfaceProps, "children">;
};

export function HelixAskLegacyConsoleView({
  debugDrawer,
  debugDrawerState,
  errorLine,
  errorLineState,
  errorMessage,
  onDebugDrawerClose,
  goalPill,
  goalPillState,
  surface,
  surfaceContent,
  surfaceContentState,
  surfaceFrameState,
  steeringQueue,
  turnList,
  turnListContent,
  turnListRef,
  turnListState,
  ...props
}: HelixAskLegacyConsoleViewProps) {
  return (
    <HelixAskConsoleRuntimeLayout
      {...props}
      surface={
        surface ??
        (surfaceFrameState ? (
          <HelixAskSurfaceFrameSurface {...surfaceFrameState}>
            {surfaceContent ?? (surfaceContentState ? <HelixAskLegacySurfaceContent {...surfaceContentState} /> : null)}
          </HelixAskSurfaceFrameSurface>
        ) : (
          surfaceContent ?? (surfaceContentState ? <HelixAskLegacySurfaceContent {...surfaceContentState} /> : null)
        ))
      }
      debugDrawer={
        debugDrawer ??
        <HelixAskDebugDrawerSurface
          drawerState={debugDrawerState}
          onClose={onDebugDrawerClose ?? undefined}
        />
      }
      errorLine={errorLine ?? <HelixAskConsoleErrorLineSurface {...(errorLineState ?? { message: errorMessage })} />}
      goalPill={goalPill ?? (goalPillState ? <HelixAskGoalPillSurface {...goalPillState} /> : null)}
      steeringQueue={steeringQueue ?? <HelixAskSteeringQueueSurface />}
      turnList={
        turnList ??
        (turnListState ? (
          <HelixAskTurnListSurface {...turnListState} ref={turnListRef}>
            {turnListContent}
          </HelixAskTurnListSurface>
        ) : (
          turnListContent ?? null
        ))
      }
    />
  );
}

import type { ReactNode } from "react";

export type HelixAskSurfaceComposerPanelProps = {
  voiceLevelMonitor?: ReactNode;
  moodAvatar: ReactNode;
  actionToolbar: ReactNode;
  textarea: ReactNode;
};

export function HelixAskSurfaceComposerPanel({
  voiceLevelMonitor = null,
  moodAvatar,
  actionToolbar,
  textarea,
}: HelixAskSurfaceComposerPanelProps) {
  return (
    <>
      {voiceLevelMonitor}
      <div className="flex flex-col gap-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {moodAvatar}
          {actionToolbar}
        </div>
        {textarea}
      </div>
    </>
  );
}

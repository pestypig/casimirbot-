export type HelixAskCalculatorPanelLaunchSurfaceProps = {
  visible: boolean;
  onOpen: () => void;
};

export function HelixAskCalculatorPanelLaunchSurface({
  visible,
  onOpen,
}: HelixAskCalculatorPanelLaunchSurfaceProps) {
  if (!visible) return null;
  return (
    <button
      type="button"
      className="text-[10px] uppercase tracking-[0.2em] text-emerald-300 hover:text-emerald-200"
      onClick={onOpen}
    >
      Open Calculator Panel
    </button>
  );
}

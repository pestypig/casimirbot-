import { useEffect, useRef } from "react";

export function WorkstationResizeRail({
  onResize,
}: {
  onResize: (deltaX: number) => void;
}) {
  const startXRef = useRef<number | null>(null);

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      if (startXRef.current === null) return;
      const delta = startXRef.current - event.clientX;
      startXRef.current = event.clientX;
      onResize(delta);
    };
    const handleUp = () => {
      startXRef.current = null;
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [onResize]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className="w-1.5 cursor-col-resize bg-transparent hover:bg-sky-400/30"
      onMouseDown={(event) => {
        event.preventDefault();
        startXRef.current = event.clientX;
      }}
    />
  );
}

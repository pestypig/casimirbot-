import * as React from "react";

export function Tooltip({
  children,
  label,
  side = "top",
}: {
  children: React.ReactNode;
  label: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <span className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          className={[
            "absolute z-[60] max-w-[28rem] rounded-md bg-slate-900/95 text-slate-100",
            "shadow-xl ring-1 ring-white/10 px-3 py-2 text-xs leading-snug",
            side === "top" && "bottom-full mb-2 left-1/2 -translate-x-1/2",
            side === "bottom" && "top-full mt-2 left-1/2 -translate-x-1/2",
            side === "left" && "right-full mr-2 top-1/2 -translate-y-1/2",
            side === "right" && "left-full ml-2 top-1/2 -translate-y-1/2",
          ].join(" ")}
        >
          {label}
        </div>
      )}
    </span>
  );
}
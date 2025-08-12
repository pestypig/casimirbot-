// components/LumaOverlayHost.tsx
import * as React from "react";
import { LumaWhisper } from "./LumaWhisper";
import { subscribe, unsubscribe } from "@/lib/luma-bus";

export function LumaOverlayHost() {
  const [msg, setMsg] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const id = subscribe("luma:whisper", (p: any) => setMsg(p.text));
    return () => unsubscribe(id);
  }, []);
  
  if (!msg) return null;
  
  return <LumaWhisper text={msg} onDone={() => setMsg(null)} />;
}
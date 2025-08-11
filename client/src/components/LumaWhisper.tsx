"use client";

// components/LumaWhisper.tsx
import * as React from "react";

export function LumaWhisper({
  icon="/luma/Luma_29.png",
  text,
  onDone,
  msPerChar=18,
  stayMs=2200,
}:{
  icon?: string;
  text: string;
  onDone?: ()=>void;
  msPerChar?: number;
  stayMs?: number;
}) {
  const [shown, setShown] = React.useState("");
  React.useEffect(()=>{
    let i = 0;
    const id = setInterval(()=>{
      i++; setShown(text.slice(0,i));
      if (i >= text.length) { clearInterval(id); setTimeout(()=>onDone?.(), stayMs); }
    }, msPerChar);
    return ()=>clearInterval(id);
  }, [text, msPerChar, stayMs, onDone]);

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3 px-3 py-2 rounded-2xl border bg-slate-950/85 border-slate-700 backdrop-blur shadow-lg">
      <img 
        src={icon} 
        alt="Luma" 
        className="w-8 h-8 drop-shadow" 
        onError={(e) => { 
          console.warn("Luma icon not found:", icon); 
          (e.currentTarget as HTMLImageElement).style.display = "none"; 
        }}
      />
      <p className="text-sm text-slate-100 leading-snug">
        {shown}
        <span className="inline-block w-[6px] animate-pulse">▌</span>
      </p>
    </div>
  );
}
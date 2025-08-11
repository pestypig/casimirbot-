"use client";
import { useEffect, useState } from "react";

export default function AssetProbe(){
  const [s,set]=useState("checking…");
  useEffect(()=>{Promise.all([
    fetch("/luma/Luma_29.png",{cache:"no-store"}),
    fetch("/luma/Butler.glb",{cache:"no-store"}),
  ]).then(([a,b])=>set(`/luma/Luma_29.png: ${a.status} | /luma/Butler.glb: ${b.status}`))
    .catch(e=>set(`error: ${String(e)}`));},[]);
  return <div style={{position:"fixed",right:8,bottom:8,zIndex:9999,background:"rgba(0,0,0,.6)",color:"#fff",padding:"6px 8px",borderRadius:8,fontSize:12}}>AssetProbe: {s}</div>;
}
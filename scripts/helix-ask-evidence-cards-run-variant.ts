import fs from 'node:fs/promises';
import path from 'node:path';

type PromptRow={id:string;bucket:string;prompt:string};
const VARIANT=(process.env.HELIX_ASK_AB_VARIANT??'A');
const BASE=process.env.HELIX_ASK_BASE_URL??'http://127.0.0.1:5173';
const SEEDS=(process.env.HELIX_ASK_AB_SEEDS??'7,11,13').split(',').map(Number);
const promptsPath='bench/helix_ask_evidence_cards_prompts.jsonl';

async function ask(body:any){
  const t=Date.now();
  const res=await fetch(new URL('/api/agi/ask',BASE),{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const latency_ms=Date.now()-t;
  let payload:any={};
  try{ payload=await res.json(); }catch{ payload={text:await res.text()}; }
  return {status:res.status,latency_ms,payload};
}

const main=async()=>{
  const lines=(await fs.readFile(promptsPath,'utf8')).trim().split('\n');
  const prompts=lines.map(l=>JSON.parse(l) as PromptRow);
  const outDir=path.join('artifacts/evidence-cards-ab',VARIANT,'raw');
  await fs.mkdir(outDir,{recursive:true});
  let i=0;
  for(const p of prompts){
    for(const seed of SEEDS){
      i++;
      const outPath=path.join(outDir,`${p.id}__seed${seed}.json`);
      try{ await fs.access(outPath); continue; }catch{}
      const res=await ask({question:p.prompt,debug:true,seed,temperature:0.2,tuning:{fast_quality_mode:false}});
      const row={variant:VARIANT,prompt_id:p.id,bucket:p.bucket,prompt:p.prompt,seed,...res,response:res.payload};
      await fs.writeFile(outPath,JSON.stringify(row,null,2));
      if(i%30===0) console.log(`${VARIANT}: ${i}/${prompts.length*SEEDS.length}`);
    }
  }
};
main().catch(e=>{console.error(e);process.exit(1)});

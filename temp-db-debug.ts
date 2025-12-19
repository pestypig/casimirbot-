import {persistKnowledgeBundles, fetchKnowledgeForProjects} from "./server/services/knowledge/corpus";
(async()=>{
  const bundle=[{project:{id:"project:test",name:"Test Project",tags:["docs"],type:"docs",hashSlug:"test-project"},summary:"Test project bundle",files:[{id:"file:alpha",name:"alpha.md",mime:"text/markdown",size:256,hashSlug:"alpha-md",kind:"text",preview:"Alpha document describes warp safety procedures.",contentBase64:Buffer.from("Alpha document full body.").toString("base64")}]}];
  await persistKnowledgeBundles(bundle as any);
  const fetched=await fetchKnowledgeForProjects(["project:test"], {goal:'Summarize the synced warp safety procedures.', extraKeywords: [], maxBytes: 10_000, maxFilesPerProject: 4});
  console.log(JSON.stringify(fetched,null,2));
})();

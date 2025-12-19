const {getPool, ensureDatabase} = require("./server/db/client");
(async()=>{
  await ensureDatabase();
  const pool = getPool();
  const res = await pool.query("SELECT project_id,file_id FROM knowledge_file WHERE project_id = ANY($1::text[])", [["project:test"]]);
  console.log(res.rows);
})();

const http = require("http");
const payload = JSON.stringify({ question: "What is a warp bubble?", debug: true, verbosity: "extended", max_tokens: 350, temperature: 0.2 });
const req = http.request({ hostname: "localhost", port: 5050, path: "/api/agi/ask", method: "POST", timeout: 90000, headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => {
  let body = "";
  res.setEncoding("utf8");
  res.on("data", (c) => (body += c));
  res.on("end", () => {
    try {
      const j = JSON.parse(body);
      const d = j?.debugContext || j?.debug || {};
      const qr = Array.isArray(d.objective_retrieval_queries) ? d.objective_retrieval_queries : [];
      const rf = Array.isArray(d.objective_retrieval_selected_files) ? d.objective_retrieval_selected_files : [];
      const st = Array.isArray(d.objective_loop_state) ? d.objective_loop_state : [];
      const out = {
        revision: d.objective_loop_patch_revision,
        objective_count: d.objective_count,
        retrieval_query_entries: qr.length,
        retrieval_selected_file_entries: rf.length,
        loop_state: st.map((x) => ({ id: x.objective_id, status: x.status, attempt: x.attempt, matched_slots: x.matched_slots, required_slots: x.required_slots })),
        missing_scoped_retrieval_count: d.objective_missing_scoped_retrieval_count,
        recovery_count: d.objective_scoped_retrieval_recovery_count,
        recovery_error_count: d.objective_scoped_retrieval_recovery_error_count,
        mini_validation: d.objective_mini_validation,
        assembly_mode: d.objective_assembly_mode,
      };
      console.log(JSON.stringify(out, null, 2));
    } catch (err) {
      console.error(String(err));
      console.error(body.slice(0, 1000));
      process.exitCode = 1;
    }
  });
});
req.on("timeout", () => { console.error("timeout"); req.destroy(new Error("timeout")); });
req.on("error", (err) => { console.error(String(err)); process.exitCode = 1; });
req.write(payload);
req.end();

const http = require("http");
const payload = JSON.stringify({
  question: "What is a warp bubble?",
  debug: true,
  verbosity: "extended",
  max_tokens: 350,
  temperature: 0.2,
});
const req = http.request({ hostname: "localhost", port: 5050, path: "/api/agi/ask", method: "POST", timeout: 90000, headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => {
  let body = "";
  res.setEncoding("utf8");
  res.on("data", (c) => (body += c));
  res.on("end", () => {
    try {
      const j = JSON.parse(body);
      const d = j?.debugContext || j?.debug || {};
      const out = {
        statusCode: res.statusCode,
        objective_loop_patch_revision: d?.objective_loop_patch_revision,
        objective_count: d?.objective_count,
        objective_retrieval_queries_count: d?.objective_retrieval_queries_count,
        objective_recovery_count: d?.objective_scoped_retrieval_recovery_count,
        objective_recovery_error_count: d?.objective_scoped_retrieval_recovery_error_count,
        objective_recovery_error_codes: d?.objective_scoped_retrieval_recovery_error_codes,
        objective_missing_scoped_retrieval_count: d?.objective_missing_scoped_retrieval_count,
        objective_mini_validation: d?.objective_mini_validation,
        objective_assembly_mode: d?.objective_assembly_mode,
        answer_path_tail: Array.isArray(d?.answer_path) ? d.answer_path.slice(-14) : null,
        textPreview: String(j?.answer || j?.text || "").slice(0, 360),
      };
      console.log(JSON.stringify(out, null, 2));
    } catch (err) {
      console.error("json_parse_error", String(err));
      console.error(body.slice(0, 1200));
      process.exitCode = 1;
    }
  });
});
req.on("timeout", () => { console.error("request_timeout"); req.destroy(new Error("request_timeout")); });
req.on("error", (err) => { console.error("request_error", String(err)); process.exitCode = 1; });
req.write(payload);
req.end();

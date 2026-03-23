const http = require("http");
const payload = JSON.stringify({ question: "# Mini Contract\n\n## Hard Constraints\n1. Preserve this boundary statement verbatim:\n\"Boundary text.\"\n\n## Required Repo Inputs\n- docs/does-not-exist.md\n\n## Fail-Closed Behavior\nIf any required repo input is missing or unreadable:\n- return blocked=true\n- list the missing paths\n- set stop_reason=Fail-closed\n- do not complete the manuscript\n", debug: true, mode: "read" });
const req = http.request({ hostname: "localhost", port: 5050, path: "/api/agi/ask", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => {
  let body = "";
  res.setEncoding("utf8");
  res.on("data", (c) => body += c);
  res.on("end", () => {
    try {
      const j = JSON.parse(body);
      const d = j?.debugContext || j?.debug || {};
      const out = {
        statusCode: res.statusCode,
        text: String(j?.answer || j?.text || "").slice(0,700),
        mode: d?.prompt_contract_mode ?? null,
        missing: d?.prompt_contract_missing_inputs ?? null,
        blocked: d?.answer_blocked ?? null,
        stop: d?.answer_stop_reason ?? null,
        llm: d?.llm_invoke_attempted ?? null,
        path: d?.answer_path ?? null,
        validation: d?.answer_validation_failures ?? null
      };
      console.log(JSON.stringify(out,null,2));
    } catch (err) {
      console.error(body.slice(0,1500));
      process.exitCode = 1;
    }
  });
});
req.on("error", (err) => { console.error(String(err)); process.exitCode = 1; });
req.write(payload);
req.end();

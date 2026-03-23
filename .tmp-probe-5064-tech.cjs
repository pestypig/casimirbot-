const http = require("http");
const payload = JSON.stringify({ question: "Explain how answer_path is populated and useful for diagnostics.", debug: true, mode: "read" });
const req = http.request({ hostname: "localhost", port: 5064, path: "/api/agi/ask", method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload) } }, (res) => {
  let body = "";
  res.setEncoding("utf8");
  res.on("data", (c) => body += c);
  res.on("end", () => {
    const j = JSON.parse(body);
    const d = j.debugContext || j.debug || {};
    console.log(JSON.stringify({
      text: String(j.answer || j.text || "").slice(0, 700),
      llm: d.llm_invoke_attempted ?? null,
      family: d.turn_contract_output_family ?? null,
      path: d.answer_path ?? null,
      validation: d.answer_validation_failures ?? null
    }, null, 2));
  });
});
req.on("error", (e) => { console.error(String(e)); process.exit(1); });
req.write(payload);
req.end();

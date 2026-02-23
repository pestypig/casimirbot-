import "@testing-library/jest-dom/vitest";

// Keep test output bounded; massive tool-log stdout floods can OOM vitest workers.
if (!process.env.TOOL_LOG_STDOUT) {
  process.env.TOOL_LOG_STDOUT = "0";
}

// Bound in-memory tool-log retention in tests to avoid heap blowups in heavy ask suites.
if (!process.env.TOOL_LOG_BUFFER_SIZE) {
  process.env.TOOL_LOG_BUFFER_SIZE = "25";
}
if (!process.env.TOOL_LOG_TENANT_BUFFER_SIZE) {
  process.env.TOOL_LOG_TENANT_BUFFER_SIZE = "25";
}

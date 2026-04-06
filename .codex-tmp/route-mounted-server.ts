import express from "express";
import { createServer } from "http";
import { patchExpressAsyncHandlers } from "../server/utils/express-async-guard";
import { registerMetricsEndpoint } from "../server/metrics/index";
import { jwtMiddleware } from "../server/auth/jwt";
import { otelMiddleware } from "../server/services/observability/otel-middleware";
import { registerRoutes } from "../server/routes";

patchExpressAsyncHandlers();

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: false, limit: "50mb" }));
registerMetricsEndpoint(app);
app.use(otelMiddleware);
app.use(jwtMiddleware);

const server = createServer(app);
await registerRoutes(app, server);

server.listen(5050, "127.0.0.1", () => {
  console.log("route-mounted server listening on http://127.0.0.1:5050");
});

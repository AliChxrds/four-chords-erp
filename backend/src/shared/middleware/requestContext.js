import { randomUUID } from "node:crypto";

import { logger } from "../logging/logger.js";

// Reuse a caller's X-Request-Id only when it is a plain token,
// so it cannot inject content into logs or response headers.
const requestIdPattern = /^[A-Za-z0-9._-]{1,100}$/;

export function requestContext(req, res, next) {
    const incoming = req.get("x-request-id");
    const requestId = incoming && requestIdPattern.test(incoming) ? incoming : randomUUID();
    const startedAt = process.hrtime.bigint();

    req.id = requestId;
    req.log = logger.child({ requestId });
    res.set("X-Request-Id", requestId);

    res.on("finish", () => {
        req.log.info("Request completed", {
            method: req.method,
            // Path only: query strings can carry search terms such as names.
            path: req.originalUrl.split("?")[0],
            status: res.statusCode,
            durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6
        });
    });

    next();
}

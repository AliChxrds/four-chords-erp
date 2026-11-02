import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { after, before, describe, it } from "node:test";
import { fileURLToPath } from "node:url";

// These checks need no database. Port 1 is never a PostgreSQL server,
// so the readiness check must report the database as unavailable.
// Set before importing the app, which reads configuration on import.
Object.assign(process.env, {
    LOG_LEVEL: "silent",
    CORS_ORIGINS: "https://erp.example.test",
    RATE_LIMIT_MAX: "20",
    DB_HOST: "127.0.0.1",
    DB_PORT: "1",
    DB_NAME: "unreachable",
    DB_USER: "unreachable"
});

const { default: app } = await import("../src/app.js");
const { default: pool } = await import("../src/config/database.js");

const backendDir = fileURLToPath(new URL("..", import.meta.url));

describe("application shell", () => {
    let server;
    let baseUrl;

    before(async () => {
        server = app.listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
        baseUrl = `http://127.0.0.1:${server.address().port}`;
    });

    after(async () => {
        await new Promise((resolve) => server.close(resolve));
        await pool.end();
    });

    const call = async (path, { method = "GET", headers = {}, body } = {}) => {
        const response = await fetch(`${baseUrl}${path}`, { method, headers, body });
        return { status: response.status, headers: response.headers, body: await response.json() };
    };

    it("keeps the root startup message", async () => {
        const response = await call("/");

        assert.equal(response.status, 200);
        assert.equal(response.body.message, "Four Chords ERP API is running");
    });

    it("reports liveness on /health", async () => {
        const response = await call("/health");

        assert.equal(response.status, 200);
        assert.deepEqual(response.body, { success: true, status: "ok" });
    });

    it("reports the database as unavailable on /health/ready without leaking details", async () => {
        const response = await call("/health/ready");

        assert.equal(response.status, 503);
        assert.equal(response.body.success, false);
        assert.equal(response.body.code, "DATABASE_UNAVAILABLE");
        assert.doesNotMatch(JSON.stringify(response.body), /ECONNREFUSED|127\.0\.0\.1/);
    });

    it("assigns a request ID and reuses a safe incoming one", async () => {
        const generated = await call("/health");
        assert.match(generated.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);

        const reused = await call("/health", { headers: { "X-Request-Id": "trace-123.abc" } });
        assert.equal(reused.headers.get("x-request-id"), "trace-123.abc");

        const replaced = await call("/health", { headers: { "X-Request-Id": "has spaces <script>" } });
        assert.match(replaced.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
    });

    it("sets security headers and hides the framework", async () => {
        const response = await call("/health");

        assert.equal(response.headers.get("x-content-type-options"), "nosniff");
        assert.equal(response.headers.get("x-powered-by"), null);
    });

    it("allows only configured browser origins", async () => {
        const allowed = await call("/health", { headers: { Origin: "https://erp.example.test" } });
        assert.equal(allowed.headers.get("access-control-allow-origin"), "https://erp.example.test");

        const denied = await call("/health", { headers: { Origin: "https://evil.example" } });
        assert.equal(denied.headers.get("access-control-allow-origin"), null);
    });

    it("returns JSON 404s for unknown routes", async () => {
        for (const path of ["/nope", "/api/unknown"]) {
            const response = await call(path);

            assert.equal(response.status, 404, path);
            assert.deepEqual(response.body, { success: false, code: "NOT_FOUND", message: "Route not found" });
        }
    });

    it("returns JSON 400 for malformed JSON on both customer paths", async () => {
        for (const path of ["/api/customers", "/api/v1/customers"]) {
            const response = await call(path, {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{\"first_name\": "
            });

            assert.equal(response.status, 400, path);
            assert.equal(response.body.code, "INVALID_JSON");
            assert.equal(response.body.success, false);
        }
    });

    it("returns JSON 413 for oversized bodies", async () => {
        const response = await call("/api/v1/customers", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ notes: "x".repeat(200 * 1024) })
        });

        assert.equal(response.status, 413);
        assert.equal(response.body.code, "PAYLOAD_TOO_LARGE");
    });

    // Runs last: it uses up the /api allowance for this server.
    it("rate limits /api with a JSON 429", async () => {
        let limited;

        for (let attempt = 0; attempt < 25 && !limited; attempt += 1) {
            const response = await call("/api/unknown");
            if (response.status === 429) limited = response;
        }

        assert.ok(limited, "expected a 429 within 25 requests");
        assert.equal(limited.body.code, "RATE_LIMITED");
        assert.ok(limited.headers.get("ratelimit-policy"));

        // Health checks are outside the limit.
        assert.equal((await call("/health")).status, 200);
    });
});

describe("startup configuration", () => {
    it("refuses to start with invalid settings and names the problem", () => {
        const result = spawnSync(process.execPath, ["src/server.js"], {
            cwd: backendDir,
            env: { ...process.env, LOG_LEVEL: "error", DB_PORT: "not-a-port", PORT: "0" },
            encoding: "utf8",
            timeout: 15000
        });

        assert.equal(result.status, 1);
        assert.match(result.stderr, /DB_PORT must be an integer/);
    });
});

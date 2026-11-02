import dotenv from "dotenv";

// Load backend/.env regardless of the directory the process was started from.
// Variables already set in the environment win over the file.
dotenv.config({
    path: new URL("../../.env", import.meta.url),
    quiet: true
});

const logLevels = ["debug", "info", "warn", "error", "silent"];

const errors = [];

const readText = (name, fallback = "") => {
    const value = process.env[name];
    return value === undefined ? fallback : value.trim();
};

const readInteger = (name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
    const raw = readText(name);

    if (raw === "") {
        return fallback;
    }

    const value = Number(raw);

    if (!Number.isInteger(value) || value < min || value > max) {
        errors.push(`${name} must be an integer between ${min} and ${max}`);
        return fallback;
    }

    return value;
};

const readRequired = (name) => {
    const value = readText(name);

    if (value === "") {
        errors.push(`${name} is required`);
    }

    return value;
};

// Express accepts true/false, a hop count, or a list of trusted addresses.
const readTrustProxy = () => {
    const raw = readText("TRUST_PROXY", "false");

    if (raw === "true") return true;
    if (raw === "false" || raw === "") return false;
    if (/^\d+$/.test(raw)) return Number(raw);

    return raw;
};

const nodeEnv = readText("NODE_ENV", "development");

const logLevel = readText("LOG_LEVEL", "info");

if (!logLevels.includes(logLevel)) {
    errors.push(`LOG_LEVEL must be one of ${logLevels.join(", ")}`);
}

// Comma-separated list of browser origins allowed to call the API, e.g.
// https://erp.wearefourchords.com,http://localhost:5173. Empty allows none.
const corsOrigins = readText("CORS_ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

for (const origin of corsOrigins) {
    if (!/^https?:\/\/[^/\s]+$/.test(origin)) {
        errors.push(`CORS_ORIGINS entry "${origin}" must be an origin such as https://example.com`);
    }
}

export const config = {
    nodeEnv,
    isProduction: nodeEnv === "production",
    port: readInteger("PORT", 5000, { min: 0, max: 65535 }),
    logLevel: logLevels.includes(logLevel) ? logLevel : "info",
    trustProxy: readTrustProxy(),
    corsOrigins,
    rateLimit: {
        windowMs: readInteger("RATE_LIMIT_WINDOW_MS", 15 * 60 * 1000, { min: 1000 }),
        max: readInteger("RATE_LIMIT_MAX", 300, { min: 1 })
    },
    db: {
        host: readText("DB_HOST", "localhost"),
        port: readInteger("DB_PORT", 5432, { min: 1, max: 65535 }),
        database: readRequired("DB_NAME"),
        user: readRequired("DB_USER"),
        password: readText("DB_PASSWORD"),
        poolMax: readInteger("DB_POOL_MAX", 10, { min: 1, max: 100 }),
        statementTimeoutMs: readInteger("DB_STATEMENT_TIMEOUT_MS", 15000)
    }
};

// Importing this module never throws, so tests and tools can load the app
// without a full environment. Entry points call this to fail fast instead.
export function assertValidConfig() {
    if (errors.length > 0) {
        throw new Error(
            `Invalid configuration (check backend/.env):\n- ${errors.join("\n- ")}`
        );
    }
}

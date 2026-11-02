import { config } from "../../config/env.js";

// One JSON object per line, so a log collector can parse entries without
// extra configuration. Request bodies and query strings are never logged
// because they can contain personal data.

const levels = { debug: 10, info: 20, warn: 30, error: 40, silent: Infinity };

// Keep fields useful for diagnosis but drop pg's `detail`, which can echo
// submitted values such as email addresses.
const serializeError = (error) => ({
    name: error.name,
    message: error.message,
    ...(error.code && { code: error.code }),
    ...(error.constraint && { constraint: error.constraint }),
    stack: error.stack
});

const serializeFields = (fields) =>
    Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [
            key,
            value instanceof Error ? serializeError(value) : value
        ])
    );

const write = (level, bindings, message, fields = {}) => {
    if (levels[level] < levels[config.logLevel]) {
        return;
    }

    const line = JSON.stringify({
        time: new Date().toISOString(),
        level,
        message,
        ...bindings,
        ...serializeFields(fields)
    });

    if (level === "error" || level === "warn") {
        console.error(line);
    } else {
        console.log(line);
    }
};

export function createLogger(bindings = {}) {
    return {
        debug: (message, fields) => write("debug", bindings, message, fields),
        info: (message, fields) => write("info", bindings, message, fields),
        warn: (message, fields) => write("warn", bindings, message, fields),
        error: (message, fields) => write("error", bindings, message, fields),
        child: (extra) => createLogger({ ...bindings, ...extra })
    };
}

export const logger = createLogger();

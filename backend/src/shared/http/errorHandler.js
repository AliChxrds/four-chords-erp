import { AppError } from "./errors.js";

// Every error response uses the same shape as the customer endpoints:
// { success: false, code, message }.

const send = (res, status, code, message) =>
    res.status(status).json({ success: false, code, message });

export function notFoundHandler(req, res) {
    send(res, 404, "NOT_FOUND", "Route not found");
}

// Express recognises error middleware by its four parameters.
export function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof AppError) {
        return send(res, error.status, error.code, error.message);
    }

    // Errors raised by express.json() while reading the body.
    if (error.type === "entity.parse.failed") {
        return send(res, 400, "INVALID_JSON", "Request body must be valid JSON");
    }

    if (error.type === "entity.too.large") {
        return send(res, 413, "PAYLOAD_TOO_LARGE", "Request body is too large");
    }

    if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
        return send(res, error.status, "BAD_REQUEST", "The request could not be processed");
    }

    req.log.error("Unhandled request error", { error });

    send(res, 500, "INTERNAL_ERROR", "An unexpected error occurred");
}

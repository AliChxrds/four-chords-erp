// An error whose message is safe to show to the API caller.
// Anything else that reaches the error handler is reported as a generic 500.
export class AppError extends Error {
    constructor(status, code, message) {
        super(message);
        this.name = "AppError";
        this.status = status;
        this.code = code;
    }
}

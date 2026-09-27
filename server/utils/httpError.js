// ─── Shared HTTP error helpers ───
// Controllers throw HttpError for expected failures (validation, conflicts, not found)
// and pass everything to handleError, which maps known Mongoose/Mongo errors to 4xx
// and never leaks internal messages for 5xx responses.

export class HttpError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const httpError = (statusCode, message) => new HttpError(statusCode, message);

export const handleError = (res, error, context = "Request") => {
    if (error instanceof HttpError) {
        return res.status(error.statusCode).json({ message: error.message });
    }
    if (error?.name === "CastError") {
        return res.status(400).json({ message: "Invalid identifier or value" });
    }
    if (error?.name === "ValidationError") {
        const first = Object.values(error.errors || {})[0];
        return res.status(400).json({ message: first?.message || "Validation failed" });
    }
    if (error?.code === 11000) {
        return res.status(409).json({ message: "A record with this value already exists" });
    }
    console.error(`${context} error:`, error);
    return res.status(500).json({ message: "Something went wrong. Please try again." });
};

// Escape user/admin-controlled strings before interpolating into HTML emails
export const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

export const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

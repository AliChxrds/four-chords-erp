import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { config } from "./config/env.js";
import { requestContext } from "./shared/middleware/requestContext.js";
import { errorHandler, notFoundHandler } from "./shared/http/errorHandler.js";
import healthRoutes from "./routes/healthRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";

const app = express();

// Needed for correct client IPs (rate limiting, logs) behind a reverse proxy.
app.set("trust proxy", config.trustProxy);

app.use(requestContext);
app.use(helmet());

// Browsers may call the API only from the configured origins.
// Server-to-server requests send no Origin header and are unaffected.
app.use(cors({
    origin: (origin, callback) => {
        callback(null, !origin || config.corsOrigins.includes(origin));
    }
}));

app.use(express.json({ limit: "100kb" }));


// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Four Chords ERP API is running"
    });
});


// Health checks sit outside /api so monitoring is never rate limited.
app.use("/health", healthRoutes);


app.use("/api", rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit: config.rateLimit.max,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: {
        success: false,
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later."
    }
}));


// Customer routes. /api/customers is kept for existing clients;
// new clients should use the versioned path.
app.use("/api/v1/customers", customerRoutes);
app.use("/api/customers", customerRoutes);


app.use(notFoundHandler);
app.use(errorHandler);


export default app;

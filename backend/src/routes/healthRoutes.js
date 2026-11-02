import express from "express";

import pool from "../config/database.js";

const router = express.Router();

// GET /health
// Liveness: the process is running and serving HTTP. No dependencies checked.
router.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        status: "ok"
    });
});

// GET /health/ready
// Readiness: the API can reach PostgreSQL. Failure details stay in the logs.
router.get("/ready", async (req, res) => {
    try {
        await pool.query("SELECT 1");

        res.status(200).json({
            success: true,
            status: "ready"
        });
    } catch (error) {
        req.log.error("Readiness check failed", { error });

        res.status(503).json({
            success: false,
            code: "DATABASE_UNAVAILABLE",
            status: "unavailable",
            message: "Database is not reachable"
        });
    }
});

export default router;

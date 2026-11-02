import { assertValidConfig, config } from "./config/env.js";
import { logger } from "./shared/logging/logger.js";
import app from "./app.js";
import pool from "./config/database.js";

try {
    assertValidConfig();
} catch (error) {
    logger.error(error.message);
    process.exit(1);
}

const server = app.listen(config.port, () => {
    logger.info("Four Chords ERP API listening", {
        port: server.address().port,
        nodeEnv: config.nodeEnv
    });
});


// Stop accepting connections, let in-flight requests finish, then close the
// database pool. Give up after 10 seconds so a stuck request cannot block a deploy.
let shuttingDown = false;

const shutdown = (signal) => {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;
    logger.info("Shutting down", { signal });

    const forceExit = setTimeout(() => {
        logger.error("Shutdown timed out; exiting");
        process.exit(1);
    }, 10000);
    forceExit.unref();

    server.close(async (error) => {
        try {
            await pool.end();
        } catch (poolError) {
            logger.error("Failed to close database pool", { error: poolError });
        }

        process.exit(error ? 1 : 0);
    });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

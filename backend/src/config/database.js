import pg from "pg";

import { config } from "./env.js";
import { logger } from "../shared/logging/logger.js";

const { Pool } = pg;

// Creating a pool does not connect; connections open on first query.
export function createPool({ statementTimeoutMs = config.db.statementTimeoutMs } = {}) {
    const pool = new Pool({
        user: config.db.user,
        host: config.db.host,
        database: config.db.database,
        password: config.db.password,
        port: config.db.port,
        max: config.db.poolMax,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
        application_name: "four-chords-erp",
        // 0 disables the limit, which the migration runner needs.
        ...(statementTimeoutMs > 0 && { statement_timeout: statementTimeoutMs })
    });

    // Without a listener, an idle client losing its connection crashes the process.
    pool.on("error", (error) => {
        logger.error("Idle database client error", { error });
    });

    return pool;
}

const pool = createPool();

export default pool;

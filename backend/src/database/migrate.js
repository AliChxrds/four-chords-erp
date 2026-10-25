import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const migrationsDir = fileURLToPath(new URL("../../../database/migrations/", import.meta.url));

// The caller owns the pool; all migration work uses one locked connection.
export async function runMigrations(pool, { directory = migrationsDir, log = console.log } = {}) {
    const client = await pool.connect();
    let locked = false;
    try {
        await client.query("SELECT pg_advisory_lock(4062026, 1)");
        locked = true;
        await client.query("SET search_path TO public");
        const files = (await fs.readdir(directory)).filter(file => file.endsWith(".sql")).sort();
        const tracking = await client.query("SELECT to_regclass('public.schema_migrations') AS name");
        const existing = await client.query("SELECT to_regclass('public.customers') AS name");
        if (existing.rows[0].name) {
            const baseline = tracking.rows[0].name
                ? await client.query("SELECT 1 FROM public.schema_migrations WHERE migration_name = $1", ["000_initial_schema.sql"])
                : { rowCount: 0 };
            if (!baseline.rowCount) {
                throw new Error("Existing customers schema has no recorded baseline. Back up and reconcile migration history before running migrations; automatic baselining is disabled.");
            }
        }
        await client.query(`CREATE TABLE IF NOT EXISTS public.schema_migrations (
            id SERIAL PRIMARY KEY,
            migration_name VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )`);
        const applied = new Set((await client.query("SELECT migration_name FROM public.schema_migrations")).rows.map(row => row.migration_name));
        for (const file of files) {
            if (applied.has(file)) {
                log(`Skipping ${file} (already applied)`);
                continue;
            }
            const sql = await fs.readFile(path.join(directory, file), "utf8");
            await client.query("BEGIN");
            try {
                await client.query("SET LOCAL search_path TO public");
                await client.query(sql);
                await client.query("INSERT INTO public.schema_migrations (migration_name) VALUES ($1)", [file]);
                await client.query("COMMIT");
                log(`Applied ${file}`);
            } catch (error) {
                await client.query("ROLLBACK");
                throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error });
            }
        }
    } finally {
        try {
            if (locked) await client.query("SELECT pg_advisory_unlock(4062026, 1)");
        } finally {
            client.release();
        }
    }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
    const { default: pool } = await import("../config/database.js");
    try {
        await runMigrations(pool);
        console.log("Database migrations completed successfully.");
    } catch (error) {
        console.error("Migration failed:", error.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

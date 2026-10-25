import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pg from 'pg';
import { runMigrations } from '../src/database/migrate.js';

// Explicit opt-in: use only a disposable PostgreSQL cluster, never application credentials.
const port = Number(process.env.MIGRATION_TEST_PORT);
if (!Number.isInteger(port) || port < 1024 || !process.env.MIGRATION_TEST_ADMIN) {
    throw new Error('Set MIGRATION_TEST_PORT and MIGRATION_TEST_ADMIN for a disposable local PostgreSQL cluster.');
}
const config = { host: '127.0.0.1', port, user: process.env.MIGRATION_TEST_ADMIN, database: 'postgres' };
const admin = new pg.Pool(config);
const suffix = `${process.pid}_${Date.now()}`;
const database = `erp_test_${suffix}`;
const role = `erp_owner_${suffix}`;
let pool;
let servicePool;
let fixture;
let createdDatabase = false;
let createdRole = false;
const quiet = { log() {} };
try {
    await admin.query(`CREATE ROLE ${role} LOGIN`);
    createdRole = true;
    await admin.query(`CREATE DATABASE ${database} OWNER ${role}`);
    createdDatabase = true;
    pool = new pg.Pool({ ...config, database, user: role });
    await Promise.all([runMigrations(pool, quiet), runMigrations(pool, quiet)]);
    assert.equal(Number((await pool.query('SELECT COUNT(*) FROM public.schema_migrations')).rows[0].count), 6);
    await runMigrations(pool, quiet);
    assert.equal(Number((await pool.query('SELECT COUNT(*) FROM public.schema_migrations')).rows[0].count), 6);
    console.log('PASS fresh install, concurrent runs, and rerun with non-superuser owner');

    Object.assign(process.env, {DB_HOST: '127.0.0.1', DB_PORT: String(port), DB_USER: role, DB_NAME: database, DB_PASSWORD: ''});
    const { createCustomer } = await import('../src/services/customerService.js');
    servicePool = (await import('../src/config/database.js')).default;
    const first = await createCustomer({first_name: 'Migration', last_name: 'Test'});
    assert.equal(first.customer_code, 'CUS-0001');
    const customers = await Promise.all(Array.from({length: 5}, (_, i) => createCustomer({first_name: 'Concurrent', last_name: String(i)})));
    assert.equal(new Set(customers.map(customer => customer.customer_code)).size, 5);
    console.log('PASS first customer and concurrent unique customer codes');

    const seed = await fs.readFile(new URL('../../database/migrations/005_initialize_customer_counter.sql', import.meta.url), 'utf8');
    await pool.query("INSERT INTO customers (customer_code, customer_type, first_name, last_name) VALUES ('CUS-0042', 'individual', 'Existing', 'Customer')");
    await pool.query('DELETE FROM public.customer_code_counter');
    await pool.query(seed);
    assert.equal((await pool.query('SELECT last_number FROM customer_code_counter WHERE id=1')).rows[0].last_number, 42);
    await pool.query('UPDATE customer_code_counter SET last_number=50 WHERE id=1');
    await pool.query(seed);
    assert.equal((await pool.query('SELECT last_number FROM customer_code_counter WHERE id=1')).rows[0].last_number, 50);
    console.log('PASS seed reconciles existing codes and never lowers counter');

    fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'erp-migration-fixture-'));
    await fs.writeFile(path.join(fixture, '999_failure.sql'), 'CREATE TABLE public.rollback_probe (id integer); SELECT 1/0;');
    await assert.rejects(runMigrations(pool, {directory: fixture, ...quiet}), /999_failure.sql/);
    assert.equal((await pool.query("SELECT to_regclass('public.rollback_probe') AS name")).rows[0].name, null);
    assert.equal((await pool.query("SELECT 1 FROM schema_migrations WHERE migration_name='999_failure.sql'")).rowCount, 0);
    await fs.writeFile(path.join(fixture, '999_failure.sql'), 'CREATE TABLE public.rollback_probe (id integer);');
    await runMigrations(pool, {directory: fixture, ...quiet});
    assert.equal((await pool.query("SELECT 1 FROM schema_migrations WHERE migration_name='999_failure.sql'")).rowCount, 1);
    console.log('PASS failed migration rolls back schema/history and corrected migration retries');

    await pool.query("DELETE FROM schema_migrations WHERE migration_name='000_initial_schema.sql'");
    await assert.rejects(runMigrations(pool, quiet), /automatic baselining is disabled/);
    assert.equal((await pool.query('SELECT COUNT(*) FROM customers')).rows[0].count, '7');
    console.log('PASS untracked existing schema is refused without changing customer data');
} finally {
    await servicePool?.end();
    await pool?.end();
    if (createdDatabase) await admin.query(`DROP DATABASE ${database}`);
    if (createdRole) await admin.query(`DROP ROLE ${role}`);
    await admin.end();
    if (fixture) {
        assert.equal(path.dirname(path.resolve(fixture)), path.resolve(os.tmpdir()));
        assert.ok(path.basename(fixture).startsWith('erp-migration-fixture-'));
        await fs.rm(fixture, {recursive: true, force: true});
    }
}

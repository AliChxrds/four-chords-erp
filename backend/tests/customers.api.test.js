import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import pg from "pg";

// Explicit opt-in, matching the migration test: use only a disposable PostgreSQL cluster,
// never application credentials. Without these variables the suite is skipped.
const port = Number(process.env.MIGRATION_TEST_PORT);
const adminUser = process.env.MIGRATION_TEST_ADMIN;
const skip = !Number.isInteger(port) || port < 1024 || !adminUser
    ? "set MIGRATION_TEST_PORT and MIGRATION_TEST_ADMIN to run against a disposable PostgreSQL cluster"
    : false;

describe("customers API", { skip }, () => {
    const config = { host: "127.0.0.1", port, user: adminUser, database: "postgres" };
    const suffix = `${process.pid}_${Date.now()}`;
    const database = `erp_api_test_${suffix}`;
    const role = `erp_api_owner_${suffix}`;
    let admin;
    let pool;
    let server;
    let baseUrl;
    let createdDatabase = false;
    let createdRole = false;
    let consoleError;

    const call = async (method, path, body) => {
        const response = await fetch(`${baseUrl}${path}`, {
            method,
            headers: { "content-type": "application/json" },
            body: body === undefined ? undefined : JSON.stringify(body)
        });

        return { status: response.status, body: await response.json() };
    };

    const createIndividual = async (fields = {}) => {
        const response = await call("POST", "", { first_name: "Test", last_name: "Customer", ...fields });
        assert.equal(response.status, 201);
        return response.body.data;
    };

    before(async () => {
        admin = new pg.Pool(config);
        await admin.query(`CREATE ROLE ${role} LOGIN`);
        createdRole = true;
        await admin.query(`CREATE DATABASE ${database} OWNER ${role}`);
        createdDatabase = true;

        // The app's pool reads these when first imported, so set them before importing it.
        Object.assign(process.env, {
            DB_HOST: "127.0.0.1",
            DB_PORT: String(port),
            DB_USER: role,
            DB_NAME: database,
            DB_PASSWORD: ""
        });

        pool = (await import("../src/config/database.js")).default;
        const { runMigrations } = await import("../src/database/migrate.js");
        await runMigrations(pool, { log() {} });

        const app = (await import("../src/app.js")).default;
        server = app.listen(0, "127.0.0.1");
        await new Promise((resolve) => server.once("listening", resolve));
        baseUrl = `http://127.0.0.1:${server.address().port}/api/customers`;

        // Controllers log expected 409s; keep the test output readable.
        consoleError = console.error;
        console.error = () => {};
    });

    after(async () => {
        if (consoleError) console.error = consoleError;
        if (server) await new Promise((resolve) => server.close(resolve));
        await pool?.end();
        if (createdDatabase) await admin.query(`DROP DATABASE ${database}`);
        if (createdRole) await admin.query(`DROP ROLE ${role}`);
        await admin?.end();
    });

    describe("POST /api/customers", () => {
        it("creates an individual with trimmed names, a generated code, and null blanks", async () => {
            const response = await call("POST", "", { first_name: " Mary ", last_name: "Banda", email: "", notes: "VIP" });

            assert.equal(response.status, 201);
            assert.equal(response.body.success, true);
            assert.equal(response.body.data.first_name, "Mary");
            assert.equal(response.body.data.customer_type, "individual");
            assert.match(response.body.data.customer_code, /^CUS-\d{4,}$/);
            assert.equal(response.body.data.email, null);
            assert.equal(response.body.data.notes, "VIP");
        });

        it("creates a company with only a company name", async () => {
            const response = await call("POST", "", { customer_type: "company", company_name: "Acme Ltd" });

            assert.equal(response.status, 201);
            assert.equal(response.body.data.company_name, "Acme Ltd");
            assert.equal(response.body.data.first_name, null);
        });

        it("rejects missing or non-string names with 400", async () => {
            for (const body of [
                { last_name: "Banda" },
                { first_name: "Mary" },
                { first_name: 5, last_name: "Banda" },
                { customer_type: "company" }
            ]) {
                const response = await call("POST", "", body);
                assert.equal(response.status, 400, JSON.stringify(body));
                assert.equal(response.body.success, false);
            }
        });

        it("allows several customers without an email", async () => {
            await createIndividual({ email: "" });
            await createIndividual({ email: null });
            await createIndividual();
        });

        it("returns 409 for a duplicate email", async () => {
            await createIndividual({ email: "duplicate.create@example.com" });
            const response = await call("POST", "", { first_name: "Other", last_name: "Person", email: "duplicate.create@example.com" });

            assert.equal(response.status, 409);
            assert.match(response.body.message, /email already exists/);
        });
    });

    describe("PUT /api/customers/:id", () => {
        it("updates only the supplied fields", async () => {
            const customer = await createIndividual({ first_name: "Partial" });
            const response = await call("PUT", `/${customer.id}`, { city: "Lusaka" });

            assert.equal(response.status, 200);
            assert.equal(response.body.success, true);
            assert.equal(response.body.data.city, "Lusaka");
            assert.equal(response.body.data.first_name, "Partial");
        });

        it("refuses to clear a required name", async () => {
            const customer = await createIndividual();
            const response = await call("PUT", `/${customer.id}`, { first_name: "" });

            assert.equal(response.status, 400);
        });

        it("checks required names when the customer type changes", async () => {
            const customer = await createIndividual();

            assert.equal((await call("PUT", `/${customer.id}`, { customer_type: "company" })).status, 400);

            const response = await call("PUT", `/${customer.id}`, { customer_type: "company", company_name: "Converted Ltd" });
            assert.equal(response.status, 200);
            assert.equal(response.body.data.customer_type, "company");
        });

        it("returns 400 for an empty update and an invalid ID", async () => {
            const customer = await createIndividual();

            assert.equal((await call("PUT", `/${customer.id}`, {})).status, 400);
            assert.equal((await call("PUT", "/abc", { city: "Ndola" })).status, 400);
        });

        it("returns 404 for a missing customer", async () => {
            assert.equal((await call("PUT", "/999999", { city: "Ndola" })).status, 404);
        });

        it("returns 409 when changing to another customer's email", async () => {
            await createIndividual({ email: "duplicate.update@example.com" });
            const customer = await createIndividual();
            const response = await call("PUT", `/${customer.id}`, { email: "duplicate.update@example.com" });

            assert.equal(response.status, 409);
        });
    });

    describe("GET /api/customers", () => {
        it("validates pagination and filters", async () => {
            for (const query of ["?page=0", "?page=abc", "?limit=0", "?limit=101", "?customer_type=partner", "?active=yes"]) {
                const response = await call("GET", query);
                assert.equal(response.status, 400, query);
                assert.equal(response.body.success, false);
            }
        });

        it("searches and paginates", async () => {
            await createIndividual({ last_name: "Searchable" });
            await createIndividual({ last_name: "Searchable" });

            const response = await call("GET", "?search=searchable&limit=1&page=2");

            assert.equal(response.status, 200);
            assert.deepEqual(response.body.pagination, { page: 2, limit: 1, total: 2, totalPages: 2 });
            assert.equal(response.body.data.length, 1);
        });

        it("returns 400 for an invalid ID and 404 for a missing customer", async () => {
            assert.equal((await call("GET", "/0")).status, 400);
            assert.equal((await call("GET", "/999999")).status, 404);
        });
    });

    describe("DELETE /api/customers/:id", () => {
        it("deactivates instead of deleting", async () => {
            const customer = await createIndividual({ last_name: "Deactivated" });

            assert.equal((await call("DELETE", `/${customer.id}`)).status, 200);
            assert.equal((await call("GET", "?search=deactivated")).body.pagination.total, 0);
            assert.equal((await call("GET", "?search=deactivated&active=false")).body.pagination.total, 1);

            const saved = await call("GET", `/${customer.id}`);
            assert.equal(saved.status, 200);
            assert.equal(saved.body.data.is_active, false);
        });

        it("returns 404 for a missing customer", async () => {
            assert.equal((await call("DELETE", "/999999")).status, 404);
        });
    });
});

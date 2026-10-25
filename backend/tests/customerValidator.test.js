import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validateCustomer } from "../src/validators/customerValidator.js";

const savedIndividual = {
    customer_type: "individual",
    first_name: "Mary",
    last_name: "Banda",
    company_name: null
};

const savedCompany = {
    customer_type: "company",
    first_name: null,
    last_name: null,
    company_name: "Acme"
};

describe("validateCustomer: request shape and types", () => {
    for (const input of [null, undefined, "text", 5, []]) {
        it(`rejects ${JSON.stringify(input) ?? "undefined"} as the body`, () => {
            assert.match(validateCustomer(input).error, /valid JSON object/);
        });
    }

    it("rejects an unknown customer type", () => {
        const result = validateCustomer({ customer_type: "partner", first_name: "A", last_name: "B" });
        assert.match(result.error, /individual or company/);
    });

    it("rejects non-string names", () => {
        assert.match(validateCustomer({ first_name: 5, last_name: "B" }).error, /first_name must be a string/);
        assert.match(validateCustomer({ first_name: "A", last_name: {} }).error, /last_name must be a string/);
    });

    it("rejects invalid email and phone formats", () => {
        assert.match(validateCustomer({ first_name: "A", last_name: "B", email: "not-an-email" }).error, /Invalid email/);
        assert.match(validateCustomer({ first_name: "A", last_name: "B", phone: "call me" }).error, /Invalid phone/);
    });
});

describe("validateCustomer: new customers", () => {
    it("defaults to individual and requires both names", () => {
        assert.match(validateCustomer({}).error, /First name is required/);
        assert.match(validateCustomer({ first_name: "A" }).error, /Last name is required/);
        assert.match(validateCustomer({ first_name: "   ", last_name: "B" }).error, /First name is required/);
    });

    it("requires a company name for company customers", () => {
        assert.match(validateCustomer({ customer_type: "company" }).error, /Company name is required/);
        assert.match(validateCustomer({ customer_type: "company", company_name: " " }).error, /Company name is required/);
    });

    it("trims text, stores blanks as null, and ignores unknown fields", () => {
        const result = validateCustomer({
            first_name: " Mary ",
            last_name: "Banda",
            email: "",
            phone: null,
            notes: " Prefers email ",
            is_active: false
        });

        assert.deepEqual(result, {
            changes: {
                first_name: "Mary",
                last_name: "Banda",
                email: null,
                phone: null,
                notes: "Prefers email"
            }
        });
    });

    it("accepts a company with only a company name", () => {
        const result = validateCustomer({ customer_type: "company", company_name: "Acme", email: "info@acme.co" });
        assert.deepEqual(result.changes, { customer_type: "company", company_name: "Acme", email: "info@acme.co" });
    });
});

describe("validateCustomer: updates", () => {
    it("requires at least one known field", () => {
        assert.match(validateCustomer({}, savedIndividual).error, /No valid customer fields/);
        assert.match(validateCustomer({ is_active: false }, savedIndividual).error, /No valid customer fields/);
    });

    it("returns only the supplied fields for a partial update", () => {
        assert.deepEqual(validateCustomer({ city: "Lusaka" }, savedIndividual), { changes: { city: "Lusaka" } });
    });

    it("refuses to clear a required name", () => {
        assert.match(validateCustomer({ first_name: "" }, savedIndividual).error, /First name is required/);
        assert.match(validateCustomer({ company_name: null }, savedCompany).error, /Company name is required/);
    });

    it("checks the names required by a new customer type", () => {
        assert.match(validateCustomer({ customer_type: "company" }, savedIndividual).error, /Company name is required/);
        assert.match(validateCustomer({ customer_type: "individual", first_name: "Ann" }, savedCompany).error, /Last name is required/);
    });

    it("allows a type change when the required names are supplied", () => {
        const result = validateCustomer({ customer_type: "company", company_name: "Banda Ltd" }, savedIndividual);
        assert.deepEqual(result.changes, { customer_type: "company", company_name: "Banda Ltd" });
    });
});

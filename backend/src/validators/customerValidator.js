// List the customer fields that will accept text values.
// Keeping them together lets the next validation step check each field in a loop
// instead of repeating the same type-checking and trimming code for every field.
// customer_type is handled separately because it has specific allowed values.
const textFields = [
    "company_name",
    "first_name",
    "last_name",
    "phone",
    "email",
    "address",
    "city",
    "tax_number",
    "notes"
];

const customerTypes = ["individual", "company"];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s()-]{7,20}$/;

// export allows the customer controller to import and call this function.
// input will be the data sent by the client, usually req.body.
// existingCustomer will hold the saved record when validating an update.
// Its default is null because a new customer does not have a saved record yet.
//
// The function returns either { error: "..." } or { changes: {...} }.
// changes holds only the supplied fields, with text trimmed and blanks stored as null,
// so the service can save it directly.
export function validateCustomer(input, existingCustomer = null) {
    // This endpoint expects named fields in an object, such as:
    // { first_name: "Mary", last_name: "Banda" }.
    // The || operator means OR: reject input if any condition below is true.
    if (
        // JavaScript reports typeof null as "object", so reject null explicitly.
        input === null ||
        // Reject values such as strings, numbers, booleans, and undefined.
        typeof input !== "object" ||
        // Arrays also have typeof "object", but this endpoint accepts one
        // customer's named fields, not a list of values or customers.
        Array.isArray(input)
    ) {
        // The controller will turn this result into an HTTP 400 response;
        // the validator itself does not send an HTTP response.
        return { error: "Request body must be a valid JSON object." };
    }

    const changes = {};

    // customer_type must be one of the allowed values when it is supplied.
    if (Object.hasOwn(input, "customer_type")) {
        if (!customerTypes.includes(input.customer_type)) {
            return { error: "customer_type must be either individual or company" };
        }

        changes.customer_type = input.customer_type;
    }

    for (const field of textFields) {
        // Fields the client did not send are left unchanged.
        if (!Object.hasOwn(input, field)) {
            continue;
        }

        const value = input[field];

        // Numbers, objects, and other types would fail when trimmed or saved.
        if (value !== null && typeof value !== "string") {
            return { error: `${field} must be a string or null` };
        }

        // Store empty or whitespace-only text as null so blanks are saved consistently.
        const trimmed = value === null ? "" : value.trim();
        changes[field] = trimmed === "" ? null : trimmed;
    }

    // An update must change at least one known field.
    if (existingCustomer && Object.keys(changes).length === 0) {
        return { error: "No valid customer fields were supplied" };
    }

    if (changes.email && !emailPattern.test(changes.email)) {
        return { error: "Invalid email address" };
    }

    if (changes.phone && !phonePattern.test(changes.phone)) {
        return { error: "Invalid phone number" };
    }

    // Check the required names against the record as it will be saved:
    // the saved values, replaced by any supplied changes.
    // A new customer defaults to individual, matching the database default.
    const result = {
        customer_type: "individual",
        ...existingCustomer,
        ...changes
    };

    if (result.customer_type === "individual") {
        if (!result.first_name) {
            return { error: "First name is required for individual customers" };
        }

        if (!result.last_name) {
            return { error: "Last name is required for individual customers" };
        }
    }

    if (result.customer_type === "company" && !result.company_name) {
        return { error: "Company name is required for company customers" };
    }

    return { changes };
}

import pool from "../config/database.js";


// ============================================
// GET CUSTOMERS
// Search + Pagination + Filtering
// ============================================

export const getCustomers = async ({
    search = "",
    customerType = "",
    page = 1,
    limit = 10,
    active = "true"
}) => {

    const offset = (page - 1) * limit;

    const values = [];
    const conditions = [];

    // Active filter
    if (active !== "all") {

        values.push(active === "true");

        conditions.push(
            `is_active = $${values.length}`
        );
    }


    // Customer type filter
    if (customerType) {

        values.push(customerType);

        conditions.push(
            `customer_type = $${values.length}`
        );
    }


    // Search
    if (search) {

        values.push(`%${search}%`);

        const searchParam = `$${values.length}`;

        conditions.push(`
            (
                customer_code ILIKE ${searchParam}
                OR first_name ILIKE ${searchParam}
                OR last_name ILIKE ${searchParam}
                OR company_name ILIKE ${searchParam}
                OR phone ILIKE ${searchParam}
                OR email ILIKE ${searchParam}
            )
        `);
    }


    const whereClause =
        conditions.length > 0
            ? `WHERE ${conditions.join(" AND ")}`
            : "";


    // Count total records
    const countResult = await pool.query(
        `
        SELECT COUNT(*) AS total
        FROM customers
        ${whereClause}
        `,
        values
    );


    const total = Number(countResult.rows[0].total);


    // Pagination parameters
    values.push(limit);
    const limitParam = `$${values.length}`;

    values.push(offset);
    const offsetParam = `$${values.length}`;


    // Get customers
    const result = await pool.query(
        `
        SELECT *
        FROM customers
        ${whereClause}
        ORDER BY id DESC
        LIMIT ${limitParam}
        OFFSET ${offsetParam}
        `,
        values
    );


    return {
        customers: result.rows,
        total
    };
};


// ============================================
// GET CUSTOMER BY ID
// ============================================

export const getCustomerById = async (id) => {

    const result = await pool.query(
        `
        SELECT *
        FROM customers
        WHERE id = $1
        `,
        [id]
    );

    return result.rows[0];
};


// ============================================
// GENERATE CUSTOMER CODE
// ============================================

// const generateCustomerCode = async (client) => {

//     const result = await client.query(`
//         SELECT
//             'CUS-' ||
//             LPAD(
//                 nextval('customer_code_seq')::TEXT,
//                 4,
//                 '0'
//             ) AS customer_code
//     `);

//     return result.rows[0].customer_code;
// };

const generateCustomerCode = async (client) => {
    const result = await client.query(`
        UPDATE customer_code_counter
        SET last_number = last_number + 1
        WHERE id = 1
        RETURNING last_number
    `);

    if (result.rows.length === 0) {
        throw new Error(
            "Customer code counter has not been initialized"
        );
    }

    const number = result.rows[0].last_number;

    return `CUS-${String(number).padStart(4, "0")}`;
};


// ============================================
// CREATE CUSTOMER
// ============================================

export const createCustomer = async (customer) => {

    const client = await pool.connect();

    try {

        await client.query("BEGIN");


        const customerCode =
            await generateCustomerCode(client);


        const {
            customer_type = "individual",
            company_name = null,
            first_name = null,
            last_name = null,
            phone = null,
            email = null,
            address = null,
            city = null,
            tax_number = null
        } = customer;


        const result = await client.query(
            `
            INSERT INTO customers (
                customer_code,
                customer_type,
                company_name,
                first_name,
                last_name,
                phone,
                email,
                address,
                city,
                tax_number
            )
            VALUES (
                $1, $2, $3, $4, $5,
                $6, $7, $8, $9, $10
            )
            RETURNING *
            `,
            [
                customerCode,
                customer_type,
                company_name,
                first_name,
                last_name,
                phone,
                email,
                address,
                city,
                tax_number
            ]
        );


        await client.query("COMMIT");


        return result.rows[0];

    } catch (error) {

        await client.query("ROLLBACK");

        throw error;

    } finally {

        client.release();
    }
};


// ============================================
// UPDATE CUSTOMER
// ============================================

export const updateCustomer = async (id, customer) => {

    const {
        customer_type,
        company_name,
        first_name,
        last_name,
        phone,
        email,
        address,
        city,
        tax_number
    } = customer;


    const result = await pool.query(
        `
        UPDATE customers
        SET
            customer_type = $1,
            company_name = $2,
            first_name = $3,
            last_name = $4,
            phone = $5,
            email = $6,
            address = $7,
            city = $8,
            tax_number = $9
        WHERE id = $10
        RETURNING *
        `,
        [
            customer_type,
            company_name,
            first_name,
            last_name,
            phone,
            email,
            address,
            city,
            tax_number,
            id
        ]
    );


    return result.rows[0];
};


// ============================================
// DEACTIVATE CUSTOMER
// ============================================

export const deleteCustomer = async (id) => {

    const result = await pool.query(
        `
        UPDATE customers
        SET is_active = FALSE
        WHERE id = $1
        RETURNING *
        `,
        [id]
    );


    return result.rows[0];
};
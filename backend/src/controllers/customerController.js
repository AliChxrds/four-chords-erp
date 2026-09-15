import {
    getCustomers as getCustomersService,
    getCustomerById,
    createCustomer as createCustomerService,
    updateCustomer as updateCustomerService,
    deleteCustomer as deleteCustomerService
} from "../services/customerService.js";


// ============================================
// GET CUSTOMERS
// ============================================

export const getCustomers = async (req, res) => {

    try {

        const {
            search = "",
            customer_type = "",
            page = "1",
            limit = "10",
            active = "true"
        } = req.query;


        const pageNumber = Number(page);
        const limitNumber = Number(limit);


        // Validation
        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive integer"
            });
        }


        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return res.status(400).json({
                success: false,
                message: "Limit must be between 1 and 100"
            });
        }


        // Validate customer type
        if (
            customer_type &&
            !["individual", "company"].includes(customer_type)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "customer_type must be either individual or company"
            });
        }


        const result = await getCustomersService({
            search,
            customerType: customer_type,
            page: pageNumber,
            limit: limitNumber,
            active
        });


        const totalPages = Math.ceil(
            result.total / limitNumber
        );


        res.status(200).json({

            success: true,

            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total: result.total,
                totalPages
            },

            data: result.customers
        });


    } catch (error) {

        console.error(
            "Get customers error:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to fetch customers"
        });
    }
};


// ============================================
// GET CUSTOMER
// ============================================

export const getCustomer = async (req, res) => {

    try {

        const id = Number(req.params.id);


        if (!Number.isInteger(id) || id < 1) {

            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }


        const customer =
            await getCustomerById(id);


        if (!customer) {

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }


        res.status(200).json({
            success: true,
            data: customer
        });


    } catch (error) {

        console.error(
            "Get customer error:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to fetch customer"
        });
    }
};


// ============================================
// CREATE CUSTOMER
// ============================================

export const createCustomer = async (req, res) => {

    try {

        const {
            customer_type = "individual",
            company_name,
            first_name,
            last_name,
            email,
            phone
        } = req.body;


        // Validate customer type
        if (
            !["individual", "company"]
                .includes(customer_type)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "customer_type must be either individual or company"
            });
        }


        // Individual validation
        if (customer_type === "individual") {

            if (!first_name) {

                return res.status(400).json({
                    success: false,
                    message:
                        "First name is required for individual customers"
                });
            }
        }


        // Company validation
        if (customer_type === "company") {

            if (!company_name) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Company name is required for company customers"
                });
            }
        }


        // Email validation
        if (email) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid email address"
                });
            }
        }


        // Phone validation
        if (phone) {

            const phoneRegex =
                /^[0-9+\-\s()]{7,20}$/;


            if (!phoneRegex.test(phone)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid phone number"
                });
            }
        }


        const customer =
            await createCustomerService(req.body);


        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer
        });


    } catch (error) {

        console.error(
            "Create customer error:",
            error
        );


        if (error.code === "23505") {

            return res.status(409).json({
                success: false,
                message: "Customer already exists"
            });
        }


        res.status(500).json({
            success: false,
            message: "Failed to create customer"
        });
    }
};


// ============================================
// UPDATE CUSTOMER
// ============================================

export const updateCustomer = async (req, res) => {

    try {

        const id = Number(req.params.id);


        if (!Number.isInteger(id) || id < 1) {

            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }


        const {
            customer_type,
            company_name,
            first_name,
            email,
            phone
        } = req.body;


        if (
            customer_type &&
            !["individual", "company"]
                .includes(customer_type)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "customer_type must be either individual or company"
            });
        }


        if (
            customer_type === "individual" &&
            !first_name
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "First name is required for individual customers"
            });
        }


        if (
            customer_type === "company" &&
            !company_name
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Company name is required for company customers"
            });
        }


        if (email) {

            const emailRegex =
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


            if (!emailRegex.test(email)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid email address"
                });
            }
        }


        if (phone) {

            const phoneRegex =
                /^[0-9+\-\s()]{7,20}$/;


            if (!phoneRegex.test(phone)) {

                return res.status(400).json({
                    success: false,
                    message: "Invalid phone number"
                });
            }
        }


        const customer =
            await updateCustomerService(
                id,
                req.body
            );


        if (!customer) {

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }


        res.status(200).json({
            success: true,
            message: "Customer updated successfully",
            data: customer
        });


    } catch (error) {

        console.error(
            "Update customer error:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to update customer"
        });
    }
};


// ============================================
// DEACTIVATE CUSTOMER
// ============================================

export const deleteCustomer = async (req, res) => {

    try {

        const id = Number(req.params.id);


        if (!Number.isInteger(id) || id < 1) {

            return res.status(400).json({
                success: false,
                message: "Invalid customer ID"
            });
        }


        const customer =
            await deleteCustomerService(id);


        if (!customer) {

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }


        res.status(200).json({
            success: true,
            message: "Customer deactivated successfully"
        });


    } catch (error) {

        console.error(
            "Delete customer error:",
            error
        );


        res.status(500).json({
            success: false,
            message: "Failed to deactivate customer"
        });
    }
};
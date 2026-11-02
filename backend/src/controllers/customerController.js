import {
    getCustomers as getCustomersService,
    getCustomerById,
    createCustomer as createCustomerService,
    updateCustomer as updateCustomerService,
    deleteCustomer as deleteCustomerService
} from "../services/customerService.js";

import { validateCustomer } from "../validators/customerValidator.js";


// ============================================
// HANDLE DUPLICATE VALUES
// Returns true when a 409 response was sent
// ============================================

const sendDuplicateError = (error, res) => {

    if (error.code !== "23505") {
        return false;
    }


    const message =
        error.constraint === "customers_email_key"
            ? "A customer with this email already exists"
            : "A customer with these details already exists";


    res.status(409).json({
        success: false,
        message
    });

    return true;
};


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


        // Validate active filter
        if (!["true", "false", "all"].includes(active)) {
            return res.status(400).json({
                success: false,
                message: "active must be true, false or all"
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

        req.log.error(
            "Get customers failed",
            { error }
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

        req.log.error(
            "Get customer failed",
            { error }
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

        const { error, changes } = validateCustomer(req.body);


        if (error) {

            return res.status(400).json({
                success: false,
                message: error
            });
        }


        const customer =
            await createCustomerService(changes);


        res.status(201).json({
            success: true,
            message: "Customer created successfully",
            data: customer
        });


    } catch (error) {

        req.log.error(
            "Create customer failed",
            { error }
        );


        if (sendDuplicateError(error, res)) {
            return;
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


        // Required names are checked against the saved record
        // combined with the changes, so load it first
        const existingCustomer =
            await getCustomerById(id);


        if (!existingCustomer) {

            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }


        const { error, changes } =
            validateCustomer(req.body, existingCustomer);


        if (error) {

            return res.status(400).json({
                success: false,
                message: error
            });
        }


        const customer =
            await updateCustomerService(id, changes);


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

        req.log.error(
            "Update customer failed",
            { error }
        );


        if (sendDuplicateError(error, res)) {
            return;
        }


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

        req.log.error(
            "Delete customer failed",
            { error }
        );


        res.status(500).json({
            success: false,
            message: "Failed to deactivate customer"
        });
    }
};
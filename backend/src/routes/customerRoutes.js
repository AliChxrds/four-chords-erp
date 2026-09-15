import express from "express";

import {
    getCustomers,
    getCustomer,
    createCustomer,
    updateCustomer,
    deleteCustomer
} from "../controllers/customerController.js";

const router = express.Router();

// Get /api/customers
router.get("/", getCustomers);

// Get /api/customers/:id
router.get("/:id", getCustomer);

// Post /api/customers
router.post("/", createCustomer);

// Put /api/customers/:id
router.put("/:id", updateCustomer);

// Delete /api/customers/:id
router.delete("/:id", deleteCustomer);


export default router;
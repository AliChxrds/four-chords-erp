import express from "express";
import cors from "cors";

import customerRoutes from "./routes/customerRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());


// Test route
app.get("/", (req, res) => {
    res.json({
        message: "Four Chords ERP API is running"
    });
});


// Customer routes
app.use("/api/customers", customerRoutes);


export default app;
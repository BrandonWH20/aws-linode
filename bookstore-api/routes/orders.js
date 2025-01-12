const express = require("express");
const pool = require("../database/db");
const router = express.Router();

// List all orders
router.get("/", async (req, res) => {
    const customerId = req.headers["x-customer-id"];

    try {
        const result = await pool.query(`
            SELECT * FROM orders WHERE customer_id = $1;
        `, [customerId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error retrieving orders:", error);
        res.status(500).send("Failed to retrieve orders");
    }
});

module.exports = router;


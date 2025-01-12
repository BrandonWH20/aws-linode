const express = require("express");
const pool = require("../database/db");
const router = express.Router();

// Add item to cart
router.post("/add", async (req, res) => {
    const { bookId, quantity, price } = req.body;
    const customerId = req.headers["x-customer-id"];

    if (!bookId || !quantity || !price || quantity <= 0 || price <= 0) {
        return res.status(400).send("Invalid input data");
    }

    try {
        const result = await pool.query(`
            INSERT INTO cart (customer_id, book_id, quantity, price)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `, [customerId, bookId, quantity, price]);

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).send("Failed to add to cart");
    }
});

// List items in cart
router.get("/", async (req, res) => {
    const customerId = req.headers["x-customer-id"];

    try {
        const result = await pool.query(`
            SELECT * FROM cart WHERE customer_id = $1;
        `, [customerId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error listing cart items:", error);
        res.status(500).send("Failed to retrieve cart items");
    }
});

// Update item quantity in cart
router.put("/update", async (req, res) => {
    const { bookId, quantity } = req.body;
    const customerId = req.headers["x-customer-id"];

    if (!bookId || !quantity || quantity <= 0) {
        return res.status(400).send("Invalid book ID or quantity");
    }

    try {
        const result = await pool.query(`
            UPDATE cart
            SET quantity = $1
            WHERE customer_id = $2 AND book_id = $3
            RETURNING *;
        `, [quantity, customerId, bookId]);

        if (result.rowCount === 0) {
            return res.status(404).send("Item not found in cart");
        }

        res.status(200).json({ message: "Cart item updated", item: result.rows[0] });
    } catch (error) {
        console.error("Error updating cart item:", error);
        res.status(500).send("Failed to update cart item");
    }
});

// Remove item from cart
router.delete("/remove", async (req, res) => {
    const { bookId } = req.body;
    const customerId = req.headers["x-customer-id"];

    if (!bookId) {
        return res.status(400).send("Book ID is required");
    }

    try {
        const result = await pool.query(`
            DELETE FROM cart WHERE customer_id = $1 AND book_id = $2
            RETURNING *;
        `, [customerId, bookId]);

        if (result.rowCount === 0) {
            return res.status(404).send("Item not found in cart");
        }

        res.status(200).json({ message: "Item removed from cart", item: result.rows[0] });
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).send("Failed to remove item from cart");
    }
});

// Checkout
router.post("/checkout", async (req, res) => {
    const { books } = req.body;
    const customerId = req.headers["x-customer-id"];
    const orderId = Date.now();

    if (!Array.isArray(books) || books.length === 0) {
        return res.status(400).send("Invalid or empty cart");
    }

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await client.query(`
            INSERT INTO orders (customer_id, order_id, books, order_date)
            VALUES ($1, $2, $3, NOW());
        `, [customerId, orderId, JSON.stringify(books)]);

        for (const book of books) {
            await client.query(`
                DELETE FROM cart WHERE customer_id = $1 AND book_id = $2;
            `, [customerId, book.bookId]);
        }

        await client.query("COMMIT");
        res.status(200).send("Checkout complete");
    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Checkout transaction error:", error);
        res.status(500).send("Failed to checkout");
    } finally {
        client.release();
    }
});

module.exports = router;


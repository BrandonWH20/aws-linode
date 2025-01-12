const express = require("express");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Import routes
const cartRoutes = require("./routes/cart");
const ordersRoutes = require("./routes/orders");

// Use routes
app.use("/cart", cartRoutes);
app.use("/orders", ordersRoutes);

// Default route
app.get("/", (req, res) => {
    res.send("Bookstore API is working!");
});

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


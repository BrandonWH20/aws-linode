# aws-linode
Migration of AWS Bookstore Demo to Linode infrastructure
API Gateway process:

# Refactoring Cart Functions for Knative and PostgreSQL + JSONB

This guide provides step-by-step instructions to refactor the Cart functions from an Express-based Lambda wrapper to standalone Knative services that interact with PostgreSQL + JSONB.

## Overview
The Cart functions will be deployed as Knative services, leveraging the following components:
- **Knative**: For serverless service orchestration.
- **PostgreSQL + JSONB**: For efficient relational and key-value storage.
- **Docker**: To containerize the services.

## Refactoring Steps

### 1. Identify Core Cart Functions
We will focus on the following Cart operations:
- **Add to Cart**: Add a book to the cart or update its quantity.
- **Get Cart Items**: Retrieve all items in the cart for a user.
- **Remove from Cart**: Remove a specific item from the cart.
- **Update Item Quantity**: Modify the quantity of an item in the cart.

---

#### **Knative Refactor**
##### Create the Function Logic
```javascript
const { Pool } = require("pg");

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

module.exports = async (req, res) => {
    if (req.method !== "POST") {
        res.status(405).send("Method not allowed");
        return;
    }

    const { bookId, quantity, price } = req.body;
    const customerId = req.headers["x-customer-id"];

    try {
        await pool.query(`
            INSERT INTO cart (customer_id, book_id, quantity, price)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (customer_id, book_id)
            DO UPDATE SET quantity = cart.quantity + $3;
        `, [customerId, bookId, quantity, price]);

        res.status(200).send("Item added to cart");
    } catch (error) {
        console.error("Error adding to cart:", error);
        res.status(500).send("Failed to add item to cart");
    }
};
```

##### Create a `Dockerfile`
```dockerfile
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

CMD ["node", "index.js"]
```

##### Deploy to Knative
1. **Build and Push Docker Image:**
   ```bash
   docker buildx build --platform linux/amd64,linux/arm64 -t bholcombe/bookstore-api:latest --push .
   ```

2. **Knative Service Configuration:**
   ```yaml
   apiVersion: serving.knative.dev/v1
   kind: Service
   metadata:
     name: cart-add
     namespace: bookstore-app
   spec:
     template:
       spec:
         containers:
           - image: gcr.io/<your-project-id>/cart-add
             env:
               - name: DB_USER
                 valueFrom:
                   secretKeyRef:
                     name: postgres-secret
                     key: user
               - name: DB_PASSWORD
                 valueFrom:
                   secretKeyRef:
                     name: postgres-secret
                     key: password
               - name: DB_NAME
                 value: bookstore
               - name: DB_HOST
                 value: postgres.bookstore-app.svc.cluster.local
               - name: DB_PORT
                 value: "5432"
   ```

---

### 3. Refactor `Get Cart Items`
```javascript
module.exports = async (req, res) => {
    const customerId = req.headers["x-customer-id"];

    try {
        const result = await pool.query(`
            SELECT * FROM cart WHERE customer_id = $1;
        `, [customerId]);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error retrieving cart items:", error);
        res.status(500).send("Failed to retrieve cart items");
    }
};
```

---

### 4. Refactor `Remove from Cart`
```javascript
module.exports = async (req, res) => {
    const { bookId } = req.body;
    const customerId = req.headers["x-customer-id"];

    try {
        await pool.query(`
            DELETE FROM cart WHERE customer_id = $1 AND book_id = $2;
        `, [customerId, bookId]);

        res.status(200).send("Item removed from cart");
    } catch (error) {
        console.error("Error removing item from cart:", error);
        res.status(500).send("Failed to remove item");
    }
};
```

---

## Additional Considerations
1. **Database Connectivity:**
   - Use a connection pool for efficient database interactions.
   - Store database credentials securely using Kubernetes Secrets.

2. **Knative Autoscaling:**
   - Enable autoscaling for each service to handle traffic surges.

3. **Logging and Monitoring:**
   - Use structured logging for easier debugging.
   - Integrate Prometheus and Grafana for performance monitoring.

4. **Security:**
   - Apply authentication middleware to Knative services.
   - Restrict access to database and services with network policies.

---

## Conclusion
By refactoring Cart functions into standalone Knative services, we enable better scalability, manageability, and integration with PostgreSQL. 


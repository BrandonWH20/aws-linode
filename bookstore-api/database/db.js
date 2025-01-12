const { Pool } = require("pg");

// Decode Base64-encoded environment variables
const decodeBase64 = (encoded) => Buffer.from(encoded, "base64").toString("utf-8");

const pool = new Pool({
    user: decodeBase64(process.env.POSTGRES_USER),
    host: decodeBase64(process.env.POSTGRES_HOST),
    database: decodeBase64(process.env.POSTGRES_DB),
    password: decodeBase64(process.env.POSTGRES_PASSWORD),
    port: 22270, // Linode PostgreSQL port
});

module.exports = pool;


// utils/db.js
const { Pool } = require("pg");
require("dotenv").config(); // Load environment variables from .env file

// Configure the connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST, //update GCP instance
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: false,
});

pool.on("connect", () => {
  console.log("Connected to the database");
});

pool.on("error", (err) => {
  console.error("Database connection error", err);
  process.exit(-1);
});

// Export the query method for use in models
module.exports = {
  query: (text, params) => pool.query(text, params),
};

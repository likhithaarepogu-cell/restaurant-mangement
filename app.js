
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "restaurant_db",
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err.message);
        return;
    }
    console.log("MySQL Database Connected Successfully!");
});

// Home Route
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Add Reservation
app.post("/api/reservations", (req, res) => {
    const {
        customer_name,
        email,
        phone,
        reservation_date,
        reservation_time,
        guests,
        special_request
    } = req.body;

    if (!customer_name || !email || !phone ||
        !reservation_date || !reservation_time || !guests) {
        return res.status(400).json({
            message: "Please fill all required fields"
        });
    }

    const sql = `
        INSERT INTO reservations
        (customer_name, email, phone, reservation_date,
         reservation_time, guests, special_request)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        customer_name,
        email,
        phone,
        reservation_date,
        reservation_time,
        guests,
        special_request || null
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Reservation failed"
            });
        }

        res.status(201).json({
            message: "Reservation added successfully!",
            reservation_id: result.insertId
        });
    });
});

// Display All Reservations
app.get("/api/reservations", (req, res) => {
    const sql = "SELECT * FROM reservations ORDER BY reservation_id DESC";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Unable to fetch reservations"
            });
        }

        res.json(results);
    });
});

// Update Reservation Status
app.patch("/api/reservations/:id/status", (req, res) => {
    const { status } = req.body;
    const allowedStatus = ["Pending", "Confirmed", "Cancelled"];

    if (!allowedStatus.includes(status)) {
        return res.status(400).json({
            message: "Invalid status"
        });
    }

    const sql = `
        UPDATE reservations
        SET status = ?
        WHERE reservation_id = ?
    `;

    db.query(sql, [status, req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Status update failed"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        res.json({
            message: "Reservation status updated successfully!"
        });
    });
});

// Delete Reservation
app.delete("/api/reservations/:id", (req, res) => {
    const sql = "DELETE FROM reservations WHERE reservation_id = ?";

    db.query(sql, [req.params.id], (err, result) => {
        if (err) {
            return res.status(500).json({
                message: "Delete failed"
            });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        res.json({
            message: "Reservation deleted successfully!"
        });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

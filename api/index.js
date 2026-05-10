const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// Aiven MySQL Connection
const db = mysql.createConnection({
    host: 'mysql-354224c0-stimflow01-31a1.c.aivencloud.com',
    port: 14051,
    user: 'avnadmin',
    password: process.env.DB_PASSWORD,
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
});

// GET all products
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// POST - Add new product (simplified for Vercel)
app.post('/api/products', (req, res) => {
    const { name, price, material, category, description, image_url } = req.body;
    
    db.query('INSERT INTO products (name, price, material, category, description, image_url) VALUES (?, ?, ?, ?, ?, ?)',
        [name, price, material, category, description, image_url],
        (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, id: result.insertId });
        });
});

// DELETE - Remove product
app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// Export for Vercel
module.exports = app;
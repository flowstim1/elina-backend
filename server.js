const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Create uploads folder
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// ==================== AIVEN MYSQL CONNECTION ====================
const db = mysql.createConnection({
    host: 'mysql-354224c0-stimflow01-31a1.c.aivencloud.com',
    port: 14051,
    user: 'avnadmin',
    password: 'AVNS_TcUvfA4xecb02szw7LZ',
    database: 'defaultdb',
    ssl: {
        rejectUnauthorized: false
    }
});

db.connect((err) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to Aiven MySQL Cloud!');
    
    // Create products table if it doesn't exist
    const createTable = `
        CREATE TABLE IF NOT EXISTS products (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200) NOT NULL,
            price VARCHAR(50) NOT NULL,
            material VARCHAR(200),
            category VARCHAR(100),
            description TEXT,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.query(createTable, (err) => {
        if (err) {
            console.error('Table creation error:', err);
            return;
        }
        console.log('✅ Products table ready');
        
        // Check if table is empty and add default products
        db.query('SELECT COUNT(*) as count FROM products', (err, results) => {
            if (err) {
                console.error('Count error:', err);
                return;
            }
            
            if (results[0].count === 0) {
                console.log('📦 Adding default products...');
                const defaultProducts = [
                    {name:"Étoile Solitaire Ring", price:"4,200", material:"18K Rose Gold · 1.2ct Diamond", category:"Ring", description:"A stunning solitaire that captures light from every angle. The perfect declaration of love."},
                    {name:"Céleste Choker", price:"2,800", material:"18K White Gold · Diamond", category:"Necklace", description:"Delicate and luminous, this choker sits gracefully on the collarbone."},
                    {name:"Nova Ear Drops", price:"3,600", material:"Platinum · Sapphire", category:"Earrings", description:"Sapphire drops that dance with every movement. Inspired by the night sky."},
                    {name:"Lumière Bracelet", price:"1,950", material:"Rose Gold · Ruby", category:"Bracelet", description:"A cascade of rose gold links with a hidden ruby clasp. Delicate and unforgettable."}
                ];
                
                let added = 0;
                defaultProducts.forEach(p => {
                    db.query('INSERT INTO products (name, price, material, category, description) VALUES (?, ?, ?, ?, ?)', 
                        [p.name, p.price, p.material, p.category, p.description], (err) => {
                        if (err) console.error('Error adding product:', p.name, err);
                        else {
                            added++;
                            console.log(`✅ Added: ${p.name}`);
                            if (added === defaultProducts.length) {
                                console.log('🎉 All default products added successfully!');
                            }
                        }
                    });
                });
            } else {
                console.log(`📊 Database already has ${results[0].count} products`);
            }
        });
    });
});

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// ==================== API ROUTES ====================

// GET all products
app.get('/api/products', (req, res) => {
    db.query('SELECT * FROM products ORDER BY id DESC', (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results);
    });
});

// GET single product
app.get('/api/products/:id', (req, res) => {
    db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, results) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(results[0] || null);
    });
});

// POST - Add new product
app.post('/api/products', upload.single('image'), (req, res) => {
    const { name, price, material, category, description } = req.body;
    let imageUrl = null;
    
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const sql = 'INSERT INTO products (name, price, material, category, description, image_url) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [name, price, material, category, description, imageUrl], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true, id: result.insertId, imageUrl: imageUrl });
    });
});

// DELETE - Remove product
app.delete('/api/products/:id', (req, res) => {
    db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ success: true });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
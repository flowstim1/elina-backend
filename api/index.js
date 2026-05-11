require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection String - Will use environment variable from Vercel
const MONGODB_URI = process.env.MONGODB_URI;

let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }
    
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('elina_jewelry');
    cachedDb = db;
    return db;
}

// GET all products
app.get('/api/products', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const products = await db.collection('products').find({}).toArray();
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// POST - Add new product
app.post('/api/products', async (req, res) => {
    try {
        const { name, price, material, category, description, image_url } = req.body;
        const db = await connectToDatabase();
        const result = await db.collection('products').insertOne({
            name,
            price,
            material: material || '',
            category: category || '',
            description: description || '',
            image_url: image_url || '',
            createdAt: new Date()
        });
        res.json({ success: true, id: result.insertedId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE - Remove product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const db = await connectToDatabase();
        await db.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// For local testing
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;" " 

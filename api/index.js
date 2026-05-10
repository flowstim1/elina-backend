const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI;
let db;

async function connectDB() {
    if (!db) {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db('elina_jewelry');
        console.log('✅ Connected to MongoDB');
    }
    return db;
}

app.get('/api/products', async (req, res) => {
    try {
        const database = await connectDB();
        const products = await database.collection('products').find({}).toArray();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/products', async (req, res) => {
    try {
        const { name, price, material, category, description, image_url } = req.body;
        const database = await connectDB();
        const result = await database.collection('products').insertOne({
            name, price, material, category, description, image_url,
            created_at: new Date()
        });
        res.json({ success: true, id: result.insertedId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const database = await connectDB();
        await database.collection('products').deleteOne({ _id: new ObjectId(req.params.id) });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = app;
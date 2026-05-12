const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const streamifier = require('streamifier');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Cloudinary configuration
cloudinary.config({
    cloud_name: 'dch2plvwi',
    api_key: '187234395113243',
    api_secret: 'L3DmVbIt7KaJ-8ZRWWUS4fe1y9A'
});

// Use memory storage instead of CloudinaryStorage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const MONGODB_URI = process.env.MONGODB_URI;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) return cachedDb;
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedDb = client.db('elina_jewelry');
    return cachedDb;
}

// GET all products
app.get('/api/products', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const products = await db.collection('products').find({}).toArray();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// POST - Add new product with image upload to Cloudinary
app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        const { name, price, material, category, description } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }
        
        let image_url = '';
        
        // Upload to Cloudinary if image exists
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: 'elina_jewelry' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
            });
            image_url = result.secure_url;
        }
        
        const db = await connectToDatabase();
        const result = await db.collection('products').insertOne({
            name,
            price,
            material: material || '',
            category: category || '',
            description: description || '',
            image_url: image_url,
            createdAt: new Date()
        });
        
        res.json({ success: true, insertedId: result.insertedId, image_url });
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
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = app;

const express = require('express');
const router = express.Router();
const multer = require('multer');
const Product = require('../Models/productModel');

// --- 1. CLOUDINARY CONFIGURATION ---
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config(); // Load environment variables

// Configure Cloudinary with keys from .env
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Storage Engine
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'shopping-app', // Folder name in your Cloudinary Dashboard
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    },
});

const upload = multer({ storage: storage });


// --- 2. CREATE PRODUCT (POST /add) ---
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        // CHANGED: Cloudinary returns the full URL in file.path (not filename)
        const imageUrl = req.file ? req.file.path : "";

        const newProduct = await Product.create({
            name: req.body.name, 
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: imageUrl // Saves "https://res.cloudinary.com/..."
        });
        res.status(201).json({ message: "Product added", product: newProduct });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- 3. GET ALL PRODUCTS (GET /) ---
router.get('/', async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }); 
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- 4. GET SINGLE PRODUCT (GET /:id) --- 
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: "Invalid Product ID" });
    }
});

// --- [NEW] GET DASHBOARD STATS ---
// MUST be placed BEFORE router.get('/:id')
router.get('/stats', async (req, res) => {
    try {
        // 1. Count total products
        const totalProducts = await Product.countDocuments();
        
        // 2. Sum up the price of all products (Inventory Value)
        const stats = await Product.aggregate([
            {
                $group: {
                    _id: null,
                    totalValue: { $sum: "$price" } // Sums the 'price' field
                }
            }
        ]);
        
        const totalRevenue = stats.length > 0 ? stats[0].totalValue : 0;

        // 3. Send data
        res.json({
            totalProducts: totalProducts,
            totalRevenue: totalRevenue,
            activeOrders: 0 // Placeholder until you build an Order System
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// --- 5. UPDATE PRODUCT (PUT /:id) ---
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const productId = req.params.id;
        
        // 1. Find the existing product
        const oldProduct = await Product.findById(productId);
        if (!oldProduct) {
            return res.status(404).json({ error: "Product not found" });
        }

        // 2. Prepare update data
        const updateData = {
            name: req.body.name,
            description: req.body.description,
            price: req.body.price,
            category: req.body.category
        };

        // 3. Handle Image Update
        if (req.file) {
            // If user uploaded a NEW image, Cloudinary automatically uploads it
            // and gives us the new URL here:
            updateData.image = req.file.path;
            
            // Note: We removed the fs.unlink logic because the files 
            // are no longer on your local computer.
        }

        // 4. Update Database
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
        res.json({ message: "Product updated", product: updatedProduct });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


// --- 6. DELETE PRODUCT (DELETE /:id) ---
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        
        // Optional Future Step: You can add logic here to delete the image 
        // from Cloudinary using cloudinary.uploader.destroy(public_id)
        
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
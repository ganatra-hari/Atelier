const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Added to help delete old images
const Product = require('../Models/productModel');

// --- 1. MULTER CONFIGURATION ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); 
    }
});
const upload = multer({ storage: storage });


// --- 2. CREATE PRODUCT (POST /add) ---
router.post('/add', upload.single('image'), async (req, res) => {
    try {
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : "";
        const newProduct = await Product.create({
            name: req.body.name, 
            description: req.body.description,
            price: req.body.price,
            category: req.body.category,
            image: imageUrl
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


// --- 4. [NEW] GET SINGLE PRODUCT (GET /:id) --- 
// This is used by the Edit Page to pre-fill the form
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


// --- 5. [NEW] UPDATE PRODUCT (PUT /:id) ---
// This is used when you click "Update Product"
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const productId = req.params.id;
        
        // 1. Find the existing product first
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
            // If user uploaded a NEW image, use it
            updateData.image = `/uploads/${req.file.filename}`;
            
            // Optional: Delete the OLD image file to save space
            // (Only if it exists and isn't a placeholder)
            if (oldProduct.image && !oldProduct.image.includes('placehold.co')) {
                const oldPath = path.join(__dirname, '..', oldProduct.image);
                fs.unlink(oldPath, (err) => {
                    if (err) console.error("Could not delete old image:", err);
                });
            }
        }

        // 4. Update Database
        const updatedProduct = await Product.findByIdAndUpdate(productId, updateData, { new: true });
        res.json({ message: "Product updated", product: updatedProduct });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


// --- 6. [NEW] DELETE PRODUCT (DELETE /:id) ---
router.delete('/:id', async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ error: "Product not found" });
        
        res.json({ message: "Product deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
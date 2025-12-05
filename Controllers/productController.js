const Product = require("../Models/productModel");

exports.addProduct = async (req, res) => {
    try {
        const { name, shortDescription, description, price, category } = req.body;

        const image = req.file ? `/uploads/${req.file.filename}` : "";

        const product = await Product.create({
            name,
            shortDescription,
            description,
            price: Number(price),
            category,
            image
        });

        res.json({ success: true, product });

    } catch (err) {
        console.log("Error in addProduct:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.log("Error in getProducts:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

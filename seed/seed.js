const mongoose = require("mongoose");
const Product = require("./Models/productModel");
const productsData = require("./seed/productsSeed");

async function seedDB() {
    await mongoose.connect("mongodb://127.0.0.1:27017/Shopping_DB");

    await Product.deleteMany({});
    console.log("🗑️ Cleared old products");

    await Product.insertMany(productsData);
    console.log("✅ Inserted new products");

    mongoose.connection.close();
}

seedDB();

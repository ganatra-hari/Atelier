const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: String,
    shortDescription: String,
    description: String,
    price: Number,
    category: String,
    image: String
},{ timestamps: true });

module.exports = mongoose.model("Product", productSchema);

const express = require('express');
const path = require('path');
const router = express.Router();

// Define path to admin folder
const adminPath = path.join(__dirname, '..', 'Admin');

// Dashboard
router.get('/', (req, res) => {
    res.sendFile(path.join(adminPath, 'Home.html'));
});
router.get('/home', (req, res) => {
    res.sendFile(path.join(adminPath, 'Home.html'));
});

// User List Page
router.get('/userList', (req, res) => {
    res.sendFile(path.join(adminPath, 'userList.html'));
});

// Product List Page
router.get('/productList', (req, res) => {
    res.sendFile(path.join(adminPath, 'productList.html'));
});

// Add Product Page
router.get('/addProduct', (req, res) => {
    res.sendFile(path.join(adminPath, 'addProduct.html'));
});

// Login Page
router.get('/login', (req, res) => {
    res.sendFile(path.join(adminPath, 'login.html'));
});

module.exports = router;
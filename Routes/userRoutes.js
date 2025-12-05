const ex = require('express');
const path = require('path');
const router = ex.Router();

// Debug: Print the calculated path to ensure it is correct
const frontPath = path.join(__dirname, '..', 'Front');
console.log('Front Path resolves to:', frontPath);

// --- TRACER MIDDLEWARE ---
// This catches ANY request sent to this router
router.use((req, res, next) => {
    console.log('Entered User Router for URL:', req.url);
    next();
});

// Home Page
router.get('/', (req, res) => {
    console.log('Matched Route: /');
    res.sendFile(path.join(frontPath, 'Index.html'));
});

// Index Page
router.get('/index', (req, res) => {
    console.log('Matched Route: /index');
    res.sendFile(path.join(frontPath, 'Index.html'));
});

// Shop Page
router.get('/shop', (req, res) => {
    console.log('Matched Route: /shop');
    res.sendFile(path.join(frontPath, 'shop.html'));
});

module.exports = router;
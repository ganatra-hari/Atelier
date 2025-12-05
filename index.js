const ex = require('express');
const path = require('path');
const { ConnectionDB } = require('./connect');

// Initialize App
const app = ex();
const port = process.env.PORT || 3001;

// Middleware
app.use(ex.urlencoded({ extended: false }));
app.use(ex.json());

// --- 1. STATIC ASSETS CONFIGURATION ---

// Serve User-side assets (Public folder)
app.use(ex.static(path.join(__dirname, 'Public')));

// [FIX] Serve Admin Files (This allows layout.js to find the design files)
// This creates the "tunnel" so http://localhost:3001/admin-files/Sidebar.html works
app.use('/admin', ex.static(path.join(__dirname, 'Admin')));

app.use('/uploads', ex.static(path.join(__dirname, 'uploads')));

// --- 2. PAGE ROUTES ---

// Frontend Routes
const userRoutes = require('./Routes/userRoutes');
app.use('/', userRoutes);

// Admin Routes
const adminRoutes = require('./Routes/adminRoutes');
app.use('/admin/', adminRoutes);


// --- 3. API ROUTES ---
const productRoutes = require('./Routes/productRoutes');
app.use('/api/products', productRoutes);


// --- 4. ERROR HANDLING ---
app.use((req, res) => {
  res.status(404).send('<h1>404 - Page Not Found</h1>');
});

// --- 5. START SERVER ---
// Add this line to debug
console.log("DEBUG: My Mongo URL is:", process.env.MONGO_URL); 

ConnectionDB(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/Shopping_DB')
  .then(() => {
    console.log('Database Connected!');
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error: Connection Issues!', err);
  });
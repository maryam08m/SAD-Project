const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = 3000;

// --- CONFIGURATION: PATHS ---
console.log("--- SERVER STARTING ---");

// 1. Define 'public' folder (Root/public)
const publicPath = path.join(__dirname, 'public');

// 2. Define 'html' folder (Root/public/html)
const htmlPath = path.join(__dirname, 'public', 'html');

// --- DEBUG CHECKS ---
if (fs.existsSync(publicPath)) {
    console.log("✅ 'public' folder found.");
} else {
    console.error("❌ ERROR: 'public' folder NOT found. Expected at:", publicPath);
}

if (fs.existsSync(htmlPath)) {
    console.log("✅ 'html' folder found inside public.");
} else {
    console.error("❌ ERROR: 'html' folder NOT found inside 'public'. Expected at:", htmlPath);
}

// --- MIDDLEWARE ---
app.use(bodyParser.json());

// Serve static files (CSS, JS, Images, HTML)
app.use(express.static(publicPath)); 
app.use(express.static(htmlPath));   

// --- ROOT ROUTE ---
app.get('/', (req, res) => {
    const mainPage = path.join(htmlPath, 'main.html');
    if (fs.existsSync(mainPage)) {
        res.sendFile(mainPage);
    } else {
        res.send(`<h1>Error</h1><p>Could not find main.html at ${mainPage}</p>`);
    }
});

// --- API ROUTES ---

// 1. Get Products (SMARTER SEARCH)
app.get('/api/products', (req, res) => {
    const { category, search } = req.query;
    
    let sql = "SELECT * FROM products WHERE 1=1";
    let params = [];
    
    // Filter by Category
    if (category) {
        sql += " AND category = ?";
        params.push(category);
    }
    
    // Filter by Search (Split words logic)
    if (search) {
        // Split the search query into individual words (e.g. "Ring Model 3" -> ["Ring", "Model", "3"])
        const searchTerms = search.trim().split(/\s+/);
        
        searchTerms.forEach(term => {
            // For each word, add a condition that it must exist in the name OR description
            sql += " AND (name LIKE ? OR description LIKE ?)";
            params.push(`%${term}%`, `%${term}%`);
        });
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Register User
app.post('/api/register', async (req, res) => {
    const { email, password, full_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email/Password required" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const sql = "INSERT INTO users (email, password, full_name, role) VALUES (?, ?, ?, 'user')";
        db.run(sql, [email, hashedPassword, full_name || 'New User'], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE")) return res.status(400).json({ error: "Email exists" });
                return res.status(500).json({ error: err.message });
            }
            res.json({ message: "Registered", userId: this.lastID });
        });
    } catch (e) { res.status(500).json({ error: "Server Error" }); }
});

// 3. Login User
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err || !user) return res.status(400).json({ error: "User not found" });
        
        if (await bcrypt.compare(password, user.password)) {
            // Send back role so frontend knows if they are admin
            res.json({ 
                message: "Login success", 
                user: { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role, 
                    full_name: user.full_name 
                } 
            });
        } else {
            res.status(400).json({ error: "Wrong password" });
        }
    });
});

// 4. Create Order (Critical for Admin Panel)
app.post('/api/orders', (req, res) => {
    const { userId, totalPrice, items } = req.body;
    
    // Convert array of items to a JSON string for storage
    const itemsJson = JSON.stringify(items);
    
    const sql = "INSERT INTO orders (user_id, total_price, items) VALUES (?, ?, ?)";
    
    db.run(sql, [userId || 0, totalPrice, itemsJson], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Order placed", orderId: this.lastID });
    });
});

// 5. Admin: Get Orders
app.get('/api/admin/orders', (req, res) => {
    db.all("SELECT * FROM orders ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 6. Admin: Add Product
app.post('/api/admin/products', (req, res) => {
    const { name, price, category, stock, image, description } = req.body;
    db.run("INSERT INTO products (name, price, category, stock, image, description) VALUES (?, ?, ?, ?, ?, ?)",
        [name, price, category, stock, image, description], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ message: "Product added", id: this.lastID });
        });
});
// --- NEW USER ROUTES ---

// 7. Get User Orders (FIXED)
app.get('/api/user/orders/:userId', (req, res) => {
    const userId = req.params.userId;
    // Changed 'ORDER BY created_at' to 'ORDER BY id' to prevent errors
    db.all("SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC", [userId], (err, rows) => {
        if (err) {
            console.error("Database Error:", err.message); // Log error to terminal
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});
// 8. Update User Profile
app.put('/api/user/update/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { full_name, password } = req.body;
    
    try {
        if (password) {
            // Update Name and Password
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run("UPDATE users SET full_name = ?, password = ? WHERE id = ?", 
                [full_name, hashedPassword, userId], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Profile updated successfully" });
            });
        } else {
            // Update Name Only
            db.run("UPDATE users SET full_name = ? WHERE id = ?", 
                [full_name, userId], function(err) {
                    if (err) return res.status(500).json({ error: err.message });
                    res.json({ message: "Profile updated successfully" });
            });
        }
    } catch (e) {
        res.status(500).json({ error: "Server Error" });
    }
});
app.listen(PORT, () => {
    console.log(`\n🚀 Server running at http://localhost:${PORT}`);
    console.log(`👉 Click here to open: http://localhost:${PORT}`);
});
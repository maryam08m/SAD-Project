const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('./baroque.db');

db.serialize(() => {
    // 1. Create Tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user',
        full_name TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price INTEGER,
        category TEXT,
        image TEXT,
        weight REAL,
        description TEXT,
        stock INTEGER DEFAULT 10
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        total_price INTEGER,
        status TEXT DEFAULT 'New',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        items TEXT
    )`);

    // 2. Seed Admin User
    db.get("SELECT count(*) as count FROM users WHERE role='admin'", async (err, row) => {
        if (row.count === 0) {
            const hash = await bcrypt.hash('admin123', 10);
            db.run("INSERT INTO users (email, password, role, full_name) VALUES (?, ?, ?, ?)", 
                ["admin@baroque.com", hash, "admin", "Admin Manager"]);
            console.log("✅ Admin Created: admin@baroque.com / admin123");
        }
    });

    // 3. Seed Initial Products
    db.get("SELECT count(*) as count FROM products", (err, row) => {
        if (row.count === 0) {
            console.log("🌱 Seeding Products...");
            const stmt = db.prepare("INSERT INTO products (name, price, category, image, weight) VALUES (?, ?, ?, ?, ?)");
            
            // NOTE: These match the renamed folders (e.g. necklace, bracelet, rings)
            for (let i = 1; i <= 20; i++) {
                stmt.run(`Necklace Model ${i}`, 1200000, "necklace", `images/necklace/necklace-(${i}).jpg`, 5.5);
            }
            for (let i = 1; i <= 20; i++) {
                stmt.run(`Bracelet Model ${i}`, 850000, "bracelet", `images/bracelet/bracelet-(${i}).jpg`, 8.2);
            }
            for (let i = 1; i <= 20; i++) {
                stmt.run(`Ring Model ${i}`, 2500000, "ring", `images/rings/rings-(${i}).jpg`, 3.1);
            }
            
            stmt.finalize();
            console.log("✅ Products Seeded Successfully");
        }
    });
});

module.exports = db;
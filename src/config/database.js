const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../../campus_swap.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            dorm TEXT,
            verified INTEGER DEFAULT 0
        )`);

        // Listings table
        db.run(`CREATE TABLE IF NOT EXISTS listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            user TEXT NOT NULL,
            dorm TEXT,
            price TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (!err) {
                seedData();
            }
        });
    });
}

function seedData() {
    db.get("SELECT COUNT(*) as count FROM listings", (err, row) => {
        if (!err && row.count === 0) {
            console.log('Seeding initial data...');
            const stmt = db.prepare("INSERT INTO listings (type, title, description, user, dorm, price) VALUES (?, ?, ?, ?, ?, ?)");
            stmt.run('have', 'Calculus Textbook', 'Slightly used, 10th edition.', 'Alice', 'North Hall', 'Free');
            stmt.run('need', 'Lab Coat', 'Size Medium needed for Bio 101.', 'Bob', 'South Hall', 'Trade');
            stmt.finalize();
        }
    });
}

// Utility to run queries as promises
const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const run = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ id: this.lastID, changes: this.changes });
        });
    });
};

const get = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

module.exports = { db, query, run, get };

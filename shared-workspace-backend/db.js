// db.js
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Database file path
const dbPath = path.join(__dirname, process.env.DB_FILE || "shared_workspace.db");

// Open database
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error("❌ Error opening database:", err.message);
    } else {
        console.log("✅ SQLite database connected:", dbPath);

        // USERS TABLE
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('owner','coworker'))
            )
        `);

        // PROPERTIES TABLE
        db.run(`
            CREATE TABLE IF NOT EXISTS properties (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_id INTEGER NOT NULL,
                address TEXT NOT NULL,
                neighborhood TEXT NOT NULL,
                square_feet INTEGER NOT NULL,
                parking INTEGER NOT NULL,
                public_transport INTEGER NOT NULL,
                FOREIGN KEY (owner_id) REFERENCES users(id)
            )
        `);

        // WORKSPACES TABLE
        db.run(`
            CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                property_id INTEGER NOT NULL,
                type TEXT NOT NULL,
                seats INTEGER NOT NULL,
                smoking INTEGER NOT NULL,
                availability_date TEXT NOT NULL,
                lease_term TEXT NOT NULL CHECK(lease_term IN ('day','week','month')),
                price REAL NOT NULL,
                FOREIGN KEY (property_id) REFERENCES properties(id)
            )
        `);
    }
});

// RATINGS TABLE (for coworker to workspace)
db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

// REVIEWS TABLE (for coworker to workspace)
db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        workspace_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        comment TEXT NOT NULL,
        FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
        FOREIGN KEY (user_id) REFERENCES users(id)
    )
`);

// OWNER → COWORKER RATINGS TABLE
db.run(`
    CREATE TABLE IF NOT EXISTS coworker_ratings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner_id INTEGER NOT NULL,
        coworker_id INTEGER NOT NULL,
        rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(id),
        FOREIGN KEY (coworker_id) REFERENCES users(id)
    )
`);


module.exports = db;

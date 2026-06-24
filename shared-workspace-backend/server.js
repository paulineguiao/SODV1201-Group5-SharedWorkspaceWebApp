// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const db = require("./db");


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes (we will create these files next)
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/properties", require("./routes/propertyRoutes"));
app.use("/api/workspaces", require("./routes/workspaceRoutes"));
app.use("/api/coworkers", require("./routes/coworkerRatingRoutes"));
app.use("/api/users", require("./routes/userRoutes"));



// Default route
app.get("/", (req, res) => {
    res.send("Shared Workspace Backend (SQLite) is running...");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

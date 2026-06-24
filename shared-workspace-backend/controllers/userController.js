const db = require("../db");

exports.getUsers = (req, res) => {
    const role = req.query.role;

    let query = "SELECT id, name, email FROM users";
    let params = [];

    if (role) {
        query += " WHERE role = ?";
        params.push(role);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(rows);
    });
};

const db = require("../db");

// Owner rates coworker
exports.rateCoworker = (req, res) => {
    const ownerId = req.user.id;
    const coworkerId = req.params.coworkerId;
    const { rating, comment } = req.body;

    if (req.user.role !== "owner") {
        return res.status(403).json({ message: "Only owners can rate coworkers" });
    }

    const sql = `
        INSERT INTO coworker_ratings (owner_id, coworker_id, rating, comment)
        VALUES (?, ?, ?, ?)
    `;

    db.run(sql, [ownerId, coworkerId, rating, comment], function (err) {
        if (err) return res.status(500).json({ message: "Database error" });

        res.json({ message: "Coworker rated successfully", ratingId: this.lastID });
    });
};

// Get coworker ratings
exports.getCoworkerRatings = (req, res) => {
    const coworkerId = req.params.coworkerId;

    const sql = `
        SELECT rating, comment, created_at
        FROM coworker_ratings
        WHERE coworker_id = ?
    `;

    db.all(sql, [coworkerId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error" });

        const avg = rows.length
            ? rows.reduce((sum, r) => sum + r.rating, 0) / rows.length
            : 0;

        res.json({
            coworker_id: coworkerId,
            average_rating: avg,
            total_ratings: rows.length,
            ratings: rows
        });
    });
};

exports.getCoworkerReviews = (req, res) => {
    const coworkerId = req.params.coworkerId; 

    const query = `
        SELECT rating, comment
        FROM coworker_ratings
        WHERE coworker_id = ?
        ORDER BY created_at DESC
    `;

    db.all(query, [coworkerId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(rows);
    });
};

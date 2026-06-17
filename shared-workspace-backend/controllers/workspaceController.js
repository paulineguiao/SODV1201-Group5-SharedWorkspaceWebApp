// controllers/workspaceController.js
const db = require("../db");

// CREATE WORKSPACE (owner only)
exports.createWorkspace = (req, res) => {
    const { property_id, type, seats, smoking, availability_date, lease_term, price, image_url } = req.body;

    if (!property_id || !type || !seats || !availability_date || !lease_term || !price) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    // Check if property belongs to the owner
    db.get(
        "SELECT * FROM properties WHERE id = ?",
        [property_id],
        (err, property) => {
            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }

            if (property.owner_id !== req.user.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            db.run(
                `INSERT INTO workspaces 
                (property_id, type, seats, smoking, availability_date, lease_term, price, image_url)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    property_id,
                    type,
                    seats,
                    smoking ? 1 : 0,
                    availability_date,
                    lease_term,
                    price,
                    image_url
                ],
                function (err) {
                    if (err) return res.status(500).json({ message: "Database error" });

                    res.json({
                        message: "Workspace created",
                        workspaceId: this.lastID
                    });
                }
            );
        }
    );
};

exports.getAllWorkspaces = (req, res) => {
    db.all(
        `SELECT 
            w.id,
            w.property_id,
            w.type,
            w.seats,
            w.smoking,
            w.availability_date,
            w.lease_term,
            w.price,
            w.image_url,
            p.address,
            p.neighborhood
         FROM workspaces w
         JOIN properties p ON w.property_id = p.id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json(rows);
        }
    );
};


// SEARCH WORKSPACES (coworker)
exports.searchWorkspaces = (req, res) => {
    const { seats, price, neighborhood, smoking } = req.query;

    let query = `
        SELECT workspaces.*, properties.address, properties.neighborhood
        FROM workspaces
        JOIN properties ON workspaces.property_id = properties.id
        WHERE 1 = 1
    `;
    const params = [];

    if (seats) {
        query += " AND seats >= ?";
        params.push(seats);
    }

    if (price) {
        query += " AND price <= ?";
        params.push(price);
    }

    if (neighborhood) {
        query += " AND properties.neighborhood = ?";
        params.push(neighborhood);
    }

    if (smoking !== undefined) {
        query += " AND smoking = ?";
        params.push(smoking === "true" ? 1 : 0);
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(rows);
    });
};

// UPDATE WORKSPACE (owner only)
exports.updateWorkspace = (req, res) => {
    const workspaceId = req.params.id;

    db.get(
        `SELECT workspaces.*, properties.owner_id 
         FROM workspaces 
         JOIN properties ON workspaces.property_id = properties.id
         WHERE workspaces.id = ?`,
        [workspaceId],
        (err, workspace) => {
            if (!workspace) {
                return res.status(404).json({ message: "Workspace not found" });
            }

            if (workspace.owner_id !== req.user.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            const { type, seats, smoking, availability_date, lease_term, price } = req.body;

            db.run(
                `UPDATE workspaces SET
                    type = ?,
                    seats = ?,
                    smoking = ?,
                    availability_date = ?,
                    lease_term = ?,
                    price = ?
                 WHERE id = ?`,
                [
                    type || workspace.type,
                    seats || workspace.seats,
                    smoking !== undefined ? (smoking ? 1 : 0) : workspace.smoking,
                    availability_date || workspace.availability_date,
                    lease_term || workspace.lease_term,
                    price || workspace.price,
                    workspaceId
                ],
                function (err) {
                    if (err) return res.status(500).json({ message: "Database error" });
                    res.json({ message: "Workspace updated" });
                }
            );
        }
    );
};

// DELETE WORKSPACE (owner only)
exports.deleteWorkspace = (req, res) => {
    const workspaceId = req.params.id;

    db.get(
        `SELECT workspaces.*, properties.owner_id 
         FROM workspaces 
         JOIN properties ON workspaces.property_id = properties.id
         WHERE workspaces.id = ?`,
        [workspaceId],
        (err, workspace) => {
            if (!workspace) {
                return res.status(404).json({ message: "Workspace not found" });
            }

            if (workspace.owner_id !== req.user.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            db.run(
                "DELETE FROM workspaces WHERE id = ?",
                [workspaceId],
                function (err) {
                    if (err) return res.status(500).json({ message: "Database error" });
                    res.json({ message: "Workspace deleted" });
                }
            );
        }
    );
};


// GET WORKSPACE DETAILS (coworker)
exports.getWorkspaceById = (req, res) => {
    const workspaceId = req.params.id;

    const sql = `
        SELECT 
            w.*,
            p.address,
            p.neighborhood,
            p.square_feet,
            p.parking,
            p.public_transport,
            p.image_url AS property_image,
            u.name AS owner_name,
            u.email AS owner_email,
            u.phone AS owner_phone
        FROM workspaces w
        JOIN properties p ON w.property_id = p.id
        JOIN users u ON p.owner_id = u.id
        WHERE w.id = ?
    `;

    db.get(sql, [workspaceId], (err, row) => {
        if (err) return res.status(500).json({ message: "Database error" });
        if (!row) return res.status(404).json({ message: "Workspace not found" });

        res.json({
            id: row.id,
            property_id: row.property_id,
            type: row.type,
            seats: row.seats,
            smoking: row.smoking,
            availability_date: row.availability_date,
            lease_term: row.lease_term,
            price: row.price,
            image_url: row.image_url,
            property_image: row.property_image,
            address: row.address,
            neighborhood: row.neighborhood,
            square_feet: row.square_feet,
            parking: row.parking,
            public_transport: row.public_transport,
            owner_name: row.owner_name,
            owner_email: row.owner_email,
            owner_phone: row.owner_phone
        });
    });
};

//Add Rating
exports.addRating = (req, res) => {
    const workspaceId = req.params.id;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    db.run(
        `INSERT INTO ratings (workspace_id, user_id, rating)
         VALUES (?, ?, ?)`,
        [workspaceId, req.user.id, rating],
        function (err) {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json({ message: "Rating submitted" });
        }
    );
};


//Get all ratings for a workspace
exports.getRatings = (req, res) => {
    const workspaceId = req.params.id;

    db.all(
        `SELECT rating FROM ratings WHERE workspace_id = ?`,
        [workspaceId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Database error" });

            const ratings = rows.map(r => r.rating);
            const average = ratings.length
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;

            res.json({
                average_rating: average,
                total_ratings: ratings.length,
                ratings
            });
        }
    );
};

//Add Review
exports.addReview = (req, res) => {
    const workspaceId = req.params.id;
    const { comment } = req.body;

    if (!comment) {
        return res.status(400).json({ message: "Comment is required" });
    }

    db.run(
        `INSERT INTO reviews (workspace_id, user_id, comment)
         VALUES (?, ?, ?)`,
        [workspaceId, req.user.id, comment],
        function (err) {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json({ message: "Review submitted" });
        }
    );
};


//Get all reviews for a workspace
exports.getReviews = (req, res) => {
    const workspaceId = req.params.id;

    db.all(
        `SELECT comment FROM reviews WHERE workspace_id = ?`,
        [workspaceId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json(rows);
        }
    );
};

// controllers/workspaceController.js
const db = require("../db");

exports.createWorkspace = (req, res) => {
    const property_id = req.body.property_id;
    const type = req.body.type;
    const seats = req.body.seats;
    const smoking = req.body.smoking === "1" ? 1 : 0;
    const availability_date = req.body.availability_date;
    const lease_term = req.body.lease_term;
    const price = req.body.price;

    // Correct validation (allows "0")
    if (
        property_id == null ||
        type == null ||
        seats == null ||
        availability_date == null ||
        lease_term == null ||
        price == null
    ) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    let image_url = null;
    if (req.file) {
        image_url = `/uploads/${req.file.filename}`;
    }

    // Check if property belongs to owner
    db.get(
        "SELECT * FROM properties WHERE id = ?",
        [property_id],
        (err, property) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }

            if (!req.user) {
                return res.status(401).json({ message: "Unauthorized" });
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
                    smoking,
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
            p.neighborhood,
            p.owner_id
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
    const {
        address,
        neighborhood,
        sqft,
        parking,
        transport,
        seats,
        smoking,
        date,
        term,
        price
    } = req.query;

    let query = `
        SELECT 
            w.id,
            w.type,
            w.seats,
            w.smoking,
            w.availability_date,
            w.lease_term,
            w.price,
            w.image_url,
            p.address,
            p.neighborhood,
            p.square_feet,
            p.parking,
            p.public_transport,
            u.phone AS owner_phone,
            u.email AS owner_email,
            u.name AS owner_name,
            AVG(r.rating) AS average_rating,
            COUNT(r.rating) AS total_ratings
        FROM workspaces w
        JOIN properties p ON w.property_id = p.id
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN workspace_reviews r ON w.id = r.workspace_id
        WHERE 1 = 1
    `;

    const params = [];

    if (address) {
        query += " AND p.address LIKE ?";
        params.push(`%${address}%`);
    }

    if (neighborhood) {
        query += " AND p.neighborhood LIKE ?";
        params.push(`%${neighborhood}%`);
    }

    if (sqft) {
        query += " AND p.square_feet >= ?";
        params.push(sqft);
    }

    if (parking) {
        query += " AND p.parking = ?";
        params.push(parking === "yes" ? 1 : 0);
    }

    if (transport) {
        query += " AND p.public_transport = ?";
        params.push(transport === "yes" ? 1 : 0);
    }

    if (seats) {
        query += " AND w.seats >= ?";
        params.push(seats);
    }

    if (smoking) {
        query += " AND w.smoking = ?";
        params.push(smoking === "yes" ? 1 : 0);
    }

    if (date) {
        query += " AND w.availability_date <= ?";
        params.push(date);
    }

    if (term) {
        query += " AND w.lease_term = ?";
        params.push(term);
    }

    if (price) {
        query += " AND w.price <= ?";
        params.push(price);
    }

    query += `
        GROUP BY w.id
        ORDER BY w.price ASC
    `;

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(rows);
    });
};

exports.addReview = (req, res) => {
    const workspaceId = req.params.id;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }
    if (!comment) {
        return res.status(400).json({ message: "Comment is required" });
    }

    db.run(
        `INSERT INTO workspace_reviews (workspace_id, user_id, rating, comment)
         VALUES (?, ?, ?, ?)`,
        [workspaceId, req.user.id, rating, comment],
        function (err) {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json({ message: "Review and Rating submitted successfully!" });
        }
    );
};

exports.getRatings = (req, res) => {
    const workspaceId = req.params.id;

    db.all(
        `SELECT rating FROM workspace_reviews WHERE workspace_id = ?`,
        [workspaceId],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Database error" });

            const ratings = rows.map(r => r.rating);
            const average = ratings.length
                ? ratings.reduce((a, b) => a + b, 0) / ratings.length
                : 0;

            res.json({
                average_rating: average,
                total_ratings: ratings.length
            });
        }
    );
};

exports.getReviews = (req, res) => {
    const workspaceId = req.params.id;

    const sql = `
        SELECT r.comment, u.name AS coworker_name
        FROM workspace_reviews r
        JOIN users u ON r.user_id = u.id
        WHERE r.workspace_id = ?
        ORDER BY r.created_at DESC
    `;

    db.all(sql, [workspaceId], (err, rows) => {
        if (err) return res.status(500).json({ message: "Database error" });
        res.json(rows);
    });
};

// UPDATE WORKSPACE (owner only)
exports.updateWorkspace = (req, res) => {
    const workspaceId = req.params.id;

    // First, fetch the existing workspace
    db.get(
        `SELECT workspaces.*, properties.owner_id 
         FROM workspaces 
         JOIN properties ON workspaces.property_id = properties.id
         WHERE workspaces.id = ?`,
        [workspaceId],
        (err, workspace) => {
            if (err) return res.status(500).json({ message: "Database error" });
            if (!workspace) return res.status(404).json({ message: "Workspace not found" });

            // Check owner
            if (workspace.owner_id !== req.user.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            // FormData fields
            const type = req.body.type || workspace.type;
            const seats = req.body.seats || workspace.seats;
            const smoking = req.body.smoking !== undefined ? Number(req.body.smoking) : workspace.smoking;
            const availability_date = req.body.availability_date || workspace.availability_date;
            const lease_term = req.body.lease_term || workspace.lease_term;
            const price = req.body.price || workspace.price;

            // Image handling
            let image_url = workspace.image_url;
            if (req.file) {
                image_url = `/uploads/${req.file.filename}`;
            }

            db.run(
                `UPDATE workspaces SET
                    type = ?,
                    seats = ?,
                    smoking = ?,
                    availability_date = ?,
                    lease_term = ?,
                    price = ?,
                    image_url = ?
                 WHERE id = ?`,
                [
                    type,
                    seats,
                    smoking,
                    availability_date,
                    lease_term,
                    price,
                    image_url,
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


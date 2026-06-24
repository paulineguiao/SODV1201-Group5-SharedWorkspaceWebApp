// controllers/propertyController.js
const db = require("../db");

// CREATE PROPERTY (owner only)
exports.createProperty = (req, res) => {
    const { address, neighborhood, square_feet, parking, public_transport, image_url } = req.body;

    if (!address || !neighborhood || !square_feet) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    db.run(
        `INSERT INTO properties 
        (owner_id, address, neighborhood, square_feet, parking, public_transport, image_url)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            req.user.id,
            address,
            neighborhood,
            square_feet,
            parking ? 1 : 0,
            public_transport ? 1 : 0,
            image_url
        ],
        function (err) {
            if (err) return res.status(500).json({ message: "Database error" });

            return res.json({
                message: "Property created",
                propertyId: this.lastID
            });
        }
    );
};

// GET ALL PROPERTIES
exports.getAllProperties = (req, res) => {
    db.all(
        `SELECT properties.*, users.name AS owner_name, users.email AS owner_email
         FROM properties
         JOIN users ON properties.owner_id = users.id`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ message: "Database error" });
            res.json(rows);
        }
    );
};

// UPDATE PROPERTY (owner only)
exports.updateProperty = (req, res) => {
    const propertyId = req.params.id;

    db.get(
        "SELECT * FROM properties WHERE id = ?",
        [propertyId],
        (err, property) => {
            if (err) return res.status(500).json({ message: "Database error" });
            if (!property) return res.status(404).json({ message: "Property not found" });

            if (property.owner_id !== req.user.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            // FormData fields (always strings)
            const address = req.body.address || property.address;
            const neighborhood = req.body.neighborhood || property.neighborhood;
            const square_feet = req.body.square_feet || property.square_feet;
            const parking = req.body.parking !== undefined ? Number(req.body.parking) : property.parking;
            const public_transport = req.body.public_transport !== undefined ? Number(req.body.public_transport) : property.public_transport;

            // Handle image upload
            let image_url = property.image_url;
            if (req.file) {
                image_url = `/uploads/${req.file.filename}`;
            }

            db.run(
                `UPDATE properties SET 
                    address = ?, 
                    neighborhood = ?, 
                    square_feet = ?, 
                    parking = ?, 
                    public_transport = ?,
                    image_url = ?
                 WHERE id = ?`,
                [
                    address,
                    neighborhood,
                    square_feet,
                    parking,
                    public_transport,
                    image_url,
                    propertyId
                ],
                function (err) {
                    if (err) return res.status(500).json({ message: "Database error" });

                    res.json({ message: "Property updated" });
                }
            );
        }
    );
};


// DELETE PROPERTY (owner only)
exports.deleteProperty = (req, res) => {
    const propertyId = req.params.id;

    db.get(
        "SELECT * FROM properties WHERE id = ?",
        [propertyId],
        (err, property) => {
            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }

            if (property.owner_id !== req.user.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            db.run(
                "DELETE FROM properties WHERE id = ?",
                [propertyId],
                function (err) {
                    if (err) return res.status(500).json({ message: "Database error" });

                    res.json({ message: "Property deleted" });
                }
            );
        }
    );
};

exports.getPropertyById = (req, res) => {
    const id = req.params.id;

    db.get(
        `SELECT * FROM properties WHERE id = ?`,
        [id],
        (err, row) => {
            if (err) return res.status(500).json({ message: "Database error" });
            if (!row) return res.status(404).json({ message: "Property not found" });

            res.json(row);
        }
    );
};

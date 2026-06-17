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
            if (!property) {
                return res.status(404).json({ message: "Property not found" });
            }

            if (property.owner_id !== req.user.id) {
                return res.status(403).json({ message: "Not authorized" });
            }

            const { address, neighborhood, square_feet, parking, public_transport } = req.body;

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
                    address || property.address,
                    neighborhood || property.neighborhood,
                    square_feet || property.square_feet,
                    parking !== undefined ? (parking ? 1 : 0) : property.parking,
                    public_transport !== undefined ? (public_transport ? 1 : 0) : property.public_transport,
                    req.body.image_url || property.image_url,
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

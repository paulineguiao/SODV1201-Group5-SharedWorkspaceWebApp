// routes/propertyRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    createProperty,
    getAllProperties,
    updateProperty,
    deleteProperty
} = require("../controllers/propertyController");

// CREATE property (owner only)
router.post("/", auth, createProperty);

// GET all properties
router.get("/", getAllProperties);

// UPDATE property (owner only)
router.put("/:id", auth, updateProperty);

// DELETE property (owner only)
router.delete("/:id", auth, deleteProperty);

module.exports = router;

// routes/propertyRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    createProperty,
    getAllProperties,
    updateProperty,
    deleteProperty,
    getPropertyById
} = require("../controllers/propertyController");

// CREATE property (owner only)
router.post("/", auth, upload.single("image"), createProperty);

// GET all properties
router.get("/", getAllProperties);

// GET property by ID
router.get("/:id", auth, getPropertyById);

// UPDATE property (owner only)
router.put("/:id", auth, upload.single("image"), updateProperty);

// DELETE property (owner only)
router.delete("/:id", auth, deleteProperty);

module.exports = router;

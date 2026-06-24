// routes/workspaceRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {
    createWorkspace,
    getAllWorkspaces,
    searchWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    getRatings,
    addReview,
    getReviews
} = require("../controllers/workspaceController");

// SEARCH workspaces (coworker)
router.get("/search", searchWorkspaces);

// GET all workspaces
router.get("/", getAllWorkspaces);

// IMPORTANT: longer routes FIRST
router.get("/:id/ratings", getRatings);
router.get("/:id/reviews", getReviews);

router.post("/:id/review", auth, addReview);

// GET workspace details (coworker)
router.get("/:id", getWorkspaceById);

// CREATE workspace (owner only)
router.post("/", auth, upload.single("image"), createWorkspace);

// UPDATE workspace (owner only)
router.put("/:id", auth, upload.single("image"), updateWorkspace);

// DELETE workspace (owner only)
router.delete("/:id", auth, deleteWorkspace);


module.exports = router;

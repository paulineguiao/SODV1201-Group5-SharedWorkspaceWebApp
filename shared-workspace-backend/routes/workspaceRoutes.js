// routes/workspaceRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const {
    createWorkspace,
    getAllWorkspaces,
    searchWorkspaces,
    getWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    addRating,
    getRatings,
    addReview,
    getReviews
} = require("../controllers/workspaceController");

// SEARCH workspaces (coworker)
router.get("/search", searchWorkspaces);

// GET workspace details (coworker)
router.get("/:id", getWorkspaceById);

// GET all workspaces
router.get("/", getAllWorkspaces);

// CREATE workspace (owner only)
router.post("/", auth, createWorkspace);

// UPDATE workspace (owner only)
router.put("/:id", auth, updateWorkspace);

// DELETE workspace (owner only)
router.delete("/:id", auth, deleteWorkspace);

router.post("/:id/rate", auth, addRating);
router.get("/:id/ratings", getRatings);

router.post("/:id/review", auth, addReview);
router.get("/:id/reviews", getReviews);


module.exports = router;

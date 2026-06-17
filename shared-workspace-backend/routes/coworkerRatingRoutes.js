const express = require("express");
const router = express.Router();
const coworkerRatingController = require("../controllers/coworkerRatingController");
const authMiddleware = require("../middleware/authMiddleware");

// Owner rates coworker
router.post("/:coworkerId/rate", authMiddleware, coworkerRatingController.rateCoworker);

// Get all ratings for a coworker
router.get("/:coworkerId/ratings", coworkerRatingController.getCoworkerRatings);

module.exports = router;

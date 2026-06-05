const router = require('express').Router();
const {
  getReviewsByFood,
  getAllReviews,
  createReview,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Public
router.get('/food/:foodId', getReviewsByFood); // GET /api/reviews/food/:foodId
router.post('/',            createReview);      // POST /api/reviews

// Admin only
router.get('/',     protect, getAllReviews);    // GET /api/reviews
router.delete('/:id', protect, deleteReview);  // DELETE /api/reviews/:id

module.exports = router;

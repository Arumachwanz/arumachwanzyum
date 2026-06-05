const router = require('express').Router();
const {
  getFoods,
  getFoodById,
  createFood,
  updateFood,
  deleteFood,
} = require('../controllers/foodController');
const { protect } = require('../middleware/auth');

// Public
router.get('/',    getFoods);
router.get('/:id', getFoodById);

// Admin only
router.post('/',    protect, createFood);
router.put('/:id',  protect, updateFood);
router.delete('/:id', protect, deleteFood);

module.exports = router;

const router = require('express').Router();
const {
  adminLogin,
  verifyToken,
  getStats,
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');

// Public
router.post('/login', adminLogin);         // POST /api/admin/login

// Admin only
router.get('/verify', protect, verifyToken); // GET /api/admin/verify
router.get('/stats',  protect, getStats);    // GET /api/admin/stats

module.exports = router;

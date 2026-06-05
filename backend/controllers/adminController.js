const jwt    = require('jsonwebtoken');
const Food   = require('../models/Food');
const Review = require('../models/Review');

// ──────────────────────────────────────────────────────
// @desc   Admin login → dapat JWT
// @route  POST /api/admin/login
// @access Public
// ──────────────────────────────────────────────────────
const adminLogin = async (req, res) => {
console.log("ADMIN LOGIN DIPANGGIL"); 
  
  try {
    const { password } = req.body;

    console.log("ENV =", process.env.ADMIN_PASSWORD);
    console.log("INPUT =", password);

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password wajib diisi.' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      // Delay kecil supaya brute-force lebih susah
      await new Promise((r) => setTimeout(r, 500));
      return res.status(401).json({ success: false, message: 'Password salah.' });
    }

    const token = jwt.sign(
      { role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      message: 'Login berhasil~ 🎉',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────
// @desc   Verifikasi token masih valid
// @route  GET /api/admin/verify
// @access Admin
// ──────────────────────────────────────────────────────
const verifyToken = (req, res) => {
  res.json({ success: true, message: 'Token valid.', admin: req.admin });
};

// ──────────────────────────────────────────────────────
// @desc   Statistik keseluruhan (dashboard admin)
// @route  GET /api/admin/stats
// @access Admin
// ──────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [totalFoods, totalReviews, ratingAgg, recentReviews, topFoods] = await Promise.all([
      // Total hidangan aktif
      Food.countDocuments({ isActive: true }),

      // Total review
      Review.countDocuments(),

      // Rata-rata rating & distribusi
      Review.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            dist: { $push: '$rating' },
          },
        },
      ]),

      // 5 review terbaru
      Review.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('food', 'name emoji'),

      // Top 5 hidangan berdasarkan avg rating (min 1 review)
      Review.aggregate([
        { $group: { _id: '$food', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
        { $sort: { avgRating: -1, count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'foods',
            localField: '_id',
            foreignField: '_id',
            as: 'food',
          },
        },
        { $unwind: '$food' },
        {
          $project: {
            _id: 0,
            name:      '$food.name',
            emoji:     '$food.emoji',
            avgRating: { $round: ['$avgRating', 1] },
            count:     1,
          },
        },
      ]),
    ]);

    // Buat distribusi rating { 1:n, 2:n, 3:n, 4:n, 5:n }
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    if (ratingAgg[0]) {
      ratingAgg[0].dist.forEach((r) => {
        ratingDistribution[r] = (ratingDistribution[r] || 0) + 1;
      });
    }

    res.json({
      success: true,
      data: {
        totalFoods,
        totalReviews,
        avgRating: ratingAgg[0] ? +ratingAgg[0].avgRating.toFixed(1) : 0,
        ratingDistribution,
        topFoods,
        recentReviews,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { adminLogin, verifyToken, getStats };

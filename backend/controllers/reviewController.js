const Review = require('../models/Review');
const Food   = require('../models/Food');

// ──────────────────────────────────────────────────────
// @desc   Get semua review untuk satu hidangan
// @route  GET /api/reviews/food/:foodId
// @access Public
// ──────────────────────────────────────────────────────
const getReviewsByFood = async (req, res) => {
  try {
    const { foodId } = req.params;
    const { limit = 50, page = 1 } = req.query;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments({ food: foodId });

    const reviews = await Review.find({ food: foodId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const avg = reviews.length
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      count: reviews.length,
      total,
      avgRating: +avg.toFixed(1),
      page: Number(page),
      data: reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────
// @desc   Get semua review (untuk admin dashboard)
// @route  GET /api/reviews
// @access Admin
// ──────────────────────────────────────────────────────
const getAllReviews = async (req, res) => {
  try {
    const { limit = 100, page = 1, rating } = req.query;

    const filter = {};
    if (rating) filter.rating = Number(rating);

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Review.countDocuments(filter);

    const reviews = await Review.find(filter)
      .populate('food', 'name emoji category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      count: reviews.length,
      total,
      page: Number(page),
      data: reviews,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────
// @desc   Submit review baru (public)
// @route  POST /api/reviews
// @access Public
// ──────────────────────────────────────────────────────
const createReview = async (req, res) => {
  try {
    const { foodId, name, rating, comment } = req.body;

    // Validasi field wajib
    if (!foodId || !name?.trim() || rating == null) {
      return res.status(400).json({
        success: false,
        message: 'foodId, nama, dan rating wajib diisi.',
      });
    }

    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating harus bilangan bulat antara 1 dan 5.',
      });
    }

    // Pastikan hidangan ada dan aktif
    const food = await Food.findOne({ _id: foodId, isActive: true });
    if (!food) {
      return res.status(404).json({ success: false, message: 'Hidangan tidak ditemukan.' });
    }

    const review = await Review.create({
      food:    foodId,
      name:    name.trim(),
      rating:  parsedRating,
      comment: comment?.trim() || '',
    });

    res.status(201).json({ success: true, data: review });
  } catch (err) {
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────
// @desc   Hapus satu review
// @route  DELETE /api/reviews/:id
// @access Admin
// ──────────────────────────────────────────────────────
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review tidak ditemukan.' });
    }

    res.json({ success: true, message: 'Review berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getReviewsByFood, getAllReviews, createReview, deleteReview };

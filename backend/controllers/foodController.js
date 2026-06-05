const Food   = require('../models/Food');
const Review = require('../models/Review');

// ── Helper: hitung avg + count per food ───────────────
const withStats = async (foods) => {
  const ids = foods.map((f) => f._id);

  const stats = await Review.aggregate([
    { $match: { food: { $in: ids } } },
    {
      $group: {
        _id: '$food',
        avgRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  const statsMap = Object.fromEntries(stats.map((s) => [s._id.toString(), s]));

  return foods.map((food) => {
    const obj = food.toObject();
    const s   = statsMap[food._id.toString()];
    obj.avgRating   = s ? +s.avgRating.toFixed(1) : 0;
    obj.reviewCount = s ? s.reviewCount : 0;
    return obj;
  });
};

// ──────────────────────────────────────────────────────
// @desc   Get semua hidangan aktif + statistik rating
// @route  GET /api/foods
// @access Public
// ──────────────────────────────────────────────────────
const getFoods = async (req, res) => {
  try {
    const { category, sort = 'newest' } = req.query;

    const filter = { isActive: true };
    if (category) filter.category = category;

    const sortMap = {
      newest:  { createdAt: -1 },
      oldest:  { createdAt:  1 },
      name:    { name: 1 },
    };

    const foods = await Food.find(filter)
      .select('+isActive') // kecualikan field isActive dari hasil (select false), tapi kita perlu filter
      .sort(sortMap[sort] || sortMap.newest)
      .lean({ virtuals: false });

    // Munculkan kembali tanpa isActive di response
    const cleaned = foods.map(({ isActive, ...rest }) => rest);

    const data = await withStats(
      cleaned.map((f) => ({ _id: f._id, toObject: () => f }))
    );

    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────
// @desc   Get satu hidangan + semua review-nya
// @route  GET /api/foods/:id
// @access Public
// ──────────────────────────────────────────────────────
const getFoodById = async (req, res) => {
  try {
    const food = await Food.findOne({ _id: req.params.id, isActive: true });
    if (!food) {
      return res.status(404).json({ success: false, message: 'Hidangan tidak ditemukan.' });
    }

    const reviews = await Review.find({ food: food._id }).sort({ createdAt: -1 });
    const avg = reviews.length
      ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length
      : 0;

    res.json({
      success: true,
      data: {
        ...food.toObject(),
        avgRating:   +avg.toFixed(1),
        reviewCount: reviews.length,
        reviews,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────
// @desc   Tambah hidangan baru
// @route  POST /api/foods
// @access Admin
// ──────────────────────────────────────────────────────
const createFood = async (req, res) => {
  try {
    const { name, emoji, category, description, image } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Nama hidangan wajib diisi.' });
    }

    // Cek duplikat nama (case-insensitive)
    const exists = await Food.findOne({ name: new RegExp(`^${name.trim()}$`, 'i'), isActive: true });
    if (exists) {
      return res.status(409).json({ success: false, message: 'Hidangan dengan nama ini sudah ada.' });
    }

    const food = await Food.create({ name: name.trim(), emoji, category, description, image });
    res.status(201).json({ success: true, data: food });
  } catch (err) {
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────
// @desc   Update hidangan
// @route  PUT /api/foods/:id
// @access Admin
// ──────────────────────────────────────────────────────
const updateFood = async (req, res) => {
  try {
    const allowed = ['name', 'emoji', 'category', 'description', 'image'];
    const updates = Object.fromEntries(
      Object.entries(req.body).filter(([k]) => allowed.includes(k))
    );

    const food = await Food.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      updates,
      { new: true, runValidators: true }
    );

    if (!food) {
      return res.status(404).json({ success: false, message: 'Hidangan tidak ditemukan.' });
    }

    res.json({ success: true, data: food });
  } catch (err) {
    const status = err.name === 'ValidationError' ? 400 : 500;
    res.status(status).json({ success: false, message: err.message });
  }
};

// ──────────────────────────────────────────────────────
// @desc   Hapus hidangan (soft delete) + semua review-nya
// @route  DELETE /api/foods/:id
// @access Admin
// ──────────────────────────────────────────────────────
const deleteFood = async (req, res) => {
  try {
    const food = await Food.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!food) {
      return res.status(404).json({ success: false, message: 'Hidangan tidak ditemukan.' });
    }

    // Hapus semua review terkait (hard delete review)
    const { deletedCount } = await Review.deleteMany({ food: food._id });

    res.json({
      success: true,
      message: `Hidangan "${food.name}" berhasil dihapus beserta ${deletedCount} ulasan.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getFoods, getFoodById, createFood, updateFood, deleteFood };

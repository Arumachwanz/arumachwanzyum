const mongoose = require('mongoose');

const CATEGORIES = ['sarapan', 'makan-siang', 'makan-malam', 'snack', 'dessert', 'minuman'];

const foodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama hidangan wajib diisi'],
      trim: true,
      maxlength: [100, 'Nama terlalu panjang (maks 100 karakter)'],
    },
    emoji: {
      type: String,
      default: '🍜',
      maxlength: [10, 'Emoji terlalu panjang'],
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: 'Kategori tidak valid' },
      default: 'makan-siang',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Deskripsi terlalu panjang (maks 500 karakter)'],
      default: '',
    },
    // Base64 compressed image string (frontend mengompresi sebelum kirim)
    image: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false, // tidak ikut query default
    },
  },
  {
    timestamps: true,   // createdAt & updatedAt otomatis
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ────────────────────────────────────────────
foodSchema.index({ isActive: 1, createdAt: -1 });

// ── Virtual: statistik dari luar ──────────────────────
// Diisi di controller pakai populate/aggregate, bukan di schema.
// Tetap definisikan agar ikut toJSON.
foodSchema.virtual('avgRating').get(function () {
  return this._avgRating ?? 0;
});
foodSchema.virtual('reviewCount').get(function () {
  return this._reviewCount ?? 0;
});

// ── Hapus field sensitif dari JSON response ────────────
foodSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Food', foodSchema);

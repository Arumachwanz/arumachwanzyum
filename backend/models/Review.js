const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    food: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Food',
      required: [true, 'Food ID wajib ada'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Nama reviewer wajib diisi'],
      trim: true,
      maxlength: [50, 'Nama terlalu panjang (maks 50 karakter)'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating wajib diisi'],
      min: [1, 'Rating minimal 1'],
      max: [5, 'Rating maksimal 5'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating harus bilangan bulat',
      },
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Komentar terlalu panjang (maks 500 karakter)'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Compound index untuk query per food ────────────────
reviewSchema.index({ food: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);

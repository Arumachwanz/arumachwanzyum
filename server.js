const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv  = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

// ── Security headers ──────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ── Rate limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' },
});
app.use('/api', limiter);

// Lebih ketat untuk review submission (anti spam)
const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 jam
  max: 10,
  message: { success: false, message: 'Kamu udah kasih terlalu banyak ulasan, coba lagi nanti ya~' },
});

// ── Body parser ───────────────────────────────────────
// limit 10mb untuk gambar base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files ──────────────────────────────────────
app.use('/uploads', express.static('uploads'));

// ── Routes ────────────────────────────────────────────
app.use('/api/foods',   require('./routes/foodRoutes'));
app.use('/api/reviews', reviewLimiter, require('./routes/reviewRoutes'));
app.use('/api/admin',   require('./routes/adminRoutes'));

// ── Health check ──────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    message: '🍳 arumachwanz API is running~',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ── 404 handler ───────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route tidak ditemukan.' });
});

// ── Global error handler ──────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`);
});

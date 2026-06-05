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
const allowedOrigins = [
  'https://arumachwanzyum.netlify.app',
  'https://gorgeous-banoffee-984817.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (Postman, mobile, dll)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} tidak diizinkan`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Handle preflight OPTIONS untuk semua route
app.options('*', cors());

// ── Rate limiting ─────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti.' },
});
app.use('/api', limiter);

const reviewLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Kamu udah kasih terlalu banyak ulasan, coba lagi nanti ya~' },
});

// ── Body parser ───────────────────────────────────────
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
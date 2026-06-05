const jwt = require('jsonwebtoken');

/**
 * Middleware proteksi route admin.
 * Cek Bearer token di header Authorization.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token tidak ada atau format salah.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded; // { role: 'admin', iat, exp }
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Token sudah kadaluarsa. Silakan login ulang.'
        : 'Token tidak valid.';

    return res.status(401).json({ success: false, message });
  }
};

module.exports = { protect };

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');

const jobRoutes = require('./routes/jobs');
const applicationRoutes = require('./routes/applications');
const adminRoutes = require('./routes/admin');

const app = express();
const port = process.env.PORT || 3000;

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Middleware
app.use(helmet());
// Log CORS origin for debugging
console.log('CORS Origin:', process.env.CORS_ORIGIN);

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: 'An internal server error occurred'
    }
  });
});

// Debug environment variables
console.log('Environment check on startup:');
console.log('ADMIN_PASSWORD_HASH length:', process.env.ADMIN_PASSWORD_HASH ? process.env.ADMIN_PASSWORD_HASH.length : 0);
console.log('ADMIN_PASSWORD_HASH first 4 chars:', process.env.ADMIN_PASSWORD_HASH ? process.env.ADMIN_PASSWORD_HASH.slice(0,4) : 'not set');

// Validate ADMIN_PASSWORD_HASH early and fail fast with clear error if it's malformed.
const adminHash = process.env.ADMIN_PASSWORD_HASH;
if (!adminHash || typeof adminHash !== 'string' || !adminHash.startsWith('$2') || adminHash.length < 50) {
  console.error('\nCRITICAL: ADMIN_PASSWORD_HASH appears to be missing or malformed.');
  console.error('  - Current value (safe-preview):', adminHash ? `${adminHash.slice(0,4)}...(${adminHash.length} chars)` : 'not set');
  console.error("  - Ensure your .env contains a full bcrypt hash and that you haven't exported a truncated value in your shell.\n");
  console.error("Suggested fix: open backend/.env and ensure ADMIN_PASSWORD_HASH is quoted, e.g. ADMIN_PASSWORD_HASH='$2b$10$...'");
  console.error('Then either unset the env var in your shell (`unset ADMIN_PASSWORD_HASH`) or restart the shell/session and restart the server.');
  // Exit to avoid running with a broken secret
  process.exit(1);
}

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
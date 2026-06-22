const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/product');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/order');
const affiliateRoutes = require('./routes/affiliate');
const adminRoutes = require('./routes/admin');
const { errorHandler } = require('./utils/errorHandler');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
const dbConnection = connectDB();
dbConnection.catch((err) => {
  console.error('Failed to connect to MongoDB, but server will start anyway:', err.message);
});

// Middleware
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const ALLOWED_ORIGINS = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOriginFunction = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, etc.)
  if (!origin) return callback(null, true);
  if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
  callback(null, false);
};

app.use(
  cors({
    origin: corsOriginFunction,
    credentials: true,
  })
);
// Serve images with permissive Cross-Origin-Resource-Policy and caching for frontend
app.use(
  '/images',
  (req, res, next) => {
    // Allow other origins (e.g. localhost:3000) to use these image resources
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    // Allow browsers to request these resources from different origins
    // (CORS middleware already handles API endpoints)
    const requestOrigin = req.headers.origin;
    if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin);
    } else if (ALLOWED_ORIGINS.length > 0) {
      res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGINS[0]);
    }
    // Cache static images long-term to improve performance in production
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    next();
  },
  express.static(path.resolve(__dirname, '../frontend/src/images'))
);

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/affiliate', affiliateRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Affiliate e-commerce API is running' });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

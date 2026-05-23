// API Gateway - JEE/NEET Platform
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const proxy = require('express-http-proxy');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { rateLimit } = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Service mappings from environment variables
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:5001';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:5002';
const CONTENT_SERVICE_URL = process.env.CONTENT_SERVICE_URL || 'http://localhost:5003';

// Security Headers
app.use(helmet());

// CORS Setup (highly compatible with standard frontends)
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Global Rate Limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', globalLimiter);

// Gateway Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'API Gateway',
    timestamp: new Date().toISOString(),
    services: {
      auth: AUTH_SERVICE_URL,
      user: USER_SERVICE_URL,
      content: CONTENT_SERVICE_URL
    }
  });
});

// Helper for proxy path matching
const proxyOptions = (targetUrl) => ({
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    // Preserve client headers (e.g. Auth Token, Content-Type)
    return proxyReqOpts;
  },
  userResHeaderDecorator: (headers, userReq, userRes, proxyReq, proxyRes) => {
    // Preserve CORS headers if required
    return headers;
  },
  proxyErrorHandler: (err, res, next) => {
    console.error(`❌ Proxy connection failed to ${targetUrl}:`, err.message);
    res.status(502).json({
      success: false,
      message: 'Service is temporarily unavailable. Please try again later.'
    });
  }
});

// Route mappings to microservices

// 1. Auth Service Routes
app.use('/api/auth', proxy(AUTH_SERVICE_URL, {
  proxyReqPathResolver: (req) => `/api/auth${req.url}`,
  ...proxyOptions(AUTH_SERVICE_URL)
}));

// 2. User Service Routes
const userPaths = ['/users', '/leaderboard', '/badges', '/analytics', '/admin'];
userPaths.forEach(path => {
  app.use(`/api${path}`, proxy(USER_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api${path}${req.url}`,
    ...proxyOptions(USER_SERVICE_URL)
  }));
});

// 3. Content & Gamification Service Routes
const contentPaths = [
  '/content',
  '/quizzes',
  '/mistakes',
  '/bookmarks',
  '/sessions',
  '/challenges',
  '/mock-tests',
  '/daily-challenge',
  '/doubts',
  '/study-plan',
  '/flashcards',
  '/resources',
  '/syllabus',
  '/notes',
  '/ai'
];
contentPaths.forEach(path => {
  app.use(`/api${path}`, proxy(CONTENT_SERVICE_URL, {
    proxyReqPathResolver: (req) => `/api${path}${req.url}`,
    ...proxyOptions(CONTENT_SERVICE_URL)
  }));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found at Gateway' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`🔗 Routing /api/auth -> ${AUTH_SERVICE_URL}`);
  console.log(`🔗 Routing /api/users, /api/leaderboard, /api/badges, /api/analytics, /api/admin -> ${USER_SERVICE_URL}`);
  console.log(`🔗 Routing all content API paths -> ${CONTENT_SERVICE_URL}`);
});

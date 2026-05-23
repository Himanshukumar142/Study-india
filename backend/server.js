// JEE/NEET Platform Server
require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler.middleware');

const { globalLimiter, authLimiter, aiLimiter, quizLimiter } = require('./src/middleware/rateLimiter.middleware');

// Routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const contentRoutes = require('./src/routes/content.routes');
const quizRoutes = require('./src/routes/quiz.routes');
const mistakeRoutes = require('./src/routes/mistake.routes');
const bookmarkRoutes = require('./src/routes/bookmark.routes');
const sessionRoutes = require('./src/routes/session.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const leaderboardRoutes = require('./src/routes/leaderboard.routes');
const adminRoutes = require('./src/routes/admin.routes');
const challengeRoutes = require('./src/routes/challenge.routes');
const aiRoutes = require('./src/routes/ai.routes');

const app = express();

// Connect DB
connectDB();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate limiting
app.use('/api', globalLimiter);

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/quizzes', quizLimiter, quizRoutes);
app.use('/api/mistakes', mistakeRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/challenges', challengeRoutes);
const mockTestRoutes = require('./src/routes/mockTest.routes');
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/daily-challenge', require('./src/routes/dailyChallenge.routes'));
app.use('/api/doubts', require('./src/routes/doubt.routes'));
app.use('/api/study-plan', require('./src/routes/studyPlan.routes'));
app.use('/api/flashcards', require('./src/routes/flashcard.routes'));
app.use('/api/resources', require('./src/routes/resource.routes'));
app.use('/api/syllabus', require('./src/routes/syllabus.routes'));
app.use('/api/notes', require('./src/routes/note.routes'));
app.use('/api/badges', require('./src/routes/badge.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
// Restart triggered for .env reload

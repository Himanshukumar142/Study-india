// JEE/NEET Platform - Content & Gamification Service
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
require('dotenv').config({ path: path.join(__dirname, '.env') });
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler.middleware');
const { aiLimiter, quizLimiter } = require('./src/middleware/rateLimiter.middleware');

// ── Register Mongoose Models (ensures populated refs work) ──
require('./src/models/User.model');
require('./src/models/Badge.model');
require('./src/models/Bookmark.model');
require('./src/models/Challenge.model');
require('./src/models/Content.model');
require('./src/models/DailyChallenge.model');
require('./src/models/Doubt.model');
require('./src/models/Flashcard.model');
require('./src/models/FocusSession.model');
require('./src/models/Mistake.model');
require('./src/models/MockTest.model');
require('./src/models/Note.model');
require('./src/models/Question.model');
require('./src/models/QuizAttempt.model');
require('./src/models/Resource.model');
require('./src/models/StudyPlan.model');
require('./src/models/StudySession.model');
require('./src/models/SyllabusProgress.model');

// Import Routes
const contentRoutes = require('./src/routes/content.routes');
const quizRoutes = require('./src/routes/quiz.routes');
const mistakeRoutes = require('./src/routes/mistake.routes');
const bookmarkRoutes = require('./src/routes/bookmark.routes');
const sessionRoutes = require('./src/routes/session.routes');
const challengeRoutes = require('./src/routes/challenge.routes');
const mockTestRoutes = require('./src/routes/mockTest.routes');
const aiRoutes = require('./src/routes/ai.routes');
const dailyChallengeRoutes = require('./src/routes/dailyChallenge.routes');
const doubtRoutes = require('./src/routes/doubt.routes');
const studyPlanRoutes = require('./src/routes/studyPlan.routes');
const flashcardRoutes = require('./src/routes/flashcard.routes');
const resourceRoutes = require('./src/routes/resource.routes');
const syllabusRoutes = require('./src/routes/syllabus.routes');
const noteRoutes = require('./src/routes/note.routes');

const app = express();
app.set('trust proxy', 1);

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

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check
app.get('/api/content/health', (req, res) => {
  res.json({ status: 'OK', service: 'content-service', timestamp: new Date().toISOString() });
});

// Content Routes (Port 5003)
app.use('/api/content', contentRoutes);
app.use('/api/quizzes', quizLimiter, quizRoutes);
app.use('/api/mistakes', mistakeRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/mock-tests', mockTestRoutes);
app.use('/api/ai', aiLimiter, aiRoutes);
app.use('/api/daily-challenge', dailyChallengeRoutes);
app.use('/api/doubts', doubtRoutes);
app.use('/api/study-plan', studyPlanRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/notes', noteRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Content service route not found' });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.CONTENT_PORT || 5003;
app.listen(PORT, () => {
  console.log(`🚀 Content & Revision Service running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

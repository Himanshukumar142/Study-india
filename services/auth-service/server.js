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
const { authLimiter } = require('./src/middleware/rateLimiter.middleware');

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

const authRoutes = require('./src/routes/auth.routes');

const app = express();
app.set('trust proxy', 1);

connectDB();

app.use(helmet());
app.use(cors({
  origin: [process.env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.get('/api/auth/health', (req, res) => {
  res.json({ status: 'OK', service: 'auth-service', timestamp: new Date().toISOString() });
});
app.use('/api/auth', authRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Auth route not found' });
});
app.use(errorHandler);

const PORT = process.env.AUTH_PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Auth Service running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

[![Production CI/CD Pipeline](https://github.com/Himanshukumar142/Study-india/actions/workflows/deploy.yml/badge.svg)](https://github.com/Himanshukumar142/Study-india/actions/workflows/deploy.yml)
# StudyQuest — JEE/NEET Gamified Learning Platform

A production-ready full-stack learning platform for JEE and NEET aspirants with gamification, focus mode, quizzes, analytics, and more.

## Tech Stack
- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas
- **File Storage**: Backblaze B2 (native API)
- **Auth**: JWT access token + refresh token (HttpOnly cookie);

## Setup

### 1. Clone & Install

```bash
# From root directory
npm run install-all
```

### 2. Configure Environment Variables

**Backend** — copy `.env.example` to `.env` and fill in:
```
MONGO_URI=mongodb+srv://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
B2_KEY_ID=...
B2_APPLICATION_KEY=...
B2_BUCKET_NAME=...
B2_BUCKET_ID=...
B2_DOWNLOAD_URL=https://f004.backblazeb2.com
CLIENT_URL=http://localhost:5173
```

**Frontend** — copy `.env.example` to `.env`:
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Backblaze B2 Setup
1. Create a Backblaze B2 account
2. Create a **public** bucket
3. Create an application key with **Read and Write** access
4. Copy `keyId`, `applicationKey`, `bucketName`, `bucketId` to backend `.env`
5. Set `B2_DOWNLOAD_URL` to your bucket's download URL (e.g. `https://f004.backblazeb2.com`)

### 4. Run

```bash
# Start both Backend and Frontend
npm run dev
```

## API Reference

| Route | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/signup` | POST | Public | Create account |
| `/api/auth/login` | POST | Public | Login |
| `/api/auth/refresh` | POST | Cookie | Refresh access token |
| `/api/auth/logout` | POST | Public | Logout |
| `/api/auth/me` | GET | Bearer | Get current user |
| `/api/content/upload` | POST | Bearer | Upload PDF/image |
| `/api/content` | GET | Bearer | List content |
| `/api/content/:id` | GET | Bearer | Get single content |
| `/api/quizzes/questions` | GET | Bearer | Get quiz questions |
| `/api/quizzes/submit` | POST | Bearer | Submit quiz |
| `/api/mistakes` | GET | Bearer | Get mistakes |
| `/api/mistakes/:id/revise` | PATCH | Bearer | Mark revised |
| `/api/bookmarks` | GET | Bearer | List bookmarks |
| `/api/sessions/study` | POST | Bearer | Save study session |
| `/api/sessions/focus` | POST | Bearer | Save focus session |
| `/api/analytics/dashboard` | GET | Bearer | Dashboard analytics |
| `/api/leaderboard` | GET | Bearer | Top users by XP |
| `/api/challenges` | GET | Bearer | Active challenges |
| `/api/admin/stats` | GET | Admin | Platform stats |
| `/api/admin/users` | GET | Admin | Manage users |
| `/api/admin/content` | GET | Admin | Manage content |

## Features
- 🔐 Secure JWT auth with refresh token rotation
- 📚 PDF/image upload to Backblaze B2 with image compression
- 📖 In-browser PDF viewer with reading time tracking
- 🎯 Focus mode with tab/window violation detection
- 📝 Chapter-wise quizzes with negative marking
- ❌ Auto-save mistakes + revision tracking
- 🎮 XP system, levels, streaks, daily challenges
- 📊 Analytics dashboard with charts
- 🏆 Leaderboard
- 🛡️ Admin panel for user/content management

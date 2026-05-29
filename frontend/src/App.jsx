import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import ContentLibrary from './pages/ContentLibrary'
import UploadPage from './pages/UploadPage'
import ReaderPage from './pages/ReaderPage'
import FocusModePage from './pages/FocusModePage'
import QuizSelectionPage from './pages/QuizSelectionPage'
import QuizPage from './pages/QuizPage'
import QuizResultPage from './pages/QuizResultPage'
import MistakeNotebook from './pages/MistakeNotebook'
import LeaderboardPage from './pages/LeaderboardPage'
import ProfilePage from './pages/ProfilePage'
import BookmarksPage from './pages/BookmarksPage'
import AdminPanel from './pages/AdminPanel'
import MockTestLeaderboardPage from './pages/MockTestLeaderboardPage'
import PDFQuizPage from './pages/PDFQuizPage'
import AnalyticsPage from './pages/AnalyticsPage'
import DailyChallengePage from './pages/DailyChallengePage'
import DoubtForumPage from './pages/DoubtForumPage'
import StudyPlannerPage from './pages/StudyPlannerPage'
import FlashcardPage from './pages/FlashcardPage'
import ResourceDownloaderPage from './pages/ResourceDownloaderPage'
import SyllabusTrackerPage from './pages/SyllabusTrackerPage'
import NotesPage from './pages/NotesPage'
import FormulaSheetPage from './pages/FormulaSheetPage'
import BadgesPage from './pages/BadgesPage'
import PomodoroPage from './pages/PomodoroPage'
import Layout from './components/Layout'
import AIFloatingBot from './components/AIFloatingBot'
import MusicPlayer from './components/MusicPlayer'

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
    </div>
  )

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
        <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignupPage />} />

        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="library" element={<ContentLibrary />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="reader/:id" element={<ReaderPage />} />
          <Route path="focus" element={<FocusModePage />} />
          <Route path="quiz" element={<QuizSelectionPage />} />
          <Route path="quiz/:subject/:chapter" element={<QuizPage />} />
          <Route path="quiz/mock/:mockTestId" element={<QuizPage isMockTest={true} />} />
          <Route path="quiz/result/:id" element={<QuizResultPage />} />
          <Route path="mistakes" element={<MistakeNotebook />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="mock-test/leaderboard/:id" element={<MockTestLeaderboardPage />} />
          <Route path="pdf-quiz" element={<PDFQuizPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="daily-challenge" element={<DailyChallengePage />} />
          <Route path="doubts" element={<DoubtForumPage />} />
          <Route path="study-plan" element={<StudyPlannerPage />} />
          <Route path="flashcards" element={<FlashcardPage />} />
          <Route path="downloader" element={<ResourceDownloaderPage />} />
          <Route path="syllabus" element={<SyllabusTrackerPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="formulas" element={<FormulaSheetPage />} />
          <Route path="badges" element={<BadgesPage />} />
          <Route path="pomodoro" element={<PomodoroPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      <AIFloatingBot />
      <MusicPlayer />
    </BrowserRouter>
  )
}

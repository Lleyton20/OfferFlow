import { AnimatePresence } from 'motion/react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { GuestRoute } from './components/GuestRoute'
import { PageFade } from './components/PageFade'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { ContactsPage } from './pages/ContactsPage'
import { DashboardPage } from './pages/DashboardPage'
import { HistoryPage } from './pages/HistoryPage'
import { InterviewPrepPage } from './pages/InterviewPrepPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResumesPage } from './pages/ResumesPage'

function App() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <GuestRoute>
              <PageFade>
                <LandingPage />
              </PageFade>
            </GuestRoute>
          }
        />
        <Route
          path="/login"
          element={
            <GuestRoute>
              <PageFade>
                <LoginPage />
              </PageFade>
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <PageFade>
                <RegisterPage />
              </PageFade>
            </GuestRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <PageFade>
                <DashboardPage />
              </PageFade>
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <PageFade>
                <HistoryPage />
              </PageFade>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resumes"
          element={
            <ProtectedRoute>
              <PageFade>
                <ResumesPage />
              </PageFade>
            </ProtectedRoute>
          }
        />
        <Route
          path="/contacts"
          element={
            <ProtectedRoute>
              <PageFade>
                <ContactsPage />
              </PageFade>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews"
          element={
            <ProtectedRoute>
              <PageFade>
                <InterviewPrepPage />
              </PageFade>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <PageFade>
                <AnalyticsPage />
              </PageFade>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default App

import { AnimatePresence } from 'motion/react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { GuestRoute } from './components/GuestRoute'
import { PageFade } from './components/PageFade'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

// Signed-in pages load on demand so the landing and sign-in pages stay light.
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })))
const AssistantPage = lazy(() => import('./pages/AssistantPage').then((m) => ({ default: m.AssistantPage })))
const ContactsPage = lazy(() => import('./pages/ContactsPage').then((m) => ({ default: m.ContactsPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const DiscoverPage = lazy(() => import('./pages/DiscoverPage').then((m) => ({ default: m.DiscoverPage })))
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((m) => ({ default: m.HistoryPage })))
const InterviewPrepPage = lazy(() => import('./pages/InterviewPrepPage').then((m) => ({ default: m.InterviewPrepPage })))
const ResumesPage = lazy(() => import('./pages/ResumesPage').then((m) => ({ default: m.ResumesPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((m) => ({ default: m.SettingsPage })))

function App() {
  const location = useLocation()

  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
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
          path="/forgot-password"
          element={
            <PageFade>
              <ForgotPasswordPage />
            </PageFade>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PageFade>
              <ResetPasswordPage />
            </PageFade>
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
          path="/assistant"
          element={
            <ProtectedRoute>
              <PageFade>
                <AssistantPage />
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
        <Route
          path="/discover"
          element={
            <ProtectedRoute>
              <PageFade>
                <DiscoverPage />
              </PageFade>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PageFade>
                <SettingsPage />
              </PageFade>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
    </Suspense>
  )
}

export default App

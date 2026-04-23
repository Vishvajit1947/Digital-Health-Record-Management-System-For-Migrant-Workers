import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { ThemeProvider } from './context/ThemeContext'
import './lib/i18n'

import RoleGuard from './components/shared/RoleGuard'
import AppLayout from './components/shared/AppLayout'
import LoadingSpinner from './components/shared/LoadingSpinner'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Home from './pages/Home'
import PatientAccess from './pages/doctor/PatientAccess'

// Auth pages (eager)
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Worker pages
import WorkerDashboard from './pages/worker/Dashboard'
import WorkerRecords from './pages/worker/Records'
import WorkerPrescriptions from './pages/worker/Prescriptions'
import WorkerNotifications from './pages/worker/Notifications'

// Doctor pages
import DoctorDashboard from './pages/doctor/Dashboard'
import ScanNFC from './pages/doctor/ScanNFC'
import PatientDetail from './pages/doctor/PatientDetail'
import AddRecord from './pages/doctor/AddRecord'
import DoctorPatients from './pages/doctor/Patients'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import Analytics from './pages/admin/Analytics'
import RiskTable from './pages/admin/RiskTable'
import WorkerDetail from './pages/admin/WorkerDetail'

function ProtectedLayout({ role, children }) {
  return (
    <RoleGuard role={role}>
      <AppLayout>
        {children}
      </AppLayout>
    </RoleGuard>
  )
}

// Guards the /patient/:token route.
// Enforces: authenticated + role=doctor before rendering PatientAccess.
// All other states show a spinner or redirect — patient data is never exposed.
function NfcPatientGuard({ children }) {
  const { session, role, loading } = useAuth()
  const location = useLocation()

  // Wait until auth is fully resolved (session set + profile loaded)
  if (loading || (session && !role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Not logged in → send to login, preserving the full NFC URL for redirect-back
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Logged in but not a doctor → show access denied (don't redirect to avoid loops)
  if (role !== 'doctor') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
        <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-8 text-center">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Access Denied</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            This page is only accessible to doctors. Please log in with a doctor account.
          </p>
          <a href="/login" className="mt-6 inline-block w-full bg-indigo-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-indigo-700 transition-colors">
            Sign in as Doctor
          </a>
        </div>
      </div>
    )
  }

  // Authenticated doctor — render inside AppLayout
  return <AppLayout>{children}</AppLayout>
}

function AdminRouteGuard({ children }) {
  const { session, role, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const simulatedAdminAccess = localStorage.getItem('admin_portal_access') === 'true'
  if (role !== 'admin' && !simulatedAdminAccess) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: { borderRadius: '12px', background: '#1E293B', color: '#F8FAFC', fontSize: '14px' },
                  success: { iconTheme: { primary: '#16A34A', secondary: '#F8FAFC' } },
                  error: { iconTheme: { primary: '#DC2626', secondary: '#F8FAFC' } },
                }}
              />
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900"><LoadingSpinner size="lg" /></div>}>
                <Routes>
                {/* Auth */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* NFC patient link — auth-gated, renders inside AppLayout */}
                <Route path="/patient/:token/:patientName?" element={<NfcPatientGuard><PatientAccess /></NfcPatientGuard>} />

                {/* Worker routes */}
                <Route path="/dashboard/worker" element={<Navigate to="/worker/dashboard" replace />} />
                <Route path="/worker/dashboard" element={<ProtectedLayout role="worker"><WorkerDashboard /></ProtectedLayout>} />
                <Route path="/worker/records" element={<ProtectedLayout role="worker"><WorkerRecords /></ProtectedLayout>} />
                <Route path="/worker/prescriptions" element={<ProtectedLayout role="worker"><WorkerPrescriptions /></ProtectedLayout>} />
                <Route path="/worker/notifications" element={<ProtectedLayout role="worker"><WorkerNotifications /></ProtectedLayout>} />

                {/* Doctor routes */}
                <Route path="/dashboard/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
                <Route path="/dashboard/doctor/patients" element={<ProtectedLayout role="doctor"><DoctorPatients /></ProtectedLayout>} />
                <Route path="/doctor/patients" element={<Navigate to="/dashboard/doctor/patients" replace />} />
                <Route path="/doctor/dashboard" element={<ProtectedLayout role="doctor"><DoctorDashboard /></ProtectedLayout>} />
                <Route path="/doctor/scan" element={<ProtectedLayout role="doctor"><ScanNFC /></ProtectedLayout>} />
                <Route path="/doctor/patient/:id" element={<ProtectedLayout role="doctor"><PatientDetail /></ProtectedLayout>} />
                <Route path="/doctor/add-record/:patientId" element={<ProtectedLayout role="doctor"><AddRecord /></ProtectedLayout>} />

                {/* Admin routes */}
                <Route path="/admin/dashboard" element={<AdminRouteGuard><AdminDashboard /></AdminRouteGuard>} />
                <Route path="/admin/analytics" element={<AdminRouteGuard><Analytics /></AdminRouteGuard>} />
                <Route path="/admin/risk-table" element={<AdminRouteGuard><RiskTable /></AdminRouteGuard>} />
                <Route path="/admin/worker/:id" element={<AdminRouteGuard><WorkerDetail /></AdminRouteGuard>} />

                {/* Default redirect */}
                <Route path="/" element={<Home />} />
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

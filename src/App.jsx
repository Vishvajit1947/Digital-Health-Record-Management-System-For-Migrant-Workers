import { Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/AuthContext'
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
import AdminLogin from './pages/admin/Login'

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
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  const simulatedAdminAccess = localStorage.getItem('admin_portal_access') === 'true'
  if (role !== 'admin' && !simulatedAdminAccess) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />
  }

  return <AppLayout>{children}</AppLayout>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
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
                <Route path="/admin/login" element={<AdminLogin />} />

                {/* Public NFC patient link */}
                <Route path="/patient/:token/:patientName?" element={<PatientAccess />} />

                {/* Worker routes */}
                <Route path="/dashboard/worker" element={<Navigate to="/worker/dashboard" replace />} />
                <Route path="/worker/dashboard" element={<ProtectedLayout role="worker"><WorkerDashboard /></ProtectedLayout>} />
                <Route path="/worker/records" element={<ProtectedLayout role="worker"><WorkerRecords /></ProtectedLayout>} />
                <Route path="/worker/prescriptions" element={<ProtectedLayout role="worker"><WorkerPrescriptions /></ProtectedLayout>} />
                <Route path="/worker/notifications" element={<ProtectedLayout role="worker"><WorkerNotifications /></ProtectedLayout>} />

                {/* Doctor routes */}
                <Route path="/dashboard/doctor" element={<Navigate to="/doctor/dashboard" replace />} />
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
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

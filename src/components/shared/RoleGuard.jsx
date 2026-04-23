import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

// Final destination paths — no intermediate redirects that cause loop chains
const ROLE_HOME = {
  worker: '/worker/dashboard',
  doctor: '/doctor/dashboard',
  admin: '/admin/dashboard',
}

export default function RoleGuard({ role, children }) {
  const { session, role: userRole, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) return <Navigate to="/login" replace />

  if (role && userRole !== role) {
    // Redirect to the user's actual home — never to an intermediate /dashboard/* redirect
    return <Navigate to={ROLE_HOME[userRole] || '/login'} replace />
  }

  return children
}

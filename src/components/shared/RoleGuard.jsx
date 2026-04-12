import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'

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
    const redirectMap = { worker: '/worker/dashboard', doctor: '/doctor/dashboard', admin: '/admin/dashboard' }
    return <Navigate to={redirectMap[userRole] || '/login'} replace />
  }

  return children
}

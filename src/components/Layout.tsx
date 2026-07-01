import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { user, signOut } = useAuth()

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <Link to="/" className="app-brand">
            Brighten Div 10 Estimator
          </Link>
          <nav className="app-nav">
            <Link to="/">Projects</Link>
            <Link to="/labor-rules">Labor Rules</Link>
            {user && <span className="nav-user">{user.email}</span>}
            <button
              type="button"
              className="header-button"
              onClick={() => {
                void signOut()
              }}
            >
              Sign Out
            </button>
          </nav>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}

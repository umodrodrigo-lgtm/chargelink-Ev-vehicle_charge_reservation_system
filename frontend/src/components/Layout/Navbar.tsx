import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Zap, Menu, X, Sun, Moon, User, LogOut, LayoutDashboard, Map, CreditCard } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useLogout } from '@/hooks/useAuth'
import { Button } from '@/components/UI/Button'
import { clsx } from 'clsx'

function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    document.documentElement.classList.toggle('dark')
    setDark(d => !d)
  }
  return { dark, toggle }
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { dark, toggle } = useDarkMode()
  const { isAuthenticated, user } = useAuthStore()
  const logout = useLogout()

  const navLinks = [
    { to: '/map', label: 'Map', icon: <Map className="w-4 h-4" /> },
    { to: '/subscriptions', label: 'Plans', icon: <CreditCard className="w-4 h-4" /> },
    ...(isAuthenticated ? [{ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> }] : []),
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin', icon: <LayoutDashboard className="w-4 h-4" /> }] : []),
  ]

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary-600 rounded-lg">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">ChargeLink</span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => clsx(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700',
                )}
              >
                {link.icon}{link.label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={toggle}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <span className="hidden md:block text-sm text-gray-600 dark:text-gray-400">
                  {user?.firstName}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex gap-2">
                <Link to="/login"><Button variant="secondary" size="sm">Login</Button></Link>
                <Link to="/register"><Button size="sm">Sign Up</Button></Link>
              </div>
            )}

            <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileOpen(o => !o)}>
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <NavLink key={link.to} to={link.to} onClick={() => setMobileOpen(false)}
                className={({ isActive }) => clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full',
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700',
                )}>
                {link.icon}{link.label}
              </NavLink>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 pt-2">
                <Link to="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">Login</Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

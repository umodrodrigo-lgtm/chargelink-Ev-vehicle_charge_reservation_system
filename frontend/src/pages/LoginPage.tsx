import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Zap } from 'lucide-react'
import { Input } from '@/components/UI/Input'
import { Button } from '@/components/UI/Button'
import { useLogin } from '@/hooks/useAuth'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const login = useLogin()

  const validate = () => {
    const e: typeof errors = {}
    if (!email) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Invalid email'
    if (!password) e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    login.mutate({ email, password })
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary-600 rounded-2xl">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-1">Welcome back</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">Sign in to your ChargeLink account</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            error={errors.email}
            icon={<Mail className="w-4 h-4" />}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            error={errors.password}
            icon={<Lock className="w-4 h-4" />}
          />

          <Button type="submit" className="w-full" size="lg" loading={login.isPending}>
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
            Create one
          </Link>
        </p>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700 rounded-xl text-xs text-gray-500 dark:text-gray-400">
          <strong>Demo:</strong> user@chargelink.com / User@1234<br />
          <strong>Admin:</strong> admin@chargelink.com / Admin@1234
        </div>
      </div>
    </div>
  )
}

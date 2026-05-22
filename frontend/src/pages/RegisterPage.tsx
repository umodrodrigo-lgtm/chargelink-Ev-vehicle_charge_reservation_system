import { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Mail, Lock, Phone, Zap } from 'lucide-react'
import { Input } from '@/components/UI/Input'
import { Button } from '@/components/UI/Button'
import { useRegister } from '@/hooks/useAuth'

export function RegisterPage() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const register = useRegister()

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.firstName) e.firstName = 'Required'
    if (!form.lastName) e.lastName = 'Required'
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required'
    if (form.password.length < 8) e.password = 'Min 8 characters'
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password))
      e.password = 'Must contain uppercase, lowercase, and digit'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    register.mutate({ ...form, phone: form.phone || undefined })
  }

  return (
    <div className="w-full max-w-md animate-slide-up">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-primary-600 rounded-2xl">
            <Zap className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-1">Create account</h1>
        <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">Join ChargeLink today</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" placeholder="John" value={form.firstName} onChange={set('firstName')}
              error={errors.firstName} icon={<User className="w-4 h-4" />} />
            <Input label="Last Name" placeholder="Doe" value={form.lastName} onChange={set('lastName')}
              error={errors.lastName} />
          </div>
          <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')}
            error={errors.email} icon={<Mail className="w-4 h-4" />} />
          <Input label="Password" type="password" placeholder="Min 8 chars" value={form.password}
            onChange={set('password')} error={errors.password} icon={<Lock className="w-4 h-4" />} />
          <Input label="Phone (optional)" placeholder="+1 555 000 0000" value={form.phone} onChange={set('phone')}
            icon={<Phone className="w-4 h-4" />} />

          <Button type="submit" className="w-full" size="lg" loading={register.isPending}>
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}

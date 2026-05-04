import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, AlertCircle } from 'lucide-react'
import axios from 'axios'

const BACKEND = '/backend'

export default function Register() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('from') || ''
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${BACKEND}/api/auth/register`, {
        name: name.trim() || 'Customer',
        email: email.trim(),
        password,
      })
      const loginUrl = redirectTo
        ? `/login?from=${encodeURIComponent(redirectTo)}`
        : '/login'
      navigate(loginUrl, { state: { registeredEmail: email.trim() } })
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/portal" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-forge-orange/10 border border-forge-orange/20 flex items-center justify-center">
              <Zap size={20} className="text-forge-orange" />
            </div>
            <span className="font-display font-bold text-xl">Create customer account</span>
          </Link>
          <p className="text-forge-muted text-sm">Book repairs and track saved estimates in the portal.</p>
        </div>
        <div className="glass rounded-2xl p-8 border border-forge-border/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm border border-red-500/30 rounded-xl px-3 py-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase mb-1">Name</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-forge-border bg-transparent text-sm" />
            </div>
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase mb-1">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-forge-border bg-transparent text-sm" />
            </div>
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase mb-1">Password (min 8)</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-forge-border bg-transparent text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 bg-forge-orange text-white font-semibold rounded-xl disabled:opacity-60">
              {loading ? 'Creating…' : 'Create account'}
            </button>
          </form>
          <p className="text-center text-xs text-forge-muted mt-4">
            <Link
              to={redirectTo ? `/login?from=${encodeURIComponent(redirectTo)}` : '/login'}
              className="text-forge-blue-light hover:underline"
            >
              Already have an account? Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

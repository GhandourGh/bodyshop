import { useState, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react'
import axios from 'axios'

const BACKEND = '/backend'

export default function ResetPassword() {
  const [search] = useSearchParams()
  const token = useMemo(() => search.get('token') || '', [search])
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!token) {
      setError('Missing reset token. Open the link from your email.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await axios.post(`${BACKEND}/api/auth/reset-password`, { token, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-forge-blue/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-forge-orange/10 border border-forge-orange/20 flex items-center justify-center">
              <Zap size={20} className="text-forge-orange" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Auto<span className="text-forge-orange">Forge</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-3xl mb-2">New password</h1>
          <p className="text-forge-muted text-sm">Choose a strong password for your account.</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-forge-border/50">
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-400" />
              </div>
              <p className="font-display font-semibold text-lg mb-2">Password updated</p>
              <p className="text-sm text-forge-muted">Redirecting to sign in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">New password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 glass border border-forge-border rounded-xl text-sm text-forge-text focus:outline-none focus:border-forge-blue/50 bg-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">Confirm password</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 glass border border-forge-border rounded-xl text-sm text-forge-text focus:outline-none focus:border-forge-blue/50 bg-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-forge-orange hover:bg-forge-orange-light disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
              >
                {loading ? 'Saving…' : 'Save password'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-forge-muted mt-6">
          <Link to="/login" className="inline-flex items-center gap-1.5 hover:text-forge-text transition-colors">
            <ArrowLeft size={12} /> Back to sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

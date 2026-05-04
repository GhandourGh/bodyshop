import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Zap, AlertCircle } from 'lucide-react'
import { useToast } from '@/components/shared/Toast'
import { getStoredToken, getStoredUser, setStoredAuth } from '@/lib/auth'
import axios from 'axios'

const BACKEND_URL = '/backend'

export default function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('from') || null
  const [step, setStep] = useState<'password' | 'totp'>('password')
  const [pendingToken, setPendingToken] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Already logged in — redirect away from the login page
  useEffect(() => {
    if (!getStoredToken()) return
    const r = (getStoredUser()?.role || '').toLowerCase()
    const dest = redirectTo || (r === 'customer' ? '/portal/dashboard' : '/admin/dashboard')
    navigate(dest, { replace: true })
  }, [navigate, redirectTo])

  function finishLogin(token: string, user: { name?: string; email?: string; role?: string }) {
    setStoredAuth(token, user)
    toast(`Welcome back, ${user.name ?? user.email}`, 'success')
    const r = (user.role || '').toLowerCase()
    if (redirectTo) {
      navigate(redirectTo, { replace: true })
    } else if (r === 'customer') {
      navigate('/portal/dashboard', { replace: true })
    } else {
      navigate('/admin/dashboard', { replace: true })
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password })
      const data = res.data?.data ?? res.data
      if (data.step === 'totp_required' && data.pendingToken) {
        setPendingToken(data.pendingToken)
        setStep('totp')
        setTotpCode('')
        toast('Enter the code from your authenticator app', 'success')
        return
      }
      if (data.token && data.user) {
        finishLogin(data.token, data.user)
      } else {
        setError('Unexpected response from server.')
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  async function handleTotpSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!totpCode.trim()) {
      setError('Enter the 6-digit code.')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login/complete`, {
        pendingToken,
        code: totpCode.replace(/\s/g, ''),
      })
      const data = res.data?.data ?? res.data
      if (data.token && data.user) {
        finishLogin(data.token, data.user)
      } else {
        setError('Unexpected response from server.')
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Invalid code. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-forge-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-forge-orange/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-forge-orange/10 border border-forge-orange/20 flex items-center justify-center group-hover:bg-forge-orange/20 transition-colors">
              <Zap size={20} className="text-forge-orange" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Auto<span className="text-forge-orange">Forge</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-3xl mb-2">
            {step === 'totp' ? 'Authenticator' : 'Welcome back'}
          </h1>
          <p className="text-forge-muted text-sm">
            {step === 'totp'
              ? 'Enter the 6-digit code from your app.'
              : 'Sign in to your AutoForge account'}
          </p>
        </div>

        <div className="glass rounded-2xl p-8 border border-forge-border/50">
          {step === 'password' ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full px-4 py-3 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">
                    Password
                  </label>
                  <Link to="/forgot-password"
                    className="text-xs text-forge-blue-light hover:underline font-mono">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className="w-full px-4 py-3 pr-11 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent transition-colors"
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-forge-muted hover:text-forge-text transition-colors p-1">
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-forge-orange hover:bg-forge-orange-light disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mt-2">
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in…
                  </>
                ) : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotpSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={15} />
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">
                  Authenticator code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="000000"
                  className="w-full px-4 py-3 glass border border-forge-border rounded-xl text-sm text-forge-text tracking-widest font-mono focus:outline-none focus:border-forge-blue/50 bg-transparent"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-forge-orange hover:bg-forge-orange-light disabled:opacity-60 text-white font-semibold rounded-xl transition-colors">
                {loading ? 'Verifying…' : 'Verify and sign in'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('password'); setPendingToken(''); setTotpCode(''); setError('') }}
                className="w-full text-xs text-forge-muted hover:text-forge-text font-mono">
                ← Back to password
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-forge-muted mt-6">
          <Link to="/" className="hover:text-forge-text transition-colors">← Back to site</Link>
        </p>
      </motion.div>
    </div>
  )
}

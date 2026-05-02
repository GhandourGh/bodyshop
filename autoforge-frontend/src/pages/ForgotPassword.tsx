import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Mail, ArrowLeft, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail]   = useState('')
  const [sent, setSent]     = useState(false)
  const [loading, setLoading] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    // Simulate network delay — no real email in demo
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-forge-bg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-forge-blue/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-forge-orange/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="w-10 h-10 rounded-xl bg-forge-orange/10 border border-forge-orange/20 flex items-center justify-center group-hover:bg-forge-orange/20 transition-colors">
              <Zap size={20} className="text-forge-orange" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">
              Auto<span className="text-forge-orange">Forge</span>
            </span>
          </Link>
          <h1 className="font-display font-bold text-3xl mb-2">Reset password</h1>
          <p className="text-forge-muted text-sm">
            {sent ? 'Check your inbox for the reset link.' : "We'll send a reset link to your email."}
          </p>
        </div>

        <div className="glass rounded-2xl p-8 border border-forge-border/50">
          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forge-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent transition-colors"
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading || !email}
                  className="w-full py-3 bg-forge-blue hover:bg-forge-blue/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending…
                    </>
                  ) : 'Send Reset Link'}
                </button>
              </motion.form>
            ) : (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} className="text-green-400" />
                </div>
                <p className="font-display font-semibold text-lg mb-1">Email sent!</p>
                <p className="text-sm text-forge-muted mb-6">
                  We sent a reset link to <span className="text-forge-text font-mono">{email}</span>.<br />
                  Check your inbox (and spam folder).
                </p>
                <button onClick={() => { setSent(false); setEmail('') }}
                  className="text-xs font-mono text-forge-blue-light hover:underline">
                  Try a different email
                </button>
              </motion.div>
            )}
          </AnimatePresence>
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

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, Loader2 } from 'lucide-react'
import { backendClient } from '@/api/client'
import BackButton from '@/components/shared/BackButton'

type Me = {
  id: string
  name: string
  email: string
  role: string
  created_at?: string | null
  totp_enabled?: boolean
}

export default function PortalProfile() {
  const [me, setMe] = useState<Me | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const res = await backendClient.get('/api/users/me')
        const root = res.data
        const d = root?.data ?? root
        if (!cancelled) setMe(d as Me)
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string } } }
        if (!cancelled) setErr(ax.response?.data?.message || 'Failed to load profile')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <BackButton />
      <div className="flex items-center gap-3 mb-6 mt-4">
        <User className="text-forge-blue-light" size={24} />
        <div>
          <p className="text-xs font-mono text-forge-muted uppercase tracking-widest">Account</p>
          <h1 className="font-display font-bold text-2xl">Your profile</h1>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-forge-muted">
          <Loader2 size={18} className="animate-spin" /> Loading…
        </div>
      )}
      {err && <p className="text-red-400 text-sm">{err}</p>}

      {!loading && me && (
        <div className="glass rounded-2xl border border-forge-border p-6 max-w-lg space-y-4">
          <div className="flex items-start gap-3">
            <Mail size={18} className="text-forge-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-mono text-forge-muted uppercase">Email</p>
              <p className="text-forge-text font-medium">{me.email}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <User size={18} className="text-forge-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-mono text-forge-muted uppercase">Name</p>
              <p className="text-forge-text font-medium">{me.name}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Shield size={18} className="text-forge-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-mono text-forge-muted uppercase">Two-factor sign-in</p>
              <p className="text-forge-text text-sm">
                {me.totp_enabled ? 'Enabled on your account' : 'Not enabled'}
              </p>
            </div>
          </div>
          {me.created_at && (
            <p className="text-xs text-forge-muted font-mono pt-2 border-t border-forge-border/40">
              Member since {new Date(me.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
      )}
    </motion.div>
  )
}

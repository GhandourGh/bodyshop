import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Shield, Bell, SunMoon, KeyRound, Loader2 } from 'lucide-react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'
import { useToast } from '@/components/shared/Toast'

const uptimeData = [
  { time: '00:00', uptime: 99.9 },
  { time: '06:00', uptime: 99.8 },
  { time: '12:00', uptime: 99.95 },
  { time: '18:00', uptime: 99.92 },
  { time: '24:00', uptime: 99.96 },
]

const settingsCards = [
  { icon: Bell, title: 'Alerts', description: 'Control low-stock, delayed-repair, and sentiment risk notifications.' },
  { icon: SunMoon, title: 'Appearance', description: 'Set global dark/light preferences and cinematic motion intensity.' },
]

type MeUser = { id: string; name: string; email: string; role: string; totp_enabled?: boolean }

export default function Settings() {
  const { toast } = useToast()
  const [me, setMe] = useState<MeUser | null>(null)
  const [loadingMe, setLoadingMe] = useState(true)
  const [totpPhase, setTotpPhase] = useState<'idle' | 'scan'>('idle')
  const [totpSecret, setTotpSecret] = useState('')
  const [totpUrl, setTotpUrl] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpBusy, setTotpBusy] = useState(false)
  const [disablePw, setDisablePw] = useState('')
  const [disableCode, setDisableCode] = useState('')

  const loadMe = useCallback(async () => {
    setLoadingMe(true)
    try {
      const res = await backendClient.get('/api/users/me')
      const u = res.data?.data ?? res.data
      setMe(u)
    } catch {
      setMe(null)
    } finally {
      setLoadingMe(false)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  async function startTotpSetup() {
    setTotpBusy(true)
    try {
      const res = await backendClient.post('/api/auth/totp/setup')
      const d = res.data?.data ?? res.data
      setTotpSecret(d.secret)
      setTotpUrl(d.otpauthUrl)
      setTotpPhase('scan')
      setTotpCode('')
      toast('Scan the QR code with Google Authenticator, Authy, or 1Password.', 'success')
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Could not start 2FA setup.', 'error')
    } finally {
      setTotpBusy(false)
    }
  }

  async function confirmTotpEnable() {
    if (!totpSecret || !totpCode.trim()) {
      toast('Enter the code from your app.', 'error')
      return
    }
    setTotpBusy(true)
    try {
      await backendClient.post('/api/auth/totp/enable', { secret: totpSecret, code: totpCode.replace(/\s/g, '') })
      setTotpPhase('idle')
      setTotpSecret('')
      setTotpUrl('')
      setTotpCode('')
      await loadMe()
      toast('Two-factor authentication is enabled.', 'success')
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Invalid code.', 'error')
    } finally {
      setTotpBusy(false)
    }
  }

  async function submitTotpDisable() {
    if (!disablePw || !disableCode.trim()) {
      toast('Password and authenticator code are required.', 'error')
      return
    }
    setTotpBusy(true)
    try {
      await backendClient.post('/api/auth/totp/disable', {
        password: disablePw,
        code: disableCode.replace(/\s/g, ''),
      })
      setDisablePw('')
      setDisableCode('')
      await loadMe()
      toast('Two-factor authentication disabled.', 'success')
    } catch (e: unknown) {
      const ax = e as { response?: { data?: { message?: string } } }
      toast(ax.response?.data?.message || 'Could not disable 2FA.', 'error')
    } finally {
      setTotpBusy(false)
    }
  }

  const qrSrc = totpUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpUrl)}`
    : ''

  return (
    <AdminLayout>
      <div className="space-y-6">
        <BackButton />
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">System</p>
          <h1 className="font-display font-bold text-3xl">Settings</h1>
        </div>

        {/* Two-factor authentication */}
        <div className="glass rounded-2xl p-6 border border-forge-border/50">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound size={18} className="text-forge-orange" />
            <h3 className="font-display font-semibold text-lg">Two-factor authentication (TOTP)</h3>
          </div>
          {loadingMe ? (
            <div className="flex items-center gap-2 text-forge-muted text-sm">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : me?.totp_enabled ? (
            <div className="space-y-4">
              <p className="text-sm text-forge-muted">
                2FA is <span className="text-green-400 font-semibold">on</span> for <span className="font-mono text-forge-text">{me.email}</span>.
                Sign-in will require your authenticator app after the password.
              </p>
              <div className="grid gap-3 max-w-md">
                <input
                  type="password"
                  placeholder="Current password"
                  value={disablePw}
                  onChange={e => setDisablePw(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-forge-border bg-transparent text-sm"
                />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Authenticator code"
                  value={disableCode}
                  onChange={e => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="px-4 py-2.5 rounded-xl border border-forge-border bg-transparent text-sm font-mono tracking-widest"
                />
                <button
                  type="button"
                  disabled={totpBusy}
                  onClick={submitTotpDisable}
                  className="px-4 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 disabled:opacity-50 w-fit"
                >
                  Disable 2FA
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-forge-muted max-w-xl">
                Add an extra step at login using an authenticator app (Google Authenticator, Authy, 1Password, etc.).
                No SMS required.
              </p>
              {totpPhase === 'idle' && (
                <button
                  type="button"
                  disabled={totpBusy}
                  onClick={startTotpSetup}
                  className="px-5 py-2.5 rounded-xl bg-forge-orange text-white text-sm font-semibold hover:bg-forge-orange-light disabled:opacity-50 flex items-center gap-2"
                >
                  {totpBusy ? <Loader2 size={16} className="animate-spin" /> : null}
                  Set up authenticator
                </button>
              )}
              {totpPhase === 'scan' && totpUrl && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex flex-wrap gap-6 items-start">
                    <div className="rounded-xl border border-forge-border p-2 bg-white">
                      <img src={qrSrc} width={180} height={180} alt="Authenticator QR" className="block" />
                    </div>
                    <div className="text-xs font-mono text-forge-muted max-w-sm break-all">
                      <p className="mb-2 text-forge-text font-sans text-sm font-semibold">If you cannot scan:</p>
                      <p className="text-forge-text">{totpSecret}</p>
                    </div>
                  </div>
                  <div className="max-w-xs space-y-2">
                    <label className="text-xs font-mono text-forge-muted uppercase">Verification code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={totpCode}
                      onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="000000"
                      className="w-full px-4 py-2.5 rounded-xl border border-forge-border bg-transparent font-mono tracking-widest"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={totpBusy}
                      onClick={confirmTotpEnable}
                      className="px-5 py-2.5 rounded-xl bg-forge-blue text-white text-sm font-semibold disabled:opacity-50"
                    >
                      {totpBusy ? <Loader2 size={16} className="animate-spin inline" /> : null}
                      Enable 2FA
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTotpPhase('idle'); setTotpSecret(''); setTotpUrl(''); setTotpCode('') }}
                      className="px-4 py-2.5 text-sm text-forge-muted hover:text-forge-text"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <SettingsIcon size={18} className="text-forge-blue" />
            <h3 className="font-display font-semibold text-lg">AI Service Uptime (24h)</h3>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={uptimeData}>
                <defs>
                  <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.06} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis domain={[99.6, 100]} stroke="#6b7280" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="uptime" stroke="#3b82f6" fill="url(#uptimeGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5 card-hover">
            <div className="w-10 h-10 rounded-xl bg-forge-blue/10 border border-forge-blue/20 flex items-center justify-center mb-3">
              <Shield size={18} className="text-forge-blue-light" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">Security</h3>
            <p className="text-sm text-forge-muted">
              Use two-factor authentication above. Password reset links are sent by email when SMTP is configured in the backend.
            </p>
          </motion.div>
          {settingsCards.map(({ icon: Icon, title, description }) => (
            <motion.div key={title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5 card-hover">
              <div className="w-10 h-10 rounded-xl bg-forge-blue/10 border border-forge-blue/20 flex items-center justify-center mb-3">
                <Icon size={18} className="text-forge-blue-light" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-sm text-forge-muted">{description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}

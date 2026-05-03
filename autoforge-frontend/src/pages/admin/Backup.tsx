import { useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Database, Clock, BookOpen, CheckCircle, AlertTriangle } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { backendClient } from '@/api/client'
import { useToast } from '@/components/shared/Toast'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } }),
}

const RESTORE_STEPS = [
  { step: '1', title: 'Sign in to Neon Console', detail: 'Go to console.neon.tech and open your AutoForge project.' },
  { step: '2', title: 'Open Branch History',      detail: 'Click the "Branches" tab → select your main branch → click "Restore".' },
  { step: '3', title: 'Choose a restore point',   detail: 'Pick a timestamp (Neon keeps 7-day rolling history on free tier).' },
  { step: '4', title: 'Confirm restore',           detail: 'Neon restores to a new branch. Verify data, then update DATABASE_URL in .env to point to it.' },
  { step: '5', title: 'Restart services',          detail: 'Restart the Next.js backend (intern-db) and FastAPI service so Prisma reconnects.' },
]

export default function Backup() {
  const { toast } = useToast()
  const [exporting, setExporting]   = useState(false)
  const [lastExport, setLastExport] = useState<string | null>(localStorage.getItem('af_last_backup'))

  async function handleExport() {
    setExporting(true)
    try {
      const res = await backendClient.get('/api/admin/backup', { responseType: 'blob' })
      const url  = URL.createObjectURL(res.data)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `autoforge-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      const ts = new Date().toLocaleString()
      localStorage.setItem('af_last_backup', ts)
      setLastExport(ts)
      toast('Database export downloaded successfully.', 'success')
    } catch {
      toast('Export failed. Make sure you are signed in as admin.', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">System</p>
          <h1 className="font-display font-bold text-3xl">Backup & Restore</h1>
          <p className="text-forge-muted text-sm mt-1">Export data and restore from Neon's built-in point-in-time recovery</p>
        </div>

        {/* Export card */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="glass rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-forge-blue/10 border border-forge-blue/20 flex items-center justify-center flex-shrink-0">
              <Database size={20} className="text-forge-blue" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Export Full Database</h3>
              <p className="text-sm text-forge-muted mt-1">Downloads all jobs, customers, vehicles, mechanics, parts, and messages as a single JSON file. Use as an offline backup or for data migration.</p>
            </div>
          </div>

          {lastExport && (
            <div className="flex items-center gap-2 text-xs font-mono text-forge-muted bg-forge-border/20 rounded-lg px-3 py-2 w-fit">
              <Clock size={11} /> Last export: {lastExport}
            </div>
          )}

          <button onClick={handleExport} disabled={exporting}
            className="flex items-center gap-2 px-5 py-3 bg-forge-blue hover:bg-forge-blue-light disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
            {exporting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Exporting…</>
              : <><Download size={15} /> Export JSON Backup</>
            }
          </button>
        </motion.div>

        {/* Restore guide */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-forge-orange/10 border border-forge-orange/20 flex items-center justify-center flex-shrink-0">
              <BookOpen size={20} className="text-forge-orange" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg">Restore from Neon</h3>
              <p className="text-sm text-forge-muted mt-1">Neon provides point-in-time recovery with 7-day rolling history (free tier). No pg_dump needed — restore directly from the console.</p>
            </div>
          </div>

          <div className="space-y-3">
            {RESTORE_STEPS.map(({ step, title, detail }) => (
              <div key={step} className="flex gap-4 p-3 rounded-xl bg-forge-border/10 border border-forge-border/20">
                <div className="w-7 h-7 rounded-lg bg-forge-blue/20 border border-forge-blue/30 flex items-center justify-center text-xs font-bold text-forge-blue flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-forge-text">{title}</p>
                  <p className="text-xs text-forge-muted mt-0.5">{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Warning */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2}
          className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
          <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-forge-muted">
            <span className="text-amber-400 font-semibold">Before restoring:</span> notify all active mechanics and close the shop app. A restore overwrites all data written after the restore point.
          </div>
        </motion.div>

        {/* Status indicator */}
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
          className="flex items-center gap-3 p-4 rounded-xl glass border border-forge-border/40">
          <CheckCircle size={16} className="text-green-400" />
          <div>
            <p className="text-sm font-medium text-forge-text">Neon automatic backups: <span className="text-green-400">Active</span></p>
            <p className="text-xs text-forge-muted">Neon snapshots your database continuously. Free tier retains 7 days of history.</p>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  )
}

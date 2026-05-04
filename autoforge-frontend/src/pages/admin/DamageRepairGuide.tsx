import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Wrench, Package, ListOrdered, Loader2 } from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import BackButton from '@/components/shared/BackButton'
import { backendClient } from '@/api/client'

type PartRow = { name: string; note?: string }
type GuideEntry = {
  label: string
  parts: PartRow[]
  actions: string[]
  yoloHints?: string[]
}

export default function DamageRepairGuide() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['damage-repair-guide'],
    queryFn: async () => {
      const res = await backendClient.get('/api/damage-repair-guide')
      const root = res.data
      if (root?.success === false) throw new Error(root.message || 'Failed')
      return (root?.data ?? root) as { damageTypes: string[]; guide: Record<string, GuideEntry> }
    },
  })

  const errMsg = error instanceof Error ? error.message : null

  return (
    <AdminLayout>
      <div className="space-y-8">
        <BackButton />
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Phase 10</p>
          <h1 className="font-display font-bold text-3xl">Damage → parts & labor</h1>
          <p className="text-forge-muted text-sm mt-2 max-w-2xl">
            Reference mapping from canonical damage types (used by AI estimates) to typical parts and labor steps.
            YOLO class names vary; use this table for planning and training—not a warranty of required work.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center gap-2 text-forge-muted">
            <Loader2 size={18} className="animate-spin" /> Loading guide…
          </div>
        )}
        {errMsg && <p className="text-red-400 text-sm">{errMsg}</p>}

        {data?.guide && Object.entries(data.guide).map(([key, g], i) => (
          <motion.section
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl border border-forge-border overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-forge-border/40 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display font-semibold text-lg capitalize">{key}</h2>
              <p className="text-sm text-forge-muted">{g.label}</p>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="flex items-center gap-2 text-xs font-mono text-forge-muted uppercase tracking-wider mb-3">
                  <Package size={14} /> Typical parts / materials
                </h3>
                <ul className="space-y-2 text-sm text-forge-text">
                  {g.parts.map((p, j) => (
                    <li key={j} className="border-l-2 border-forge-orange/50 pl-3">
                      <span className="font-medium">{p.name}</span>
                      {p.note && <span className="text-forge-muted"> — {p.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-xs font-mono text-forge-muted uppercase tracking-wider mb-3">
                  <ListOrdered size={14} /> Labor actions
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-forge-text">
                  {g.actions.map((a, j) => (
                    <li key={j}>{a}</li>
                  ))}
                </ol>
                {g.yoloHints && g.yoloHints.length > 0 && (
                  <p className="text-xs text-forge-muted mt-4 font-mono">
                    YOLO hints: {g.yoloHints.join(', ')}
                  </p>
                )}
              </div>
            </div>
          </motion.section>
        ))}
      </div>
    </AdminLayout>
  )
}

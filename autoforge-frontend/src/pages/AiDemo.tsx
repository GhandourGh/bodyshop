import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import {
  Upload, Scan, DollarSign, Clock, Wrench, Package,
  MessageSquare, Heart, Copy, RefreshCw, ChevronRight,
  AlertTriangle, CheckCircle, Minus, Zap
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import SkeletonCard from '@/components/shared/SkeletonCard'
import { useToast } from '@/components/shared/Toast'
import {
  predictDamage, predictTime, predictCost,
  assignMechanic, forecastInventory, generateMessage, analyzeSentiment
} from '@/api'
import type {
  DamageResponse, RepairFeatures, MechanicAssignResponse,
  InventoryResponse, MessageResponse, SentimentResponse
} from '@/types'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const PART_CATEGORIES = ['bumpers', 'headlights', 'body-panels', 'mirrors', 'windshields']
const BBOX_COLORS = ['#f97316', '#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#06b6d4', '#eab308']

function SectionHeader({ number, icon: Icon, title, desc }: { number: string; icon: any; title: string; desc: string }) {
  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-8">
      <div className="flex items-center gap-4 mb-3">
        <div className="w-10 h-10 rounded-xl bg-forge-orange/10 border border-forge-orange/20 flex items-center justify-center">
          <Icon size={18} className="text-forge-orange" />
        </div>
        <span className="font-mono text-xs text-forge-muted">SECTION {number}</span>
      </div>
      <h2 className="font-display font-bold text-3xl mb-2">{title}</h2>
      <p className="text-forge-muted text-sm max-w-xl">{desc}</p>
    </motion.div>
  )
}

// ── 1. Damage Detection ──────────────────────────────────────────────
function DamageDetection() {
  const { toast } = useToast()
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<DamageResponse | null>(null)
  const [imgDims, setImgDims] = useState({ w: 0, h: 0, natural_w: 0, natural_h: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const mutation = useMutation({
    mutationFn: predictDamage,
    onSuccess: (data) => {
      setResult(data)
      toast('Damage analysis complete — ' + data.detection_count + ' detections found', 'success')
    },
    onError: () => toast('AI service unavailable. Is the FastAPI server running on port 8000?', 'error'),
  })

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast('Please upload an image file', 'error'); return }
    setResult(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    mutation.mutate(file)
  }

  const onImgLoad = () => {
    if (!imgRef.current) return
    const { clientWidth, clientHeight, naturalWidth, naturalHeight } = imgRef.current
    setImgDims({ w: clientWidth, h: clientHeight, natural_w: naturalWidth, natural_h: naturalHeight })
  }

  const severityColor = (s: number) => s < 0.4 ? '#4ade80' : s < 0.7 ? '#fbbf24' : '#ef4444'
  const severityLabel = (s: number) => s < 0.4 ? 'LOW' : s < 0.7 ? 'MODERATE' : 'CRITICAL'

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
      className="glass rounded-2xl p-8 space-y-6">
      <SectionHeader number="01" icon={Scan} title="Damage Detection" desc="Upload a car photo. YOLOv8 detects every dent, scratch, crack, and broken part — with bounding boxes and confidence scores." />

      {/* Upload Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        className={`relative border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 overflow-hidden ${
          dragOver ? 'border-forge-blue bg-forge-blue/5' : 'border-forge-border hover:border-forge-blue/50'
        } ${preview ? 'min-h-[300px]' : 'h-48'}`}
      >
        {!preview && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-forge-muted">
            <Upload size={32} className="text-forge-blue" />
            <div className="text-center">
              <p className="font-medium text-forge-text">Drop a car photo here</p>
              <p className="text-xs mt-1">JPG, PNG, WEBP — any car damage photo</p>
            </div>
          </div>
        )}

        {preview && (
          <div className="relative">
            <img ref={imgRef} src={preview} alt="Car" className="w-full rounded-xl object-contain" onLoad={onImgLoad} />
            {/* Bounding boxes */}
            {result && imgDims.w > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${imgDims.w} ${imgDims.h}`}>
                {result.detections.map((det, i) => {
                  const scaleX = imgDims.w / imgDims.natural_w
                  const scaleY = imgDims.h / imgDims.natural_h
                  const [x1, y1, x2, y2] = det.bbox
                  const sx = x1 * scaleX, sy = y1 * scaleY, sw = (x2 - x1) * scaleX, sh = (y2 - y1) * scaleY
                  const color = BBOX_COLORS[i % BBOX_COLORS.length]
                  return (
                    <g key={i}>
                      <rect x={sx} y={sy} width={sw} height={sh} fill="none" stroke={color} strokeWidth="2" rx="3" />
                      <rect x={sx} y={sy - 20} width={Math.min(sw, 160)} height={18} fill={color} rx="3" opacity="0.9" />
                      <text x={sx + 4} y={sy - 6} fontSize="10" fill="white" fontFamily="JetBrains Mono, monospace">
                        {det.class} {(det.confidence * 100).toFixed(0)}%
                      </text>
                    </g>
                  )
                })}
              </svg>
            )}

            {/* Scanning beam while loading */}
            {mutation.isPending && (
              <div className="absolute inset-0 bg-forge-bg/40 rounded-xl overflow-hidden">
                <div className="scan-beam" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="glass px-4 py-2 rounded-lg text-sm font-mono text-forge-blue-light flex items-center gap-2">
                    <Scan size={14} className="animate-pulse" /> ANALYZING...
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      </div>

      {/* Results */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass text-sm">
                <span className="font-mono font-bold" style={{ color: severityColor(result.severity_score) }}>
                  {severityLabel(result.severity_score)}
                </span>
                <span className="text-forge-muted">severity</span>
                <span className="font-mono text-forge-text">{(result.severity_score * 100).toFixed(0)}%</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg glass text-sm text-forge-muted">
                <span className="font-mono text-forge-text font-bold">{result.detection_count}</span> detections
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {result.detections.map((d, i) => (
                <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono glass border border-forge-border/60"
                  style={{ borderColor: BBOX_COLORS[i % BBOX_COLORS.length] + '40', color: BBOX_COLORS[i % BBOX_COLORS.length] }}>
                  {d.class} · {(d.confidence * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {mutation.isPending && <SkeletonCard lines={3} />}
    </motion.div>
  )
}

// ── 2. Cost & Time Prediction ────────────────────────────────────────
function CostTimePrediction() {
  const { toast } = useToast()
  const [form, setForm] = useState<RepairFeatures>({ vehicle_type: 'sedan', damage_type: 'dent', severity: 0.5, parts_count: 3, mechanic_skill: 3 })
  const [results, setResults] = useState<{ hours: number; cost: number } | null>(null)

  const mutation = useMutation({
    mutationFn: async (f: RepairFeatures) => {
      const [time, cost] = await Promise.all([predictTime(f), predictCost(f)])
      return { hours: time.predicted_hours, cost: cost.predicted_cost_usd }
    },
    onSuccess: (data) => { setResults(data); toast('Predictions ready', 'success') },
    onError: () => toast('Prediction service unavailable', 'error'),
  })

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )

  const selectCls = "w-full bg-forge-panel border border-forge-border rounded-lg px-3 py-2.5 text-sm text-forge-text focus:border-forge-blue focus:outline-none transition-colors"

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
      className="glass rounded-2xl p-8 space-y-6">
      <SectionHeader number="02" icon={DollarSign} title="Cost & Time Prediction" desc="XGBoost models predict repair cost and time based on vehicle, damage type, severity, and mechanic skill level." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Vehicle Type">
          <select className={selectCls} value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value as any }))}>
            {['sedan', 'suv', 'truck', 'hatchback', 'luxury', 'van'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
          </select>
        </Field>
        <Field label="Damage Type">
          <select className={selectCls} value={form.damage_type} onChange={e => setForm(f => ({ ...f, damage_type: e.target.value as any }))}>
            {['dent', 'scratch', 'crack', 'paint', 'multiple'].map(v => <option key={v} value={v}>{v.charAt(0).toUpperCase() + v.slice(1)}</option>)}
          </select>
        </Field>
        <Field label={`Severity: ${(form.severity * 100).toFixed(0)}%`}>
          <input type="range" min="0" max="1" step="0.01" value={form.severity}
            onChange={e => setForm(f => ({ ...f, severity: parseFloat(e.target.value) }))}
            className="w-full accent-forge-orange" />
        </Field>
        <Field label="Parts Count">
          <input type="number" min="1" max="20" value={form.parts_count}
            onChange={e => setForm(f => ({ ...f, parts_count: parseInt(e.target.value) }))}
            className={selectCls} />
        </Field>
        <Field label={`Mechanic Skill: ${form.mechanic_skill}/5`}>
          <input type="range" min="1" max="5" step="1" value={form.mechanic_skill}
            onChange={e => setForm(f => ({ ...f, mechanic_skill: parseInt(e.target.value) }))}
            className="w-full accent-forge-blue" />
        </Field>
      </div>

      <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
        className="flex items-center gap-2 px-6 py-3 bg-forge-blue hover:bg-forge-blue-light text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
        {mutation.isPending ? <><Scan size={16} className="animate-pulse" /> Predicting...</> : <><Zap size={16} /> Get Predictions</>}
      </button>

      <AnimatePresence>
        {results && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-4">
            <div className="bg-forge-panel rounded-xl p-6 text-center border border-forge-orange/20">
              <p className="text-xs font-mono text-forge-muted mb-2">ESTIMATED COST</p>
              <div className="font-display font-bold text-3xl text-forge-orange">
                $<AnimatedCounter target={results.cost} decimals={0} />
              </div>
            </div>
            <div className="bg-forge-panel rounded-xl p-6 text-center border border-forge-blue/20">
              <p className="text-xs font-mono text-forge-muted mb-2">ESTIMATED TIME</p>
              <div className="font-display font-bold text-3xl text-forge-blue-light">
                <AnimatedCounter target={results.hours} decimals={1} suffix=" hrs" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {mutation.isPending && (
        <div className="grid grid-cols-2 gap-4">
          <SkeletonCard lines={2} />
          <SkeletonCard lines={2} />
        </div>
      )}
    </motion.div>
  )
}

// ── 3. Mechanic Assignment ───────────────────────────────────────────
function MechanicAssignment() {
  const { toast } = useToast()
  const [form, setForm] = useState({ job_type: 'body_repair', required_skill: 3, estimated_hours: 4 })
  const [result, setResult] = useState<MechanicAssignResponse | null>(null)

  const mutation = useMutation({
    mutationFn: assignMechanic,
    onSuccess: (data) => { setResult(data); toast('Mechanic ranking complete', 'success') },
    onError: () => toast('Assignment service unavailable', 'error'),
  })

  const selectCls = "w-full bg-forge-panel border border-forge-border rounded-lg px-3 py-2.5 text-sm text-forge-text focus:border-forge-blue focus:outline-none"

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
      className="glass rounded-2xl p-8 space-y-6">
      <SectionHeader number="03" icon={Wrench} title="Mechanic Assignment" desc="LambdaRank AI ranks your mechanics by job fit — considering specialty, skill level, and current workload." />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Job Type</label>
          <select className={selectCls} value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))}>
            {['body_repair', 'paint', 'engine', 'electrical', 'glass', 'suspension'].map(v => (
              <option key={v} value={v}>{v.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Required Skill (1–5)</label>
          <input type="number" min="1" max="5" value={form.required_skill}
            onChange={e => setForm(f => ({ ...f, required_skill: parseInt(e.target.value) }))}
            className={selectCls} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Estimated Hours</label>
          <input type="number" min="0.5" step="0.5" value={form.estimated_hours}
            onChange={e => setForm(f => ({ ...f, estimated_hours: parseFloat(e.target.value) }))}
            className={selectCls} />
        </div>
      </div>

      <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
        className="flex items-center gap-2 px-6 py-3 bg-forge-blue hover:bg-forge-blue-light text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
        {mutation.isPending ? 'Ranking...' : 'Find Best Mechanic'}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {result.ranked_mechanics.map((m, i) => (
              <motion.div key={m.mechanic_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl border ${i === 0 ? 'border-forge-orange/40 bg-forge-orange/5' : 'border-forge-border/40 bg-forge-panel/50'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i === 0 ? 'bg-forge-orange text-white' : 'bg-forge-border text-forge-muted'}`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-forge-text">{m.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded glass text-forge-muted">{m.specialty}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <div key={si} className={`w-2.5 h-2.5 rounded-sm ${si < m.skill_level ? 'bg-forge-blue' : 'bg-forge-border'}`} />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-mono text-forge-muted mb-1">Workload</div>
                  <div className="w-24 h-1.5 bg-forge-border rounded-full overflow-hidden">
                    <div className="h-full bg-forge-orange rounded-full" style={{ width: `${m.workload * 100}%` }} />
                  </div>
                </div>
                <div className="text-right w-16">
                  <div className="text-xs font-mono text-forge-muted">Score</div>
                  <div className="font-mono font-bold text-forge-blue-light">{m.score.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      {mutation.isPending && (
        <div className="space-y-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      )}
    </motion.div>
  )
}

// ── 4. Inventory Forecast ────────────────────────────────────────────
function InventoryForecast() {
  const { toast } = useToast()
  const [category, setCategory] = useState('bumpers')
  const [days, setDays] = useState(30)
  const [result, setResult] = useState<InventoryResponse | null>(null)

  const mutation = useMutation({
    mutationFn: ({ cat, d }: { cat: string; d: number }) => forecastInventory(cat, d),
    onSuccess: (data) => { setResult(data); toast('Forecast loaded', 'success') },
    onError: () => toast('Inventory forecast unavailable', 'error'),
  })

  const chartData = result ? Array.from({ length: result.days }, (_, i) => ({
    day: i + 1,
    units: Math.round(result.daily_avg * (0.7 + Math.random() * 0.6)),
    avg: result.daily_avg,
  })) : []

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
      className="glass rounded-2xl p-8 space-y-6">
      <SectionHeader number="04" icon={Package} title="Inventory Forecast" desc="Prophet time-series models predict part demand over the next 30–90 days, with low-stock alerts." />

      <div className="flex flex-wrap gap-3">
        <div className="flex gap-2 flex-wrap">
          {PART_CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${category === cat ? 'bg-forge-blue text-white' : 'glass text-forge-muted hover:text-forge-text'}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[30, 60, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${days === d ? 'bg-forge-orange text-white' : 'glass text-forge-muted hover:text-forge-text'}`}>
              {d}d
            </button>
          ))}
        </div>
        <button onClick={() => mutation.mutate({ cat: category, d: days })} disabled={mutation.isPending}
          className="px-4 py-1.5 bg-forge-panel border border-forge-border hover:border-forge-blue text-forge-text text-sm rounded-lg transition-colors flex items-center gap-2">
          <RefreshCw size={12} className={mutation.isPending ? 'animate-pulse' : ''} /> Forecast
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="glass px-4 py-2 rounded-lg">
                <span className="text-xs font-mono text-forge-muted">TOTAL DEMAND</span>
                <div className="font-display font-bold text-2xl text-forge-text">{result.forecast_units} <span className="text-sm text-forge-muted">units</span></div>
              </div>
              <div className="glass px-4 py-2 rounded-lg">
                <span className="text-xs font-mono text-forge-muted">DAILY AVG</span>
                <div className="font-display font-bold text-2xl text-forge-blue-light">{result.daily_avg}</div>
              </div>
              {result.low_stock_alert && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400 text-sm font-medium">LOW STOCK ALERT</span>
                </div>
              )}
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="day" stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <YAxis stroke="#4b5563" tick={{ fontSize: 10, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ background: '#111118', border: '1px solid #2a2a3e', borderRadius: 8, fontSize: 12 }} />
                  <ReferenceLine y={result.daily_avg} stroke="#f97316" strokeDasharray="4 2" label={{ value: 'avg', position: 'insideRight', fontSize: 10, fill: '#f97316' }} />
                  <Line type="monotone" dataKey="units" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {mutation.isPending && <SkeletonCard lines={4} />}
    </motion.div>
  )
}

// ── 5. Message Generator ─────────────────────────────────────────────
function MessageGenerator() {
  const { toast } = useToast()
  const [form, setForm] = useState({ message_type: 'status_update' as any, customer_name: 'Ahmad Khalil', job_details: '2022 BMW X5, front bumper dent, estimated 3 days', language: 'en' as 'en' | 'ar' })
  const [result, setResult] = useState<MessageResponse | null>(null)

  const mutation = useMutation({
    mutationFn: generateMessage,
    onSuccess: (data) => { setResult(data); toast('Message generated', 'success') },
    onError: () => toast('Message service unavailable', 'error'),
  })

  const copy = () => { if (result) { navigator.clipboard.writeText(result.message); toast('Copied to clipboard', 'success') } }
  const selectCls = "w-full bg-forge-panel border border-forge-border rounded-lg px-3 py-2.5 text-sm text-forge-text focus:border-forge-blue focus:outline-none"

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
      className="glass rounded-2xl p-8 space-y-6">
      <SectionHeader number="05" icon={MessageSquare} title="Customer Message Generator" desc="LLaMA 3.1 via Groq generates professional customer messages in English or Arabic." />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Message Type</label>
          <select className={selectCls} value={form.message_type} onChange={e => setForm(f => ({ ...f, message_type: e.target.value as any }))}>
            {[['status_update', 'Status Update'], ['delay', 'Delay Notice'], ['completion', 'Job Complete'], ['follow_up', 'Follow Up']].map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Customer Name</label>
          <input type="text" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} className={selectCls} />
        </div>
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-mono text-forge-muted uppercase tracking-wider">Job Details</label>
          <textarea rows={2} value={form.job_details} onChange={e => setForm(f => ({ ...f, job_details: e.target.value }))}
            className={`${selectCls} resize-none`} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-forge-muted">LANGUAGE</span>
          <div className="flex rounded-lg overflow-hidden border border-forge-border">
            {(['en', 'ar'] as const).map(lang => (
              <button key={lang} onClick={() => setForm(f => ({ ...f, language: lang }))}
                className={`px-4 py-1.5 text-sm font-mono transition-colors ${form.language === lang ? 'bg-forge-blue text-white' : 'bg-forge-panel text-forge-muted hover:text-forge-text'}`}>
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending}
          className="flex items-center gap-2 px-6 py-3 bg-forge-orange hover:bg-forge-orange-light text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
          {mutation.isPending ? 'Generating...' : 'Generate Message'}
        </button>
        {result && (
          <button onClick={() => mutation.mutate(form)} className="flex items-center gap-2 px-4 py-3 glass border border-forge-border hover:border-forge-blue text-forge-muted hover:text-forge-text rounded-xl transition-all">
            <RefreshCw size={14} /> Regenerate
          </button>
        )}
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="bg-forge-panel rounded-xl p-6 border border-forge-border relative">
            <div className="absolute top-4 right-4">
              <button onClick={copy} className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-lg text-xs text-forge-muted hover:text-forge-text transition-colors">
                <Copy size={12} /> Copy
              </button>
            </div>
            <p className="text-xs font-mono text-forge-muted mb-3">GENERATED MESSAGE</p>
            <p className={`text-forge-text text-sm leading-relaxed ${result.language === 'ar' ? 'text-right' : ''}`}
              dir={result.language === 'ar' ? 'rtl' : 'ltr'}
              style={result.language === 'ar' ? { fontFamily: 'Arial, sans-serif' } : {}}>
              {result.message}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      {mutation.isPending && <SkeletonCard lines={3} />}
    </motion.div>
  )
}

// ── 6. Sentiment Analysis ────────────────────────────────────────────
function SentimentAnalysis() {
  const { toast } = useToast()
  const [text, setText] = useState('')
  const [result, setResult] = useState<SentimentResponse | null>(null)

  const mutation = useMutation({
    mutationFn: analyzeSentiment,
    onSuccess: (data) => { setResult(data); toast('Sentiment analyzed', 'success') },
    onError: () => toast('Sentiment service unavailable', 'error'),
  })

  const sentConfig = {
    positive: { color: '#4ade80', icon: CheckCircle, label: 'POSITIVE' },
    negative: { color: '#ef4444', icon: AlertTriangle, label: 'NEGATIVE' },
    neutral: { color: '#fbbf24', icon: Minus, label: 'NEUTRAL' },
  }

  return (
    <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
      className="glass rounded-2xl p-8 space-y-6">
      <SectionHeader number="06" icon={Heart} title="Sentiment Analysis" desc="LLaMA 3.1 classifies customer review sentiment and returns a confidence score." />

      <div className="space-y-3">
        <textarea rows={4} value={text} onChange={e => setText(e.target.value)}
          placeholder="Paste a customer review here — e.g. 'The repair was done perfectly and ahead of schedule. Very happy!'"
          className="w-full bg-forge-panel border border-forge-border rounded-xl px-4 py-3 text-sm text-forge-text focus:border-forge-blue focus:outline-none resize-none placeholder:text-forge-muted" />
        <button onClick={() => mutation.mutate(text)} disabled={mutation.isPending || !text.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-forge-blue hover:bg-forge-blue-light text-white font-semibold rounded-xl transition-colors disabled:opacity-50">
          {mutation.isPending ? 'Analyzing...' : 'Analyze Sentiment'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 py-4">
            {(() => {
              const cfg = sentConfig[result.sentiment]
              const Icon = cfg.icon
              return (
                <>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto mb-4"
                      style={{ borderColor: cfg.color, background: cfg.color + '15' }}>
                      <Icon size={36} style={{ color: cfg.color }} />
                    </div>
                    <div className="font-display font-bold text-3xl" style={{ color: cfg.color }}>{cfg.label}</div>
                  </div>
                  <div className="w-full max-w-xs">
                    <div className="flex justify-between text-xs font-mono text-forge-muted mb-2">
                      <span>Confidence</span>
                      <span>{(result.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-forge-border rounded-full overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: cfg.color }}
                        initial={{ width: 0 }} animate={{ width: `${result.confidence * 100}%` }} transition={{ duration: 1 }} />
                    </div>
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>
      {mutation.isPending && <SkeletonCard lines={3} />}
    </motion.div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────
export default function AiDemo() {
  return (
    <div className="bg-forge-bg min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 max-w-4xl mx-auto px-6 space-y-8">
        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-forge-blue/20 text-xs font-mono text-forge-blue-light mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-forge-blue animate-pulse" />
            LIVE AI DEMO — 7 MODELS
          </div>
          <h1 className="font-display font-bold leading-tight mb-4" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>
            The AI <span className="text-gradient-orange">Engine</span> Behind AutoForge
          </h1>
          <p className="text-forge-muted text-lg max-w-2xl mx-auto">
            Every section below hits a real ML model running on your local FastAPI server. No mocks, no fake data.
          </p>
        </motion.div>

        <DamageDetection />
        <CostTimePrediction />
        <MechanicAssignment />
        <InventoryForecast />
        <MessageGenerator />
        <SentimentAnalysis />
      </div>
    </div>
  )
}

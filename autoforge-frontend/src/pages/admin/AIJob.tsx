import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import {
  Upload, Zap, CheckCircle, ChevronRight, Edit3,
  Car, User, Clock, DollarSign, Wrench, MessageSquare,
  AlertTriangle, Globe, RotateCcw, Copy, Check, Phone, Mail,
  Loader2,
} from 'lucide-react'
import AdminLayout from '@/components/layout/AdminLayout'
import { useToast } from '@/components/shared/Toast'
import { predictDamage, predictTime, predictCost, assignMechanic, generateMessage } from '@/api'
import { backendClient } from '@/api/client'
import type { Detection } from '@/types'

// ── Helpers ────────────────────────────────────────────────────────────────────

function damageClassToType(classes: string[]): string {
  if (classes.length === 0) return 'dent'
  const counts: Record<string, number> = {}
  for (const c of classes) {
    const key = c.toLowerCase().includes('scratch') ? 'scratch'
      : c.toLowerCase().includes('crack') || c.toLowerCase().includes('glass') ? 'crack'
      : c.toLowerCase().includes('paint') ? 'paint'
      : 'dent'
    counts[key] = (counts[key] || 0) + 1
  }
  const uniqueTypes = Object.keys(counts)
  if (uniqueTypes.length > 2) return 'multiple'
  return uniqueTypes.sort((a, b) => counts[b] - counts[a])[0]
}

function damageTypeToJobType(dt: string): string {
  return dt === 'paint' ? 'paint' : 'body_repair'
}

function severityToSkill(severity: number): number {
  if (severity > 0.7) return 5
  if (severity > 0.5) return 4
  if (severity > 0.3) return 3
  return 2
}

function vehicleModelToType(model: string): 'sedan' | 'suv' | 'truck' | 'hatchback' | 'luxury' | 'van' {
  const m = model.toLowerCase()
  if (['f-150', 'f150', 'silverado', 'ram', 'tacoma', 'tundra', 'hilux'].some(t => m.includes(t))) return 'truck'
  if (['rav4', 'cr-v', 'x5', 'x3', 'q7', 'q5', 'cherokee', 'wrangler', 'highlander', 'pilot', 'tucson', 'santa'].some(t => m.includes(t))) return 'suv'
  if (['transit', 'sprinter', 'odyssey', 'sienna', 'carnival'].some(t => m.includes(t))) return 'van'
  if (['golf', 'fit', 'yaris', 'polo', 'clio', 'fiesta'].some(t => m.includes(t))) return 'hatchback'
  if (['bmw', 'mercedes', 'lexus', 'audi', 'porsche', 'maserati', 'bentley'].some(t => m.includes(t))) return 'luxury'
  return 'sedan'
}

// Colour per damage class for bbox drawing
const CLASS_COLORS: Record<string, string> = {
  scratch: '#facc15',
  crack: '#ef4444',
  dent: '#f97316',
  paint: '#3b82f6',
  glass: '#06b6d4',
}
function classColor(cls: string): string {
  for (const [k, v] of Object.entries(CLASS_COLORS)) {
    if (cls.toLowerCase().includes(k)) return v
  }
  return '#a855f7'
}

// ── BBox overlay component ─────────────────────────────────────────────────────

function BBoxOverlay({ imageURL, detections }: { imageURL: string; detections: Detection[] }) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [dims, setDims] = useState<{ nW: number; nH: number; dW: number; dH: number } | null>(null)

  const updateDims = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    setDims({ nW: img.naturalWidth, nH: img.naturalHeight, dW: img.clientWidth, dH: img.clientHeight })
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateDims)
    return () => window.removeEventListener('resize', updateDims)
  }, [updateDims])

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black/20">
      <img
        ref={imgRef}
        src={imageURL}
        alt="Damage scan"
        className="w-full object-contain max-h-80 block"
        onLoad={updateDims}
      />
      {dims && detections.length > 0 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${dims.dW} ${dims.dH}`}
          preserveAspectRatio="none"
        >
          {detections.map((det, i) => {
            const [x1, y1, x2, y2] = det.bbox
            const scaleX = dims.dW / dims.nW
            const scaleY = dims.dH / dims.nH
            const rx = x1 * scaleX
            const ry = y1 * scaleY
            const rw = (x2 - x1) * scaleX
            const rh = (y2 - y1) * scaleY
            const color = classColor(det.class)
            const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`
            const fontSize = Math.max(9, Math.min(13, rw / 8))
            const labelW = label.length * fontSize * 0.6 + 8
            const labelH = fontSize + 6

            return (
              <g key={i}>
                {/* Box */}
                <rect x={rx} y={ry} width={rw} height={rh}
                  fill="none" stroke={color} strokeWidth="2"
                  strokeDasharray={rw < 40 ? '4 2' : undefined}
                  rx="3" opacity="0.9"
                />
                {/* Corner highlights */}
                <line x1={rx} y1={ry + 10} x2={rx} y2={ry} stroke={color} strokeWidth="3" />
                <line x1={rx} y1={ry} x2={rx + 10} y2={ry} stroke={color} strokeWidth="3" />
                <line x1={rx + rw - 10} y1={ry} x2={rx + rw} y2={ry} stroke={color} strokeWidth="3" />
                <line x1={rx + rw} y1={ry} x2={rx + rw} y2={ry + 10} stroke={color} strokeWidth="3" />
                <line x1={rx} y1={ry + rh - 10} x2={rx} y2={ry + rh} stroke={color} strokeWidth="3" />
                <line x1={rx} y1={ry + rh} x2={rx + 10} y2={ry + rh} stroke={color} strokeWidth="3" />
                <line x1={rx + rw - 10} y1={ry + rh} x2={rx + rw} y2={ry + rh} stroke={color} strokeWidth="3" />
                <line x1={rx + rw} y1={ry + rh - 10} x2={rx + rw} y2={ry + rh} stroke={color} strokeWidth="3" />
                {/* Label background */}
                <rect x={rx} y={ry - labelH} width={Math.min(labelW, rw + 2)} height={labelH}
                  fill={color} rx="2" opacity="0.92"
                />
                {/* Label text */}
                <text x={rx + 4} y={ry - 4} fill="white"
                  fontSize={fontSize} fontFamily="monospace" fontWeight="600">
                  {label}
                </text>
              </g>
            )
          })}
        </svg>
      )}
      {dims && detections.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-mono text-forge-muted bg-black/50 px-3 py-1.5 rounded-lg">
            No damage regions detected
          </span>
        </div>
      )}
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────

type Step = 'info' | 'upload' | 'analyzing' | 'review' | 'done'

interface JobInfo {
  customerName: string
  customerEmail: string
  customerPhone: string
  vehicleMake: string
  vehicleModel: string
  vehicleYear: string
  language: 'en' | 'ar'
}

interface AIResults {
  rawDetections: Detection[]
  detections: { class: string; confidence: number }[]
  severityScore: number
  predictedHours: number
  predictedCost: number
  topMechanic: { name: string; specialty: string; skill_level: number; workload: number; score: number } | null
  customerMessage: string
  damageType: string
}

interface Editable {
  hours: string
  cost: string
  mechanic: string
  message: string
  language: 'en' | 'ar'
}

const ANALYSIS_STEPS = [
  { id: 'damage',   label: 'Detecting damage with YOLOv8',  icon: '🔍' },
  { id: 'cost',     label: 'Predicting repair time & cost', icon: '💰' },
  { id: 'mechanic', label: 'Selecting best mechanic',        icon: '🔧' },
  { id: 'message',  label: 'Generating customer message',    icon: '✉️'  },
]

// ── Component ──────────────────────────────────────────────────────────────────

export default function AIJob() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const [step, setStep]             = useState<Step>('info')
  const [info, setInfo]             = useState<JobInfo>({
    customerName: '', customerEmail: '', customerPhone: '',
    vehicleMake: '', vehicleModel: '', vehicleYear: new Date().getFullYear().toString(),
    language: 'en',
  })
  const [imageFile, setImageFile]   = useState<File | null>(null)
  const [imageURL, setImageURL]     = useState<string>('')
  const [dragging, setDragging]     = useState(false)
  const [activeStep, setActiveStep] = useState(-1)
  const [results, setResults]       = useState<AIResults | null>(null)
  const [editable, setEditable]     = useState<Editable | null>(null)
  const [copied, setCopied]         = useState(false)
  const [savedJobId, setSavedJobId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // ── File handling ─────────────────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) { toast('Please upload an image file.', 'error'); return }
    setImageFile(file)
    setImageURL(URL.createObjectURL(file))
  }, [toast])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  // ── AI pipeline ───────────────────────────────────────────────────────────────
  const runPipeline = useMutation({
    mutationFn: async () => {
      if (!imageFile) throw new Error('No image')

      setActiveStep(0)
      const damage = await predictDamage(imageFile)
      const detectedClasses = damage.detections.map(d => d.class)
      const damageType   = damageClassToType(detectedClasses)
      const severity     = damage.severity_score
      const vehicleType  = vehicleModelToType(info.vehicleModel)
      const partsCount   = Math.min(Math.max(damage.detection_count, 1), 20)
      const mechanicSkill = severityToSkill(severity)
      const features = { vehicle_type: vehicleType, damage_type: damageType, severity, parts_count: partsCount, mechanic_skill: mechanicSkill }

      setActiveStep(1)
      const [timeRes, costRes] = await Promise.all([predictTime(features), predictCost(features)])

      setActiveStep(2)
      const mechanicRes = await assignMechanic({
        job_type: damageTypeToJobType(damageType),
        required_skill: mechanicSkill,
        estimated_hours: timeRes.predicted_hours,
      })
      const topMechanic = mechanicRes.ranked_mechanics[0] ?? null

      setActiveStep(3)
      const jobDetails = `Vehicle: ${info.vehicleYear} ${info.vehicleMake} ${info.vehicleModel}. Damage: ${detectedClasses.join(', ') || damageType}. Severity: ${(severity * 100).toFixed(0)}%. Estimated repair: ${timeRes.predicted_hours.toFixed(1)} hours, $${costRes.predicted_cost_usd.toFixed(0)}.`
      const msgRes = await generateMessage({
        message_type: 'status_update',
        customer_name: info.customerName,
        job_details: jobDetails,
        language: info.language,
      })

      return {
        rawDetections: damage.detections,
        detections: damage.detections.map(d => ({ class: d.class, confidence: d.confidence })),
        severityScore: severity,
        predictedHours: timeRes.predicted_hours,
        predictedCost: costRes.predicted_cost_usd,
        topMechanic,
        customerMessage: msgRes.message,
        damageType,
      } satisfies AIResults
    },
    onSuccess: (data) => {
      setResults(data)
      setEditable({
        hours:    data.predictedHours.toFixed(1),
        cost:     data.predictedCost.toFixed(0),
        mechanic: data.topMechanic?.name ?? '',
        message:  data.customerMessage,
        language: info.language,
      })
      setStep('review')
    },
    onError: (err: any) => {
      toast(err?.response?.data?.detail || 'AI analysis failed. Is the FastAPI server running?', 'error')
      setStep('upload')
      setActiveStep(-1)
    },
  })

  function startAnalysis() {
    if (!imageFile) { toast('Please upload a car photo first.', 'error'); return }
    setStep('analyzing')
    setActiveStep(0)
    runPipeline.mutate()
  }

  async function regenerateMessage() {
    if (!results || !editable) return
    try {
      const jobDetails = `Vehicle: ${info.vehicleYear} ${info.vehicleMake} ${info.vehicleModel}. Damage: ${results.damageType}. Severity: ${(results.severityScore * 100).toFixed(0)}%. Estimated repair: ${editable.hours} hours, $${editable.cost}.`
      const msgRes = await generateMessage({
        message_type: 'status_update',
        customer_name: info.customerName,
        job_details: jobDetails,
        language: editable.language,
      })
      setEditable(e => e ? { ...e, message: msgRes.message } : e)
    } catch {
      toast('Failed to regenerate message.', 'error')
    }
  }

  function copyMessage() {
    if (!editable?.message) return
    navigator.clipboard.writeText(editable.message)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Message copied to clipboard.', 'success')
  }

  // ── Save to DB on confirm ─────────────────────────────────────────────────────
  const saveJob = useMutation({
    mutationFn: async () => {
      if (!results || !editable) throw new Error('No results to save')
      const { data } = await backendClient.post('/api/ai-job', {
        customerName:  info.customerName,
        customerEmail: info.customerEmail || undefined,
        customerPhone: info.customerPhone || undefined,
        vehicleMake:   info.vehicleMake,
        vehicleModel:  info.vehicleModel,
        vehicleYear:   info.vehicleYear,
        mechanicName:  editable.mechanic || undefined,
        estimatedCost: editable.cost,
        estimatedHours: editable.hours,
        severity:      results.severityScore,
        damageType:    results.damageType,
        detections:    results.rawDetections,
        message:       editable.message,
        language:      editable.language,
      })
      return data
    },
    onSuccess: (data) => {
      setSavedJobId(data.jobId)
      setStep('done')
      toast('Job saved to database successfully!', 'success')
    },
    onError: (err: any) => {
      toast(err?.response?.data?.error || 'Failed to save job to database.', 'error')
    },
  })

  function reset() {
    setStep('info'); setImageFile(null); setImageURL(''); setResults(null)
    setEditable(null); setActiveStep(-1); setSavedJobId(null)
    setInfo({ customerName: '', customerEmail: '', customerPhone: '', vehicleMake: '', vehicleModel: '', vehicleYear: new Date().getFullYear().toString(), language: 'en' })
  }

  const severityColor = (s: number) => s > 0.7 ? '#ef4444' : s > 0.4 ? '#f97316' : '#22c55e'
  const severityLabel = (s: number) => s > 0.7 ? 'High' : s > 0.4 ? 'Medium' : 'Low'

  const stepOrder: Step[] = ['info', 'upload', 'analyzing', 'review', 'done']
  const stepIdx = stepOrder.indexOf(step)

  // ── Input class helper ────────────────────────────────────────────────────────
  const inputCls = 'w-full px-4 py-3 glass border border-forge-border rounded-xl text-sm text-forge-text placeholder:text-forge-muted/40 focus:outline-none focus:border-forge-blue/50 bg-transparent'

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div>
          <p className="text-forge-muted text-sm font-mono uppercase tracking-widest mb-1">Intelligence</p>
          <h1 className="font-display font-bold text-3xl">AI Job Wizard</h1>
          <p className="text-forge-muted text-sm mt-1">Upload a photo — the AI predicts everything. You just confirm.</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {['Info', 'Photo', 'Analyzing', 'Review', 'Done'].map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                i < stepIdx ? 'text-green-400' : i === stepIdx ? 'text-forge-blue bg-forge-blue/10 border border-forge-blue/30' : 'text-forge-muted/40'
              }`}>
                {i < stepIdx ? <CheckCircle size={12} /> : <span className="w-3 text-center">{i + 1}</span>}
                {label}
              </div>
              {i < 4 && <div className={`flex-1 h-px ${i < stepIdx ? 'bg-green-500/40' : 'bg-forge-border/40'}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── STEP 1: Info ──────────────────────────────────────────────────── */}
          {step === 'info' && (
            <motion.div key="info" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="glass rounded-2xl p-8 space-y-6">
              <h2 className="font-display font-semibold text-xl">Customer & Vehicle Info</h2>

              <div className="grid grid-cols-2 gap-4">
                {/* Customer name */}
                <div className="col-span-2">
                  <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                    <User size={11} className="inline mr-1" /> Customer Name *
                  </label>
                  <input value={info.customerName} onChange={e => setInfo(p => ({ ...p, customerName: e.target.value }))}
                    placeholder="e.g. Rami Haddad" className={inputCls} />
                </div>

                {/* Customer email */}
                <div>
                  <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                    <Mail size={11} className="inline mr-1" /> Email (optional — finds existing)
                  </label>
                  <input value={info.customerEmail} onChange={e => setInfo(p => ({ ...p, customerEmail: e.target.value }))}
                    placeholder="rami@example.com" type="email" className={inputCls} />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                    <Phone size={11} className="inline mr-1" /> Phone (optional)
                  </label>
                  <input value={info.customerPhone} onChange={e => setInfo(p => ({ ...p, customerPhone: e.target.value }))}
                    placeholder="+961 71 000 000" className={inputCls} />
                </div>

                {/* Make */}
                <div>
                  <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                    <Car size={11} className="inline mr-1" /> Vehicle Make *
                  </label>
                  <input value={info.vehicleMake} onChange={e => setInfo(p => ({ ...p, vehicleMake: e.target.value }))}
                    placeholder="e.g. Toyota" className={inputCls} />
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">Model *</label>
                  <input value={info.vehicleModel} onChange={e => setInfo(p => ({ ...p, vehicleModel: e.target.value }))}
                    placeholder="e.g. Camry" className={inputCls} />
                </div>

                {/* Year */}
                <div>
                  <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">Year</label>
                  <input value={info.vehicleYear} onChange={e => setInfo(p => ({ ...p, vehicleYear: e.target.value }))}
                    placeholder="2023" className={inputCls} />
                </div>

                {/* Language */}
                <div>
                  <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-1.5">
                    <Globe size={11} className="inline mr-1" /> Message Language
                  </label>
                  <div className="flex gap-2">
                    {(['en', 'ar'] as const).map(lang => (
                      <button key={lang} onClick={() => setInfo(p => ({ ...p, language: lang }))}
                        className={`flex-1 py-3 rounded-xl text-sm font-semibold border transition-all ${
                          info.language === lang
                            ? 'bg-forge-blue/20 border-forge-blue text-forge-blue'
                            : 'glass border-forge-border text-forge-muted hover:text-forge-text'
                        }`}>
                        {lang === 'en' ? '🇬🇧 English' : '🇸🇦 Arabic'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!info.customerName || !info.vehicleMake || !info.vehicleModel) {
                    toast('Please fill in customer name, make, and model.', 'error'); return
                  }
                  setStep('upload')
                }}
                className="w-full py-3.5 bg-forge-orange hover:bg-forge-orange-light text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            </motion.div>
          )}

          {/* ── STEP 2: Upload ────────────────────────────────────────────────── */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="glass rounded-2xl p-8 space-y-6">
              <h2 className="font-display font-semibold text-xl">Upload Damage Photo</h2>

              <div
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => !imageURL && fileRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed transition-all overflow-hidden ${
                  dragging ? 'border-forge-blue bg-forge-blue/5' : imageURL ? 'border-forge-blue/50' : 'border-forge-border hover:border-forge-blue/40 cursor-pointer'
                }`}
                style={{ minHeight: 260 }}>

                {imageURL ? (
                  <div className="relative">
                    <img src={imageURL} alt="Car" className="w-full object-cover max-h-72 rounded-2xl" />
                    <button
                      onClick={e => { e.stopPropagation(); setImageFile(null); setImageURL('') }}
                      className="absolute top-3 right-3 px-3 py-1.5 bg-black/60 text-white text-xs font-mono rounded-lg hover:bg-black/80 transition-colors">
                      Change photo
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 gap-4">
                    <div className="relative w-20 h-20">
                      <div className="absolute inset-0 rounded-xl bg-forge-blue/10 border border-forge-blue/20" />
                      <Upload size={32} className="absolute inset-0 m-auto text-forge-blue" />
                      <motion.div className="absolute left-0 right-0 h-0.5 bg-forge-blue/60 rounded"
                        animate={{ top: ['10%', '90%', '10%'] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-forge-text font-medium">Drop car photo here</p>
                      <p className="text-forge-muted text-sm mt-1">or click to browse — JPG, PNG, WEBP</p>
                    </div>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
              </div>

              {imageURL && (
                <p className="text-xs text-forge-muted font-mono flex items-center gap-1.5">
                  <CheckCircle size={11} className="text-green-400" />
                  {imageFile?.name} — ready for analysis
                </p>
              )}

              <div className="flex gap-3">
                <button onClick={() => setStep('info')}
                  className="px-6 py-3 glass border border-forge-border text-sm font-medium rounded-xl transition-all hover:border-forge-blue/40">
                  Back
                </button>
                <button onClick={startAnalysis} disabled={!imageFile}
                  className="flex-1 py-3 bg-forge-orange hover:bg-forge-orange-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Zap size={16} /> Run Full AI Analysis
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3: Analyzing ─────────────────────────────────────────────── */}
          {step === 'analyzing' && (
            <motion.div key="analyzing" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="glass rounded-2xl p-8 space-y-8">
              <div className="text-center">
                <motion.div className="w-16 h-16 rounded-2xl bg-forge-orange/10 border border-forge-orange/20 flex items-center justify-center mx-auto mb-4"
                  animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 1.4, repeat: Infinity }}>
                  <Zap size={28} className="text-forge-orange" />
                </motion.div>
                <h2 className="font-display font-bold text-2xl">AI Analysing...</h2>
                <p className="text-forge-muted text-sm mt-1">Running 4 models sequentially</p>
              </div>

              <div className="space-y-3">
                {ANALYSIS_STEPS.map((s, i) => {
                  const isDone    = activeStep > i
                  const isActive  = activeStep === i
                  return (
                    <motion.div key={s.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                        isActive ? 'glass border-forge-orange/40 bg-forge-orange/5'
                        : isDone ? 'border-green-500/20 bg-green-500/5'
                        : 'border-forge-border/30 opacity-40'
                      }`}>
                      <span className="text-xl">{s.icon}</span>
                      <span className={`text-sm font-medium flex-1 ${isDone ? 'text-green-400' : isActive ? 'text-forge-text' : 'text-forge-muted'}`}>
                        {s.label}
                      </span>
                      {isDone && <CheckCircle size={16} className="text-green-400 flex-shrink-0" />}
                      {isActive && (
                        <motion.div className="w-4 h-4 border-2 border-forge-orange/30 border-t-forge-orange rounded-full flex-shrink-0"
                          animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ── STEP 4: Review ────────────────────────────────────────────────── */}
          {step === 'review' && results && editable && (
            <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
              className="space-y-6">

              {/* Damage detection — image with bbox overlay */}
              <div className="glass rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg">🔍 Damage Detected</h3>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-mono"
                    style={{ borderColor: severityColor(results.severityScore) + '40', color: severityColor(results.severityScore), background: severityColor(results.severityScore) + '10' }}>
                    <AlertTriangle size={12} />
                    {severityLabel(results.severityScore)} Severity — {(results.severityScore * 100).toFixed(0)}%
                  </div>
                </div>

                {/* BBox overlay on the uploaded image */}
                {imageURL && <BBoxOverlay imageURL={imageURL} detections={results.rawDetections} />}

                {/* Detection chips */}
                {results.detections.length === 0 ? (
                  <p className="text-forge-muted text-sm">No specific damage classes detected.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {results.detections.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm"
                        style={{ borderColor: classColor(d.class) + '50', background: classColor(d.class) + '10', color: classColor(d.class) }}>
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: classColor(d.class) }} />
                        <span className="capitalize font-medium">{d.class}</span>
                        <span className="text-xs font-mono opacity-70">{(d.confidence * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Time & Cost */}
              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-forge-blue" />
                    <h3 className="font-display font-semibold">Repair Time</h3>
                    <Edit3 size={12} className="text-forge-muted ml-auto" />
                  </div>
                  <input type="number" value={editable.hours}
                    onChange={e => setEditable(p => p ? { ...p, hours: e.target.value } : p)}
                    className="w-full px-3 py-2 glass border border-forge-border rounded-xl text-2xl font-display font-bold text-forge-blue text-center focus:outline-none focus:border-forge-blue/50 bg-transparent" />
                  <p className="text-xs text-forge-muted text-center mt-1 font-mono">hours (editable)</p>
                </div>

                <div className="glass rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign size={16} className="text-forge-orange" />
                    <h3 className="font-display font-semibold">Repair Cost</h3>
                    <Edit3 size={12} className="text-forge-muted ml-auto" />
                  </div>
                  <input type="number" value={editable.cost}
                    onChange={e => setEditable(p => p ? { ...p, cost: e.target.value } : p)}
                    className="w-full px-3 py-2 glass border border-forge-border rounded-xl text-2xl font-display font-bold text-forge-orange text-center focus:outline-none focus:border-forge-orange/50 bg-transparent" />
                  <p className="text-xs text-forge-muted text-center mt-1 font-mono">USD (editable)</p>
                </div>
              </div>

              {/* Mechanic */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench size={16} className="text-forge-muted" />
                  <h3 className="font-display font-semibold">Assigned Mechanic</h3>
                  <Edit3 size={12} className="text-forge-muted ml-auto" />
                </div>
                {results.topMechanic ? (
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <input value={editable.mechanic}
                        onChange={e => setEditable(p => p ? { ...p, mechanic: e.target.value } : p)}
                        className="text-lg font-display font-bold text-forge-text bg-transparent border-b border-forge-border focus:border-forge-blue/50 focus:outline-none pb-1 w-full" />
                      <p className="text-sm text-forge-muted mt-1 capitalize">{results.topMechanic.specialty}</p>
                      <div className="flex items-center gap-4 mt-3">
                        {[
                          { label: 'Skill', value: `${results.topMechanic.skill_level}/5` },
                          { label: 'Workload', value: `${results.topMechanic.workload}%` },
                          { label: 'Match', value: `${(results.topMechanic.score * 100).toFixed(0)}%` },
                        ].map(({ label, value }) => (
                          <div key={label} className="text-center">
                            <p className="text-xs font-mono text-forge-muted">{label}</p>
                            <p className="text-sm font-semibold text-forge-text">{value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 bg-forge-border/20 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-forge-blue rounded-full transition-all"
                          style={{ width: `${results.topMechanic.workload}%` }} />
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-forge-blue/10 border border-forge-blue/20 flex items-center justify-center text-xl font-bold text-forge-blue flex-shrink-0">
                      {(results.topMechanic.name || '?').charAt(0)}
                    </div>
                  </div>
                ) : (
                  <input value={editable.mechanic} placeholder="Mechanic name (optional)"
                    onChange={e => setEditable(p => p ? { ...p, mechanic: e.target.value } : p)}
                    className={inputCls} />
                )}
              </div>

              {/* Customer message */}
              <div className="glass rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={16} className="text-forge-muted" />
                  <h3 className="font-display font-semibold">Customer Message</h3>
                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex gap-1 p-0.5 glass rounded-lg border border-forge-border/40">
                      {(['en', 'ar'] as const).map(lang => (
                        <button key={lang} onClick={async () => {
                          setEditable(p => p ? { ...p, language: lang } : p)
                          setInfo(p => ({ ...p, language: lang }))
                          setTimeout(regenerateMessage, 50)
                        }}
                          className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${editable.language === lang ? 'bg-forge-blue/20 text-forge-blue' : 'text-forge-muted hover:text-forge-text'}`}>
                          {lang.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <button onClick={regenerateMessage}
                      className="p-1.5 glass border border-forge-border rounded-lg text-forge-muted hover:text-forge-text transition-colors" title="Regenerate">
                      <RotateCcw size={12} />
                    </button>
                    <button onClick={copyMessage}
                      className="p-1.5 glass border border-forge-border rounded-lg text-forge-muted hover:text-forge-text transition-colors" title="Copy">
                      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
                <textarea value={editable.message}
                  onChange={e => setEditable(p => p ? { ...p, message: e.target.value } : p)}
                  rows={5}
                  dir={editable.language === 'ar' ? 'rtl' : 'ltr'}
                  className="w-full px-4 py-3 glass border border-forge-border rounded-xl text-sm text-forge-text focus:outline-none focus:border-forge-blue/50 bg-transparent resize-none leading-relaxed" />
              </div>

              {/* Confirm */}
              <div className="flex gap-3">
                <button onClick={() => { setStep('upload'); setActiveStep(-1) }}
                  className="px-6 py-3.5 glass border border-forge-border text-sm font-medium rounded-xl transition-all hover:border-forge-blue/40">
                  Re-analyze
                </button>
                <button onClick={() => saveJob.mutate()} disabled={saveJob.isPending}
                  className="flex-1 py-3.5 bg-forge-orange hover:bg-forge-orange-light disabled:opacity-60 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                  {saveJob.isPending
                    ? <><Loader2 size={16} className="animate-spin" /> Saving to database...</>
                    : <><CheckCircle size={16} /> Confirm & Save Job</>
                  }
                </button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 5: Done ──────────────────────────────────────────────────── */}
          {step === 'done' && editable && results && (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-10 text-center space-y-6">
              <motion.div className="w-20 h-20 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto"
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                <CheckCircle size={36} className="text-green-400" />
              </motion.div>

              <div>
                <h2 className="font-display font-bold text-2xl mb-2">Job Saved!</h2>
                <p className="text-forge-muted text-sm">
                  All data saved to database for <strong className="text-forge-text">{info.customerName}</strong>
                </p>
                {savedJobId && (
                  <p className="text-xs font-mono text-forge-muted/60 mt-1">Job ID: {savedJobId}</p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 text-left">
                {[
                  { label: 'Customer',  value: info.customerName },
                  { label: 'Vehicle',   value: `${info.vehicleYear} ${info.vehicleMake} ${info.vehicleModel}` },
                  { label: 'Damage',    value: results.damageType },
                  { label: 'Est. Hours',value: `${editable.hours}h` },
                  { label: 'Est. Cost', value: `$${Number(editable.cost).toLocaleString()}` },
                  { label: 'Severity',  value: `${severityLabel(results.severityScore)} (${(results.severityScore * 100).toFixed(0)}%)` },
                  { label: 'Mechanic',  value: editable.mechanic || '—' },
                  { label: 'Detections',value: `${results.detections.length} areas` },
                  { label: 'Message',   value: editable.language === 'ar' ? 'Arabic ✓' : 'English ✓' },
                ].map(({ label, value }) => (
                  <div key={label} className="glass rounded-xl p-3">
                    <p className="text-xs font-mono text-forge-muted uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm font-semibold text-forge-text truncate">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <button onClick={reset}
                  className="px-6 py-3 glass border border-forge-border text-sm font-medium rounded-xl transition-all hover:border-forge-blue/40">
                  New Job
                </button>
                <button onClick={() => navigate('/admin/jobs')}
                  className="px-6 py-3 bg-forge-blue hover:bg-forge-blue-light text-white text-sm font-semibold rounded-xl transition-colors">
                  View All Jobs →
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AdminLayout>
  )
}

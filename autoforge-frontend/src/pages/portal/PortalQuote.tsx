import { useState, useRef, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  Calculator, Loader2, Wrench, Lock, UserPlus, LogIn,
  ScanLine, CheckCircle, AlertTriangle, RefreshCw, ImagePlus, Send, X,
} from 'lucide-react'
import BackButton from '@/components/shared/BackButton'
import { predictDamage } from '@/api'
import type { Detection } from '@/types'

// ── constants ──────────────────────────────────────────────────────────────────

const VEHICLE_TYPES = ['sedan', 'suv', 'truck', 'hatchback', 'luxury', 'van'] as const
const DAMAGE_TYPES  = ['dent', 'scratch', 'crack', 'paint', 'multiple'] as const
const REDIRECT      = encodeURIComponent('/portal')

const CLASS_COLORS: Record<string, string> = {
  scratch: '#facc15', crack: '#ef4444', dent: '#f97316',
  paint: '#3b82f6',  glass: '#06b6d4',
}
function classColor(cls: string) {
  for (const [k, v] of Object.entries(CLASS_COLORS)) if (cls.toLowerCase().includes(k)) return v
  return '#a855f7'
}

function damageClassToType(classes: string[]): (typeof DAMAGE_TYPES)[number] {
  if (!classes.length) return 'dent'
  const counts: Record<string, number> = {}
  for (const c of classes) {
    const key = c.toLowerCase().includes('scratch') ? 'scratch'
      : c.toLowerCase().includes('crack') || c.toLowerCase().includes('glass') ? 'crack'
      : c.toLowerCase().includes('paint') ? 'paint'
      : 'dent'
    counts[key] = (counts[key] || 0) + 1
  }
  const types = Object.keys(counts)
  if (types.length > 2) return 'multiple'
  return (types.sort((a, b) => counts[b] - counts[a])[0] || 'dent') as (typeof DAMAGE_TYPES)[number]
}

// ── auth helper ────────────────────────────────────────────────────────────────

function isSignedIn() {
  try {
    const token = localStorage.getItem('af_token')
    if (!token) return false
    const u = JSON.parse(localStorage.getItem('af_user') || '{}') as { role?: string }
    return (u.role || '').toLowerCase() === 'customer'
  } catch { return false }
}

// ── BBox overlay (same as AIJob) ──────────────────────────────────────────────

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
    <div className="relative w-full rounded-xl overflow-hidden bg-black/30">
      <img ref={imgRef} src={imageURL} alt="Damage scan"
        className="w-full object-contain max-h-72 block" onLoad={updateDims} />
      {dims && detections.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${dims.dW} ${dims.dH}`} preserveAspectRatio="none">
          {detections.map((det, i) => {
            const [x1, y1, x2, y2] = det.bbox
            const sx = dims.dW / dims.nW, sy = dims.dH / dims.nH
            const rx = x1 * sx, ry = y1 * sy, rw = (x2 - x1) * sx, rh = (y2 - y1) * sy
            const color = classColor(det.class)
            const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`
            const fs = Math.max(9, Math.min(13, rw / 8))
            const lw = label.length * fs * 0.6 + 8
            const lh = fs + 6
            return (
              <g key={i}>
                <rect x={rx} y={ry} width={rw} height={rh} fill="none" stroke={color}
                  strokeWidth="2" rx="3" opacity="0.9" />
                <line x1={rx} y1={ry + 10} x2={rx} y2={ry} stroke={color} strokeWidth="3" />
                <line x1={rx} y1={ry} x2={rx + 10} y2={ry} stroke={color} strokeWidth="3" />
                <line x1={rx + rw - 10} y1={ry} x2={rx + rw} y2={ry} stroke={color} strokeWidth="3" />
                <line x1={rx + rw} y1={ry} x2={rx + rw} y2={ry + 10} stroke={color} strokeWidth="3" />
                <line x1={rx} y1={ry + rh - 10} x2={rx} y2={ry + rh} stroke={color} strokeWidth="3" />
                <line x1={rx} y1={ry + rh} x2={rx + 10} y2={ry + rh} stroke={color} strokeWidth="3" />
                <line x1={rx + rw - 10} y1={ry + rh} x2={rx + rw} y2={ry + rh} stroke={color} strokeWidth="3" />
                <line x1={rx + rw} y1={ry + rh - 10} x2={rx + rw} y2={ry + rh} stroke={color} strokeWidth="3" />
                <rect x={rx} y={ry - lh} width={Math.min(lw, rw + 2)} height={lh} fill={color} rx="2" opacity="0.92" />
                <text x={rx + 4} y={ry - 4} fill="white" fontSize={fs} fontFamily="monospace" fontWeight="600">{label}</text>
              </g>
            )
          })}
        </svg>
      )}
    </div>
  )
}

// ── damage repair guide types ─────────────────────────────────────────────────

type GuideEntry = { label: string; parts: { name: string; note?: string }[]; actions: string[] }

// ── main component ────────────────────────────────────────────────────────────

type EstimateResult = {
  predicted_hours: number
  predicted_cost_usd: number
  inputs: Record<string, unknown>
  leadSaved?: boolean
}

export default function PortalQuote() {
  const authed = isSignedIn()

  // damage repair guide (for parts list after estimate)
  const { data: guidePack } = useQuery({
    queryKey: ['damage-repair-guide'],
    queryFn: async () => {
      const res = await axios.get<{ success?: boolean; data?: { guide?: Record<string, GuideEntry> } }>(
        '/backend/api/damage-repair-guide'
      )
      const root = res.data
      const d = root?.data ?? (root as { guide?: Record<string, GuideEntry> })
      return d?.guide ?? null
    },
    staleTime: 60 * 60 * 1000,
  })

  // image & detection state
  const [imageFile, setImageFile]       = useState<File | null>(null)
  const [imageURL, setImageURL]         = useState<string | null>(null)
  const [detections, setDetections]     = useState<Detection[]>([])
  const [severityScore, setSeverityScore] = useState<number | null>(null)
  const [scanning, setScanning]         = useState(false)
  const [scanError, setScanError]       = useState<string | null>(null)
  const [dragging, setDragging]         = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // form state (auto-filled from detections, user can adjust)
  const [vehicleType, setVehicleType] = useState<(typeof VEHICLE_TYPES)[number]>('sedan')
  const [damageType, setDamageType]   = useState<(typeof DAMAGE_TYPES)[number]>('dent')
  const [severity, setSeverity]       = useState(0.5)
  const [partsCount, setPartsCount]   = useState(3)
  const [mechanicSkill, setMechanicSkill] = useState(3)

  // estimate state
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [result, setResult]     = useState<EstimateResult | null>(null)

  // send request state
  const [showSendForm, setShowSendForm]     = useState(false)
  const [sendName, setSendName]             = useState('')
  const [sendPhone, setSendPhone]           = useState('')
  const [sendLoading, setSendLoading]       = useState(false)
  const [sendError, setSendError]           = useState<string | null>(null)
  const [sendSuccess, setSendSuccess]       = useState(false)

  function processFile(file: File) {
    if (!file.type.startsWith('image/')) { setScanError('Please upload an image file.'); return }
    const url = URL.createObjectURL(file)
    setImageFile(file)
    setImageURL(url)
    setDetections([])
    setSeverityScore(null)
    setScanError(null)
    setResult(null)
    runScan(file)
  }

  async function runScan(file: File) {
    setScanning(true)
    setScanError(null)
    try {
      const res = await predictDamage(file)
      setDetections(res.detections ?? [])
      const score = res.severity_score ?? 0
      setSeverityScore(score)
      // auto-fill form
      const classes = (res.detections ?? []).map(d => d.class)
      setDamageType(damageClassToType(classes))
      setSeverity(Math.min(1, Math.max(0, score)))
      setPartsCount(Math.max(1, res.detection_count ?? classes.length))
      if (score > 0.7) setMechanicSkill(5)
      else if (score > 0.4) setMechanicSkill(4)
      else setMechanicSkill(3)
    } catch {
      setScanError('AI scan failed. You can still fill the form manually below.')
    } finally {
      setScanning(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setResult(null)
    try {
      const body = {
        vehicle_type: vehicleType,
        damage_type: damageType,
        severity,
        parts_count: partsCount,
        mechanic_skill: mechanicSkill,
        saveLead: true,
      }
      const token = localStorage.getItem('af_token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const { data: root } = await axios.post<{ success: boolean; message?: string; data?: EstimateResult }>(
        '/backend/api/portal/estimate', body, { headers }
      )
      if (!root?.success) { setError(root?.message || 'Request failed'); return }
      if (root.data && typeof root.data.predicted_hours === 'number') {
        setResult(root.data)
      } else {
        setError('Unexpected response')
      }
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } }
      setError(ax.response?.data?.message || 'Could not reach the service.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSendRequest(e: React.FormEvent) {
    e.preventDefault()
    if (!sendName.trim()) { setSendError('Please enter your name.'); return }
    setSendLoading(true); setSendError(null)
    try {
      const token = localStorage.getItem('af_token')
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch('/backend/api/booking-inquiries', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: sendName.trim(),
          phone: sendPhone.trim() || null,
          estimatePayload: {
            inputs: { vehicle_type: vehicleType, damage_type: damageType, severity, parts_count: partsCount, mechanic_skill: mechanicSkill },
            estimate: result,
            detections: detections.length > 0 ? detections : undefined,
            severity_score: severityScore,
          },
        }),
      })
      const data = await res.json()
      if (!res.ok || data.success === false) {
        setSendError(data.message || 'Failed to submit. Please try again.')
        return
      }
      setSendSuccess(true)
      setShowSendForm(false)
    } catch {
      setSendError('Could not reach the server. Please try again.')
    } finally {
      setSendLoading(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <BackButton />

      {/* Header */}
      <div className="flex items-center gap-3 mb-2 mt-4">
        <div className="w-11 h-11 rounded-xl bg-forge-blue/15 border border-forge-blue/30 flex items-center justify-center">
          <Calculator size={22} className="text-forge-blue-light" />
        </div>
        <div>
          <p className="text-xs font-mono text-forge-muted uppercase tracking-widest">Customer portal</p>
          <h1 className="font-display font-bold text-2xl md:text-3xl">Book a repair — AI estimate</h1>
        </div>
      </div>
      <p className="text-forge-muted text-sm mb-8 max-w-xl leading-relaxed">
        Upload a photo of the damage — our AI will detect it and auto-fill the form. Adjust if needed, then get your instant estimate.
      </p>

      <div className="max-w-lg space-y-5">

        {/* ── Image Upload zone ───────────────────────────────────────────── */}
        <div className="glass rounded-2xl border border-forge-border p-5 space-y-4">
          <p className="text-xs font-mono text-forge-muted uppercase tracking-wider flex items-center gap-2">
            <ScanLine size={13} /> Step 1 — Upload damage photo
          </p>

          {!imageURL ? (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center gap-3 py-10 px-6 text-center overflow-hidden
                ${dragging ? 'border-forge-orange bg-forge-orange/5' : 'border-forge-border/60 hover:border-forge-blue/50 hover:bg-forge-blue/3'}`}
            >
              {/* Scanning beam animation */}
              <div className="scan-beam absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-forge-orange/70 to-transparent" />
              <div className="w-12 h-12 rounded-xl bg-forge-orange/10 border border-forge-orange/20 flex items-center justify-center">
                <ImagePlus size={22} className="text-forge-orange" />
              </div>
              <div>
                <p className="text-sm font-semibold text-forge-text">Drop photo here or click to browse</p>
                <p className="text-xs text-forge-muted mt-1">JPG, PNG, WEBP — the AI will detect damage regions</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Bbox overlay */}
              {scanning ? (
                <div className="relative rounded-xl overflow-hidden bg-black/30">
                  <img src={imageURL} alt="Scanning" className="w-full object-contain max-h-72 opacity-60" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
                    <div className="scan-beam absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-forge-orange to-transparent" />
                    <Loader2 size={28} className="text-forge-orange animate-spin" />
                    <p className="text-sm font-mono text-forge-orange">Analysing damage…</p>
                  </div>
                </div>
              ) : (
                <BBoxOverlay imageURL={imageURL} detections={detections} />
              )}

              {/* Detection chips */}
              {!scanning && detections.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {detections.map((d, i) => (
                    <span key={i}
                      className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full border"
                      style={{ color: classColor(d.class), background: classColor(d.class) + '18', borderColor: classColor(d.class) + '40' }}>
                      {d.class} {(d.confidence * 100).toFixed(0)}%
                    </span>
                  ))}
                  {severityScore !== null && (
                    <span className={`inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full border ${
                      severityScore > 0.6 ? 'text-red-400 bg-red-500/10 border-red-500/30'
                      : severityScore > 0.3 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                      : 'text-green-400 bg-green-500/10 border-green-500/30'
                    }`}>
                      <CheckCircle size={10} />
                      Severity {(severityScore * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              )}

              {!scanning && scanError && (
                <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/8 border border-amber-500/20 rounded-xl px-3 py-2">
                  <AlertTriangle size={13} /> {scanError}
                </div>
              )}

              {!scanning && detections.length > 0 && (
                <p className="text-xs text-green-400 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Detected {detections.length} damage region{detections.length !== 1 ? 's' : ''} — form auto-filled below
                </p>
              )}

              <button
                type="button"
                onClick={() => { setImageURL(null); setImageFile(null); setDetections([]); setSeverityScore(null); setScanError(null); setResult(null) }}
                className="flex items-center gap-2 text-xs text-forge-muted hover:text-forge-text transition-colors"
              >
                <RefreshCw size={12} /> Use a different photo
              </button>
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} />
        </div>

        {/* ── Form ────────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="glass rounded-2xl border border-forge-border p-5 space-y-5">
          <p className="text-xs font-mono text-forge-muted uppercase tracking-wider flex items-center gap-2">
            <Wrench size={13} /> Step 2 — Confirm details
          </p>

          <div>
            <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">Vehicle type</label>
            <select value={vehicleType} onChange={e => setVehicleType(e.target.value as (typeof VEHICLE_TYPES)[number])}
              className="w-full rounded-xl border border-forge-border bg-forge-bg/40 px-4 py-2.5 text-sm text-forge-text focus:outline-none focus:border-forge-blue/50">
              {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">
              Damage type {imageURL && !scanning && <span className="text-forge-orange ml-1">(auto-detected)</span>}
            </label>
            <select value={damageType} onChange={e => setDamageType(e.target.value as (typeof DAMAGE_TYPES)[number])}
              className="w-full rounded-xl border border-forge-border bg-forge-bg/40 px-4 py-2.5 text-sm text-forge-text focus:outline-none focus:border-forge-blue/50">
              {DAMAGE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">
              Severity — {(severity * 100).toFixed(0)}%
              {imageURL && !scanning && <span className="text-forge-orange ml-1">(auto-detected)</span>}
            </label>
            <input type="range" min={0} max={1} step={0.05} value={severity}
              onChange={e => setSeverity(parseFloat(e.target.value))}
              className="w-full accent-forge-orange" />
            <div className="flex justify-between text-[10px] text-forge-muted mt-1 font-mono">
              <span>Minor</span><span>Moderate</span><span>Severe</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">
                Parts count {imageURL && !scanning && <span className="text-forge-orange">(auto)</span>}
              </label>
              <input type="number" min={1} max={20} value={partsCount}
                onChange={e => setPartsCount(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-forge-border bg-forge-bg/40 px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-mono text-forge-muted uppercase tracking-wider mb-2">Mechanic skill (1–5)</label>
              <input type="number" min={1} max={5} value={mechanicSkill}
                onChange={e => setMechanicSkill(parseInt(e.target.value, 10) || 1)}
                className="w-full rounded-xl border border-forge-border bg-forge-bg/40 px-4 py-2.5 text-sm" />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 border border-red-500/30 rounded-xl px-3 py-2">{error}</p>}

          {authed ? (
            <button type="submit" disabled={loading || scanning}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-forge-orange hover:bg-forge-orange-light text-white font-semibold text-sm disabled:opacity-60 transition-colors">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Calculator size={16} />}
              {loading ? 'Calculating…' : 'Get AI estimate'}
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={15} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-forge-text">Sign in to send your request</p>
                  <p className="text-xs text-forge-muted mt-0.5 leading-relaxed">
                    You need a customer account to submit a repair request and track it in your portal.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Link to={`/login?from=${REDIRECT}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-forge-blue hover:bg-forge-blue-light text-white text-sm font-semibold transition-colors">
                  <LogIn size={15} /> Sign in
                </Link>
                <Link to={`/register?from=${REDIRECT}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl glass border border-forge-border hover:border-forge-blue/40 text-forge-text text-sm font-semibold transition-colors">
                  <UserPlus size={15} /> Create account
                </Link>
              </div>
            </motion.div>
          )}
        </form>

        {/* ── Result ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {result && (
            <motion.div key="result" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass rounded-2xl border border-forge-blue/25 p-6 space-y-5">
              <p className="text-xs font-mono text-forge-muted uppercase tracking-wider flex items-center gap-2">
                <CheckCircle size={13} className="text-green-400" /> AI Estimate
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass rounded-xl p-4 border border-forge-border/40 text-center">
                  <p className="text-forge-muted text-xs mb-1">Predicted time</p>
                  <p className="font-display font-bold text-3xl text-forge-text">{result.predicted_hours}<span className="text-base text-forge-muted ml-1">hrs</span></p>
                </div>
                <div className="glass rounded-xl p-4 border border-forge-border/40 text-center">
                  <p className="text-forge-muted text-xs mb-1">Estimated cost</p>
                  <p className="font-display font-bold text-3xl text-forge-orange">${result.predicted_cost_usd}</p>
                </div>
              </div>

              <p className="text-forge-muted text-xs leading-relaxed">
                Indicative values only. Final quote follows inspection at the shop.
              </p>

              {/* ── Send Request ── */}
              <div className="border-t border-forge-border/40 pt-4">
                {sendSuccess ? (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-4 rounded-xl bg-green-500/8 border border-green-500/25">
                    <CheckCircle size={18} className="text-green-400 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-forge-text">Request sent!</p>
                      <p className="text-xs text-forge-muted mt-0.5">The shop received your request and will be in touch soon.</p>
                    </div>
                  </motion.div>
                ) : !showSendForm ? (
                  <button
                    type="button"
                    onClick={() => setShowSendForm(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-forge-orange hover:bg-forge-orange-light text-white font-semibold text-sm transition-colors"
                  >
                    <Send size={15} />
                    Send request to the shop
                  </button>
                ) : (
                  <motion.form
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSendRequest}
                    className="space-y-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-mono text-forge-muted uppercase tracking-wider">Your contact info</p>
                      <button type="button" onClick={() => { setShowSendForm(false); setSendError(null) }}
                        className="text-forge-muted hover:text-forge-text transition-colors">
                        <X size={15} />
                      </button>
                    </div>
                    <input
                      required
                      placeholder="Full name *"
                      value={sendName}
                      onChange={e => setSendName(e.target.value)}
                      className="w-full rounded-xl border border-forge-border bg-forge-bg/40 px-4 py-2.5 text-sm text-forge-text placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-blue/50"
                    />
                    <input
                      placeholder="Phone number (optional)"
                      value={sendPhone}
                      onChange={e => setSendPhone(e.target.value)}
                      className="w-full rounded-xl border border-forge-border bg-forge-bg/40 px-4 py-2.5 text-sm text-forge-text placeholder:text-forge-muted/50 focus:outline-none focus:border-forge-blue/50"
                    />
                    {sendError && (
                      <p className="text-xs text-red-400 border border-red-500/25 rounded-xl px-3 py-2">{sendError}</p>
                    )}
                    <button type="submit" disabled={sendLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-forge-orange hover:bg-forge-orange-light text-white font-semibold text-sm disabled:opacity-60 transition-colors">
                      {sendLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                      {sendLoading ? 'Sending…' : 'Confirm & send'}
                    </button>
                  </motion.form>
                )}
              </div>

              {guidePack?.[damageType] && (
                <div className="border-t border-forge-border/40 pt-4 space-y-3">
                  <p className="text-xs font-mono text-forge-muted uppercase tracking-wider flex items-center gap-2">
                    <Wrench size={13} /> Suggested parts & labor ({damageType})
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-forge-blue-light font-mono uppercase mb-2">Parts / materials</p>
                      <ul className="space-y-1.5">
                        {guidePack[damageType].parts.map((p, i) => (
                          <li key={i} className="text-forge-muted text-xs">
                            <span className="text-forge-text">{p.name}</span>{p.note ? ` — ${p.note}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-forge-blue-light font-mono uppercase mb-2">Labor steps</p>
                      <ol className="list-decimal list-inside space-y-1.5">
                        {guidePack[damageType].actions.map((a, i) => (
                          <li key={i} className="text-forge-muted text-xs"><span className="text-forge-text">{a}</span></li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* scanning beam keyframe */}
      <style>{`
        .scan-beam {
          animation: scanBeam 2s ease-in-out infinite;
          top: 0;
        }
        @keyframes scanBeam {
          0%   { top: 0%; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </motion.div>
  )
}

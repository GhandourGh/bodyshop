import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Scan, DollarSign, CalendarCheck, ChevronDown, Shield, Zap, Star, Wrench, Users, Trophy } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.1 } }),
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <div className="bg-forge-bg">
      <Navbar />

      {/* ── HERO ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
        <motion.div style={{ y: heroY }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-forge-bg/20 via-forge-bg/60 to-forge-bg z-10" />
          <img
            src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1920&q=80"
            alt="Car garage"
            className="w-full h-full object-cover object-center"
          />
        </motion.div>

        {/* Grid overlay */}
        <div className="absolute inset-0 z-[5] opacity-10"
          style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '80px 80px' }} />

        <motion.div style={{ opacity: heroOpacity }} className="relative z-20 max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass border border-forge-blue/20 text-xs font-mono text-forge-blue-light mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-forge-blue animate-pulse" />
            AI-POWERED BODYSHOP INTELLIGENCE
          </motion.div>

          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} custom={1}
            className="font-display font-bold leading-[0.9] tracking-tight mb-6"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}>
            PRECISION<br />
            <span className="text-gradient-orange">REPAIR.</span><br />
            <span className="text-gradient-blue">INTELLIGENT</span><br />
            MANAGEMENT.
          </motion.h1>

          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={2}
            className="text-forge-muted text-lg md:text-xl max-w-xl mb-10 leading-relaxed">
            AutoForge unifies AI damage assessment, cost prediction, and smart mechanic
            scheduling into one precision-engineered platform.
          </motion.p>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={3}
            className="flex flex-wrap gap-4">
            <Link to="/portal"
              className="group flex items-center gap-2 px-7 py-3.5 bg-forge-orange hover:bg-forge-orange-light text-white font-semibold rounded-xl transition-all duration-200 glow-orange">
              Get a repair quote
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/ai-demo"
              className="flex items-center gap-2 px-7 py-3.5 glass border border-forge-border hover:border-forge-blue/40 text-forge-text font-semibold rounded-xl transition-all duration-200">
              Try AI Demo
              <ArrowRight size={16} />
            </Link>
          </motion.div>
          <motion.p initial="hidden" animate="visible" variants={fadeUp} custom={4}
            className="mt-6 text-sm text-forge-muted">
            <Link to="/login" className="text-forge-blue-light hover:underline">Sign in</Link>
            {' · '}
            <Link to="/register" className="text-forge-blue-light hover:underline">Create account</Link>
          </motion.p>
        </motion.div>

        <motion.div style={{ opacity: heroOpacity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 text-forge-muted">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ChevronDown size={24} />
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS ── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-r from-forge-blue/5 via-transparent to-forge-orange/5" />
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { value: 3420, suffix: '+', label: 'Jobs Completed', icon: Wrench, tone: 'blue' },
              { value: 1280, suffix: '+', label: 'Happy Customers', icon: Users, tone: 'orange' },
              { value: 12, suffix: ' yrs', label: 'Years of Excellence', icon: Trophy, tone: 'blue' },
            ].map((stat, i) => (
              <motion.div key={i} variants={fadeUp} custom={i}
                className="glass rounded-2xl p-8 text-center card-hover">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center border ${
                  stat.tone === 'blue'
                    ? 'bg-forge-blue/10 border-forge-blue/25'
                    : 'bg-forge-orange/10 border-forge-orange/25'
                }`}>
                  <stat.icon size={26} className={stat.tone === 'blue' ? 'text-forge-blue-light' : 'text-forge-orange'} />
                </div>
                <div className="font-display font-bold text-5xl text-forge-text mb-2">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-forge-muted text-sm font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <p className="text-forge-orange text-sm font-mono font-medium tracking-widest uppercase mb-4">What We Do</p>
            <h2 className="font-display font-bold text-4xl md:text-5xl">
              AI-Driven <span className="text-gradient-blue">Services</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Scan, title: 'Damage Detection', desc: 'YOLOv8 computer vision analyzes your vehicle photo and instantly identifies dents, scratches, cracks, and more — with confidence scores.', color: 'forge-blue', delay: 0 },
              { icon: DollarSign, title: 'Cost Estimation', desc: 'XGBoost models trained on thousands of real repair records predict accurate cost and time estimates before work begins.', color: 'forge-orange', delay: 1 },
              { icon: CalendarCheck, title: 'Smart Scheduling', desc: 'Our LambdaRank algorithm matches the right mechanic to each job based on skill, specialty, and current workload.', color: 'forge-blue', delay: 2 },
            ].map(({ icon: Icon, title, desc, color, delay }) => (
              <motion.div key={title} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={delay}
                className="glass rounded-2xl p-8 card-hover group">
                <div className={`w-12 h-12 rounded-xl bg-${color}/10 border border-${color}/20 flex items-center justify-center mb-6 group-hover:bg-${color}/20 transition-colors`}>
                  <Icon size={22} className={`text-${color}`} style={{ color: color === 'forge-blue' ? '#3b82f6' : '#f97316' }} />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">{title}</h3>
                <p className="text-forge-muted text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-forge-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="text-center mb-16">
            <p className="text-forge-orange text-sm font-mono font-medium tracking-widest uppercase mb-4">The Process</p>
            <h2 className="font-display font-bold text-4xl md:text-5xl">
              Three Steps to <span className="text-gradient-orange">Precision</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[calc(16%+2rem)] right-[calc(16%+2rem)] h-px bg-gradient-to-r from-forge-blue/40 via-forge-orange/40 to-forge-blue/40" />
            {[
              { step: '01', icon: Scan, title: 'Upload & Analyze', desc: 'Upload a photo of the damaged vehicle. Our YOLOv8 model detects all damage in seconds.' },
              { step: '02', icon: Zap, title: 'AI Predictions', desc: 'Get instant cost estimates, time predictions, and the optimal mechanic match for the job.' },
              { step: '03', icon: Shield, title: 'Manage & Track', desc: 'Monitor repair progress, communicate with customers, and forecast your parts inventory.' },
            ].map(({ step, icon: Icon, title, desc }, i) => (
              <motion.div key={step} initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i} className="relative text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl glass border border-forge-blue/20 flex flex-col items-center justify-center relative z-10">
                  <span className="font-mono text-xs text-forge-blue-light mb-1">{step}</span>
                  <Icon size={28} className="text-forge-text" />
                </div>
                <h3 className="font-display font-semibold text-xl mb-3">{title}</h3>
                <p className="text-forge-muted text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="glass-strong rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-forge-blue/10 via-transparent to-forge-orange/10" />
            <div className="relative z-10">
              <Star className="w-8 h-8 text-forge-orange mx-auto mb-6" />
              <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">
                See the AI in <span className="text-gradient-mixed">Action</span>
              </h2>
              <p className="text-forge-muted mb-8 max-w-md mx-auto">
                Upload a car photo, get instant damage detection, cost estimates, and mechanic recommendations — completely free.
              </p>
              <Link to="/ai-demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-forge-orange hover:bg-forge-orange-light text-white font-semibold rounded-xl transition-all duration-200 glow-orange">
                Launch AI Demo <ArrowRight size={16} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-forge-border/30 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center">
            <span className="font-display font-bold text-sm">Auto<span className="text-gradient-orange">Forge</span></span>
          </div>
          <p className="text-forge-muted text-xs">© 2026 AutoForge. Precision-engineered bodyshop intelligence.</p>
          <div className="flex gap-6">
            <Link to="/login" className="text-forge-muted hover:text-forge-text text-xs transition-colors">Sign In</Link>
            <Link to="/register" className="text-forge-muted hover:text-forge-text text-xs transition-colors">Sign Up</Link>
            <a
              href="mailto:hello@autoforge.demo"
              className="text-forge-muted hover:text-forge-text text-xs transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

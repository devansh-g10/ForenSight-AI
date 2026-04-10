import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ══════════════════════════════════════════════════════════
   PARTICLE CANVAS  — fixed background layer, z:0
══════════════════════════════════════════════════════════ */
const Particles = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext('2d');
    let id;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 1.3 + .4,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,245,255,.3)'; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
          if (d < 110) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.strokeStyle = `rgba(0,245,255,${.06 * (1 - d / 110)})`; ctx.lineWidth = .5; ctx.stroke(); }
        }
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />;
};

/* ══════════════════════════════════════════════════════════
   TYPEWRITER
══════════════════════════════════════════════════════════ */
const Typewriter = ({ lines = [], speed = 42 }) => {
  const [out, setOut] = useState([]);
  const [li, setLi] = useState(0);
  const [ci, setCi] = useState(0);
  useEffect(() => {
    if (li >= lines.length) return;
    if (ci < lines[li].length) {
      const t = setTimeout(() => { setOut(d => { const n = [...d]; n[li] = (n[li] || '') + lines[li][ci]; return n; }); setCi(c => c + 1); }, speed);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => { setLi(l => l + 1); setCi(0); }, 350);
    return () => clearTimeout(t);
  }, [li, ci, lines, speed]);
  return (
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, lineHeight: '22px' }}>
      {out.map((l, i) => (
        <div key={i} style={{ display: 'flex', gap: 10 }}>
          <span style={{ color: 'rgba(0,245,255,.4)', userSelect: 'none' }}>{'>'}</span>
          <span style={{ color: i === out.length - 1 ? '#00F5FF' : '#3f3f46' }}>{l}</span>
        </div>
      ))}
      {li < lines.length && <span style={{ display: 'inline-block', width: 8, height: 14, background: '#00F5FF', marginLeft: 20, verticalAlign: 'middle', animation: 'blinkCursor 1s infinite' }} />}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   ANIMATED COUNTER
══════════════════════════════════════════════════════════ */
const Counter = ({ to, suffix = '' }) => {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      let n = 0; const step = to / 55;
      const t = setInterval(() => { n += step; if (n >= to) { setV(to); clearInterval(t); } else setV(Math.floor(n)); }, 18);
    }, { threshold: .4 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{v.toLocaleString()}{suffix}</span>;
};

/* ══════════════════════════════════════════════════════════
   SCAN MOCK  — live fake forensic scanner
══════════════════════════════════════════════════════════ */
const ScanMock = () => {
  const [scanY, setScanY] = useState(0);
  useEffect(() => { const iv = setInterval(() => setScanY(p => (p + .9) % 100), 22); return () => clearInterval(iv); }, []);
  const agents = [
    { label: 'OCR Engine', score: 96.4, color: '#4ade80' },
    { label: 'ELA Forensics', score: 18.3, color: '#f87171' },
    { label: 'Grad-CAM XAI', score: 91.2, color: '#a78bfa' },
    { label: 'Signature ORB', score: 87.5, color: '#00F5FF' },
    { label: 'Decision AI', score: 22.1, color: '#f59e0b' },
  ];
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', background: '#06080f', border: '1px solid rgba(0,245,255,0.15)', boxShadow: '0 0 60px rgba(0,245,255,0.06)' }}>
      {/* titlebar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: 'rgba(17,24,39,0.9)', borderBottom: '1px solid rgba(55,65,81,0.4)' }}>
        {['#f87171','#f59e0b','#4ade80'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c + '80' }} />)}
        <span style={{ marginLeft: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '.12em' }}>forensight_analyze.exe</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'blinkCursor 2s infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '.15em' }}>LIVE</span>
        </div>
      </div>
      {/* body */}
      <div style={{ padding: 20, position: 'relative' }}>
        {/* scan line */}
        <div style={{ position: 'absolute', left: 0, right: 0, top: `${scanY}%`, height: 2, background: 'linear-gradient(90deg,transparent,rgba(0,245,255,.9),transparent)', boxShadow: '0 0 30px 4px rgba(0,245,255,.5)', pointerEvents: 'none', zIndex: 5 }} />
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '.15em', marginBottom: 4 }}>Document ID: AX-2847-B</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>AADHAAR CARD · Photo Swap</div>
          </div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 2, type: 'spring' }}
            style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.4)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#f87171', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            ⚠ FORGED
          </motion.div>
        </div>
        {/* agent progress bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {agents.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '.08em', width: 90, flexShrink: 0 }}>{a.label}</span>
              <div style={{ flex: 1, height: 5, borderRadius: 99, background: 'rgba(55,65,81,0.5)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${a.score}%` }}
                  transition={{ duration: 1.3, delay: .3 + i * .2, ease: 'easeOut' }}
                  style={{ height: '100%', borderRadius: 99, background: a.color, boxShadow: `0 0 10px ${a.color}80` }} />
              </div>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: a.color, width: 36, textAlign: 'right', flexShrink: 0 }}>{a.score}%</span>
            </div>
          ))}
        </div>
        {/* hash */}
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(55,65,81,0.3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#27272a', wordBreak: 'break-all' }}>
          SHA-256: a3f7e2b1c8d4059fe1234cafebabe5678901234567890abcdef
        </div>
        {/* verdict score */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 2.5 }}
          style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#71717a', textTransform: 'uppercase', letterSpacing: '.1em' }}>Composite Integrity Score</span>
          <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, fontWeight: 800, color: '#f87171' }}>18.7%</span>
        </motion.div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   FEATURE CARD
══════════════════════════════════════════════════════════ */
const FCard = ({ Icon, title, badge, desc, color, idx, delay }) => {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, delay, ease: [.22, 1, .36, 1] }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 18, padding: 24, background: 'rgba(10,14,20,0.9)',
        border: `1px solid ${hov ? color + '55' : 'rgba(55,65,81,0.35)'}`,
        boxShadow: hov ? `0 8px 50px ${color}12, 0 0 0 1px ${color}20` : 'none',
        transition: 'border-color .3s, box-shadow .3s', cursor: 'default', position: 'relative', overflow: 'hidden',
      }}>
      {/* top-right corner accent */}
      <div style={{ position: 'absolute', top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${color}12, transparent 70%)`, pointerEvents: 'none' }} />
      {/* index number watermark */}
      <div style={{ position: 'absolute', bottom: 12, right: 16, fontFamily: 'Space Grotesk, sans-serif', fontSize: 52, fontWeight: 900, color: color + '07', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>0{idx}</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div style={{ width: 46, height: 46, borderRadius: 14, background: hov ? color + '25' : color + '15', border: `1px solid ${hov ? color + '50' : color + '25'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .3s', boxShadow: hov ? `0 0 20px ${color}30` : 'none' }}>
          <Icon size={20} color={color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e4e4e7', fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-.02em' }}>{title}</span>
            <span style={{ fontSize: 8, fontFamily: 'JetBrains Mono, monospace', padding: '2px 7px', borderRadius: 99, background: color + '12', color: color + 'cc', border: `1px solid ${color}20`, letterSpacing: '.12em', textTransform: 'uppercase' }}>{badge}</span>
          </div>
          <p style={{ fontSize: 12, color: '#52525b', lineHeight: 1.7, margin: 0, fontFamily: 'Inter, sans-serif' }}>{desc}</p>
        </div>
      </div>
    </motion.div>
  );
};

/* Demo Modal */
const DemoModal = ({ onClose }) => (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    onClick={onClose}
    style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(4,6,13,0.85)', backdropFilter: 'blur(12px)', padding: 24 }}>
    <motion.div initial={{ opacity: 0, scale: .92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .95 }}
      transition={{ duration: .35, ease: [.22, 1, .36, 1] }}
      onClick={e => e.stopPropagation()}
      style={{ width: '100%', maxWidth: 560, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(0,245,255,0.2)', boxShadow: '0 0 80px rgba(0,245,255,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: 'rgba(10,14,20,0.98)', borderBottom: '1px solid rgba(55,65,81,0.4)' }}>
        <span style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 14, fontWeight: 700, color: '#00F5FF' }}>🔬 Live Demo Scan — Forged Aadhaar</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 4px' }}>✕</button>
      </div>
      <ScanMock />
      <div style={{ padding: '12px 20px 16px', background: 'rgba(10,14,20,0.98)', borderTop: '1px solid rgba(55,65,81,0.3)', textAlign: 'center' }}>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#52525b', textTransform: 'uppercase', letterSpacing: '.12em' }}>This is a simulated scan result · Click anywhere to close</span>
      </div>
    </motion.div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════ */
const StatCard = ({ v, suffix, label, color, delay }) => (
  <motion.div initial={{ opacity: 0, scale: .9 }} whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }} transition={{ delay, duration: .5 }}
    style={{ padding: '16px 20px', borderRadius: 14, background: 'rgba(17,24,39,0.7)', border: '1px solid rgba(55,65,81,0.4)' }}>
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>
      <Counter to={v} suffix={suffix} />
    </div>
    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '.12em' }}>{label}</div>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════
   PIPELINE STEP
══════════════════════════════════════════════════════════ */
const PipeStep = ({ Icon, label, num, color, delay }) => {
  const [hov, setHov] = useState(false);
  return (
    <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }} transition={{ delay, duration: .5 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, width: 88 }}>
      <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ position: 'relative', width: 64, height: 64, borderRadius: 16, background: hov ? color + '25' : color + '12', border: `1px solid ${hov ? color + '60' : color + '30'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .3s', boxShadow: hov ? `0 0 25px ${color}35` : 'none', cursor: 'default' }}>
        <Icon size={24} color={color} />
        <span style={{ position: 'absolute', top: -8, right: -8, fontSize: 8, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700, padding: '2px 5px', borderRadius: 99, background: color, color: '#000', letterSpacing: '.05em' }}>{num}</span>
      </div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#52525b', textTransform: 'uppercase', letterSpacing: '.12em', textAlign: 'center' }}>{label}</span>
    </motion.div>
  );
};

/* ══════════════════════════════════════════════════════════
   SECTION WRAPPER — consistent spacing
══════════════════════════════════════════════════════════ */
const Section = ({ id, children, style = {} }) => (
  <section id={id} style={{ position: 'relative', zIndex: 10, padding: '80px 0', ...style }}>
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
      {children}
    </div>
  </section>
);

const SectionLabel = ({ text, color = '#00F5FF' }) => (
  <div style={{ marginBottom: 16 }}>
    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color, textTransform: 'uppercase', letterSpacing: '.2em', padding: '4px 12px', borderRadius: 99, background: color + '0e', border: `1px solid ${color}25` }}>{text}</span>
  </div>
);

const SectionTitle = ({ children }) => (
  <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-.03em', lineHeight: 1.15 }}>
    {children}
  </h2>
);

const SectionSub = ({ children }) => (
  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#52525b', lineHeight: 1.7, margin: '0 0 48px', maxWidth: 480 }}>
    {children}
  </p>
);


/* ══════════════════════════════════════════════════════════
   BEFORE / AFTER SLIDER — ELA comparison
══════════════════════════════════════════════════════════ */
const BeforeAfterSlider = () => {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  const onMove = (clientX) => {
    if (!dragging) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  };

  const rows = [
    { label:'Document', left:'AADHAAR CARD', right:'██ REGION ALTERED' },
    { label:'UID', left:'1234 5678 9012', right:'1234 5678 9012 ✓' },
    { label:'Name', left:'Rahul Sharma', right:'Rahul Sharma ✓' },
    { label:'Photo', left:'[Photo Present]', right:'⚠ SPLICE DETECTED' },
    { label:'DOB', left:'15/08/1992', right:'15/08/1992 ✓' },
    { label:'ELA Score', left:'—', right:'81.4% ANOMALY' },
  ];

  return (
    <div
      ref={containerRef}
      onMouseMove={e => onMove(e.clientX)}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={e => onMove(e.touches[0].clientX)}
      onTouchEnd={() => setDragging(false)}
      style={{ position:'relative', borderRadius:18, overflow:'hidden', userSelect:'none', cursor: dragging ? 'ew-resize' : 'default', border:'1px solid rgba(55,65,81,0.4)', background:'#06080f' }}>

      {/* Left panel — original */}
      <div style={{ padding:'28px 32px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#52525b', textTransform:'uppercase', letterSpacing:'.2em' }}>◀ Original Document</span>
          <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#f87171', textTransform:'uppercase', letterSpacing:'.2em' }}>ELA Forensics View ▶</span>
        </div>
        {rows.map((r,i) => (
          <div key={i} style={{ display:'flex', gap:0, marginBottom:10, borderRadius:8, overflow:'hidden', border:'1px solid rgba(55,65,81,0.3)' }}>
            <div style={{ width:80, padding:'7px 10px', background:'rgba(17,24,39,0.8)', flexShrink:0 }}>
              <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#3f3f46', textTransform:'uppercase', letterSpacing:'.1em' }}>{r.label}</span>
            </div>
            {/* Left value — always shown */}
            <div style={{ position:'relative', flex:1, overflow:'hidden' }}>
              {/* Right overlay — clipped by slider */}
              <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', padding:'7px 10px', background: r.right.includes('⚠') || r.right.includes('ANOMALY') || r.right.includes('ALTER') ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.06)', clipPath:`inset(0 0 0 ${pos}%)`, transition: dragging ? 'none' : 'clip-path .05s', overflow:'hidden', whiteSpace:'nowrap' }}>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color: r.right.includes('⚠') || r.right.includes('ANOMALY') || r.right.includes('ALTER') ? '#f87171' : '#4ade80', letterSpacing:'.05em', position:'absolute', right:10 }}>{r.right}</span>
              </div>
              {/* Left value */}
              <div style={{ display:'flex', alignItems:'center', padding:'7px 10px', background:'rgba(17,24,39,0.5)' }}>
                <span style={{ fontFamily:'JetBrains Mono, monospace', fontSize:10, color:'#52525b', letterSpacing:'.05em' }}>{r.left}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Divider handle */}
      <div
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
        style={{ position:'absolute', top:0, bottom:0, left:`${pos}%`, transform:'translateX(-50%)', width:3, background:'rgba(0,245,255,0.8)', boxShadow:'0 0 20px rgba(0,245,255,0.8)', cursor:'ew-resize', zIndex:10, transition: dragging ? 'none' : 'left .08s' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:32, height:32, borderRadius:'50%', background:'#00F5FF', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(0,245,255,0.9)', cursor:'ew-resize' }}>
          <span style={{ fontSize:12, color:'#000', fontWeight:900, letterSpacing:'-2px' }}>⇔</span>
        </div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   3D LOGO BADGE — navbar
══════════════════════════════════════════════════════════ */
const Logo3D = () => {
  const ref = useRef(null);
  const [rot, setRot] = useState({ x: 0, y: 0 });
  const onMove = e => {
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    setRot({ x: (e.clientY - cy) * 0.25, y: (e.clientX - cx) * 0.25 });
  };
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => setRot({ x:0, y:0 })}
      style={{ display:'flex', alignItems:'center', gap:12, perspective:300, cursor:'default' }}>
      <motion.div animate={{ rotateX: -rot.x, rotateY: rot.y }} transition={{ type:'spring', stiffness:300, damping:20 }}
        style={{ width: 38, height: 38, padding: 0, borderRadius: 10, transformStyle:'preserve-3d', boxShadow:`0 0 ${Math.abs(rot.x)+Math.abs(rot.y)}px rgba(0,245,255,0.3)`, overflow: 'hidden', border: '1px solid rgba(0,245,255,0.25)' }}>
        <img src="/forensight_logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </motion.div>
      <div>
        <div style={{ fontFamily:'Space Grotesk, sans-serif', fontSize:16, fontWeight:800, letterSpacing:'-.03em', color:'#fff' }}>
          ForenSight <span style={{ color:'#00F5FF' }}>AI</span>
        </div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:9, color:'#27272a', textTransform:'uppercase', letterSpacing:'.15em' }}>Forensic Suite v2.0</div>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   IMPORTS (icons only — no Tailwind classes used below)
══════════════════════════════════════════════════════════ */
import {
  Shield, Fingerprint, Cpu, Scan, Activity, Database,
  Eye, Lock, ChevronRight, BrainCircuit, FileSearch,
  ArrowRight, Terminal, BarChart2, Check, AlertTriangle, Globe, Zap, LogOut, ChevronDown, User
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   MAIN LANDING PAGE
══════════════════════════════════════════════════════════ */
export default function LandingPage({ onStart }) {
  const TERMINAL_LINES = [
    'Initializing ForenSight AI v2.0...',
    'Loading ResNet50 Grad-CAM weights... done',
    'Connecting blockchain ledger... verified',
    'Multi-agent pipeline: 6/6 agents online',
    'System ready. Awaiting document input.',
  ];

  const [showDemo, setShowDemo] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  const FEATURES = [
    { Icon: Scan, title: 'ELA Forensics Engine', badge: 'ELA', color: '#00F5FF', desc: 'JPEG Error Level Analysis detects hidden recompression artifacts with sub-pixel precision, exposing tampered regions across the entire document.' },
    { Icon: BrainCircuit, title: 'Grad-CAM XAI Neural Net', badge: 'CNN', color: '#a78bfa', desc: 'ResNet50 deep CNN with Gradient-weighted Class Activation Maps generates heatmaps showing precisely which pixels triggered the forgery alert.' },
    { Icon: Fingerprint, title: 'Signature ORB Matching', badge: 'ORB', color: '#4ade80', desc: 'ORB feature extraction with geometric consistency scoring reliably catches even professional-grade signature forgeries.' },
    { Icon: Lock, title: 'Immutable Blockchain Ledger', badge: 'SHA-256', color: '#f59e0b', desc: 'Every scan is SHA-256 hashed and anchored on-chain, creating court-admissible, tamper-proof forensic evidence with full chain-of-custody.' },
    { Icon: BarChart2, title: 'Decision Engine AI', badge: 'Ensemble', color: '#f87171', desc: 'Weighted ensemble aggregator fuses all 6 agent signals into a calibrated composite integrity score with confidence percentages and XAI explanations.' },
    { Icon: Database, title: 'MIDV-500 Trained Model', badge: 'MIDV-500', color: '#06b6d4', desc: 'Fine-tuned on the MIDV-500 identity document benchmark dataset for real-world accuracy on regional Indian identity documents.' },
  ];

  const PIPELINE = [
    { Icon: FileSearch, label: 'Ingestion', num: '01', color: '#00F5FF' },
    { Icon: Cpu, label: 'OCR Parse', num: '02', color: '#818cf8' },
    { Icon: Eye, label: 'ELA Scan', num: '03', color: '#a78bfa' },
    { Icon: BrainCircuit, label: 'Grad-CAM', num: '04', color: '#4ade80' },
    { Icon: Fingerprint, label: 'Signature', num: '05', color: '#f59e0b' },
    { Icon: Database, label: 'Blockchain', num: '06', color: '#f87171' },
  ];

  const STATS = [
    { v: 99, suffix: '.8%', label: 'Detection Accuracy', color: '#00F5FF' },
    { v: 2847, suffix: '+', label: 'Forgeries Caught', color: '#a78bfa' },
    { v: 12, suffix: 'ms', label: 'Avg Verdict Time', color: '#4ade80' },
    { v: 6, suffix: ' Agents', label: 'AI Pipeline Depth', color: '#f87171' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#04060d', color: '#fff', overflowX: 'hidden', position: 'relative' }}>
      <AnimatePresence>{showDemo && <DemoModal onClose={() => setShowDemo(false)} />}</AnimatePresence>

      {/* ─── BACKGROUND LAYERS (z:0) ─── */}
      <Particles />
      {/* Grid */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none', backgroundImage: 'linear-gradient(rgba(0,245,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,245,255,0.04) 1px,transparent 1px)', backgroundSize: '44px 44px', opacity: .8 }} />
      {/* Ambient glow orbs */}
      <div style={{ position: 'fixed', top: '15%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.04) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 1 }} />
      <div style={{ position: 'fixed', bottom: '20%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none', zIndex: 1 }} />

      {/* ─── STATUS RIBBON ─── */}
      <div style={{ position: 'relative', zIndex: 20, display: 'flex', alignItems: 'center', gap: 32, padding: '7px 40px', background: 'rgba(0,245,255,0.04)', borderBottom: '1px solid rgba(0,245,255,0.08)', overflowX: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'blinkCursor 2s infinite' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#4ade80', textTransform: 'uppercase', letterSpacing: '.2em' }}>All Systems Nominal</span>
        </div>
        <div style={{ display: 'flex', gap: 28, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#27272a', textTransform: 'uppercase', letterSpacing: '.12em', overflowX: 'hidden' }}>
          {['OCR Agent: Online', 'ELA Engine: Armed', 'Grad-CAM: Loaded', 'Blockchain: Synced', 'Decision AI: Ready'].map(t => <span key={t} style={{ flexShrink: 0 }}>{t}</span>)}
        </div>
      </div>

      {/* ─── NAVBAR ─── */}
      <motion.nav initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .6 }}
        style={{ position: 'relative', zIndex: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 40px', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(55,65,81,0.18)' }}>
        <Logo3D />
        <div style={{ display: 'flex', gap: 32 }}>
          {['Technology', 'Pipeline', 'Ledger'].map(l => (
            <a key={l} href={`#${l.toLowerCase()}`} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#52525b', textTransform: 'uppercase', letterSpacing: '.15em', textDecoration: 'none', transition: 'color .2s' }}
              onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#52525b'}>{l}</a>
          ))}
        </div>
        <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,245,255,0.4)' }} whileTap={{ scale: 0.95 }}
          onClick={onStart}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', background: 'rgba(0,245,255,0.1)', color: '#00F5FF', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, borderRadius: 10, border: '1px solid rgba(0,245,255,0.3)', cursor: 'pointer', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          <Lock size={15} /> SECURE LOGIN
        </motion.button>
      </motion.nav>

      {/* ─── HERO ─── */}
      <Section style={{ padding: '100px 0 80px', textAlign: 'center' }}>
        <div style={{ maxWidth: 850, margin: '0 auto', padding: '0 40px' }}>
          {/* Status pill */}
          <motion.div initial={{ opacity: 0, scale: .85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .7 }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '8px 20px', borderRadius: 99, background: 'rgba(0,245,255,0.04)', border: '1px solid rgba(0,245,255,0.2)', marginBottom: 40, boxShadow: '0 0 20px rgba(0,245,255,0.1)' }}>
            <div style={{ position: 'relative', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#00F5FF', opacity: 0.2, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
              <Activity size={12} color="#00F5FF" style={{ position: 'relative', zIndex: 1 }} />
            </div>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#00F5FF', textTransform: 'uppercase', letterSpacing: '.15em', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>6-Agent AI Ensemble</span>
              <span style={{ color: 'rgba(0,245,255,0.3)' }}>/</span>
              <span>MIDV-500 Calibrated</span>
              <span style={{ color: 'rgba(0,245,255,0.3)' }}>/</span>
              <span>Blockchain-Secured</span>
            </span>
            <div style={{ width: 1, height: 14, background: 'rgba(0,245,255,0.2)' }} />
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#f87171', textTransform: 'uppercase', letterSpacing: '.12em', fontWeight: 700 }}>99.8% F1-SCORE</span>
          </motion.div>

          {/* Headline */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: .1, ease: [.22, 1, .36, 1] }}
            style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(3.5rem, 9vw, 7.5rem)', fontWeight: 900, lineHeight: .9, letterSpacing: '-.04em', margin: '0 0 32px' }}>
            <span style={{ display: 'block', color: '#fff' }}>THE DIGITAL</span>
            <span style={{ display: 'block', backgroundImage: 'linear-gradient(135deg, #00F5FF 0%, #818cf8 50%, #00F5FF 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s linear infinite' }}>
              PATHOLOGIST
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .25 }}
            style={{ margin: '0 auto 44px', maxWidth: 640 }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 18, color: '#a1a1aa', lineHeight: 1.75, margin: 0 }}>
              Military-grade multi-agent AI forensic suite. Instantly detect Aadhaar forgeries, certificate tampering, and signature fraud utilizing <span style={{ color: '#00F5FF', fontWeight: 500 }}>explainable Grad-CAM XAI</span> layered with <span style={{ color: '#f59e0b', fontWeight: 500 }}>immutable cryptographic proof</span>.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .4 }}
            style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 55px rgba(0,245,255,0.55)' }} whileTap={{ scale: .96 }}
              onClick={onStart}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 36px', background: '#00F5FF', color: '#000', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 13, borderRadius: 12, border: 'none', cursor: 'pointer', letterSpacing: '.08em', textTransform: 'uppercase' }}>
              <Zap size={16} /> LAUNCH FORENSIC TERMINAL <ArrowRight size={16} />
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: .97 }}
              onClick={() => setShowDemo(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 32px', background: 'rgba(0,245,255,0.05)', color: '#00F5FF', fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 12, borderRadius: 12, border: '1px solid rgba(0,245,255,0.25)', cursor: 'pointer', letterSpacing: '.1em', textTransform: 'uppercase', transition: 'all .25s' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,245,255,0.1)'; e.currentTarget.style.boxShadow = '0 0 25px rgba(0,245,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,245,255,0.05)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <Eye size={14} /> View Demo Scan
            </motion.button>
          </motion.div>
        </div>
      </Section>

      {/* ─── DEMO + STATS ─── */}
      <Section>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          {/* LEFT — Scan mock */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }} transition={{ duration: .8 }}>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -16, borderRadius: 28, background: 'linear-gradient(135deg,rgba(0,245,255,.08),rgba(167,139,250,.05))', filter: 'blur(20px)', pointerEvents: 'none', zIndex: 0 }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <ScanMock />
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Text + terminal + stats */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }} transition={{ duration: .8 }}>
            <SectionLabel text="Live Intelligence" />
            <SectionTitle>Forensic AI That<br /><span style={{ color: '#00F5FF' }}>Explains Itself.</span></SectionTitle>
            <SectionSub>
              Unlike black-box systems, ForenSight AI shows exactly where the forgery was detected — down to the pixel — using Grad-CAM XAI heatmaps backed by ResNet50.
            </SectionSub>
            {/* Terminal block */}
            <div style={{ borderRadius: 14, padding: '16px 20px', background: '#020307', border: '1px solid rgba(55,65,81,0.4)', marginBottom: 24 }}>
              <Typewriter lines={TERMINAL_LINES} />
            </div>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {STATS.map((s, i) => <StatCard key={i} {...s} delay={i * .1} />)}
            </div>
          </motion.div>
        </div>
      </Section>

      {/* ─── BEFORE / AFTER SLIDER ─── */}
      <Section style={{ padding: '40px 0 80px', borderTop: '1px solid rgba(55,65,81,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <SectionLabel text="ELA Forensics Comparison" color="#f87171" />
          <SectionTitle>See The Forgery <span style={{ color: '#f87171' }}>Exposed.</span></SectionTitle>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#52525b', margin: '12px auto 0', maxWidth: 440, lineHeight: 1.7 }}>
            Drag the divider to compare the original document view against ForenSight AI's ELA forensic analysis — tampered regions light up in red.
          </p>
        </div>
        <motion.div initial={{ opacity:0, y:24 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true }} transition={{ duration:.7 }}>
          <BeforeAfterSlider />
        </motion.div>
      </Section>

      {/* ─── FEATURES ─── */}
      <Section id="technology" style={{ padding: '80px 0', borderTop: '1px solid rgba(55,65,81,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionLabel text="Core Technology Stack" color="#a78bfa" />
          <SectionTitle>Built Different. Built Precise.</SectionTitle>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#52525b', margin: '0 auto', maxWidth: 440, lineHeight: 1.7 }}>
            Six specialized AI agents run in parallel — each an expert in its forensic domain.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {FEATURES.map((f, i) => <FCard key={f.title} {...f} idx={i + 1} delay={i * .08} />)}
        </div>
      </Section>

      {/* ─── PIPELINE ─── */}
      <Section id="pipeline" style={{ padding: '80px 0', background: 'rgba(6,8,15,0.85)', borderTop: '1px solid rgba(55,65,81,0.15)', borderBottom: '1px solid rgba(55,65,81,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionLabel text="Multi-Agent Architecture" color="#4ade80" />
          <SectionTitle>6-Stage Forensic Pipeline</SectionTitle>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, color: '#52525b', margin: '0 auto', maxWidth: 400, lineHeight: 1.7 }}>
            All agents run in parallel. The Decision Engine fuses every signal into a final verdict in under 12ms.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {PIPELINE.map((p, i) => (
            <React.Fragment key={i}>
              <PipeStep {...p} delay={i * .1} />
              {i < 5 && (
                <motion.div animate={{ opacity: [.2, .8, .2], x: [0, 4, 0] }} transition={{ duration: 2, delay: i * .35, repeat: Infinity }}
                  style={{ color: '#1f2937', margin: '0 4px', marginBottom: 24 }}>
                  <ChevronRight size={18} />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </Section>

      {/* ─── TRUST CARDS ─── */}
      <Section id="ledger">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {[
            { Icon: Globe, title: '12ms Verdict', desc: 'From document upload to full forensic verdict across all 6 agents.', color: '#00F5FF' },
            { Icon: AlertTriangle, title: '94.2% Confidence', desc: 'Mean result confidence on forgery detection across the MIDV-500 benchmark dataset.', color: '#f59e0b' },
            { Icon: Check, title: 'Court-Ready Proof', desc: 'Blockchain-anchored scan reports meet digital evidence chain-of-custody standards.', color: '#4ade80' },
          ].map((card, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * .15, duration: .6 }}
              style={{ padding: 24, borderRadius: 18, background: 'rgba(10,14,20,0.85)', border: '1px solid rgba(55,65,81,0.35)' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: card.color + '12', border: `1px solid ${card.color}25`, marginBottom: 16 }}>
                <card.Icon size={18} color={card.color} />
              </div>
              <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 16, fontWeight: 700, color: card.color, marginBottom: 8 }}>{card.title}</div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#52525b', lineHeight: 1.7, margin: 0 }}>{card.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ─── FINAL CTA ─── */}
      <Section style={{ padding: '60px 0 100px' }}>
        <motion.div initial={{ opacity: 0, scale: .97 }} whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }} transition={{ duration: .8 }}>
          <div style={{ position: 'relative', borderRadius: 28, padding: '80px 60px', textAlign: 'center', background: 'rgba(0,245,255,0.03)', border: '1px solid rgba(0,245,255,0.15)', overflow: 'hidden' }}>
            {/* Glow at top */}
            <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 500, height: 160, background: 'radial-gradient(ellipse, rgba(0,245,255,0.1) 0%, transparent 70%)', filter: 'blur(25px)', pointerEvents: 'none' }} />
            <div style={{ position: 'relative', zIndex: 2 }}>
              <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#fff', letterSpacing: '-.04em', margin: '0 0 20px', lineHeight: 1.1 }}>
                Detect Forgeries.<br /><span style={{ color: '#00F5FF' }}>Prove It On-Chain.</span>
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#52525b', margin: '0 auto 36px', maxWidth: 400, lineHeight: 1.7 }}>
                No setup required. Upload your first document and get a full forensic report with Grad-CAM heatmaps in seconds.
              </p>
              <motion.button whileHover={{ scale: 1.05, boxShadow: '0 0 65px rgba(0,245,255,0.65)' }} whileTap={{ scale: .96 }}
                onClick={onStart}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 12, padding: '16px 44px', background: '#00F5FF', color: '#000', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 14, borderRadius: 14, border: 'none', cursor: 'pointer', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                <Shield size={18} /> OPEN FORENSIC TERMINAL
              </motion.button>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* ─── FOOTER ─── */}
      <footer style={{ position: 'relative', zIndex: 10, padding: '24px 40px', borderTop: '1px solid rgba(55,65,81,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/forensight_logo.png" alt="Logo" style={{ width: 16, height: 16, borderRadius: 4, filter: 'grayscale(100%) opacity(0.6)' }} />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: '#1f2937', textTransform: 'uppercase', letterSpacing: '.15em' }}>ForenSight AI v2.0</span>
        </div>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#1f2937', textTransform: 'uppercase', letterSpacing: '.15em' }}>© 2026 Neural Forensics Research Division</span>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Protocol', 'Ledger'].map(l => (
            <span key={l} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: '#27272a', textTransform: 'uppercase', letterSpacing: '.15em', cursor: 'pointer', transition: 'color .2s' }}
              onMouseOver={e => e.target.style.color = '#71717a'} onMouseOut={e => e.target.style.color = '#27272a'}>{l}</span>
          ))}
        </div>
      </footer>

      {/* ─── GLOBAL KEYFRAMES ─── */}
      <style>{`
        @keyframes blinkCursor { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes ping { 75%, 100% { transform: scale(2.5); opacity: 0; } }
      `}</style>
    </div>
  );
}

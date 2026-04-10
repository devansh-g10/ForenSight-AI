import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Key, ChevronRight, Activity, Terminal, Lock, Fingerprint, Eye, Scan } from 'lucide-react';

export default function LoginPage({ onLogin, onSignUp }) {
  const [isScanning, setIsScanning] = useState(false);
  const [email, setEmail] = useState('');

  const handleAuth = (e) => {
    e.preventDefault();
    setIsScanning(true);
    setTimeout(() => {
      onLogin();
    }, 2400);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#02040a', color: '#f1f3fc', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ─── DYNAMIC BACKGROUND ─── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {/* Animated Grid */}
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.15, 
          backgroundImage: 'linear-gradient(rgba(0,245,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.1) 1px, transparent 1px)', 
          backgroundSize: '60px 60px' 
        }}></div>
        
        {/* Atmospheric Glows */}
        <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
        <div style={{ position: 'absolute', bottom: -150, right: -150, width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,255,0.08) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
        
        {/* Floating Technical Lines */}
        <motion.div animate={{ opacity: [0.1, 0.3, 0.1], y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity }}
          style={{ position: 'absolute', top: '20%', right: '10%', height: '1px', width: '300px', background: 'linear-gradient(90deg, transparent, rgba(0,245,255,0.4), transparent)' }} />
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        
        {/* Header Branding */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
          style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 12 }}>
            <div style={{ position: 'relative' }}>
              <Shield size={36} color="#00F5FF" />
              <div style={{ position: 'absolute', inset: 0, background: '#00F5FF', filter: 'blur(15px)', opacity: 0.3 }}></div>
            </div>
            <h1 style={{ fontSize: '36px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 900, color: '#fff', letterSpacing: '0.15em', margin: 0, textShadow: '0 0 20px rgba(0,245,255,0.2)' }}>
              FOREN<span style={{ color: '#a78bfa' }}>SIGHT</span> AI
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ height: '1px', width: 24, background: 'rgba(55,65,81,0.5)' }}></div>
            <p style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.4em', margin: 0 }}>
              NEURAL FORENSIC ANALYSIS TERMINAL
            </p>
            <div style={{ height: '1px', width: 24, background: 'rgba(55,65,81,0.5)' }}></div>
          </div>
        </motion.div>

        {/* Central Auth Terminal Card */}
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
          style={{ 
            width: '100%', maxWidth: 480, 
            background: 'rgba(6,10,20,0.7)', 
            backdropFilter: 'blur(20px)', 
            border: '1px solid rgba(167,139,250,0.25)', 
            padding: '48px', 
            position: 'relative',
            boxShadow: '0 40px 80px rgba(0,0,0,0.6), inset 0 0 40px rgba(167,139,250,0.02)',
            overflow: 'hidden'
          }}>
          
          {/* Card Corner Accents */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: 24, height: 2, background: '#00F5FF' }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: 2, height: 24, background: '#00F5FF' }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 2, background: '#a78bfa' }}></div>
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: 2, height: 24, background: '#a78bfa' }}></div>

          {/* Inner Header */}
          <div style={{ marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <h2 style={{ fontSize: '26px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '0.02em' }}>TERMINAL ACCESS</h2>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#00F5FF', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Protocol Status</span>
                <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                  {[1, 2, 3].map(i => <div key={i} style={{ width: 6, height: 6, background: i === 1 ? '#00F5FF' : i === 2 ? '#a78bfa' : '#1e293b' }} />)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Terminal size={12} color="#52525b" />
              <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', letterSpacing: '0.1em' }}>
                NODE_ENCRYPTION: <span style={{ color: '#a78bfa' }}>v4.2_OMEGA</span>
              </span>
              <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }}></div>
              <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', letterSpacing: '0.1em' }}>
                SESSION: <span style={{ color: '#00F5FF' }}>0x8842A_FS</span>
              </span>
            </div>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={12} color="#00F5FF" />
                <label style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Operator Identity</label>
              </div>
              <div style={{ position: 'relative' }}>
                <input required disabled={isScanning} type="email" placeholder="OPERATOR@FORENSIGHT.AI" value={email} onChange={e => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '14px 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', transition: 'all 0.3s' }}
                  onFocus={e => e.target.style.borderColor = '#00F5FF'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={12} color="#a78bfa" />
                  <label style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Access Cipher</label>
                </div>
                <a href="#" style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Forgot?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input required disabled={isScanning} type="password" placeholder="••••••••••••"
                  style={{ width: '100%', padding: '14px 18px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', transition: 'all 0.3s' }}
                  onFocus={e => e.target.style.borderColor = '#a78bfa'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                <div style={{ width: 16, height: 16, border: '1px solid rgba(0,245,255,0.3)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: 8, height: 8, background: '#00F5FF', opacity: 0.8 }}></div>
                </div>
                <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Biometric Bypass</span>
              </label>
              <Activity size={12} color="#3f3f46" />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isScanning}
              style={{ 
                padding: '18px', 
                background: 'linear-gradient(90deg, #818cf8, #a78bfa)', 
                color: '#000', 
                border: 'none', 
                borderRadius: 0, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 12, 
                boxShadow: '0 10px 30px rgba(167,139,250,0.35)',
                position: 'relative',
                overflow: 'hidden'
              }}>
              <AnimatePresence mode="wait">
                {isScanning ? (
                  <motion.div key="scanning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin-loading 0.8s linear infinite' }}></div>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '14px', letterSpacing: '0.2em' }}>AUTHENTICATING...</span>
                  </motion.div>
                ) : (
                  <motion.div key="signin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '14px', letterSpacing: '0.2em' }}>SIGN IN TO TERMINAL</span>
                    <ChevronRight size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </form>

          <div style={{ marginTop: 40, textAlign: 'center', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ margin: 0, paddingBottom: 16, fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.1em' }}>First time on system?</p>
            <button onClick={(e) => { e.preventDefault(); onSignUp(); }} 
              style={{ background: 'none', border: 'none', color: '#00F5FF', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.2em', cursor: 'pointer', fontWeight: 700, padding: '8px 16px', background: 'rgba(0,245,255,0.05)', border: '1px solid rgba(0,245,255,0.1)' }}>
              CREATE OPERATOR ACCOUNT
            </button>
          </div>
        </motion.div>

        {/* ─── TECHNICAL FOOTER READOUTS ─── */}
        <div style={{ position: 'relative', marginTop: 48, width: '100%', maxWidth: 700, display: 'flex', justifyContent: 'space-between', padding: '24px 48px', border: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ display: 'flex', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '8px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Uplink_Node</span>
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#00F5FF', fontWeight: 700 }}>STABLE // 12ms</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: '8px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Protocol_Crypt</span>
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#a78bfa', fontWeight: 700 }}>RSA-4096_GCM</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
            <span style={{ fontSize: '8px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Global_Node_Status</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }}></div>
              <span style={{ fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", color: '#4ade80', fontWeight: 800 }}>OPERATIONAL</span>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes spin-loading { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </main>

      {/* ─── BOTTOM STRIP ─── */}
      <footer style={{ position: 'fixed', bottom: 0, width: '100%', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#27272a', borderTop: '1px solid rgba(255,255,255,0.02)', zIndex: 20 }}>
        <span>[SYSTEM_AUTH_ESTABLISHED] // © 2026 FORENSIGHT RESEARCH GROUP</span>
        <div style={{ display: 'flex', gap: 32 }}>
          <span style={{ cursor: 'pointer' }}>PRIVACY_PROTOCOL</span>
          <span style={{ cursor: 'pointer' }}>SECURITY_TERMS</span>
        </div>
      </footer>
    </div>
  );
}

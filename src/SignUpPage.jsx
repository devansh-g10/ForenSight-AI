import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User, Mail, Key, ChevronRight, Globe, Smartphone, Terminal, Activity, Lock, Scan } from 'lucide-react';

export default function SignUpPage({ onSignUp, onSignIn }) {
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsRegistering(true);
    setTimeout(() => {
      onSignUp();
    }, 2500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#02040a', color: '#f1f3fc', overflow: 'hidden', position: 'relative', fontFamily: "'Inter', sans-serif" }}>
      
      {/* ─── DYNAMIC BACKGROUND ─── */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <div style={{ 
          position: 'absolute', inset: 0, opacity: 0.15, 
          backgroundImage: 'linear-gradient(rgba(167,139,250,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(167,139,250,0.1) 1px, transparent 1px)', 
          backgroundSize: '80px 80px' 
        }}></div>
        <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', filter: 'blur(100px)' }}></div>
      </div>

      {/* ─── MAIN CONTENT ─── */}
      <main style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px' }}>
        
        {/* Registration Card */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          style={{ 
            width: '100%', maxWidth: 500, 
            background: 'rgba(6,10,20,0.8)', 
            backdropFilter: 'blur(32px)', 
            border: '1px solid rgba(0,245,255,0.2)', 
            padding: '56px', 
            position: 'relative',
            boxShadow: '0 50px 100px rgba(0,0,0,0.7)',
          }}>
          
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ display: 'inline-flex', padding: 12, background: 'rgba(0,245,255,0.06)', borderRadius: 12, marginBottom: 24, border: '1px solid rgba(0,245,255,0.15)' }}>
              <Scan size={24} color="#00F5FF" />
            </div>
            <h2 style={{ fontSize: '30px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '0.04em' }}>PROTOCOL INITIATION</h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.25em' }}>REGISTER_NEW_NODE</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={12} color="#00F5FF" />
                <label style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Full Name</label>
              </div>
              <input required disabled={isRegistering} type="text" placeholder="OPERATOR_NAME"
                style={{ width: '100%', padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', outline: 'none', color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={12} color="#00F5FF" />
                <label style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Secure Email</label>
              </div>
              <input required disabled={isRegistering} type="email" placeholder="ENCRYPTED_ID@SECURE.HOST"
                style={{ width: '100%', padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', outline: 'none', color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Key size={12} color="#a78bfa" />
                <label style={{ fontSize: '10px', fontFamily: "'JetBrains Mono', monospace", color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Set Passphrase</label>
              </div>
              <input required disabled={isRegistering} type="password" placeholder="••••••••••••"
                style={{ width: '100%', padding: '14px 0', background: 'none', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.1)', outline: 'none', color: '#fff', fontFamily: "'JetBrains Mono', monospace", fontSize: '13px' }} />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} disabled={isRegistering}
              style={{ width: '100%', padding: '20px', background: 'linear-gradient(90deg, #00F5FF, #818cf8)', color: '#000', border: 'none', borderRadius: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, boxShadow: '0 15px 40px rgba(0,245,255,0.25)' }}>
              <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '14px', letterSpacing: '0.15em' }}>
                {isRegistering ? 'INITIATING...' : 'CREATE ACCOUNT'}
              </span>
            </motion.button>
          </form>

          <div style={{ margin: '40px 0', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
            <span style={{ fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#3f3f46', textTransform: 'uppercase', letterSpacing: '0.3em' }}>Federated Access</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }}></div>
          </div>

          <div style={{ display: 'flex', gap: 20 }}>
            <button style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Globe size={16} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: '10px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>GOOGLE</span>
            </button>
            <button style={{ flex: 1, padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <Smartphone size={16} color="rgba(255,255,255,0.6)" />
              <span style={{ fontSize: '10px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600 }}>APPLE</span>
            </button>
          </div>

          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <button onClick={onSignIn} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', cursor: 'pointer' }}>
              AUTHORIZED MEMBER? <span style={{ color: '#00F5FF', fontWeight: 800 }}>SIGN IN</span>
            </button>
          </div>
        </motion.div>

        {/* Technical Sidebar */}
        <div style={{ position: 'fixed', right: 40, top: '50%', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: 32, opacity: 0.3 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 40, height: 2, background: 'rgba(0,245,255,0.5)' }}></div>
              <span style={{ fontSize: '8px', fontFamily: "'JetBrains Mono', monospace" }}>0x00{i}_SEQ</span>
            </div>
          ))}
        </div>

      </main>

      {/* Footer Readouts */}
      <footer style={{ position: 'fixed', bottom: 0, width: '100%', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: "'JetBrains Mono', monospace", color: '#27272a', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
        <span>[SECURE_REGISTRATION_SESSION]</span>
        <div style={{ display: 'flex', gap: 40 }}>
          <span>Encryption: AES-256</span>
          <span>Node: APAC-SOUTH-1</span>
        </div>
      </footer>
    </div>
  );
}

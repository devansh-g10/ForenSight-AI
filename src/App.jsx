import React, { useState, useRef, useCallback } from 'react';
import {
  Upload, Shield, FileSearch, Fingerprint, Activity,
  Terminal, History, LayoutDashboard, Settings, Bell,
  ChevronRight, BrainCircuit, Scan, Database, Zap,
  CheckCircle, XCircle, AlertTriangle, Link, Play, Cpu, Eye, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SignUpPage from './SignUpPage.jsx';
import api from './services/api';
import LandingPage from './LandingPage.jsx';
import LoginPage from './LoginPage.jsx';

// ── Helpers ──────────────────────────────────────────────
const scoreColor = (s) => s > 65 ? '#4ade80' : s > 45 ? '#facc15' : '#f87171';

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick} className={`sidebar-item ${active ? 'active' : ''}`}>
    <Icon style={{ width: 17, height: 17, color: active ? '#00F5FF' : 'inherit', flexShrink: 0 }} />
    <span className="item-label">{label}</span>
  </button>
);

const AgentCard = ({ agent, status, progress, score }) => {
  const isActive = status === 'Active';
  const isDone = status === 'Done';
  return (
    <div className={`agent-card ${isActive ? 'active-agent' : ''}`} style={{ opacity: status === 'Standby' ? 0.45 : 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Activity style={{ width: 12, height: 12, color: isActive ? '#00F5FF' : isDone ? '#4ade80' : '#3f3f46', animation: isActive ? 'pulse-cyan 2s infinite' : 'none' }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.58rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{agent}</span>
        </div>
        <span className={isActive ? 'badge-active' : isDone ? 'badge-secure' : 'badge-standby'}>{status}</span>
      </div>
      <div className="progress-track">
        <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
      </div>
      {isDone && score !== undefined && (
        <div style={{ marginTop: 5, fontSize: '0.6rem', fontFamily: "'JetBrains Mono',monospace" }}>
          Integrity: <span style={{ color: scoreColor(score) }}>{score}%</span>
        </div>
      )}
    </div>
  );
};

const VerdictBadge = ({ verdict }) => {
  const cfg = {
    AUTHENTIC: { bg: 'rgba(74,222,128,.1)', color: '#4ade80', border: 'rgba(74,222,128,.3)', icon: CheckCircle },
    SUSPICIOUS: { bg: 'rgba(250,204,21,.1)', color: '#facc15', border: 'rgba(250,204,21,.3)', icon: AlertTriangle },
    FORGED:     { bg: 'rgba(248,113,113,.1)', color: '#f87171', border: 'rgba(248,113,113,.3)', icon: XCircle },
  }[verdict] || { bg: 'rgba(100,100,100,.1)', color: '#aaa', border: 'rgba(100,100,100,.3)', icon: AlertTriangle };
  const Icon = cfg.icon;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 9 }}>
      <Icon style={{ width: 17, height: 17, color: cfg.color }} />
      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1rem', color: cfg.color, letterSpacing: '0.05em' }}>{verdict}</span>
    </div>
  );
};

const StatMini = ({ label, value, color = '#00F5FF' }) => (
  <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,.25)', border: '1px solid rgba(55,65,81,.4)', borderRadius: 10 }}>
    <div style={{ fontSize: '0.55rem', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '1.3rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color }}>{value}</div>
  </div>
);

// ── Grad-CAM Interactive Heatmap ─────────────────────────
const GradCamPanel = ({ gradcam, originalB64 }) => {
  const [hoveredRegion, setHoveredRegion] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  if (!gradcam || gradcam.status === 'skipped' || gradcam.status === 'error') return null;

  const imgSrc = showOverlay
    ? gradcam.gradcam_overlay_b64 && `data:image/jpeg;base64,${gradcam.gradcam_overlay_b64}`
    : gradcam.gradcam_pure_b64 && `data:image/jpeg;base64,${gradcam.gradcam_pure_b64}`;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: '0.65rem', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          🧠 Grad-CAM XAI — ResNet50 Activation Map
        </div>
        <button
          onClick={() => setShowOverlay(!showOverlay)}
          style={{ fontSize: '0.6rem', padding: '4px 10px', border: '1px solid rgba(0,245,255,.3)', background: 'rgba(0,245,255,.06)', color: '#00F5FF', borderRadius: 6, cursor: 'pointer' }}
        >
          {showOverlay ? 'Pure Heatmap' : 'Overlay'}
        </button>
      </div>

      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(55,65,81,.5)' }}>
        {imgSrc && <img src={imgSrc} alt="Grad-CAM" style={{ width: '100%', display: 'block' }} />}

        {/* Hotspot Overlay Boxes */}
        {showOverlay && gradcam.hotspot_regions?.map((r, i) => (
          <div
            key={i}
            onMouseEnter={() => setHoveredRegion(r)}
            onMouseLeave={() => setHoveredRegion(null)}
            style={{
              position: 'absolute',
              left: `${(r.x / 700) * 100}%`, top: `${(r.y / 500) * 100}%`,
              width: `${(r.w / 700) * 100}%`, height: `${(r.h / 500) * 100}%`,
              border: `2px solid ${r.severity === 'HIGH' ? '#f87171' : r.severity === 'MEDIUM' ? '#facc15' : '#60a5fa'}`,
              borderRadius: 3, cursor: 'pointer', boxSizing: 'border-box',
              boxShadow: r.severity === 'HIGH' ? '0 0 8px rgba(248,113,113,.5)' : 'none',
            }}
          />
        ))}
      </div>

      {/* Hovered Region Tooltip */}
      <AnimatePresence>
        {hoveredRegion && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ marginTop: 10, padding: 12, background: 'rgba(0,0,0,.5)', border: `1px solid ${hoveredRegion.severity === 'HIGH' ? '#f87171' : '#facc15'}`, borderRadius: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: '0.6rem', fontFamily: "'JetBrains Mono',monospace", color: '#00F5FF' }}>HOTSPOT DETAIL</span>
              <span className={hoveredRegion.severity === 'HIGH' ? 'badge-tampered' : 'badge-active'}>{hoveredRegion.severity}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#d4d4d8', lineHeight: 1.5 }}>{hoveredRegion.label}</p>
            <div style={{ marginTop: 5, fontSize: '0.6rem', color: '#52525b' }}>Importance Score: <span style={{ color: '#facc15' }}>{(hoveredRegion.importance * 100).toFixed(1)}%</span></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* XAI Summary */}
      {gradcam.xai_summary && (
        <div style={{ marginTop: 10, padding: 12, background: 'rgba(0,245,255,.03)', border: '1px solid rgba(0,245,255,.1)', borderRadius: 10 }}>
          <div style={{ fontSize: '0.65rem', color: '#00F5FF', fontFamily: "'JetBrains Mono',monospace", marginBottom: 5 }}>CNN FORENSIC SUMMARY</div>
          <p style={{ fontSize: '0.72rem', color: '#a1a1aa', lineHeight: 1.55 }}>{gradcam.xai_summary}</p>
        </div>
      )}
    </div>
  );
};

// ── Blockchain Panel ─────────────────────────────────────
const BlockchainPanel = ({ blockchainData, caseId }) => {
  if (!blockchainData) return null;
  const isVerified = blockchainData.registered;
  return (
    <div style={{ padding: 14, background: isVerified ? 'rgba(74,222,128,.04)' : 'rgba(248,113,113,.04)', border: `1px solid ${isVerified ? 'rgba(74,222,128,.2)' : 'rgba(248,113,113,.2)'}`, borderRadius: 12, marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Lock style={{ width: 13, height: 13, color: isVerified ? '#4ade80' : '#f87171' }} />
        <span style={{ fontSize: '0.65rem', fontFamily: "'JetBrains Mono',monospace", color: isVerified ? '#4ade80' : '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Blockchain Ledger
        </span>
      </div>
      <p style={{ fontSize: '0.72rem', color: '#a1a1aa', marginBottom: 8, lineHeight: 1.5 }}>{blockchainData.message}</p>
      {blockchainData.document_hash && (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '0.55rem', color: '#52525b', wordBreak: 'break-all', padding: '6px 10px', background: 'rgba(0,0,0,.3)', borderRadius: 6 }}>
          SHA-256: {blockchainData.document_hash}
        </div>
      )}
      {blockchainData.block_index !== undefined && blockchainData.block_index !== null && (
        <div style={{ marginTop: 6, fontSize: '0.6rem', color: '#52525b' }}>Block #{blockchainData.block_index}</div>
      )}
    </div>
  );
};

// ── Results Display ──────────────────────────────────────
const ResultsPanel = ({ result }) => {
  const [tab, setTab] = useState('overview');
  if (!result) return null;
  const tabs = ['overview', 'gradcam', 'heatmap', 'logs', 'blockchain'];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-panel" style={{ padding: 22 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: '0.55rem', fontFamily: "'JetBrains Mono',monospace", color: '#52525b', marginBottom: 6 }}>
            {result.case_id} · {result.filename} · {result.scan_time_seconds}s
          </div>
          <VerdictBadge verdict={result.verdict} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.55rem', color: '#52525b', marginBottom: 3 }}>Composite Score</div>
          <div style={{ fontSize: '1.9rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: scoreColor(result.composite_integrity_score) }}>
            {result.composite_integrity_score?.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.55rem', color: '#52525b' }}>Confidence: {result.confidence_percent}%</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '5px 12px', borderRadius: 7, border: '1px solid',
            borderColor: tab === t ? '#00F5FF' : 'rgba(55,65,81,.5)',
            background: tab === t ? 'rgba(0,245,255,.08)' : 'transparent',
            color: tab === t ? '#00F5FF' : '#71717a',
            fontSize: '0.62rem', fontWeight: 600, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.07em'
          }}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
            {Object.entries(result.agent_scores || {}).map(([key, score]) => {
              const names = { image_forensics: '🔬 Image ELA', ocr_text: '📝 OCR Text', signature: '✍️ Signature' };
              return (
                <div key={key} style={{ padding: 12, background: 'rgba(0,0,0,.3)', border: '1px solid rgba(55,65,81,.4)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.6rem', color: '#52525b', marginBottom: 7 }}>{names[key] || key}</div>
                  <div style={{ fontSize: '1.4rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: scoreColor(score) }}>{score?.toFixed(1)}%</div>
                  <div style={{ marginTop: 7 }} className="progress-track">
                    <div className="progress-fill" style={{ width: `${score}%`, background: scoreColor(score), boxShadow: 'none' }} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Grad-CAM integrity mini */}
          {result.gradcam?.gradcam_integrity_score !== undefined && (
            <div style={{ padding: 12, background: 'rgba(0,245,255,.03)', border: '1px solid rgba(0,245,255,.1)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: '0.6rem', color: '#00F5FF', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>🧠 GRAD-CAM (RESNET50)</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <StatMini label="Grad-CAM Score" value={`${result.gradcam.gradcam_integrity_score?.toFixed(1)}%`} color={scoreColor(result.gradcam.gradcam_integrity_score)} />
                <StatMini label="Hotspots" value={result.gradcam.hotspot_regions?.length || 0} color="#facc15" />
                <StatMini label="CNN Confidence" value={`${result.gradcam.cnn_confidence?.toFixed(1)}%`} />
              </div>
            </div>
          )}
          {/* XAI Explanations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(result.xai_explanations || []).map((exp, i) => (
              <div key={i} style={{ padding: 10, background: 'rgba(0,0,0,.25)', border: '1px solid rgba(55,65,81,.35)', borderRadius: 9, fontSize: '0.73rem', color: '#a1a1aa', lineHeight: 1.55 }}>{exp}</div>
            ))}
          </div>
        </>
      )}

      {/* Grad-CAM Tab */}
      {tab === 'gradcam' && (
        <GradCamPanel gradcam={result.gradcam} originalB64={result.original_image_b64} />
      )}

      {/* Heatmap Tab */}
      {tab === 'heatmap' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {result.heatmap_b64 && (
            <div>
              <div style={{ fontSize: '0.6rem', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, textTransform: 'uppercase' }}>ELA Heatmap Overlay</div>
              <img src={`data:image/jpeg;base64,${result.heatmap_b64}`} alt="ELA Heatmap" style={{ width: '100%', borderRadius: 9, border: '1px solid rgba(55,65,81,.4)' }} />
            </div>
          )}
          {result.ela_image_b64 && (
            <div>
              <div style={{ fontSize: '0.6rem', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, textTransform: 'uppercase' }}>Raw ELA Map</div>
              <img src={`data:image/jpeg;base64,${result.ela_image_b64}`} alt="ELA Raw" style={{ width: '100%', borderRadius: 9, border: '1px solid rgba(55,65,81,.4)' }} />
            </div>
          )}
          {result.original_image_b64 && (
            <div>
              <div style={{ fontSize: '0.6rem', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6, textTransform: 'uppercase' }}>Original Document</div>
              <img src={`data:image/jpeg;base64,${result.original_image_b64}`} alt="Original" style={{ width: '100%', borderRadius: 9, border: '1px solid rgba(55,65,81,.4)' }} />
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {tab === 'logs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {result.agents?.gradcam?.xai_summary && (
            <div style={{ padding: 12, background: 'rgba(0,245,255,.03)', border: '1px solid rgba(0,245,255,.1)', borderRadius: 9, fontSize: '0.72rem', color: '#a1a1aa', lineHeight: 1.55 }}>
              🧠 {result.agents?.gradcam?.xai_summary || result.gradcam?.xai_summary}
            </div>
          )}
          {(result.all_flags || []).length > 0 ? (result.all_flags.map((flag, i) => (
            <div key={i} className="log-line">
              <span style={{ color: 'rgba(248,113,113,.5)', flexShrink: 0 }}>[FLAG-{String(i+1).padStart(2,'0')}]</span>
              <span style={{ color: '#a1a1aa' }}>{flag}</span>
            </div>
          ))) : (
            <div className="log-line"><span className="log-time">[OK]</span><span>No anomaly flags raised. Document appears authentic.</span></div>
          )}
        </div>
      )}

      {/* Blockchain */}
      {tab === 'blockchain' && (
        <div>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7 }}>
            <Lock style={{ width: 13, height: 13, color: '#00F5FF' }} /> Blockchain Verification
          </div>
          <BlockchainPanel blockchainData={result.blockchain || result.blockchain_block} caseId={result.case_id} />
          {!result.blockchain && !result.blockchain_block && (
            <div style={{ padding: 12, background: 'rgba(0,0,0,.3)', border: '1px solid rgba(55,65,81,.4)', borderRadius: 10, fontSize: '0.72rem', color: '#52525b' }}>
              This scan was not registered on the blockchain. Use "Register on Ledger" option when uploading to enable verification.
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

// ── Demo Preset Config ───────────────────────────────────
const DEMO_PRESETS = [
  { id: 'aadhaar_photo_swap', label: 'Aadhaar Photo Swap', color: '#f87171', verdict: 'FORGED' },
  { id: 'degree_marks_tampered', label: 'Degree Marks Edit', color: '#f87171', verdict: 'FORGED' },
  { id: 'resume_exp_forged', label: 'Resume Forgery', color: '#facc15', verdict: 'SUSPICIOUS' },
  { id: 'cheque_sig_forged', label: 'Cheque Signature', color: '#f87171', verdict: 'FORGED' },
  { id: 'pan_authentic', label: 'Authentic PAN', color: '#4ade80', verdict: 'AUTHENTIC' },
  { id: 'passport_cloned', label: 'Passport Clone', color: '#f87171', verdict: 'FORGED' },
];

// ── Main App ─────────────────────────────────────────────
export default function App() {
  const [route, setRoute] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [registerOnChain, setRegisterOnChain] = useState(false);
  const [agentStatuses, setAgentStatuses] = useState({ ocr:'Standby', image:'Standby', sig:'Standby', decision:'Standby', gradcam:'Standby' });
  const fileInputRef = useRef();

  const simulateAgents = () => {
    const steps = [
      { d: 200,  u: { ocr: 'Active' } },
      { d: 700,  u: { image: 'Active' } },
      { d: 1400, u: { ocr: 'Done', sig: 'Active' } },
      { d: 2100, u: { image: 'Done', gradcam: 'Active' } },
      { d: 2800, u: { sig: 'Done', decision: 'Active' } },
      { d: 3600, u: { gradcam: 'Done', decision: 'Done' } },
    ];
    steps.forEach(({ d, u }) => setTimeout(() => setAgentStatuses(p => ({ ...p, ...u })), d));
  };

  const runScan = useCallback(async (scanFn) => {
    setError(null); setResult(null); setIsScanning(true); setScanProgress(0);
    setAgentStatuses({ ocr:'Standby', image:'Standby', sig:'Standby', decision:'Standby', gradcam:'Standby' });
    simulateAgents();

    let prog = 0;
    const iv = setInterval(() => { prog += 0.7; setScanProgress(Math.min(prog, 90)); if (prog >= 90) clearInterval(iv); }, 35);

    try {
      const data = await scanFn();
      clearInterval(iv); setScanProgress(100);
      setTimeout(() => { setResult(data); setIsScanning(false); }, 400);
    } catch (err) {
      clearInterval(iv); setIsScanning(false);
      setError(err.message);
    }
  }, []);

  const handleFile = useCallback((file) => {
    runScan(() => api.analyzeDocument(file, { runGradcam: true, registerBlockchain: registerOnChain }));
  }, [runScan, registerOnChain]);

  const handleDemo = useCallback((presetId) => {
    runScan(() => api.getDemoResult(presetId));
  }, [runScan]);

  const gp = (key) => {
    const s = agentStatuses[key];
    return s === 'Done' ? 100 : s === 'Active' ? Math.min(scanProgress * 1.3, 90) : 0;
  };
  const gs = (key) => result?.agent_scores?.[{ ocr:'ocr_text', image:'image_forensics', sig:'signature' }[key]];

  if (route === 'landing') {
    return <LandingPage onStart={() => setRoute('login')} />;
  }

  if (route === 'login') {
    return <LoginPage onLogin={() => setRoute('app')} onSignUp={() => setRoute('signup')} />;
  }

  if (route === 'signup') {
    return <SignUpPage onSignUp={() => setRoute('login')} onSignIn={() => setRoute('login')} />;
  }

  return (
    <div className="app-layout tactical-grid radar-scan">

      {/* ── SIDEBAR ── */}
      <aside className="sidebar glass-panel">
        <div style={{ padding: '20px 16px 14px' }}>
          <button
            onClick={() => setRoute('landing')}
            title="Back to Landing Page"
            style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left', transition: 'opacity 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <div style={{ padding: 7, background: 'rgba(0,245,255,.1)', borderRadius: 9, border: '1px solid rgba(0,245,255,.2)', flexShrink: 0 }}>
              <Shield style={{ width: 19, height: 19, color: '#00F5FF' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff' }}>
                ForenSight <span style={{ color: '#00F5FF' }}>AI</span>
              </h1>
              <p style={{ fontSize: '0.48rem', color: '#3f3f46', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Forensic Suite v2.0
              </p>
            </div>
          </button>
          <div style={{ height: 1, background: 'rgba(55,65,81,.5)' }} />
        </div>

        <nav style={{ padding: '4px 9px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab==='dashboard'} onClick={() => setActiveTab('dashboard')} />
          <SidebarItem icon={Scan} label="Document Scan" active={activeTab==='scan'} onClick={() => setActiveTab('scan')} />
          <SidebarItem icon={History} label="Evidence Log" active={activeTab==='logs'} onClick={() => setActiveTab('logs')} />
          <SidebarItem icon={Database} label="Archive" active={activeTab==='archive'} onClick={() => setActiveTab('archive')} />
          <div style={{ height: 1, background: 'rgba(55,65,81,.35)', margin: '6px 4px' }} />
          <SidebarItem icon={Settings} label="System Config" active={activeTab==='settings'} onClick={() => setActiveTab('settings')} />
        </nav>

        {/* Demo Presets — Phase 7 */}
        <div style={{ padding: '8px 12px 10px' }}>
          <div style={{ fontSize: '0.48rem', color: '#3f3f46', letterSpacing: '0.15em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono',monospace", padding: '2px 2px 7px' }}>
            🎬 Demo Presets (Phase 7)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {DEMO_PRESETS.map(p => (
              <button key={p.id} onClick={() => handleDemo(p.id)} disabled={isScanning}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 9px', background: 'rgba(0,0,0,.2)', border: '1px solid rgba(55,65,81,.35)', borderRadius: 7, cursor: 'pointer', transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = `${p.color}0a`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(55,65,81,.35)'; e.currentTarget.style.background = 'rgba(0,0,0,.2)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Play style={{ width: 9, height: 9, color: p.color }} />
                  <span style={{ fontSize: '0.6rem', color: '#71717a' }}>{p.label}</span>
                </div>
                <span style={{ fontSize: '0.48rem', color: p.color, fontFamily: "'JetBrains Mono',monospace" }}>{p.verdict}</span>
              </button>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div style={{ padding: '0 12px 16px', marginTop: 'auto' }}>
          <div style={{ padding: 11, background: 'rgba(0,0,0,.3)', border: '1px solid rgba(55,65,81,.4)', borderRadius: 11 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 }}>
              <Cpu style={{ width: 11, height: 11, color: '#00F5FF' }} />
              <span style={{ fontSize: '0.5rem', fontFamily: "'JetBrains Mono',monospace", color: '#00F5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System</span>
            </div>
            {[['Node', '■ Online', '#4ade80'], ['Phase 5', 'Grad-CAM ✓', '#00F5FF'], ['Phase 7', 'Demo+Chain ✓', '#00F5FF'], ['Model', 'ForenNet v2', '#a78bfa']].map(([k,v,c]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span style={{ fontSize: '0.57rem', color: '#52525b' }}>{k}</span>
                <span style={{ fontSize: '0.57rem', color: c }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content" style={{ position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, padding: '0 4px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 3 }}>Main Terminal</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80', animation: 'pulse-cyan 2s infinite' }} />
              <span style={{ fontSize: '0.58rem', fontFamily: "'JetBrains Mono',monospace", color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Monitoring · Phase 5+7 Active</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <button className="glass-panel" style={{ padding: 8, border: 'none', cursor: 'pointer', position: 'relative', borderRadius: 8 }}>
              <Bell style={{ width: 15, height: 15, color: '#71717a' }} />
              <span style={{ position: 'absolute', top: 6, right: 6, width: 5, height: 5, background: '#00F5FF', borderRadius: '50%', border: '2px solid #0A0E14', display: 'block' }} />
            </button>
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#00F5FF,#0066ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: '0.6rem' }}>AX</div>
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#e4e4e7' }}>Operator 001</div>
                <div style={{ fontSize: '0.58rem', color: '#52525b' }}>Senior Forensic Lead</div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 11, marginBottom: 16 }}>
          {[
            { l: 'Scans Today', v: '1,284', c: '#00F5FF', i: Scan },
            { l: 'Forgeries', v: '342', c: '#f87171', i: Zap },
            { l: 'Accuracy', v: '99.8%', c: '#00F5FF', i: BrainCircuit },
            { l: 'Grad-CAM', v: 'Phase 5', c: '#a78bfa', i: Eye },
            { l: 'Blockchain', v: 'Phase 7', c: '#4ade80', i: Lock },
          ].map(({ l, v, c, i: Icon }) => (
            <div key={l} className="glass-panel" style={{ padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon style={{ width: 12, height: 12, color: c }} />
                <span style={{ fontSize: '0.55rem', fontFamily: "'JetBrains Mono',monospace", color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</span>
              </div>
              <div style={{ fontSize: '1.2rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#fff' }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto' }} className="custom-scrollbar">

          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Upload */}
            <div className="glass-panel" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle,rgba(0,245,255,.05) 0%,transparent 70%)', pointerEvents: 'none' }} />

              {error && (
                <div style={{ padding: 10, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 9, marginBottom: 14, fontSize: '0.7rem', color: '#f87171' }}>⚠️ {error}</div>
              )}

              <div className="upload-zone"
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                style={isDragOver ? { borderColor: '#00F5FF', background: 'rgba(0,245,255,.03)' } : {}}
                onClick={() => !isScanning && fileInputRef.current?.click()}
              >
                <input ref={fileInputRef} type="file" hidden accept="image/*,.pdf" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
                <motion.div whileHover={{ scale: 1.05 }} style={{ padding: 16, borderRadius: '50%', background: 'rgba(0,245,255,.07)', border: '1px solid rgba(0,245,255,.15)', marginBottom: 14 }}>
                  <Upload style={{ width: 28, height: 28, color: '#00F5FF' }} />
                </motion.div>
                <h3 style={{ fontSize: '0.95rem', marginBottom: 5, fontWeight: 600 }}>Initialize Forensic Scan</h3>
                <p style={{ fontSize: '0.7rem', color: '#52525b', marginBottom: 18, textAlign: 'center', maxWidth: 340, lineHeight: 1.6 }}>
                  Upload Aadhaar, certificates, PAN cards, or resumes (JPG, PNG, PDF). Grad-CAM XAI + ELA forensics applied automatically.
                </p>

                {/* Blockchain toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 16 }}
                  onClick={e => { e.stopPropagation(); setRegisterOnChain(!registerOnChain); }}>
                  <div style={{ width: 28, height: 15, borderRadius: 99, background: registerOnChain ? '#00F5FF' : 'rgba(55,65,81,.6)', cursor: 'pointer', position: 'relative', transition: 'background .2s', border: '1px solid rgba(55,65,81,.6)' }}>
                    <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#fff', position: 'absolute', top: 1, left: registerOnChain ? 15 : 1, transition: 'left .2s' }} />
                  </div>
                  <span style={{ fontSize: '0.65rem', color: registerOnChain ? '#00F5FF' : '#52525b', cursor: 'pointer' }}>Register on Blockchain Ledger</span>
                </div>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-primary"
                  onClick={e => { e.stopPropagation(); !isScanning && fileInputRef.current?.click(); }} disabled={isScanning}>
                  {isScanning
                    ? <><Activity style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> Running Agents...</>
                    : <><Fingerprint style={{ width: 13, height: 13 }} /> Command Upload</>}
                </motion.button>
              </div>

              <AnimatePresence>
                {isScanning && (
                  <motion.div initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.58rem', fontFamily: "'JetBrains Mono',monospace", color: '#00F5FF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Bit-Scan + Grad-CAM In Progress</span>
                      <span style={{ fontSize: '0.58rem', fontFamily: "'JetBrains Mono',monospace", color: '#00F5FF' }}>{Math.floor(scanProgress)}%</span>
                    </div>
                    <div className="progress-track" style={{ height: 5 }}>
                      <motion.div className="progress-fill" animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.1 }} style={{ height: '100%' }} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Agent Monitor — 5 agents now */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9 }}>
                <Zap style={{ width: 12, height: 12, color: '#00F5FF' }} />
                <span style={{ fontSize: '0.58rem', fontFamily: "'JetBrains Mono',monospace", color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Multi-Agent Pipeline (Phase 1–6)</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 9 }}>
                <AgentCard agent="OCR Parse" status={agentStatuses.ocr} progress={gp('ocr')} score={gs('ocr')} />
                <AgentCard agent="Forensic ELA" status={agentStatuses.image} progress={gp('image')} score={gs('image')} />
                <AgentCard agent="Signature ORB" status={agentStatuses.sig} progress={gp('sig')} score={gs('sig')} />
                <AgentCard agent="Grad-CAM XAI" status={agentStatuses.gradcam} progress={gp('gradcam')} />
                <AgentCard agent="Decision Engine" status={agentStatuses.decision} progress={gp('decision')} />
              </div>
            </div>

            {/* Results */}
            <AnimatePresence>
              {result && <ResultsPanel result={result} />}
            </AnimatePresence>

            {/* Logs */}
            <div className="glass-panel custom-scrollbar" style={{ padding: 16, maxHeight: 160, overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Terminal style={{ width: 12, height: 12, color: '#00F5FF' }} />
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Real-Time Logs</span>
                </div>
                <span style={{ fontSize: '0.52rem', fontFamily: "'JetBrains Mono',monospace", color: '#3f3f46' }}>Buffer: 1024KB</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className="log-line"><span className="log-time">[INIT]</span><span>ForenNet v2 kernels online. Phases 1-7 active.</span></div>
                <div className="log-line"><span className="log-time">[P5]</span><span>ResNet50 Grad-CAM engine loaded. CUDA: {typeof window !== 'undefined' ? 'auto-detect' : 'N/A'}</span></div>
                <div className="log-line"><span className="log-time">[P7]</span><span>6 demo presets loaded. Blockchain ledger: ready.</span></div>
                {isScanning && <div className="log-line log-active"><span className="log-time">[NOW]</span><span style={{ animation: 'pulse-cyan 1s infinite' }}>Forensic pipeline + Grad-CAM executing...</span></div>}
                {result && (
                  <div className="log-line" style={{ color: result.verdict==='FORGED' ? '#f87171' : result.verdict==='AUTHENTIC' ? '#4ade80' : '#facc15' }}>
                    <span className="log-time">[RESULT]</span>
                    <span>VERDICT: {result.verdict} | Score: {result.composite_integrity_score?.toFixed(1)} | {result.case_id}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="glass-panel custom-scrollbar" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, maxHeight: 380 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <History style={{ width: 12, height: 12, color: '#00F5FF' }} />
                <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Archive</span>
              </div>
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[
                  { id:'D001', name:'Aadhaar_Rajesh.jpg', type:'Aadhaar', v:'TAMPERED' },
                  { id:'D002', name:'BTech_VTU_2021.pdf', type:'Certificate', v:'TAMPERED' },
                  { id:'D003', name:'Resume_Arjun.pdf', type:'Resume', v:'SUSPICIOUS' },
                  { id:'D004', name:'HDFC_Cheque.jpg', type:'Cheque', v:'TAMPERED' },
                  { id:'D005', name:'PAN_Priya.jpg', type:'PAN', v:'SECURE' },
                  { id:'D006', name:'Passport_P1234.jpg', type:'Passport', v:'TAMPERED' },
                ].map(item => (
                  <motion.div key={item.id} whileHover={{ x: 2 }}
                    style={{ padding: 9, border: '1px solid rgba(55,65,81,.45)', borderRadius: 9, cursor: 'pointer', background: 'rgba(0,0,0,.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: '0.52rem', fontFamily: "'JetBrains Mono',monospace", color: '#3f3f46' }}>#{item.id}</span>
                      <span className={item.v==='SECURE' ? 'badge-secure' : item.v==='SUSPICIOUS' ? 'badge-active' : 'badge-tampered'}>{item.v}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 27, height: 27, borderRadius: 6, background: 'rgba(55,65,81,.3)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileSearch style={{ width: 13, height: 13, color: '#52525b' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.67rem', fontWeight: 600, color: '#d4d4d8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                        <div style={{ fontSize: '0.52rem', color: '#52525b' }}>{item.type}</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Precision */}
            <div className="glass-panel" style={{ padding: 16, background: 'linear-gradient(135deg,rgba(0,245,255,.05) 0%,rgba(17,24,39,.5) 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                <div style={{ padding: 8, background: '#00F5FF', borderRadius: 8, flexShrink: 0 }}>
                  <BrainCircuit style={{ width: 14, height: 14, color: '#000' }} />
                </div>
                <div>
                  <div style={{ fontSize: '0.5rem', fontFamily: "'JetBrains Mono',monospace", color: '#00F5FF', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>Global Precision</div>
                  <div style={{ fontSize: '1.5rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, lineHeight: 1 }}>99.82%</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 3 }}>
                {[...Array(10)].map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 99, background: i < 9 ? '#00F5FF' : 'rgba(0,245,255,.15)', boxShadow: i < 9 ? '0 0 4px rgba(0,245,255,.3)' : 'none' }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

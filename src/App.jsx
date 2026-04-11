import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload, Shield, FileSearch, Fingerprint, Activity,
  Terminal, History, LayoutDashboard, Settings, Bell,
  ChevronRight, BrainCircuit, Scan, Database, Zap,
  CheckCircle, XCircle, AlertTriangle, Link, Play, Cpu, Eye, Lock, Globe, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from './services/api';
import LandingPage from './LandingPage.jsx';

// ── Helpers ──────────────────────────────────────────────
const scoreColor = (s) => s > 65 ? '#4ade80' : s > 45 ? '#facc15' : '#f87171';

const getVerdictConfig = (verdict) => {
  const v = (verdict || '').toUpperCase();
  const cfg = {
    REAL:       { bg: 'rgba(74,222,128,.1)', color: '#4ade80', border: 'rgba(74,222,128,.3)', icon: CheckCircle, label: 'REAL' },
    AUTHENTIC:  { bg: 'rgba(74,222,128,.1)', color: '#4ade80', border: 'rgba(74,222,128,.3)', icon: CheckCircle, label: 'AUTHENTIC' },
    SUSPICIOUS: { bg: 'rgba(250,204,21,.1)', color: '#facc15', border: 'rgba(250,204,21,.3)', icon: AlertTriangle, label: 'SUSPICIOUS' },
    FAKE:       { bg: 'rgba(248,113,113,.1)', color: '#f87171', border: 'rgba(248,113,113,.3)', icon: XCircle, label: 'FAKE' },
    FORGED:     { bg: 'rgba(248,113,113,.1)', color: '#f87171', border: 'rgba(248,113,113,.3)', icon: XCircle, label: 'FORGED' }
  };
  return cfg[v] || { bg: 'rgba(100,100,100,.1)', color: '#aaa', border: 'rgba(100,100,100,.3)', icon: AlertTriangle, label: 'UNKNOWN' };
};

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
  const cfg = getVerdictConfig(verdict);
  const Icon = cfg.icon;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 14px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 9 }}>
      <Icon style={{ width: 17, height: 17, color: cfg.color }} />
      <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: '1rem', color: cfg.color, letterSpacing: '0.05em' }}>{cfg.label}</span>
    </div>
  );
};

const StatMini = ({ label, value, color = '#00F5FF' }) => (
  <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,.25)', border: '1px solid rgba(55,65,81,.4)', borderRadius: 10 }}>
    <div style={{ fontSize: '0.55rem', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{label}</div>
    <div style={{ fontSize: '1.3rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color }}>{value}</div>
  </div>
);

const SectionHeader = ({ icon: Icon, title, sub }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <Icon size={20} color="#00F5FF" />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{title}</h2>
    </div>
    <p style={{ fontSize: '0.75rem', color: '#52525b', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase', letterSpacing: '0.1em' }}>{sub}</p>
  </div>
);

const Menu = ({ style, ...props }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style} {...props}>
    <line x1="3" y1="12" x2="21" y2="12"></line>
    <line x1="3" y1="6" x2="21" y2="6"></line>
    <line x1="3" y1="18" x2="21" y2="18"></line>
  </svg>
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
              left: `${(r.x / (gradcam.width || 700)) * 100}%`, top: `${(r.y / (gradcam.height || 500)) * 100}%`,
              width: `${(r.w / (gradcam.width || 700)) * 100}%`, height: `${(r.h / (gradcam.height || 500)) * 100}%`,
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
            {(result.composite_integrity_score || 0).toFixed(1)}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
            {Object.entries(result.breakdown || {}).map(([key, score]) => {
              const names = { 
                ocr: '📝 OCR', 
                ela: '🔬 ELA', 
                orb: '✍️ SIGN',
                xai: '🧠 NEURAL',
                ledger: '🔗 BLOCK'
              };
              const displayScore = gs(key);
              return (
                <div key={key} style={{ padding: 10, background: 'rgba(0,0,0,.3)', border: '1px solid rgba(55,65,81,.4)', borderRadius: 10 }}>
                  <div style={{ fontSize: '0.55rem', color: '#52525b', marginBottom: 5, textTransform:'uppercase' }}>{names[key] || key}</div>
                  <div style={{ fontSize: '1.2rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: scoreColor(displayScore) }}>{(displayScore).toFixed(1)}%</div>
                  <div style={{ marginTop: 6 }} className="progress-track">
                    <div className="progress-fill" style={{ width: `${score}%`, background: scoreColor(score), boxShadow: 'none' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expert Reason */}
          {result.reason && (
             <div style={{ padding: 14, background: 'rgba(0,245,255,.05)', border: '1px solid rgba(0,245,255,.2)', borderRadius: 12, marginBottom: 16 }}>
                 <div style={{ fontSize: '0.62rem', color: '#00F5FF', fontFamily: 'JetBrains Mono, monospace', marginBottom: 6, textTransform: 'uppercase' }}>Expert Forensic Narrative</div>
                 <p style={{ fontSize: '0.82rem', color: '#d4d4d8', lineHeight: 1.5, fontWeight: 500 }}>{result.reason}</p>
             </div>
          )}
          {/* Grad-CAM integrity mini */}
          {result.gradcam?.gradcam_integrity_score !== undefined && (
            <div style={{ padding: 12, background: 'rgba(0,245,255,.03)', border: '1px solid rgba(0,245,255,.1)', borderRadius: 10, marginBottom: 12 }}>
              <div style={{ fontSize: '0.6rem', color: '#00F5FF', fontFamily: "'JetBrains Mono',monospace", marginBottom: 6 }}>🧠 GRAD-CAM (RESNET50)</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <StatMini label="Grad-CAM Score" value={`${(result.gradcam.gradcam_integrity_score || 0).toFixed(1)}%`} color={scoreColor(result.gradcam.gradcam_integrity_score)} />
                <StatMini label="Hotspots" value={result.gradcam.hotspot_regions?.length || 0} color="#facc15" />
                <StatMini label="CNN Confidence" value={`${(result.gradcam.cnn_confidence || 0).toFixed(1)}%`} />
              </div>
            </div>
          )}
          {/* XAI Explanations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(result.xai_explanations || []).map((exp, i) => {
              const IsSummary = exp.includes('SUMMARY:');
              const IsRec = exp.includes('RECOMMENDATION:');
              const isPixel = exp.includes('PIXEL');
              const isOCR = exp.includes('OCR');
              const isSig = exp.includes('SIGNATURE');
              
              let bgColor = 'rgba(0,0,0,.25)';
              let borderColor = 'rgba(55,65,81,.35)';
              let textColor = '#a1a1aa';

              if (IsSummary) {
                bgColor = 'rgba(0,245,255,.04)';
                borderColor = 'rgba(0,245,255,.2)';
                textColor = '#e4e4e7';
              } else if (IsRec) {
                bgColor = 'rgba(167,139,250,.04)';
                borderColor = 'rgba(167,139,250,.2)';
              }

              return (
                <div key={i} style={{ 
                  padding: IsSummary ? '14px 16px' : '10px 14px', 
                  background: bgColor, 
                  border: `1px solid ${borderColor}`, 
                  borderRadius: 12, 
                  fontSize: IsSummary ? '0.8rem' : '0.73rem', 
                  color: textColor, 
                  lineHeight: 1.6,
                  fontWeight: IsSummary ? 600 : 400,
                  boxShadow: IsSummary ? '0 4px 12px rgba(0,245,255,0.03)' : 'none'
                }}>
                  {exp}
                </div>
              );
            })}
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState('ALL');
  const [liveStats, setLiveStats] = useState({ 
    scans: 1284, 
    forgeries: 342, 
    integrity: 99.8, 
    packets: [] 
  });
  const [terminalLogs, setTerminalLogs] = useState([
    { t: new Date().toLocaleTimeString(), m: 'Kernels online. Awaiting data packets.', s: 'SYS' },
    { t: new Date().toLocaleTimeString(), m: 'Neural node handshake... SECURE', s: 'NET' }
  ]);
  const [systemHealth, setSystemHealth] = useState({ gpu: 34, ram: 52, neural: 12 });
  const fileInputRef = useRef();
  const timersRef = useRef([]);

  // Live monitor simulation (Network traffic only, no random jumps for core stats)
  useEffect(() => {
    const iv = setInterval(() => {
      setLiveStats(prev => {
        const packetId = Math.random().toString(36).substring(7).toUpperCase();
        const action = ['GET', 'POST', 'SYNC', 'SCAN', 'PARSE'][Math.floor(Math.random() * 5)];
        
        // Random network traffic logs (keep for aesthetic)
        if (Math.random() > 0.8) {
           setTerminalLogs(logs => [
             { t: new Date().toLocaleTimeString(), m: `Cluster node ${Math.floor(Math.random()*9)} heartbeat: OK`, s: 'NET' },
             ...logs
           ].slice(0, 50));
        }

        return {
          ...prev,
          integrity: 99.92 + (Math.random() * 0.05),
          packets: [{ id: packetId, action, time: new Date().toLocaleTimeString() }, ...prev.packets].slice(0, 5)
        };
      });

      setSystemHealth({
        gpu: Math.floor(Math.random() * 15) + (isScanning ? 60 : 25),
        ram: Math.floor(Math.random() * 5) + (isScanning ? 70 : 50),
        neural: isScanning ? Math.floor(Math.random() * 40) + 50 : Math.floor(Math.random() * 10) + 5
      });
    }, 5000);
    return () => clearInterval(iv);
  }, [isScanning]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
    };
  }, []);

  const simulateAgents = () => {
    // Clear previous timers
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    const steps = [
      { d: 200,  u: { ocr: 'Active' } },
      { d: 700,  u: { image: 'Active' } },
      { d: 1100, u: { ocr: 'Done', sig: 'Active' } },
      { d: 1800, u: { image: 'Done', gradcam: 'Active' } },
      { d: 2400, u: { sig: 'Done', decision: 'Active' } },
      { d: 3000, u: { gradcam: 'Done' } },
      { d: 3400, u: { decision: 'Done' } },
    ];
    steps.forEach(({ d, u }) => {
      const t = setTimeout(() => setAgentStatuses(p => ({ ...p, ...u })), d);
      timersRef.current.push(t);
    });
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
      setTimeout(() => { 
        setResult(data); 
        setIsScanning(false);
        // Realistic stat update
        setLiveStats(prev => ({
          ...prev,
          scans: prev.scans + 1,
          forgeries: (data.verdict === 'FAKE' || data.verdict === 'SUSPICIOUS') ? prev.forgeries + 1 : prev.forgeries
        }));
      }, 400);
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

  const gs = (key) => {
    if (!result) return 0;
    // Multi-key mapping to handle various backend versions
    const map = { 
      ocr: ['ocr', 'ocr_score', 'ocr_integrity'], 
      image: ['ela', 'ela_score', 'image_forensics_score', 'image'], 
      sig: ['orb', 'orb_score', 'signature_score', 'sig'], 
      gradcam: ['xai', 'xai_score', 'neural_analysis_score', 'gradcam'], 
      decision: ['ledger', 'ledger_score', 'blockchain_score', 'decision'] 
    };
    
    const possibleKeys = map[key] || [];
    for (const k of possibleKeys) {
      // Check in breakdown
      if (result.breakdown?.[k] !== undefined) return parseFloat(result.breakdown[k]);
      // Check in agent_scores
      if (result.agent_scores?.[k] !== undefined) return parseFloat(result.agent_scores[k]);
      // Check in flat result
      if (result[k] !== undefined) return parseFloat(result[k]);
    }
    
    // Fallback for visual stability
    return result.agent_scores?.[key] || 0;
  };

  const gp = (key) => {
    if (agentStatuses[key] === 'Done') {
      return gs(key); // Show actual integrity score when done
    }
    if (agentStatuses[key] === 'Active') return Math.max(15, scanProgress);
    return 0;
  };

  if (route === 'landing') {
    return <LandingPage onStart={() => setRoute('dashboard')} />;
  }

  return (
    <div className="app-layout tactical-grid radar-scan">

      {/* ── SIDEBAR ── */}
      <aside className={`sidebar glass-panel ${mobileMenuOpen ? 'mobile-open' : ''}`}>
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
          <SidebarItem icon={Globe} label="Network Monitor" active={activeTab==='network'} onClick={() => setActiveTab('network')} />
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
          <div style={{ padding: 14, background: 'rgba(0,0,0,.3)', border: '1px solid rgba(55,65,81,.4)', borderRadius: 14, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg,rgba(0,245,255,.02) 0%,transparent 100%)', pointerEvents: 'none' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cpu style={{ width: 12, height: 12, color: '#00F5FF' }} />
                <span style={{ fontSize: '0.55rem', fontFamily: "'JetBrains Mono',monospace", color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Neural Sync</span>
              </div>
              <div style={{ display: 'flex', gap: 2 }}>
                 {[...Array(3)].map((_,i) => <div key={i} style={{ width: 3, height: 3, borderRadius: '50%', background: '#4ade80', animation: `pulse-cyan 1.5s infinite ${i*0.3}s` }} />)}
              </div>
            </div>
            {[['Core Node', 'ONLINE', '#4ade80'], ['XAI Engine', 'READY', '#00F5FF'], ['Ledger P7', 'LOCKED', '#a78bfa'], ['Latency', '2ms', '#00f5ff']].map(([k,v,c]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.55rem', color: '#52525b', fontFamily: 'JetBrains Mono, monospace' }}>{k}</span>
                <span style={{ fontSize: '0.55rem', color: c, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="main-content" style={{ position: 'relative', zIndex: 1, paddingTop: 10 }}>
        
        {/* Header removed for cleaner UI */}

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 11, marginBottom: 16 }}>
          {[
            { l: 'Scans Today', v: liveStats.scans.toLocaleString(), c: '#00F5FF', i: Scan },
            { l: 'Forgeries Found', v: liveStats.forgeries.toLocaleString(), c: '#f87171', i: Zap },
            { l: 'Detection Rate', v: `${liveStats.integrity.toFixed(2)}%`, c: '#4ade80', i: BrainCircuit },
            { l: 'Forensic Nodes', v: '5/5 ONLINE', c: '#a78bfa', i: Eye },
            { l: 'Ledger Status', v: 'VERIFIED', c: '#4ade80', i: Lock },
          ].map(({ l, v, c, i: Icon }) => (
            <motion.div key={l} whileHover={{ translateY: -2, boxShadow: `0 8px 24px ${c}11` }} className="glass-panel" style={{ padding: 14, overflow: 'hidden', position: 'relative', borderTop: `2px solid ${c}44` }}>
               <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: 2, background: `linear-gradient(90deg, transparent, ${c})`, opacity: 0.3 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Icon style={{ width: 12, height: 12, color: c }} />
                <span style={{ fontSize: '0.55rem', fontFamily: "'JetBrains Mono',monospace", color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</span>
              </div>
              <div style={{ fontSize: '1.25rem', fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, color: '#fff', textShadow: `0 0 10px ${c}22` }}>{v}</div>
            </motion.div>
          ))}
        </div>

        {/* Tab Content Wrapper */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          
          {activeTab === 'dashboard' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 310px', gap: 16, flex: 1, minHeight: 0, overflowY: 'auto' }} className="custom-scrollbar">
              {/* Left */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Upload Zone */}
                <div className="glass-panel glow-pulse" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle,rgba(0,245,255,.05) 0%,transparent 70%)', pointerEvents: 'none' }} />
                  {error && <div style={{ padding: 10, background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 9, marginBottom: 14, fontSize: '0.7rem', color: '#f87171' }}>⚠️ {error}</div>}
                  <div className={`upload-zone ${isScanning ? 'radar-scan' : ''}`} onClick={() => !isScanning && fileInputRef.current?.click()}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
                    style={{
                       ...(isDragOver ? { borderColor: '#00F5FF', background: 'rgba(0,245,255,.03)' } : {}),
                       position: 'relative',
                       minHeight: 220
                    }}>
                    {isScanning && <div className="scanner-laser" />}
                    <input ref={fileInputRef} type="file" hidden accept="image/*,.pdf" onChange={e => e.target.files[0] && handleFile(e.target.files[0])} />
                    <motion.div animate={isScanning ? { scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] } : {}} transition={{ repeat: Infinity, duration: 2 }} style={{ padding: 16, borderRadius: '50%', background: 'rgba(0,245,255,.07)', border: '1px solid rgba(0,245,255,.15)', marginBottom: 14 }}><Upload style={{ width: 28, height: 28, color: '#00F5FF' }} /></motion.div>
                    <h3 style={{ fontSize: '0.95rem', marginBottom: 5, fontWeight: 600 }}>{isScanning ? 'Scanning Bitstream...' : 'Forensic Node Initialize'}</h3>
                    <p style={{ fontSize: '0.65rem', color: '#52525b', textAlign: 'center', maxWidth: 320 }}>{isScanning ? 'Deconstructing document structure and checking for pixel-level anomalies' : 'Drag files or click to initiate bit-by-bit scanning.'}</p>
                  </div>
                  <AnimatePresence>
                    {isScanning && (
                      <motion.div initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginTop: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.58rem', fontFamily: "'JetBrains Mono',monospace", color: '#00F5FF', textTransform: 'uppercase' }}>Scan In Progress...</span>
                          <span style={{ fontSize: '0.58rem', fontFamily: "'JetBrains Mono',monospace", color: '#00F5FF' }}>{Math.floor(scanProgress)}%</span>
                        </div>
                        <div className="progress-track" style={{ height: 4 }}><motion.div className="progress-fill" animate={{ width: `${scanProgress}%` }} transition={{ duration: 0.1 }} /></div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Options */}
                  {!isScanning && (
                    <div style={{ display: 'flex', gap: 14, marginTop: 15, justifyContent: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', opacity: 0.8 }}>
                        <input type="checkbox" checked={registerOnChain} onChange={e => setRegisterOnChain(e.target.checked)} style={{ accentColor: '#00F5FF' }} />
                        <span style={{ fontSize: '0.62rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Register on Blockchain</span>
                      </label>
                       <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', opacity: 0.8 }}>
                        <input type="checkbox" checked={true} readOnly style={{ accentColor: '#a78bfa' }} />
                        <span style={{ fontSize: '0.62rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>DeepXAI Analysis</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Agents */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 9 }}>
                  <AgentCard agent="OCR" status={agentStatuses.ocr} progress={gp('ocr')} score={gs('ocr')} />
                  <AgentCard agent="ELA" status={agentStatuses.image} progress={gp('image')} score={gs('image')} />
                  <AgentCard agent="ORB" status={agentStatuses.sig} progress={gp('sig')} score={gs('sig')} />
                  <AgentCard agent="XAI" status={agentStatuses.gradcam} progress={gp('gradcam')} />
                  <AgentCard agent="LEDGER" status={agentStatuses.decision} progress={gp('decision')} />
                </div>

                {/* Results/Logs */}
                <AnimatePresence>{result && <ResultsPanel result={result} />}</AnimatePresence>
                <div className="glass-panel" style={{ padding: 14, height: 140, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div style={{ fontSize: '0.6rem', color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Telemetry Terminal Output</div>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', animation: 'pulse-cyan 2s infinite' }} />
                  </div>
                  <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {isScanning && <div className="log-line log-active"><span>[DMA]</span><span>Bitstream analysis executing...</span></div>}
                    {result && <div className="log-line" style={{ color: scoreColor(result.composite_integrity_score) }}><span>[VER]</span><span>CASE_{result.case_id} COMPLETED // {result.verdict}</span></div>}
                    {terminalLogs.map((log, index) => (
                      <div key={index} className="log-line" style={{ fontSize: '0.62rem' }}>
                        <span style={{ color: '#3f3f46', marginRight: 8 }}>[{log.t}]</span>
                        <span style={{ color: log.s === 'SYS' ? '#00f5ff' : '#52525b', marginRight: 8 }}>[{log.s}]</span>
                        <span style={{ color: '#a1a1aa' }}>{log.m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="glass-panel custom-scrollbar" style={{ padding: 16, flex: 1, maxHeight: 400, overflowY: 'auto' }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <History size={12} color="#00F5FF" /> Recent Ledger Hits
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[{ id:'D01', n:'Aadhaar_X.png', v:'FORGED' }, { id:'D02', n:'MTech_VTU.pdf', v:'SECURE' }, { id:'D03', n:'Sign_Scan.jpg', v:'TAMPERED' }].map(it => (
                      <div key={it.id} style={{ padding: 10, background: 'rgba(255,255,255,.02)', borderRadius: 10, border: '1px solid rgba(255,255,255,.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '10px', fontWeight: 600 }}>{it.n}</span>
                          <span style={{ fontSize: '8px', color: it.v==='SECURE'?'#4ade80':'#f87171' }}>{it.v}</span>
                        </div>
                        <div style={{ fontSize: '8px', color: '#3f3f46' }}>ID: {it.id}1284_FS</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* System Health Component */}
                <div className="glass-panel" style={{ padding: 18 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
                      <Cpu size={14} color="#00F5FF" />
                      <span style={{ fontSize: '0.6rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Neural Node Health</span>
                   </div>
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {[
                        { l: 'GPU Load (RTX 4090)', v: systemHealth.gpu, c: '#00F5FF' },
                        { l: 'Neural Network Weighting', v: systemHealth.neural, c: '#a78bfa' },
                        { l: 'Memory Buffer', v: systemHealth.ram, c: '#4ade80' }
                      ].map(s => (
                        <div key={s.l}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.55rem', color: '#52525b', marginBottom: 4 }}>
                              <span>{s.l}</span>
                              <span style={{ color: s.c }}>{s.v}%</span>
                           </div>
                           <div className="progress-track" style={{ height: 3 }}>
                              <motion.div className="progress-fill" initial={{ width: 0 }} animate={{ width: `${s.v}%` }} style={{ background: s.c, boxShadow: `0 0 10px ${s.c}44` }} />
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="glass-panel" style={{ padding: 22, background: 'linear-gradient(135deg,rgba(0,245,255,.05),transparent)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: '0.55rem', color: '#00F5FF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Global Intelligence</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>{liveStats.integrity.toFixed(3)}%</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <div style={{ fontSize: '0.55rem', color: '#52525b', marginBottom: 4 }}>Uptime</div>
                       <div style={{ fontSize: '0.8rem', fontFamily: 'JetBrains Mono, monospace', color: '#4ade80' }}>99.999%</div>
                    </div>
                  </div>
                  
                  {/* Active Traffic Ticker */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,.05)', paddingTop: 12 }}>
                     <div style={{ fontSize: '0.5rem', color: '#3f3f46', marginBottom: 10, textTransform: 'uppercase' }}>Live Data Packets</div>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {liveStats.packets.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontFamily: 'JetBrains Mono, monospace' }}>
                             <span style={{ color: '#00F5FF' }}>PACKET_{p.id}</span>
                             <span style={{ color: '#52525b' }}>{p.action}</span>
                             <span style={{ color: '#3f3f46' }}>{p.time}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'network' && (
            <div className="glass-panel" style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SectionHeader icon={Globe} title="Global Forensic Triage" sub="Distributed neural processing and threat intelligence network" />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, flex: 1, minHeight: 0 }}>
                    {/* Live Map Visualization */}
                    <div className="glass-panel" style={{ position: 'relative', background: 'rgba(0,0,0,.4)', border: '1px solid rgba(0,245,255,.1)', overflow: 'hidden', padding: 0 }}>
                        <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 10 }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="pulse-cyan" style={{ width: 8, height: 8, borderRadius: '50%', background: '#00F5FF' }} />
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#fff', letterSpacing: '0.1em', fontFamily: 'JetBrains Mono' }}>CORE NETWORK TRAFFIC</span>
                           </div>
                           <div style={{ fontSize:'0.55rem', color:'#52525b', marginTop:4 }}>LATENCY: 14ms // ACTIVE_NODES: 128</div>
                        </div>
                        
                        {/* Map Grid Background */}
                        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, background: 'linear-gradient(90deg, #00F5FF 1px, transparent 1px) 0 0 / 40px 40px, linear-gradient(#00F5FF 1px, transparent 1px) 0 0 / 40px 40px' }} />
                        
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                             <svg viewBox="0 0 800 400" style={{ width: '92%', height: 'auto' }}>
                                {/* Data Flow Pathways */}
                                <path d="M150,220 L380,180 L650,250" fill="none" stroke="#00F5FF" strokeWidth="0.5" strokeDasharray="4,8" className="dash-move" opacity="0.4" />
                                <path d="M380,180 L420,100" fill="none" stroke="#f87171" strokeWidth="0.5" strokeDasharray="2,4" />
                                
                                {/* Major Forensic Hubs */}
                                {[
                                  {x:150, y:220, l:'Delhi-NCR Hub', s:'ONLINE', c:'#4ade80'}, 
                                  {x:380, y:180, l:'Central Triage (DB-01)', s:'SCANNING', c:'#00F5FF'}, 
                                  {x:650, y:250, l:'East Asia Edge', s:'STANDBY', c:'#71717a'},
                                  {x:420, y:100, l:'US-East Cluster', s:'THREAT_DETECTED', c:'#f87171'}
                                ].map((p,i) => (
                                  <g key={i}>
                                     <circle cx={p.x} cy={p.y} r="4" fill={p.c} />
                                     <circle cx={p.x} cy={p.y} r="12" fill="none" stroke={p.c} strokeWidth="1" className="ping-ring" style={{ animationDelay: `${i*0.8}s` }} opacity="0.5" />
                                     <text x={p.x+10} y={p.y-5} style={{ fill:'#fff', fontSize:10, fontWeight:700, fontFamily:'Space Grotesk' }}>{p.l}</text>
                                     <text x={p.x+10} y={p.y+8} style={{ fill:p.c, fontSize:7, fontFamily:'JetBrains Mono', fontWeight:600 }}>{p.s}</text>
                                  </g>
                                ))}
                             </svg>
                        </div>
                        
                        {/* Legend */}
                        <div style={{ position: 'absolute', bottom: 60, left: 20, display: 'flex', gap: 15 }}>
                           <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:6, height:6, background:'#4ade80', borderRadius:1 }} /><span style={{ fontSize:8, color:'#71717a' }}>SECURE HUB</span></div>
                           <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:6, height:6, background:'#f87171', borderRadius:1 }} /><span style={{ fontSize:8, color:'#71717a' }}>TAMPER ALERT</span></div>
                           <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:6, height:6, background:'#00F5FF', borderRadius:1 }} /><span style={{ fontSize:8, color:'#71717a' }}>ACTIVE PIPELINE</span></div>
                        </div>

                        {/* Live Log Ticker */}
                        <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,10,20,.8)', backdropFilter:'blur(10px)', padding: '10px 20px', borderTop: '1px solid rgba(0,245,255,.2)' }}>
                           <div style={{ display:'flex', gap:20, whiteSpace:'nowrap' }} className="ticker-animate">
                              <span style={{ fontSize: '0.65rem', color: '#00F5FF', fontFamily: 'JetBrains Mono' }}>[21:40] NODE_DELHI: VALIDATING_PASSPORT_B21... OK</span>
                              <span style={{ fontSize: '0.65rem', color: '#f87171', fontFamily: 'JetBrains Mono' }}>[21:42] NODE_US_EAST: ALERT_ANOMALY_IN_SIGNATURE_VECTOR</span>
                              <span style={{ fontSize: '0.65rem', color: '#4ade80', fontFamily: 'JetBrains Mono' }}>[21:44] BLOCKCHAIN_SYNC: BLOCK_HEIGHT_#88219_CONFIRMED</span>
                           </div>
                        </div>
                    </div>

                    {/* Threat Intelligence column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {/* Neural Performance Board */}
                        <div className="glass-panel" style={{ padding: 18, background: 'rgba(0,10,20,.6)' }}>
                           <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#fff', marginBottom: 15, display:'flex', alignItems:'center', gap:8 }}>
                               <BrainCircuit size={14} color="#00F5FF" /> NEURAL CLUSTER HEALTH
                           </div>
                           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {[
                                { n: 'OCR ENGINE (P-1)', v: 92, c: '#00F5FF' },
                                { n: 'ELA ANALYZER (P-2)', v: 74, c: '#4ade80' },
                                { n: 'ORB COMPARATOR (P-3)', v: 48, c: '#a78bfa' },
                                { n: 'NEURAL XAI (P-4)', v: 88, c: '#00F5FF' }
                              ].map(node => (
                                <div key={node.n}>
                                   <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                                      <span style={{ fontSize:'0.55rem', color:'#52525b', fontFamily:'JetBrains Mono' }}>{node.n}</span>
                                      <span style={{ fontSize:'0.55rem', color:node.c, fontWeight:800 }}>{node.v}%</span>
                                   </div>
                                   <div className="progress-track" style={{ height:4, background:'rgba(255,255,255,.05)' }}>
                                      <motion.div initial={{ width:0 }} animate={{ width:`${node.v}%` }} className="progress-fill" style={{ background:node.c, height:'100%', boxShadow: `0 0 10px ${node.c}44` }} />
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>

                        {/* Recent Threat Vectors */}
                        <div className="glass-panel" style={{ padding: 18, flex: 1, borderLeft:'2px solid rgba(248,113,113,.3)' }}>
                           <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f87171', marginBottom: 15, display:'flex', alignItems:'center', gap:8 }}>
                               <Zap size={14} color="#f87171" /> LIVE THREAT VECTORS
                           </div>
                           <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                              {[
                                { t: 'Synthetic Texture Injection', m: 'AI_DETECTION_P4' },
                                { t: 'MetaData Stripping Attack', m: 'HDR_FORENSICS' },
                                { t: 'Differential Sig-Tampering', m: 'ORB_MISMATCH' }
                              ].map((v, i) => (
                                <div key={i} style={{ padding:10, background:'rgba(248,113,113,.05)', border:'1px solid rgba(248,113,113,.15)', borderRadius:8 }}>
                                   <div style={{ fontSize:'0.65rem', color:'#f87171', fontWeight:700 }}>{v.t}</div>
                                   <div style={{ fontSize:'0.5rem', color:'#71717a', marginTop:3, fontFamily:'JetBrains Mono' }}>TRIGGERED: {v.m}</div>
                                </div>
                              ))}
                           </div>
                        </div>
                    </div>
                </div>
            </div>
          )}


          {activeTab === 'logs' && (
            <div className="glass-panel custom-scrollbar" style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
               <SectionHeader icon={Terminal} title="System Telemetry & Logs" sub="Real-time forensic agent communication" />
               <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                  {[...Array(12)].map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 16, padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,.03)' }}>
                      <span style={{ color: '#3f3f46' }}>[{new Date().toLocaleTimeString()}]</span>
                      <span style={{ color: '#a78bfa' }}>AGENT_0{i%6}:</span>
                      <span style={{ color: '#d4d4d8' }}>Packet analysis chunk_{i*2} verified with SHA-256... SUCCESS</span>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'archive' && (() => {
            const CASES = [
              { id:'FS-9821', file:'aadhaar_scan_67.pdf',    type:'National ID',  v:'AUTHENTIC',  s:98.2, tx:'0x8f2d...41b0', t:'10 Mar · 14:22', flags:0 },
              { id:'FS-9822', file:'degree_certificate.png', type:'Academic Doc', v:'FORGED',     s:22.4, tx:'0x1a9e...e932', t:'10 Mar · 15:45', flags:7 },
              { id:'FS-9823', file:'signature_v2.jpg',       type:'Signature',    v:'SUSPICIOUS', s:56.8, tx:'0x3c7b...fb12', t:'11 Mar · 09:12', flags:3 },
              { id:'FS-9824', file:'pan_card_verify.pdf',    type:'National ID',  v:'AUTHENTIC',  s:99.1, tx:'0x7e1a...22d8', t:'11 Mar · 11:30', flags:0 },
              { id:'FS-9825', file:'passport_bio.jpg',       type:'Travel Doc',   v:'AUTHENTIC',  s:97.4, tx:'0xf4b2...11c4', t:'12 Mar · 10:05', flags:0 },
              { id:'FS-9826', file:'rental_agreement.pdf',   type:'Legal Doc',    v:'FORGED',     s:18.2, tx:'0x0d22...a991', t:'12 Mar · 16:20', flags:9 },
            ];
            const filtered = archiveFilter === 'ALL' ? CASES : CASES.filter(c => c.v === archiveFilter);
            const vkey = v => v.toLowerCase();
            const dotColor = { AUTHENTIC:'#4ade80', FORGED:'#f87171', SUSPICIOUS:'#facc15' };
            const stripeGrad = { AUTHENTIC:'linear-gradient(180deg,#4ade80,transparent)', FORGED:'linear-gradient(180deg,#f87171,transparent)', SUSPICIOUS:'linear-gradient(180deg,#facc15,transparent)' };
            
            return (
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:14, minHeight:0, overflow:'hidden' }}>
                {/* ─── Header + Filters ─── */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, marginTop: 10 }}>
                  <div>
                    <div style={{ fontSize:'1rem', fontWeight:700, color:'#fff', marginBottom:4 }}>Forensic Evidence Ledger</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="synced-dot" />
                      <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.55rem', color:'#3f3f46' }}>
                        CHAIN_ID: ETH-MAINNET · BLOCK: 19,482,311 · LEDGER SYNCED
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {['ALL','FORGED','SUSPICIOUS','AUTHENTIC'].map(f => (
                      <button key={f} onClick={() => setArchiveFilter(f)} style={{
                        fontSize:'0.5rem', padding:'5px 14px', borderRadius:7,
                        border:'1px solid',
                        borderColor: archiveFilter === f ? '#00F5FF' : 'rgba(55,65,81,.4)',
                        background: archiveFilter === f ? 'rgba(0,245,255,.08)' : 'transparent',
                        color: archiveFilter === f ? '#00F5FF' : '#52525b',
                        cursor:'pointer', textTransform:'uppercase', letterSpacing:'0.1em', transition:'all .2s',
                      }}>{f}</button>
                    ))}
                  </div>
                </div>

                {/* ─── Case Rows ─── */}
                <div className="custom-scrollbar" style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:8, paddingRight:4, paddingBottom:8 }}>
                  {filtered.length === 0 ? (
                    <div style={{ textAlign:'center', padding:'60px 0', color:'#3f3f46', fontFamily:'JetBrains Mono,monospace', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.15em' }}>
                      No cases match filter: {archiveFilter}
                    </div>
                  ) : filtered.map((c, i) => (
                    <div key={c.id} className={`archive-card archive-card-${vkey(c.v)}`}
                      style={{ opacity:0, animation:`fadeSlideIn 0.35s ease ${i * 0.07}s forwards` }}>

                      {/* Left colour stripe */}
                      <div className="archive-stripe" style={{ background: stripeGrad[c.v] }} />

                      {/* File info */}
                      <div style={{ padding:'12px 16px', minWidth:0, overflow:'hidden' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                          <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.68rem', color:'#00F5FF', fontWeight:800, textShadow:'0 0 12px rgba(0,245,255,.6)', flexShrink:0 }}>{c.id}</span>
                          <span style={{ fontSize:'0.42rem', color:'#3f3f46', padding:'2px 6px', border:'1px solid rgba(55,65,81,.4)', borderRadius:4, textTransform:'uppercase', whiteSpace:'nowrap', flexShrink:0 }}>{c.type}</span>
                        </div>
                        <div style={{ fontSize:'0.7rem', color:'#d4d4d8', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.file}</div>
                        <div style={{ fontSize:'0.48rem', color:'#3f3f46', marginTop:2, fontFamily:'JetBrains Mono,monospace' }}>⏱ {c.t}</div>
                      </div>

                      {/* Verdict */}
                      <div style={{ padding:'0 12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div className={`pulse-dot pulse-dot-${vkey(c.v)}`} />
                          <span style={{ fontSize:'0.6rem', fontWeight:800, color:dotColor[c.v], letterSpacing:'0.05em' }}>{c.v}</span>
                        </div>
                      </div>

                      {/* Integrity bar */}
                      <div style={{ padding:'0 12px' }}>
                        <div style={{ fontSize:'0.45rem', color:'#52525b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:5 }}>Integrity</div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ flex:1, height:4, background:'rgba(39,39,42,.8)', borderRadius:99, overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${c.s}%`, background:scoreColor(c.s), borderRadius:99, animation:`bar-fill 0.9s ease ${i*0.07+0.3}s both` }} />
                          </div>
                          <span style={{ fontSize:'0.68rem', fontWeight:800, color:scoreColor(c.s), minWidth:34, textAlign:'right' }}>{c.s}%</span>
                        </div>
                      </div>

                      {/* Anomaly flags */}
                      <div style={{ textAlign:'center', padding:'0 6px' }}>
                        <div style={{ fontSize:'0.42rem', color:'#52525b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Anomalies</div>
                        <div className={c.flags > 0 ? 'flag-danger' : 'flag-safe'} style={{ fontSize:'1rem', fontWeight:900 }}>
                          {c.flags > 0 ? `⚠ ${c.flags}` : '✓'}
                        </div>
                      </div>

                      {/* On-chain hash */}
                      <div style={{ textAlign:'center', padding:'0 6px' }}>
                        <div style={{ fontSize:'0.42rem', color:'#52525b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>On-Chain</div>
                        <div style={{ fontFamily:'JetBrains Mono,monospace', fontSize:'0.48rem', color:'#52525b' }}>{c.tx}</div>
                      </div>

                      {/* Inspect */}
                      <div style={{ padding:'0 14px' }}>
                        <button className={`inspect-btn inspect-btn-${vkey(c.v)}`}>Inspect</button>
                      </div>
                    </div>
                  ))}
                </div>

                <style>{`
                  @keyframes fadeSlideIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                `}</style>

              </div>
            );
          })()}

          {activeTab === 'settings' && (
             <div className="glass-panel custom-scrollbar" style={{ flex: 1, padding: 30, overflowY: 'auto' }}>
                <SectionHeader icon={Settings} title="Terminal Configuration" sub="Customize forensic agent sensitivity and hardware orchestration" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 32 }}>
                   {/* Forensic Controls */}
                   <div className="glass-panel" style={{ padding: 20, background: 'rgba(0,0,0,.2)' }}>
                      <div style={{ fontSize: '0.65rem', color: '#00F5FF', marginBottom: 15, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Forensic Thresholds</div>
                      {[
                        { l: 'ELA Sensitivity', v: 'High (8.2)', p: 82, c: '#00F5FF' },
                        { l: 'OCR Confidence Filter', v: '95%', p: 95, c: '#4ade80' },
                        { l: 'Anomaly Flagging Bias', v: 'Strict', p: 70, c: '#f87171' },
                        { l: 'XAI Grad-CAM Resolution', v: '512px', p: 50, c: '#a78bfa' }
                      ].map(s => (
                        <div key={s.l} style={{ marginBottom: 18 }}>
                           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.72rem' }}>
                              <span style={{ color: '#fff' }}>{s.l}</span>
                              <span style={{ color: s.c }}>{s.v}</span>
                           </div>
                           <div className="progress-track" style={{ height: 4, background: 'rgba(255,255,255,.05)' }}>
                              <div style={{ width: `${s.p}%`, height: '100%', background: s.c, borderRadius: 99, boxShadow: `0 0 10px ${s.c}44` }} />
                           </div>
                        </div>
                      ))}
                   </div>

                   {/* System Preferences */}
                   <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="glass-panel" style={{ padding: 20, background: 'rgba(0,0,0,.2)' }}>
                         <div style={{ fontSize: '0.65rem', color: '#52525b', marginBottom: 15, textTransform: 'uppercase' }}>Hardware & Blockchain</div>
                         {[
                           { l: 'GPU Acceleration (CUDA)', v: 'Active', s: true },
                           { l: 'Multi-GPU Clustering', v: 'Enabled', s: true },
                           { l: 'Blockchain Ledger Sync', v: 'Automatic', s: true },
                           { l: 'Local Buffer Storage', v: '2GB Limit', s: false },
                         ].map(it => (
                           <div key={it.l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                              <span style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>{it.l}</span>
                              <div style={{ width: 34, height: 18, background: it.s ? '#00F5FF' : '#1e1e2d', borderRadius: 99, padding: 3, position: 'relative' }}>
                                 <div style={{ width: 12, height: 12, background: '#fff', borderRadius: '50%', marginLeft: it.s ? 16 : 0 }} />
                              </div>
                           </div>
                         ))}
                      </div>
                      <div className="glass-panel" style={{ padding: 20, background: 'linear-gradient(90deg, #ec489911, transparent)' }}>
                         <div style={{ fontSize: '0.65rem', color: '#ec4899', marginBottom: 10, textTransform: 'uppercase' }}>Dangerous Operations</div>
                         <button className="btn-outline" style={{ width: '100%', borderColor: '#ec489933', color: '#ec4899', fontSize: '0.65rem' }}>Flush Local Decision Cache</button>
                      </div>
                   </div>
                </div>
             </div>
          )}

        </div>
      </main>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

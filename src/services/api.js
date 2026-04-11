/**
 * ForenSight AI - API Service Layer v2.0
 * Phase 5 & 7: Grad-CAM + Blockchain + Rich Demo Presets
 */

// Use VITE_API_URL from environment or fallback to localhost for development
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = {
  /** Full multi-agent + Grad-CAM analysis */
  analyzeDocument: async (file, options = {}) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("doc_type", options.docType || "auto");
    formData.append("run_gradcam", options.runGradcam !== false ? "true" : "false");
    formData.append("register_blockchain", options.registerBlockchain ? "true" : "false");
    if (options.referenceSignature) {
      formData.append("reference_signature", options.referenceSignature);
    }

    const response = await fetch(`${BASE_URL}/api/analyze`, {
      method: "POST", body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${response.status}`);
    }
    return response.json();
  },

  /** Get demo preset by ID */
  getDemoResult: async (presetId) => {
    const response = await fetch(`${BASE_URL}/api/demo/${presetId}`);
    if (!response.ok) throw new Error("Demo fetch failed");
    return response.json();
  },

  /** List all demo presets */
  listDemos: async () => {
    const response = await fetch(`${BASE_URL}/api/demo`);
    if (!response.ok) throw new Error("Could not fetch demo list");
    return response.json();
  },

  /** Verify document against blockchain */
  verifyBlockchain: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${BASE_URL}/api/blockchain/verify`, {
      method: "POST", body: formData,
    });
    if (!response.ok) throw new Error("Blockchain verify failed");
    return response.json();
  },

  /** Get blockchain chain integrity */
  getChainIntegrity: async () => {
    const response = await fetch(`${BASE_URL}/api/blockchain/chain`);
    if (!response.ok) throw new Error("Chain check failed");
    return response.json();
  },

  /** Get ledger summary stats */
  getLedgerSummary: async () => {
    const response = await fetch(`${BASE_URL}/api/blockchain/ledger`);
    if (!response.ok) throw new Error("Ledger fetch failed");
    return response.json();
  },

  /** Health check */
  healthCheck: async () => {
    const response = await fetch(`${BASE_URL}/api/health`);
    if (!response.ok) throw new Error("Backend offline");
    return response.json();
  },
};

export default api;

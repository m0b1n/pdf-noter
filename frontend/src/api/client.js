const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";

export const api = {
  listDocuments: async () => {
    const r = await fetch(`${API_BASE}/api/documents`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  pdfUrl: (docId) => `${API_BASE}/api/documents/${encodeURIComponent(docId)}/file`,
  markOpen: async (docId) => {
    const r = await fetch(`${API_BASE}/api/documents/${encodeURIComponent(docId)}/open`, {
      method: "POST",
    });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
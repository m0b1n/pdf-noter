const API_BASE = process.env.REACT_APP_API_URL || "";

export const api = {
  listDocuments: async () => {
    const r = await fetch(`${API_BASE}/api/documents`);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  pdfUrl: (docId) =>
    `${API_BASE}/api/documents/${encodeURIComponent(docId)}/file`,

  markOpen: async (docId) => {
    const r = await fetch(
      `${API_BASE}/api/documents/${encodeURIComponent(docId)}/open`,
      { method: "POST" }
    );
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  getHighlights: async (docId) => {
    const r = await fetch(
      `${API_BASE}/api/documents/${encodeURIComponent(docId)}/highlights`
    );
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  saveHighlight: async (docId, payload) => {
    const r = await fetch(
      `${API_BASE}/api/documents/${encodeURIComponent(docId)}/highlights`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },

  deleteHighlight: async (docId, highlightId) => {
    const r = await fetch(
      `${API_BASE}/api/documents/${encodeURIComponent(docId)}/highlights/${encodeURIComponent(highlightId)}`,
      {
        method: "DELETE",
      }
    );
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
};
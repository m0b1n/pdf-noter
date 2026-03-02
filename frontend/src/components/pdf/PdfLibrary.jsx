import { useState, useEffect } from "react";
import PdfEmbedder from "./PdfEmbedder";
import "./PdfLibrary.css";
import { api } from "../../api/client";

const StaticPdfList = ({ onSelectPdf }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listDocuments()
      .then((data) => {
        setDocs(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading-state">Loading PDF Library...</div>;
  if (error) return <div className="error-state">Error: {error}</div>;

  return (
    <div className="pdf-library-container">
      <header className="pdf-library-header">
        <h1 className="pdf-library-title">My Documents</h1>
        <span className="pdf-count-badge">{docs.length} Files</span>
      </header>

      <div className="pdf-grid">
        {docs.map((doc) => (
          <div key={doc.id} className="pdf-card">
            <div className="pdf-info" onClick={() => onSelectPdf(doc.id)}>
              <div className="pdf-icon">📄</div>
              <h3 className="pdf-filename">{doc.title || doc.id}</h3>
            </div>
            <div className="pdf-actions">
              {/* We'll update this next to use docId */}
              <PdfEmbedder pdfUrl={doc.id} />
            </div>
          </div>
        ))}
      </div>

      <div className="library-tip">
        <span>💡</span>
        <p>
          Drop PDFs into the repo-level <code>pdfs/</code> folder. Backend will pick them up automatically.
        </p>
      </div>
    </div>
  );
};

export default StaticPdfList;
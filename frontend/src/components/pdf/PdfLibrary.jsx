import { useState, useEffect } from "react";
import PdfEmbedder from "./PdfEmbedder";
import "./PdfLibrary.css";

const StaticPdfList = ({ onSelectPdf }) => {
  const [pdfList, setPdfList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/pdfs/index.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Could not find index.json in public/pdfs/");
        }
        return response.json();
      })
      .then((data) => {
        setPdfList(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="loading-state">Loading PDF Library...</div>;
  }

  if (error) {
    return <div className="error-state">Error: {error}</div>;
  }

  return (
    <div className="pdf-library-container">
      <header className="pdf-library-header">
        <h1 className="pdf-library-title">My Documents</h1>
        <span className="pdf-count-badge">{pdfList.length} Files</span>
      </header>

      <div className="pdf-grid">
        {pdfList.map((filename) => (
          <div key={filename} className="pdf-card">
            <div className="pdf-info" onClick={() => onSelectPdf(`${filename}`)}>
              <div className="pdf-icon">📄</div>
              <h3 className="pdf-filename">{filename}</h3>
            </div>
            <div className="pdf-actions">
              <PdfEmbedder pdfUrl={`${filename}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="library-tip">
        <span>💡</span>
        <p>To add more files, drop them in the <code>public/</code> folder and update <code>public/pdfs/index.json</code>.</p>
      </div>
    </div>
  );
};

export default StaticPdfList;

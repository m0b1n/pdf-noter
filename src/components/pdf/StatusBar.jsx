import { memo, useState, useEffect} from "react";
import "./PdfHighlighterViewer.css";

/**
 * StatusBar component for PDF viewer
 * Displays PDF name, status, and action buttons
 */
const StatusBar = memo(({
  pdfName,
  currentPage,
  isSummarizing,
  onBack,
  onSummarize,
  onClearData,
  canSummarize = true,
  onZoom
}) => {
  const [zoom, setZoom] = useState(1.3);

	const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3.0));
	const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
	const resetZoom = () => setZoom(1.0);

  useEffect(()=>{
    onZoom(zoom);
  },[zoom, onZoom]);

  return (
    <div className="status-bar">
      <div className="status-bar-content">
        <div className="status-bar-left">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="back-button"
              title="Back to Library"
              aria-label="Back to Library"
            >
              ← Back
            </button>
          )}
          <div className="pdf-name">
            <span className="pdf-name-label">PDF:</span>
            <span className="pdf-name-value">{pdfName}</span>
          </div>
        </div>
        <div className="status-bar-actions">
          <div>
            <div className="zoom-group">
              <button className="zoom-btn" onClick={zoomOut}>-</button>
              <span className="zoom-text">
                {Math.round(zoom * 100)}%
              </span>
              <button className="zoom-btn" onClick={zoomIn}>+</button>
              <button className="reset-btn" onClick={resetZoom}>Reset</button>
            </div>
          </div>
          <button
            type="button"
            onClick={onSummarize}
            disabled={isSummarizing || !canSummarize}
            className={`summarize-button ${isSummarizing ? "summarize-button-disabled" : ""
              }`}
            aria-label={`Summarize page ${currentPage}`}
            aria-busy={isSummarizing}
          >
            {isSummarizing
              ? "⏳ Summarizing..."
              : `✨ Summarize Page ${currentPage}`}
          </button>
          <button
            type="button"
            onClick={onClearData}
            className="clear-all-button"
            aria-label="Clear all notes and summaries"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
});

StatusBar.displayName = "StatusBar";

export default StatusBar;


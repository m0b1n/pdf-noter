import { memo, useState, useEffect } from "react";
import "./PdfHighlighterViewer.css";

const StatusBar = memo(
  ({
    pdfName,
    currentPage,
    totalPages,
    isSummarizing,
    onBack,
    onSummarize,
    onClearData,
    canSummarize = true,
    onZoom,
    onGoToPage,
  }) => {
    const [zoom, setZoom] = useState(1.3);
    const [pageInput, setPageInput] = useState(String(currentPage || 1));

    const zoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3.0));
    const zoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));
    const resetZoom = () => setZoom(1.0);

    useEffect(() => {
      onZoom(zoom);
    }, [zoom, onZoom]);

    // keep input synced when user scrolls/pages change
    useEffect(() => {
      setPageInput(String(currentPage || 1));
    }, [currentPage]);

    const clampPage = (n) => {
      const min = 1;
      const max = totalPages || 1;
      return Math.max(min, Math.min(max, n));
    };

    const submitPage = () => {
      if (!onGoToPage) return;
      const n = parseInt(pageInput, 10);
      if (Number.isNaN(n)) return;
      onGoToPage(clampPage(n));
    };

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
            <div className="toolbar-group">
              {/* Page FIRST (left of zoom controls) */}
              <div className="page-inline page-inline-left">
                <span className="page-inline-label">Page</span>
                <input
                  className="page-inline-input"
                  type="number"
                  min={1}
                  max={totalPages || 1}
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitPage();
                  }}
                  aria-label="Go to page number"
                />
                <span className="page-inline-total">/ {totalPages || "—"}</span>
                <button className="page-inline-btn" onClick={submitPage}>
                  Go
                </button>
              </div>

              {/* Zoom group SECOND */}
              <div className="zoom-group">
                <button className="zoom-btn" onClick={zoomOut}>-</button>
                <span className="zoom-text">{Math.round(zoom * 100)}%</span>
                <button className="zoom-btn" onClick={zoomIn}>+</button>
                <button className="reset-btn" onClick={resetZoom}>Reset</button>
              </div>
            </div>

            {/* <button
              type="button"
              onClick={onSummarize}
              disabled={isSummarizing || !canSummarize}
              className={`summarize-button ${isSummarizing ? "summarize-button-disabled" : ""}`}
              aria-label={`Summarize page ${currentPage}`}
              aria-busy={isSummarizing}
            >
              {isSummarizing ? "⏳ Summarizing..." : `✨ Summarize Page ${currentPage}`}
            </button> */}

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
  }
);

StatusBar.displayName = "StatusBar";
export default StatusBar;
import { memo } from "react";
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
}) => {
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


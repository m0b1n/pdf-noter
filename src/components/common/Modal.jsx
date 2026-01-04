import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import "./Modal.css";

const SummaryModal = ({ isOpen, onClose, summary }) => {
  const [copied, setCopied] = useState(false);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !summary) return null;

  const handleCopy = async () => {
    try {
      // Copy the raw text content (without markdown formatting)
      await navigator.clipboard.writeText(summary.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">
            AI Analysis: Page {summary.page}
          </h3>
          <button
            onClick={onClose}
            className="modal-close-button"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          <ReactMarkdown>{summary.text}</ReactMarkdown>
        </div>

        <div className="modal-footer">
          <button
            onClick={handleCopy}
            className="modal-copy-button"
            title="Copy to clipboard"
          >
            {copied ? "✓ Copied!" : "📋 Copy"}
          </button>
          <button
            onClick={onClose}
            className="modal-footer-button"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SummaryModal;


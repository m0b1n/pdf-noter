import { memo, useCallback, useState } from "react";
import "./PdfHighlighterViewer.css";

// Constants
const CATEGORIES = [
  { id: "ai-summaries", label: "AI Summaries", icon: "✨" },
  { id: "highlights", label: "Saved Highlights", icon: "📌" },
];

const INITIAL_CATEGORIES = ["ai-summaries", "highlights"];

const SUMMARY_PREVIEW_LENGTH = 120;
const HIGHLIGHT_PREVIEW_LENGTH = 60;

/**
 * Sidebar component for PDF viewer
 * Displays category filters, AI summaries, and saved highlights
 */
const Sidebar = memo(({
  summaries = [],
  highlights = [],
  onOpenSummary,
  onScrollToHighlight,
}) => {
  const [selectedCategories, setSelectedCategories] = useState(
    () => new Set(INITIAL_CATEGORIES)
  );

  // Memoize category toggle function
  const onToggleCategory = useCallback((categoryId) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  // Memoize category visibility check
  const shouldShowCategory = useCallback((categoryId) => {
    if (selectedCategories.size === 0) return true;
    return selectedCategories.has(categoryId);
  }, [selectedCategories]);

  // Memoize summary preview text
  const getSummaryPreview = useCallback((text) => {
    const cleaned = text.replace(/[#*]/g, "");
    return cleaned.length > SUMMARY_PREVIEW_LENGTH
      ? `${cleaned.substring(0, SUMMARY_PREVIEW_LENGTH)}...`
      : cleaned;
  }, []);

  // Memoize highlight preview text
  const getHighlightPreview = useCallback((text) => {
    if (!text) return "Area Highlight";
    return text.length > HIGHLIGHT_PREVIEW_LENGTH
      ? `${text.substring(0, HIGHLIGHT_PREVIEW_LENGTH)}...`
      : text;
  }, []);

  // Memoize keyboard handler for summary cards
  const handleSummaryKeyDown = useCallback((e, summary) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenSummary(summary);
    }
  }, [onOpenSummary]);

  // Memoize keyboard handler for highlight cards
  const handleHighlightKeyDown = useCallback((e, highlight) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onScrollToHighlight(highlight);
    }
  }, [onScrollToHighlight]);

  return (
    <div className="sidebar-panel">
      <div className="sidebar-content">
        <div className="sidebar-header">
          <h2 className="sidebar-title">Insights</h2>
        </div>

        <div className="sidebar-body">
          {/* Category Filter */}
          <div className="category-filter" role="group" aria-label="Filter categories">
            <div className="category-filter-label">Filter by:</div>
            <div className="category-filter-buttons">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => onToggleCategory(category.id)}
                  className={`category-filter-button ${
                    selectedCategories.has(category.id)
                      ? "category-filter-button-active"
                      : ""
                  }`}
                  aria-pressed={selectedCategories.has(category.id)}
                  aria-label={`${
                    selectedCategories.has(category.id) ? "Hide" : "Show"
                  } ${category.label}`}
                >
                  <span className="category-filter-icon" aria-hidden="true">
                    {category.icon}
                  </span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Summaries Section */}
          {shouldShowCategory("ai-summaries") && (
            <section className="sidebar-section">
              <h4 className="sidebar-section-title">
                <span className="sidebar-section-icon">✨</span>
                AI Summaries
              </h4>
              {summaries.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">
                    No summaries yet. Click "Summarize Page" to generate AI
                    summaries.
                  </p>
                </div>
              ) : (
                <div className="summary-list">
                  {summaries.map((s) => (
                    <div
                      key={s.id}
                      onClick={() => onOpenSummary(s)}
                      className="summary-card"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => handleSummaryKeyDown(e, s)}
                      aria-label={`View summary for page ${s.page}`}
                    >
                      <div className="summary-card-header">
                        <span className="summary-page-badge">Page {s.page}</span>
                        <span className="summary-view-link">View Full →</span>
                      </div>
                      <div className="summary-card-preview">
                        {getSummaryPreview(s.text)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Saved Highlights Section */}
          {shouldShowCategory("highlights") && (
            <section className="sidebar-section">
              <h5 className="sidebar-section-title">
                <span className="sidebar-section-icon">📌</span>
                Saved Highlights
              </h5>
              {highlights.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-state-text">
                    No highlights yet. Select text and add highlights to save
                    important passages.
                  </p>
                </div>
              ) : (
                <div className="highlight-list">
                  {highlights.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => onScrollToHighlight(h)}
                      className="highlight-card"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => handleHighlightKeyDown(e, h)}
                      aria-label={`Go to highlight on page ${h.position.pageNumber}`}
                    >
                      <div className="highlight-card-header">
                        <span className="highlight-page-badge">
                          Page {h.position.pageNumber}
                        </span>
                      </div>
                      <p className="highlight-card-text">
                        {getHighlightPreview(h.content.text)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;


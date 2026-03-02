import { memo, useCallback, useState } from "react";
import "./PdfHighlighterViewer.css";

const CATEGORIES = [
  { id: "ai-summaries", label: "AI Summaries", icon: "✨" },
  { id: "highlights", label: "Saved Highlights", icon: "📌" },
];

const INITIAL_CATEGORIES = ["ai-summaries", "highlights"];
const SUMMARY_PREVIEW_LENGTH = 120;
const HIGHLIGHT_PREVIEW_LENGTH = 60;

const Sidebar = memo(({ summaries = [], highlights = [], onOpenSummary, onScrollToHighlight }) => {
  const [selectedCategories, setSelectedCategories] = useState(() => new Set(INITIAL_CATEGORIES));
  const [collapsed, setCollapsed] = useState(false);

  const onToggleCategory = useCallback((categoryId) => {
    setSelectedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) newSet.delete(categoryId);
      else newSet.add(categoryId);
      return newSet;
    });
  }, []);

  const shouldShowCategory = useCallback(
    (categoryId) => {
      if (selectedCategories.size === 0) return true;
      return selectedCategories.has(categoryId);
    },
    [selectedCategories]
  );

  const getSummaryPreview = useCallback((text) => {
    const cleaned = text.replace(/[#*]/g, "");
    return cleaned.length > SUMMARY_PREVIEW_LENGTH
      ? `${cleaned.substring(0, SUMMARY_PREVIEW_LENGTH)}...`
      : cleaned;
  }, []);

  const getHighlightPreview = useCallback((text) => {
    if (!text) return "Area Highlight";
    return text.length > HIGHLIGHT_PREVIEW_LENGTH ? `${text.substring(0, HIGHLIGHT_PREVIEW_LENGTH)}...` : text;
  }, []);

  const handleSummaryKeyDown = useCallback(
    (e, summary) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpenSummary(summary);
      }
    },
    [onOpenSummary]
  );

  const handleHighlightKeyDown = useCallback(
    (e, highlight) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onScrollToHighlight(highlight);
      }
    },
    [onScrollToHighlight]
  );

  return (
    <div className={`sidebar-panel ${collapsed ? "panel-collapsed" : ""}`}>
      <div className="sidebar-content">
        <div className="sidebar-header">
          <div className="sidebar-header-row">
            <h2 className="sidebar-title">Insights</h2>
            <button
              type="button"
              className="panel-toggle"
              onClick={() => setCollapsed((v) => !v)}
              aria-label={collapsed ? "Expand insights" : "Collapse insights"}
              title={collapsed ? "Expand" : "Collapse"}
            >
              {collapsed ? "‹" : "›"}
            </button>
          </div>
        </div>

        {!collapsed && (
          <div className="sidebar-body">
            <div className="category-filter" role="group" aria-label="Filter categories">
              <div className="category-filter-label">Filter by:</div>
              <div className="category-filter-buttons">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => onToggleCategory(category.id)}
                    className={`category-filter-button ${
                      selectedCategories.has(category.id) ? "category-filter-button-active" : ""
                    }`}
                    aria-pressed={selectedCategories.has(category.id)}
                  >
                    <span className="category-filter-icon" aria-hidden="true">
                      {category.icon}
                    </span>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {shouldShowCategory("ai-summaries") && (
              <section className="sidebar-section">
                <h4 className="sidebar-section-title">
                  <span className="sidebar-section-icon">✨</span>
                  AI Summaries
                </h4>
                {summaries.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-state-text">No summaries yet. Click "Summarize Page" to generate AI summaries.</p>
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
                      >
                        <div className="summary-card-header">
                          <span className="summary-page-badge">Page {s.page}</span>
                          <span className="summary-view-link">View Full →</span>
                        </div>
                        <div className="summary-card-preview">{getSummaryPreview(s.text)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {shouldShowCategory("highlights") && (
              <section className="sidebar-section">
                <h5 className="sidebar-section-title">
                  <span className="sidebar-section-icon">📌</span>
                  Saved Highlights
                </h5>
                {highlights.length === 0 ? (
                  <div className="empty-state">
                    <p className="empty-state-text">
                      No highlights yet. Select text and add highlights to save important passages.
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
                          <span className="highlight-page-badge">Page {h.position.pageNumber}</span>
                        </div>
                        <p className="highlight-card-text">{getHighlightPreview(h.content.text)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

Sidebar.displayName = "Sidebar";
export default Sidebar;
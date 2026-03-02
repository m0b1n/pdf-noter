import React, { useState, useEffect } from "react";
import "./PdfHighlighterViewer.css";

const BookmarkSidebar = ({ pdfDocument, onJumpToPage }) => {
  const [outline, setOutline] = useState([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!pdfDocument) return;
    pdfDocument.getOutline().then((res) => setOutline(res || []));
  }, [pdfDocument]);

  const handleBookmarkClick = async (dest) => {
    if (!dest || !pdfDocument) return;
    try {
      const pageRef = Array.isArray(dest) ? dest[0] : dest;
      const pageIndex = await pdfDocument.getPageIndex(pageRef);
      onJumpToPage(pageIndex + 1);
    } catch (error) {
      console.error("Failed to resolve bookmark destination:", error);
    }
  };

  const renderOutline = (items) => (
    <ul className="bookmark-list">
      {items.map((item, i) => (
        <li key={i} className="bookmark-item">
          <div
            className="bookmark-link"
            onClick={() => handleBookmarkClick(item.dest)}
            title={item.title}
          >
            {item.title}
          </div>
          {item.items && item.items.length > 0 && renderOutline(item.items)}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`pdf-sidebar ${collapsed ? "panel-collapsed" : ""}`}>
      <div className="panel-header panel-header-left">
        {/* Hide title when collapsed so the toggle stays clickable */}
        {!collapsed && <h4 className="sidebar-header-text">Table of Contents</h4>}

        <button
          type="button"
          className="panel-toggle panel-toggle-left"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand table of contents" : "Collapse table of contents"}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {!collapsed && (
        <div className="sidebar-content">
          {outline.length > 0 ? (
            renderOutline(outline)
          ) : (
            <p className="no-bookmarks">No bookmarks available in this PDF.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default BookmarkSidebar;
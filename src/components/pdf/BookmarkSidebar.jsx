import React, { useState, useEffect } from "react";

const BookmarkSidebar = ({ pdfDocument, onJumpToPage }) => {
  const [outline, setOutline] = useState([]);

  useEffect(() => {
    if (pdfDocument) {
      pdfDocument.getOutline().then((res) => setOutline(res || []));
    }
  }, [pdfDocument]);

  const handleBookmarkClick = async (dest) => {
    if (!dest) return;
    try {
      // Resolve the destination to a page index
      const pageRef = Array.isArray(dest) ? dest[0] : dest;
      const pageIndex = await pdfDocument.getPageIndex(pageRef);

      // Call the jump function (1-indexed for the highlighter)
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
            title={item.title} // Shows full title on hover
          >
            {item.title}
          </div>
          {item.items && item.items.length > 0 && renderOutline(item.items)}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="pdf-sidebar">
      <h4 className="sidebar-header">Table of Contents</h4>
      <div className="sidebar-content">
        {outline.length > 0 ? (
          renderOutline(outline)
        ) : (
          <p className="no-bookmarks">No bookmarks available in this PDF.</p>
        )}
      </div>
    </div>
  );
};

export default BookmarkSidebar;

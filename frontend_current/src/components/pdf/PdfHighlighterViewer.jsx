import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  PdfLoader,
  PdfHighlighter,
  Popup,
} from "react-pdf-highlighter";
import { useApp } from "../../AppContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import SummaryModal from "../common/Modal";
import Chat from "../chat/Chat";
import StatusBar from "./StatusBar";
import Sidebar from "./Sidebar";
import "./PdfHighlighterViewer.css";
import BookmarkSidebar from "./BookmarkSidebar";
import { api } from "../../api/client";

// Constants moved outside component to prevent recreation on each render

const normalizeWhitespace = (text = "") =>
  text.replace(/\s+/g, " ").trim();

const looksLikeSentenceBlock = (text = "") => {
  const clean = normalizeWhitespace(text);
  if (!clean) return false;

  const sentenceMatches = clean.match(/[.!?](?:\s|$)/g) || [];
  return sentenceMatches.length >= 1 || clean.length > 120;
};

const findMatchRange = (pageText, selectedText) => {
  const normalizedPage = normalizeWhitespace(pageText);
  const normalizedSelected = normalizeWhitespace(selectedText);

  if (!normalizedPage || !normalizedSelected) {
    return {
      pageText: normalizedPage,
      selectedText: normalizedSelected,
      start: -1,
      end: -1,
    };
  }

  const start = normalizedPage
    .toLowerCase()
    .indexOf(normalizedSelected.toLowerCase());

  return {
    pageText: normalizedPage,
    selectedText: normalizedSelected,
    start,
    end: start === -1 ? -1 : start + normalizedSelected.length,
  };
};

const extractSentenceContext = (pageText, start, end) => {
  if (start < 0 || end < 0) return "";

  let sentenceStart = 0;
  let sentenceEnd = pageText.length;

  for (let i = start - 1; i >= 0; i--) {
    const ch = pageText[i];
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      sentenceStart = i + 1;
      break;
    }
  }

  for (let i = end; i < pageText.length; i++) {
    const ch = pageText[i];
    if (ch === "." || ch === "!" || ch === "?" || ch === "\n") {
      sentenceEnd = i + 1;
      break;
    }
  }

  return normalizeWhitespace(pageText.slice(sentenceStart, sentenceEnd));
};

const extractParagraphContext = (pageText, start, end) => {
  if (start < 0 || end < 0) return normalizeWhitespace(pageText);

  const paragraphBreakRegex = /\n\s*\n/g;

  let paragraphStart = 0;
  let paragraphEnd = pageText.length;

  for (const match of pageText.matchAll(paragraphBreakRegex)) {
    const matchIndex = match.index ?? 0;

    if (matchIndex < start) {
      paragraphStart = matchIndex + match[0].length;
    } else if (matchIndex >= end) {
      paragraphEnd = matchIndex;
      break;
    }
  }

  const paragraph = normalizeWhitespace(pageText.slice(paragraphStart, paragraphEnd));

  if (paragraph) return paragraph;

  const fallbackStart = Math.max(0, start - 220);
  const fallbackEnd = Math.min(pageText.length, end + 220);
  return normalizeWhitespace(pageText.slice(fallbackStart, fallbackEnd));
};

const buildHighlightContext = (pageText, selectedText) => {
  const cleanSelected = normalizeWhitespace(selectedText);
  const cleanPage = pageText || "";

  if (!cleanSelected) {
    return {
      contextSentence: "",
      contextParagraph: "",
    };
  }

  if (!cleanPage.trim()) {
    return {
      contextSentence: cleanSelected,
      contextParagraph: "",
    };
  }

  const { pageText: normalizedPage, start, end } = findMatchRange(cleanPage, cleanSelected);

  if (looksLikeSentenceBlock(cleanSelected)) {
    return {
      contextSentence: cleanSelected,
      contextParagraph:
        start !== -1
          ? extractParagraphContext(normalizedPage, start, end)
          : normalizedPage,
    };
  }

  if (start === -1) {
    return {
      contextSentence: cleanSelected,
      contextParagraph: normalizedPage,
    };
  }

  return {
    contextSentence:
      extractSentenceContext(normalizedPage, start, end) || cleanSelected,
    contextParagraph: extractParagraphContext(normalizedPage, start, end),
  };
};

const POLLING_INTERVAL = 300; // ms
const SETUP_POLLING_INTERVAL = 100; // ms

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#f7cc1f" },
  { name: "Green", value: "#54ff90" },
  { name: "Blue", value: "#5ba5ff" },
  { name: "Pink", value: "#fc68bc" },
  { name: "Purple", value: "#8367ff" },
];

// const DEFAULT_COLOR = "#fad334";
const DEFAULT_COLOR = "#fa34d2";


function SelectionTip({
  onOpen,
  onSave,
  onCancel,
  initialText = "",
  initialColor = DEFAULT_COLOR,
  initialStyle = "highlight",
  saveLabel = "Save",
}) {
  const [text, setText] = useState(initialText);
  const [color, setColor] = useState(initialColor);
  const [style, setStyle] = useState(initialStyle);

  useEffect(() => {
    onOpen?.();
  }, [onOpen]);

  const keepSelection = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      className="tip-editor"
      onMouseDown={keepSelection}
      onClick={(e) => e.stopPropagation()}
    >
      <textarea
        className="tip-textarea"
        placeholder="Add a note (optional)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        onClick={(e) => e.stopPropagation()}
      />

      <div className="tip-row">
        <div className="tip-section">
          <div className="tip-label">Color</div>
          <div className="tip-colors">
            {HIGHLIGHT_COLORS.map((c) => {
              const active = c.value === color;
              return (
                <button
                  key={c.value}
                  type="button"
                  className="tip-color-swatch"
                  title={c.name}
                  onMouseDown={(e) => {
                    keepSelection(e);
                    setColor(c.value);
                  }}
                  style={{
                    background: c.value,
                    outline: active ? "2px solid #111827" : "none",
                    outlineOffset: 2,
                  }}
                />
              );
            })}
          </div>
        </div>

        <div className="tip-section">
          <div className="tip-label">Style</div>
          <div className="tip-style-toggle">
            <button
              type="button"
              className="tip-style-btn"
              onMouseDown={(e) => {
                keepSelection(e);
                setStyle("highlight");
              }}
              style={{ borderColor: style === "highlight" ? "#111827" : undefined }}
            >
              Highlight
            </button>
            <button
              type="button"
              className="tip-style-btn"
              onMouseDown={(e) => {
                keepSelection(e);
                setStyle("underline");
              }}
              style={{ borderColor: style === "underline" ? "#111827" : undefined }}
            >
              Underline
            </button>
          </div>
        </div>
      </div>

      <div className="tip-actions">
        <button
          type="button"
          className="tip-save-btn"
          onMouseDown={(e) => {
            keepSelection(e);
            onSave({ text, color, style });
          }}
        >
          {saveLabel}
        </button>

        <button
          type="button"
          className="tip-save-btn"
          style={{ background: "#6b7280", marginLeft: 8 }}
          onMouseDown={(e) => {
            keepSelection(e);
            onCancel();
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function PdfHighlighterViewer({ url, onBack }) {
  const { ollama } = useApp();

  /**
   * IMPORTANT CHANGE:
   * `url` is now treated as a document id / filename (e.g. "paper.pdf").
   * We load the PDF bytes from the backend, which reads from your shared ./pdfs folder.
   */
  const docId = useMemo(() => (url || "").split("/").pop(), [url]);
  const pdfUrl = useMemo(() => api.pdfUrl(docId), [docId]);

  // (optional) keep storage key stable per document id
  const storageKey = useMemo(() => `pdf_storage_${docId}`, [docId]);

  // const [highlights, setHighlights] = useLocalStorage(
  //   `${storageKey}_highlights`,
  //   []
  // );
  const [highlights, setHighlights] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [summaries, setSummaries] = useLocalStorage(
    `${storageKey}_summaries`,
    []
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const highlighterRef = useRef(null);
  const [activeSummary, setActiveSummary] = useState(null);
  const pdfDocumentRef = useRef(null);
  const pageTrackingSetupRef = useRef(false);

  const pdfName = useMemo(() => docId || url, [docId, url]);

  const [pdfDocument, setPdfDocument] = useState(null);
  const [zoom, setZoom] = useState(1.0);

  const [totalPages, setTotalPages] = useState(null);

  /**
   * IMPORTANT CHANGE:
   * Notify the backend that this document was opened.
   * Backend can record last_opened_at, or later kick off indexing, etc.
   */
  useEffect(() => {
    if (!docId) return;
    api.markOpen(docId).catch((e) => {
      console.error("Failed to notify backend that doc was opened:", e);
    });
  }, [docId]);

  useEffect(() => {
  let cancelled = false;

  async function loadHighlights() {
    if (!docId) return;

    setHighlightsLoading(true);
    try {
      const data = await api.getHighlights(docId);
      if (!cancelled) {
        setHighlights(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to load highlights:", err);
      if (!cancelled) setHighlights([]);
    } finally {
      if (!cancelled) setHighlightsLoading(false);
    }
  }

  loadHighlights();

  return () => {
    cancelled = true;
  };
}, [docId]);

  useEffect(() => {
    pageTrackingSetupRef.current = false;

    let setupIntervalId = null;
    let pollingIntervalId = null;
    let eventBusCleanup = null;

    const setupPageTracking = () => {
      // Prevent duplicate setup
      if (pageTrackingSetupRef.current) {
        return true;
      }

      const viewer = highlighterRef.current?.viewer;

      if (viewer && viewer.eventBus) {
        pageTrackingSetupRef.current = true;

        // Get current page number from viewer
        const getCurrentPage = () => {
          try {
            if (viewer.pdfViewer) {
              return viewer.pdfViewer.currentPageNumber || 1;
            }
            if (viewer.currentPageNumber !== undefined) {
              return viewer.currentPageNumber;
            }
            // Try to get from PDF.js viewer
            if (viewer._pages && viewer._pages.length > 0) {
              const visiblePage = viewer._pages.find((page) => page.visible);
              if (visiblePage) {
                return visiblePage.id + 1; // PDF.js pages are 0-indexed
              }
            }
          } catch (e) {
            // Silently fail - will use polling as fallback
          }
          return null;
        };

        // Set initial page
        const initialPage = getCurrentPage();
        if (initialPage) {
          setCurrentPage(initialPage);
        }

        // Set up event listeners for page changes
        const handlePageChange = (evt) => {
          const pageNum = evt.pageNumber || evt.page || getCurrentPage();
          if (pageNum) {
            setCurrentPage((prevPage) => {
              if (pageNum !== prevPage) {
                return pageNum;
              }
              return prevPage;
            });
          }
        };

        const handlePagesInit = () => {
          const pageNum = getCurrentPage();
          if (pageNum) {
            setCurrentPage((prevPage) => {
              if (pageNum !== prevPage) {
                return pageNum;
              }
              return prevPage;
            });
          }
        };

        // Listen to multiple events for better coverage
        viewer.eventBus.on("pagechanging", handlePageChange);
        viewer.eventBus.on("pagesinit", handlePagesInit);
        viewer.eventBus.on("pagechange", handlePageChange);

        eventBusCleanup = () => {
          viewer.eventBus.off("pagechanging", handlePageChange);
          viewer.eventBus.off("pagesinit", handlePagesInit);
          viewer.eventBus.off("pagechange", handlePageChange);
        };

        // Polling fallback to catch any missed events
        pollingIntervalId = setInterval(() => {
          const pageNum = getCurrentPage();
          if (pageNum) {
            setCurrentPage((prevPage) => {
              if (pageNum !== prevPage) {
                return pageNum;
              }
              return prevPage;
            });
          }
        }, POLLING_INTERVAL);

        return true; // Successfully set up
      }

      return false; // Viewer not ready yet
    };

    // Try to set up immediately
    if (!setupPageTracking()) {
      // If viewer not ready, poll until it is
      setupIntervalId = setInterval(() => {
        if (setupPageTracking()) {
          clearInterval(setupIntervalId);
          setupIntervalId = null;
        }
      }, SETUP_POLLING_INTERVAL);
    }

    // Cleanup
    return () => {
      pageTrackingSetupRef.current = false;
      if (setupIntervalId) {
        clearInterval(setupIntervalId);
      }
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      if (eventBusCleanup) {
        eventBusCleanup();
      }
    };
  }, [docId]); // rerun when doc changes

  // Memoize page text extraction function
  const getPageText = useCallback(async (pdfDocument, pageNumber) => {
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();

      let result = "";
      let lastY = null;

      for (const item of textContent.items) {
        const text = item.str || "";
        const y = item.transform?.[5];

        if (lastY !== null && y !== undefined) {
          const lineGap = Math.abs(y - lastY);

          if (lineGap > 14) {
            result += "\n\n";
          } else {
            result += " ";
          }
        } else if (result) {
          result += " ";
        }

        result += text;
        lastY = y;
      }

      return result;
    } catch (error) {
      console.error("Error extracting page text:", error);
      return "";
    }
  }, []);

  // Memoize summarize handler
  const handleSummarizePage = useCallback(
    async (pdfDocument) => {
      if (!pdfDocument) return;

      setIsSummarizing(true);
      try {
        const pageText = await getPageText(pdfDocument, currentPage);
        if (!pageText.trim()) {
          throw new Error("No text found on this page");
        }

        const summaryText = await ollama.summarizePage(pageText, currentPage);

        const newSummary = {
          id: `summary-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          page: currentPage,
          text: summaryText,
          type: "AI_SUMMARY",
          createdAt: new Date().toISOString(),
        };

        setSummaries((prev) => [newSummary, ...prev]);
      } catch (err) {
        console.error("Summarization failed", err);
      } finally {
        setIsSummarizing(false);
      }
    },
    [currentPage, getPageText, setSummaries, ollama]
  );

  const clearData = useCallback(() => {
    if (window.confirm("Clear all notes and summaries for this PDF?")) {
      // setHighlights([]);
      setSummaries([]);
    }
  }, [setSummaries]);

    const addHighlight = useCallback(
      async ({ content, position, noteText = "", color = DEFAULT_COLOR, style = "highlight" }) => {
        const selectedText = (content?.text || "").trim();

        if (!selectedText) {
          throw new Error("No selected text found");
        }

        const page =
          position?.pageNumber ||
          position?.boundingRect?.pageNumber ||
          currentPage ||
          1;

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const optimisticHighlight = {
          id: tempId,
          content,
          position,
          comment: {
            text: noteText?.trim()
              ? `${noteText}\n\nGenerating definition...`
              : "Generating definition...",
            color,
            style,
          },
          aiData: null,
          backendId: null,
          isLoading: true,
          createdAt: new Date().toISOString(),
        };

        setHighlights((prev) => [optimisticHighlight, ...prev]);

        try {
          const pageText = pdfDocumentRef.current
            ? await getPageText(pdfDocumentRef.current, page)
            : "";

          const { contextSentence, contextParagraph } = buildHighlightContext(
            pageText,
            selectedText
          );

          const saved = await api.saveHighlight(docId, {
            id: tempId,
            content,
            position,
            noteText,
            color,
            style,
            contextSentence,
            contextParagraph,
          });

          setHighlights((prev) =>
            prev.map((h) =>
              h.id === tempId
                ? {
                    ...saved,
                    comment: saved.comment ?? {
                      text: noteText || "",
                      color,
                      style,
                    },
                    isLoading: false,
                    hasError: false,
                  }
                : h
            )
          );

          return saved;
        } catch (error) {
          setHighlights((prev) =>
            prev.map((h) =>
              h.id === tempId
                ? {
                    ...h,
                    comment: {
                      text: noteText?.trim()
                        ? `${noteText}\n\nFailed to generate definition.`
                        : "Failed to generate definition.",
                      color,
                      style,
                    },
                    isLoading: false,
                    hasError: true,
                  }
                : h
            )
          );

          throw error;
        }
      },
      [setHighlights, docId, currentPage, getPageText]
    );

  const updateHighlight = useCallback(
    (highlightId, updates) => {
      setHighlights((prev) =>
        prev.map((h) =>
          h.id === highlightId
            ? {
                ...h,
                ...updates,
                comment: {
                  ...h.comment,
                  ...(updates.comment || {}),
                },
              }
            : h
        )
      );
    },
    [setHighlights]
  );

  

  const scrollToHighlight = useCallback((highlight) => {
    const { current } = highlighterRef;
    if (!current) return;

    if (current.scrollTo) {
      current.scrollTo(highlight);
    } else if (typeof current.scrollToHighlight === "function") {
      current.scrollToHighlight(highlight);
    } else {
      console.warn("Scroll method not found on highlighterRef.");
    }
  }, []);

  const deleteHighlight = useCallback(
    async (highlightId) => {
      const previous = highlights;

      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));

      try {
        await api.deleteHighlight(docId, highlightId);
      } catch (err) {
        console.error("Failed to delete highlight:", err);
        setHighlights(previous);
      }
    },
    [docId, highlights]
  );

  const handleCloseModal = useCallback(() => {
    setActiveSummary(null);
  }, []);

  const handleOpenSummary = useCallback((summary) => {
    setActiveSummary(summary);
  }, []);

  const handleSummarizeClick = useCallback(() => {
    handleSummarizePage(pdfDocumentRef.current);
  }, [handleSummarizePage]);

  const highlightTransform = useCallback(
    (highlight, index, setTip, hideTip, viewportToScaled, screenshot, isScrolledTo) => {
      void viewportToScaled;
      void screenshot;

      const mode = highlight.comment?.style || "highlight";
      const color = highlight.comment?.color || DEFAULT_COLOR;

      const rects = highlight.position?.rects || [];

      const openEditor = () => {
        setTip(
          highlight,
          () => (
            <SelectionTip
              initialText={highlight.comment?.text || ""}
              initialColor={highlight.comment?.color || DEFAULT_COLOR}
              initialStyle={highlight.comment?.style || "highlight"}
              saveLabel="Translate"
              onSave={({ text, color, style }) => {
                updateHighlight(highlight.id, {
                  comment: { text, color, style },
                });
                hideTip();
              }}
              onCancel={hideTip}
            />
          )
        );
      };

      const renderRects = rects.map((rect, i) => {
        const style =
          mode === "underline"
            ? {
                position: "absolute",
                left: rect.left,
                top: rect.top + rect.height - 2,
                width: rect.width,
                height: "0px",
                borderBottom: `3px solid ${color}`,
                boxShadow: isScrolledTo ? `0 2px 0 0 ${color}` : "none",
                boxSizing: "border-box",
                pointerEvents: "auto",
                cursor: "pointer",
              }
            : {
                position: "absolute",
                left: rect.left,
                top: rect.top,
                width: rect.width,
                height: rect.height,
                background: color,
                opacity: 0.45,
                borderRadius: "2px",
                outline: isScrolledTo ? `2px solid ${color}` : "none",
                pointerEvents: "auto",
                cursor: "pointer",
              };

        return (
          <div
            key={i}
            style={style}
            onClick={(e) => {
              e.stopPropagation();
              openEditor();
            }}
          />
        );
      });

      return (
        <Popup
          popupContent={
            <div className="highlight-popup-content">
              {highlight.comment?.text ? (
                <div className="highlight-popup-note">{highlight.comment.text}</div>
              ) : null}

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="highlight-remove-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditor();
                  }}
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="highlight-remove-link"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteHighlight(highlight.id);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          }
          onMouseOver={(popupContent) => setTip(highlight, () => popupContent)}
          onMouseOut={hideTip}
          key={highlight.id || index}
        >
          <div
            className="custom-highlight-layer"
            style={{ position: "absolute", inset: 0 }}
          >
            {renderRects}
          </div>
        </Popup>
      );
    },
    [deleteHighlight, updateHighlight]
  );

  const handleSelectionFinished = useCallback(
    (position, content, hideTipAndSelection, transformSelection) => {
      return (
        <SelectionTip
          onOpen={transformSelection}
          onCancel={hideTipAndSelection}
          onSave={async ({ text, color, style }) => {
            try {
              console.log("Saving highlight:", { text, color, style });

              await addHighlight({
                content,
                position,
                noteText: text,
                color,
                style,
              });

              hideTipAndSelection();
            } catch (error) {
              console.error("Failed to save highlight:", error);
              alert("Failed to save highlight to backend.");
            }
          }}
        />
      );
    },
    [addHighlight]
  );

  const jumpToPage = useCallback((pageNumber) => {
	const page = Math.max(1, Math.min(totalPages || pageNumber, pageNumber));
	setCurrentPage(page);

	const pageElement = document.querySelector(`[data-page-number="${page}"]`);
	if (pageElement) {
		pageElement.scrollIntoView({ behavior: "smooth" });
	}
	}, [totalPages]);

  const handleZoom = useCallback(
    (zoom) => {
      if (zoom >= 0.5 && zoom <= 3.0) {
        setZoom(zoom);
      }
    },
    [setZoom]
  );

  return (
    <div className="pdf-viewer-container">
      <SummaryModal isOpen={!!activeSummary} onClose={handleCloseModal} summary={activeSummary} />

      {/* You should pass docId instead of a URL once Chat is moved to backend */}
      <Chat pdfUrl={docId} />

      {pdfDocument && <BookmarkSidebar pdfDocument={pdfDocument} onJumpToPage={jumpToPage} />}

      {/* PDF Viewer */}
      <div className="pdf-viewer-wrapper">
        {/* IMPORTANT CHANGE: PdfLoader uses pdfUrl from backend */}
        <PdfLoader url={pdfUrl} beforeLoad={<div>Loading PDF...</div>}>
          {(pdfDoc) => {
			pdfDocumentRef.current = pdfDoc;

			// NEW: total pages
			if (!totalPages && pdfDoc?.numPages) {
				setTotalPages(pdfDoc.numPages);
			}

			if (!pdfDocument) {
				setTimeout(() => setPdfDocument(pdfDoc), 0);
			}
			return (
              <PdfHighlighter
                key={`viewer-${zoom}`}
                ref={highlighterRef}
                pdfDocument={pdfDoc}
                highlights={highlights}
                pdfScaleValue={zoom}
                enableAreaSelection={(event) => event.altKey}
                onSelectionFinished={handleSelectionFinished}
                onScrollChange={() => {}}
                highlightTransform={highlightTransform}
              />
            );
          }}
        </PdfLoader>
      </div>

      <Sidebar
        summaries={summaries}
        highlights={highlights}
        onOpenSummary={handleOpenSummary}
        onScrollToHighlight={scrollToHighlight}
      />

      <StatusBar
		pdfName={pdfName}
		currentPage={currentPage}
		totalPages={totalPages}
		isSummarizing={isSummarizing}
		onBack={onBack}
		onSummarize={handleSummarizeClick}
		onClearData={clearData}
		canSummarize={!!pdfDocumentRef.current}
		onZoom={handleZoom}
		onGoToPage={jumpToPage}
		/>
    </div>
  );
}

export default PdfHighlighterViewer;

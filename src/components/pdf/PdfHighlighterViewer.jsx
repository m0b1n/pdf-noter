import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
	PdfLoader,
	PdfHighlighter,
	Tip,
	Highlight,
	Popup,
} from "react-pdf-highlighter";
import { useApp } from "../../AppContext";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import SummaryModal from "../common/Modal";
import Chat from "../chat/Chat";
import StatusBar from "./StatusBar";
import Sidebar from "./Sidebar";
import "./PdfHighlighterViewer.css";
import BookmarkSidebar from "./BookmarkSidebar"

// Constants moved outside component to prevent recreation on each render
const POLLING_INTERVAL = 300; // ms
const SETUP_POLLING_INTERVAL = 100; // ms

function PdfHighlighterViewer({ url, onBack }) {
	const { ollama } = useApp();
	const storageKey = useMemo(() => `pdf_storage_${url.split("/").pop()}`, [url]);
	
	const [highlights, setHighlights] = useLocalStorage(`${storageKey}_highlights`, []);
	const [summaries, setSummaries] = useLocalStorage(`${storageKey}_summaries`, []);

	const [currentPage, setCurrentPage] = useState(1);
	const [isSummarizing, setIsSummarizing] = useState(false);
	const highlighterRef = useRef(null);
	const [activeSummary, setActiveSummary] = useState(null);
	const pdfDocumentRef = useRef(null);
	const pageTrackingSetupRef = useRef(false);

	const pdfName = useMemo(() => url.split("/").pop() || url, [url]);

	const [pdfDocument, setPdfDocument] = useState(null);

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
							const visiblePage = viewer._pages.find(page => page.visible);
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
	}, [url]); // Re-run when PDF URL changes

	// Memoize page text extraction function
	const getPageText = useCallback(async (pdfDocument, pageNumber) => {
		try {
			const page = await pdfDocument.getPage(pageNumber);
			const textContent = await page.getTextContent();
			return textContent.items.map((item) => item.str).join(" ");
		} catch (error) {
			console.error("Error extracting page text:", error);
			return "";
		}
	}, []);

	// Memoize summarize handler
	const handleSummarizePage = useCallback(async (pdfDocument) => {
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
			// Could add user-facing error notification here
		} finally {
			setIsSummarizing(false);
		}
	}, [currentPage, getPageText, setSummaries]);

	// Memoize clear data handler
	const clearData = useCallback(() => {
		if (window.confirm("Clear all notes and summaries for this PDF?")) {
			setHighlights([]);
			setSummaries([]);
			// localStorage is cleared automatically by useLocalStorage hook
		}
	}, [setHighlights, setSummaries]);

	// Memoize add highlight handler
	const addHighlight = useCallback((highlight) => {
		const newHighlight = {
			...highlight,
			id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
		};
		setHighlights((prev) => [newHighlight, ...prev]);
	}, [setHighlights]);

	// Memoize scroll to highlight handler
	const scrollToHighlight = useCallback((highlight) => {
		const { current } = highlighterRef;
		if (!current) return;
		
		if (current.scrollTo) {
			current.scrollTo(highlight);
		} else if (typeof current.scrollToHighlight === "function") {
			current.scrollToHighlight(highlight);
		} else {
			console.warn(
				"Scroll method not found on highlighterRef. Check internal viewer."
			);
		}
	}, []);

	// Memoize delete highlight handler
	const deleteHighlight = useCallback((highlightId) => {
		setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
	}, [setHighlights]);

	// Memoize handlers for modal
	const handleCloseModal = useCallback(() => {
		setActiveSummary(null);
	}, []);

	const handleOpenSummary = useCallback((summary) => {
		setActiveSummary(summary);
	}, []);

	// Memoize summarize button handler
	const handleSummarizeClick = useCallback(() => {
		handleSummarizePage(pdfDocumentRef.current);
	}, [handleSummarizePage]);

	// Memoize highlight transform function
	const highlightTransform = useCallback((
		highlight,
		index,
		setTip,
		hideTip,
		viewportToScaled,
		screenshot,
		isScrolledTo
	) => {
		return (
			<Popup
				popupContent={
					<div className="highlight-popup-content">
						<span className="highlight-popup-label">Highlight {index + 1}</span>
						<button
							type="button"
							className="highlight-remove-link"
							onClick={(e) => {
								e.stopPropagation();
								deleteHighlight(highlight.id);
							}}
							aria-label={`Remove highlight ${index + 1}`}
						>
							Remove
						</button>
					</div>
				}
				onMouseOver={(popupContent) =>
					setTip(highlight, (highlight) => popupContent)
				}
				onMouseOut={hideTip}
				key={highlight.id || index}
			>
				<Highlight
					isScrolledTo={isScrolledTo}
					position={highlight.position}
					comment={highlight.comment}
				/>
			</Popup>
		);
	}, [deleteHighlight]);

	// Memoize selection finished handler
	const handleSelectionFinished = useCallback((pos, content, hide, transform) => (
		<Tip
			onOpen={transform}
			onConfirm={(comment) => {
				addHighlight({ content, position: pos, comment });
				hide();
			}}
			render={() => null}
		/>
	), [addHighlight]);

	const jumpToPage = (pageNumber) => {
		const pageElement = document.querySelector(`[data-page-number="${pageNumber}"]`);
		if (pageElement) {
			pageElement.scrollIntoView({ behavior: 'smooth' });
		}
	};

	return (
		<div className="pdf-viewer-container">
			<SummaryModal
				isOpen={!!activeSummary}
				onClose={handleCloseModal}
				summary={activeSummary}
			/>
			<Chat pdfUrl={url} />

			{pdfDocument && (
				<BookmarkSidebar
				pdfDocument={pdfDocument}
				onJumpToPage={jumpToPage}
				/>
			)}

			{/* PDF Viewer */}
			<div className="pdf-viewer-wrapper">
				<PdfLoader url={url} beforeLoad={<div>Loading PDF...</div>}>
					{(pdfDoc) => {
						pdfDocumentRef.current = pdfDoc;
						if (!pdfDocument) {
							setPdfDocument(pdfDoc);
						}
						return (
							<>
								<PdfHighlighter
									ref={highlighterRef}
									pdfDocument={pdfDoc}
									highlights={highlights}
									enableAreaSelection={(event) => event.altKey}
									onSelectionFinished={handleSelectionFinished}
									onScrollChange={() => {}}
									highlightTransform={highlightTransform}
								/>
							</>
						);
					}}
				</PdfLoader>
			</div>

			{/* Sidebar Panel */}
			<Sidebar
				summaries={summaries}
				highlights={highlights}
				onOpenSummary={handleOpenSummary}
				onScrollToHighlight={scrollToHighlight}
			/>

			{/* Status Bar */}
			<StatusBar
				pdfName={pdfName}
				currentPage={currentPage}
				isSummarizing={isSummarizing}
				onBack={onBack}
				onSummarize={handleSummarizeClick}
				onClearData={clearData}
				canSummarize={!!pdfDocumentRef.current}
			/>
		</div>
	);
}

export default PdfHighlighterViewer;


import "./App.css";
import StaticPdfList from "./components/pdf/PdfLibrary";
import React, { useState } from "react";
import PdfHighlighterViewer from "./components/pdf/PdfHighlighterViewer";
import { useApp } from "./AppContext";

function App() {
  const [selectedPdf, setSelectedPdf] = useState(null);
  const { isInitializing } = useApp();

  if (isInitializing) {
    return (
      <div className="initializing-overlay">
        <div className="initializing-spinner"></div>
        <p>Initializing AI services...</p>
      </div>
    );
  }

  return (
    <div>
      {!selectedPdf ? (
        <StaticPdfList onSelectPdf={(url) => setSelectedPdf(url)} />
      ) : (
        <PdfHighlighterViewer 
          url={selectedPdf} 
          onBack={() => setSelectedPdf(null)}
        />
      )}
    </div>
  );
}

export default App;

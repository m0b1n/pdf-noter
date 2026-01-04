import React, { useState, useEffect } from "react";
import pdfToText from "react-pdftotext";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { useApp } from "../../AppContext";

const PdfEmbedder = ({ pdfUrl }) => {
  const { vectorService } = useApp();
  const [status, setStatus] = useState("Start Processing");
  const [isReady, setIsReady] = useState(false);

  // Check if already embedded on mount
  useEffect(() => {
    vectorService.isSourceEmbedded(pdfUrl).then((exists) => {
      if (exists) {
        setIsReady(true);
        setStatus("Ready (Loaded from Local Storage)");
      }
    });
  }, [pdfUrl]);

  const embedPdf = async () => {
    try {
      setStatus("Fetching PDF...");
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const file = new File([blob], pdfUrl, {
        type: "application/pdf",
      });

      setStatus("Extracting Text...");
      const text = await pdfToText(file);

      setStatus("Chunking Content...");
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 800,
        chunkOverlap: 100,
      });
      const chunks = await splitter.splitText(text);

      for (let i = 0; i < chunks.length; i++) {
        setStatus(`Embedding: ${Math.round(((i + 1) / chunks.length) * 100)}%`);

        // Use the service methods - pass PDF URL as source
        await vectorService.embedAndSave(chunks[i], 0, pdfUrl);
      }

      setStatus("Complete!");
      setIsReady(true);
    } catch (err) {
      console.error(err);
      setStatus("Error: Check Ollama connection.");
    }
  };

  return (
    <button
      onClick={embedPdf}
      disabled={status.includes("%") || isReady}
      className={`px-4 py-2 rounded text-white ${
        isReady ? "bg-green-500" : "bg-blue-600"
      }`}
    >
      {status}
    </button>
  );
};

export default PdfEmbedder;


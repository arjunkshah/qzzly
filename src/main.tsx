import React from "react";
import ReactDOM from "react-dom/client";
import App from "@/App";
import "@/index.css";
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

// Clear user data on app load to avoid issues with in-memory server
localStorage.removeItem('quiz_io_current_user');

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

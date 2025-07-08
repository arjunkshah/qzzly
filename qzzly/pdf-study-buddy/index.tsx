import React from 'react';
import ReactDOM from 'react-dom/client';
import * as ReactRouterDom from 'react-router-dom';
import App from './App';
import * as pdfjsLib from 'pdfjs-dist';

// Setting the worker source for pdfjs-dist is crucial for it to work in a modern web environment.
// The previous method using new URL() failed because the base URL (import.meta.url) was not valid in this context.
// This new method constructs an absolute URL to the worker on the esm.sh CDN, using the library's version.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ReactRouterDom.HashRouter>
      <App />
    </ReactRouterDom.HashRouter>
  </React.StrictMode>
);
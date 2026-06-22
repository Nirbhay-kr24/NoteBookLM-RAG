import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global reset styles injected to match the dark vector engine aesthetic
const globalStyles = document.createElement("style");
globalStyles.innerHTML = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    margin: 0;
    background-color: #090a0f;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  /* Custom scrollbar styling for a consistent dark mode feel */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #0d0f17;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 99px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(99, 102, 241, 0.4);
  }
`;
document.head.appendChild(globalStyles);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
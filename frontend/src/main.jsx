import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);

// Register Service Worker for offline PWA capabilities if supported
if ("serviceWorker" in navigator && import.meta.env.VITE_ENABLE_SW !== "false") {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => console.log("[PWA] Service Worker registered with scope:", reg.scope))
      .catch((err) => console.warn("[PWA] Service Worker registration failed:", err));
  });
}


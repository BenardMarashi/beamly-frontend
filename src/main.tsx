import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { NextUIProvider } from "@nextui-org/react";
import { FirebaseProvider } from "./contexts/firebase-context";
import { AuthProvider } from "./contexts/AuthContext";
import App from "./App";
import "./i18n"; // Initialize i18n
import "./index.css";

// Add error logging
window.addEventListener('error', (e) => {
  console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

console.log('Starting Beamly app...');

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <FirebaseProvider>
        <AuthProvider>
          <NextUIProvider>
            <App />
          </NextUIProvider>
        </AuthProvider>
      </FirebaseProvider>
    </BrowserRouter>
  </React.StrictMode>
);
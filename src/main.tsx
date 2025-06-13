import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HeroUIProvider } from "@heroui/react";
import { FirebaseProvider } from "./contexts/firebase-context";
import App from "./App.tsx";
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
        <HeroUIProvider>
          <main className="text-foreground bg-background">
            <App />
          </main>
        </HeroUIProvider>
      </FirebaseProvider>
    </BrowserRouter>
  </React.StrictMode>
);
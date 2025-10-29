import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { PWAUtils } from "./lib/pwa-utils";

console.log('[main.tsx] Application starting...');
console.log('[main.tsx] Environment:', import.meta.env.MODE);

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  console.log('[main.tsx] Root element found, creating React root...');
  
  createRoot(rootElement).render(<App />);
  console.log('[main.tsx] React app rendered');
  
  PWAUtils.registerServiceWorker();
  PWAUtils.setupInstallPrompt();
  console.log('[main.tsx] PWA utilities initialized');
} catch (error) {
  console.error('[main.tsx] Fatal error during app initialization:', error);
  if (error instanceof Error) {
    console.error('[main.tsx] Error stack:', error.stack);
  }
  // Show user-friendly error
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui;padding:20px;">
      <div style="text-align:center;max-width:500px;">
        <h1 style="color:#ef4444;font-size:48px;margin-bottom:16px;">⚠️</h1>
        <h2 style="font-size:24px;margin-bottom:12px;">Failed to Load Application</h2>
        <p style="color:#666;margin-bottom:20px;">${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        <button onclick="location.reload()" style="background:#3b82f6;color:white;border:none;padding:12px 24px;border-radius:6px;cursor:pointer;font-size:16px;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
// Entry point: render the React app and register PWA helpers.






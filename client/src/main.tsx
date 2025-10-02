import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { PWAUtils } from "./lib/pwa-utils";

createRoot(document.getElementById("root")!).render(<App />);

PWAUtils.registerServiceWorker();
PWAUtils.setupInstallPrompt();

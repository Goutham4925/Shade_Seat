import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/pwaInstaller";

// Only register service worker, remove setupPWAInstall()
registerServiceWorker();

createRoot(document.getElementById("root")!).render(<App />);
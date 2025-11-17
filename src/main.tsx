import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, setupPWAInstall } from "./lib/pwaInstaller";

// Register PWA
registerServiceWorker();
setupPWAInstall();

createRoot(document.getElementById("root")!).render(<App />);

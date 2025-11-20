// Register service worker for PWA functionality
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // console.log('SW registered:', registration);

          // === ALWAYS CHECK FOR UPDATES ON LOAD ===
          navigator.serviceWorker.ready.then(() => {
            if (registration.active) {
              // Check for updates immediately on every page load
              registration.active.postMessage({ type: 'CHECK_FOR_UPDATE' });
              // console.log('[SW] Triggered update check on page load');
            }
          });

        })
        .catch((error) => {
          // console.log('SW registration failed:', error);
        });
    });
  }
}

// PWA install prompt
let deferredPrompt: any = null;

export function setupPWAInstall(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export async function promptPWAInstall(): Promise<boolean> {
  if (!deferredPrompt) {
    return false;
  }

  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  deferredPrompt = null;

  return outcome === 'accepted';
}

export function isPWAInstalled(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as any).standalone === true;
}
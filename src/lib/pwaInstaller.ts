// Register service worker for PWA functionality
export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);

          // === 12-HOUR UPDATE CHECK ===
          navigator.serviceWorker.ready.then(() => {
            const lastCheck = localStorage.getItem('sw-last-update') || '0';
            const now = Date.now();

            // 12 hours = 12 * 60 * 60 * 1000 ms
            if (now - Number(lastCheck) > 12 * 60 * 60 * 1000) {
              if (registration.active) {
                registration.active.postMessage({ type: 'CHECK_FOR_UPDATE' });
                console.log('[SW] Triggered 12-hour cache update');
                localStorage.setItem('sw-last-update', now.toString());
              }
            }
          });

        })
        .catch((error) => {
          console.log('SW registration failed:', error);
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

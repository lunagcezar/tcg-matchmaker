if ('serviceWorker' in navigator) {
  const swUrl = import.meta.env.QUASAR_PWA_SERVICE_WORKER_FILENAME;

  navigator.serviceWorker
    .register(swUrl, { scope: '/' })
    .then((registration) => {
      console.log('PWA: service worker registered');

      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('PWA: new content available; refreshing...');
            installing.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        });
      });
    })
    .catch((error) => {
      console.error('PWA: service worker registration error:', error);
    });
}

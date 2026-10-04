(() => {
  if (navigator.doNotTrack === '1' || navigator.globalPrivacyControl) return;
  fetch('/api/visit', { method: 'POST', credentials: 'same-origin', keepalive: true,
    headers: { 'X-LuckyBox-Page': location.pathname.includes('game') ? 'game' : 'home' }
  }).catch(() => {});
})();

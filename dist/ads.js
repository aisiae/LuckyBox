function initializeSiteAds() {
  const game = document.querySelector('#ladder-app');
  if (game) {
    if (game.hidden) return;
    document.querySelectorAll('.site-ad-game').forEach(ad => { ad.hidden = false; });
  }

  const ads = [...document.querySelectorAll('.site-ad .adsbygoogle')];
  if (!ads.length) return;
  if (!document.querySelector('script[src*="pagead/js/adsbygoogle.js"]')) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2199437791118691';
    script.crossOrigin = 'anonymous';
    document.head.append(script);
  }

  const requested = new WeakSet();
  function requestAd(ad) {
    if (requested.has(ad) || ad.closest('[hidden]') || ad.getBoundingClientRect().width === 0) return;
    requested.add(ad);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn('광고를 불러오지 못했습니다.', error);
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          requestAd(entry.target);
          observer.unobserve(entry.target);
        }
      });
    });
    ads.forEach(ad => observer.observe(ad));
  } else {
    ads.forEach(requestAd);
  }
}

// Module scripts finish setting up the game before DOMContentLoaded fires.
if (document.readyState !== 'complete') {
  document.addEventListener('DOMContentLoaded', initializeSiteAds, { once: true });
} else {
  initializeSiteAds();
}

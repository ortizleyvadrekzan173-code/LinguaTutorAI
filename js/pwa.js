/* PWA Registration */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered:', reg.scope);
    }).catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}

/* Detect PWA install prompt */
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  const existing = document.querySelector('.install-banner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.className = 'install-banner';
  banner.innerHTML = `
    <span>📲 Instala LinguaTutor AI</span>
    <button id="install-btn">Instalar</button>
    <button id="install-close">✕</button>
  `;
  document.body.appendChild(banner);
  banner.querySelector('#install-btn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') console.log('App installed');
    banner.remove();
    deferredPrompt = null;
  });
  banner.querySelector('#install-close').addEventListener('click', () => banner.remove());
}

/* Add install banner styles dynamically */
const style = document.createElement('style');
style.textContent = `
  .install-banner {
    position: fixed; bottom: 70px; left: 12px; right: 12px;
    background: var(--accent-gradient); color: white; padding: 12px 16px;
    border-radius: var(--radius-sm); display: flex; align-items: center; gap: 10px;
    z-index: 1000; box-shadow: var(--shadow); animation: fadeUp 0.3s ease;
    max-width: 456px; margin: 0 auto;
  }
  .install-banner span { flex: 1; font-size: 14px; font-weight: 500; }
  .install-banner button { cursor: pointer; transition: var(--transition); }
  .install-banner #install-btn {
    background: white; color: var(--accent-2); border: none; padding: 8px 16px;
    border-radius: 8px; font-weight: 600; font-size: 13px;
  }
  .install-banner #install-btn:hover { transform: scale(1.05); }
  .install-banner #install-close {
    background: transparent; border: none; color: rgba(255,255,255,0.7);
    font-size: 18px; padding: 4px;
  }
  .install-banner #install-close:hover { color: white; }

  @media (min-width: 768px) {
    .install-banner { left: 50%; transform: translateX(-50%); width: 456px; }
  }
`;
document.head.appendChild(style);

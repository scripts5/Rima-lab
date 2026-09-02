import { registerSW } from 'virtual:pwa-register';

export function setupServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    const updateSW = registerSW({
      onNeedRefresh() {
        console.log('Nova versão do RimaLab disponível.');
        // Auto-update or prompt
        updateSW(true);
      },
      onOfflineReady() {
        console.log('RimaLab está pronto para uso offline como aplicativo!');
      },
      onRegisterError(error) {
        console.debug('Falha no registro do Service Worker:', error);
      },
    });
  }
}

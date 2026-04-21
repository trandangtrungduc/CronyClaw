import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { LAppAdapter } from '../WebSDK/src/lappadapter';
import './i18n';

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('onnxruntime')) {
    return;
  }
  originalConsoleWarn.apply(console, args);
};

// Suppress specific console.error messages from @chatscope/chat-ui-kit-react
const originalConsoleError = console.error;
const errorMessagesToIgnore = ["Warning: Failed"];
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string') {
    const shouldIgnore = errorMessagesToIgnore.some(msg => args[0].startsWith(msg));
    if (shouldIgnore) {
      return; // Suppress the warning
    }
  }
  // Call the original console.error for other messages
  originalConsoleError.apply(console, args);
};

if (typeof window !== 'undefined') {
  (window as any).getLAppAdapter = () => LAppAdapter.getInstance();

  const renderApp = () => {
    createRoot(document.getElementById('root')!).render(
      <App />,
    );
  };

  const loadLive2DCore = async () => {
    const candidates = [
      './libs/live2dcubismcore.js',
      './libs/live2dcubismcore.min.js',
      '/libs/live2dcubismcore.js',
      '/libs/live2dcubismcore.min.js',
      new URL('./libs/live2dcubismcore.js', window.location.href).toString(),
      new URL('./libs/live2dcubismcore.min.js', window.location.href).toString(),
    ];
    for (const src of candidates) {
      const ok = await new Promise<boolean>((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
      if (ok) {
        return;
      }
    }
    throw new Error('live2dcubismcore.js not found');
  };

  loadLive2DCore()
    .catch((error) => {
      console.error('Live2D core load failed, continue without blocking app start:', error);
    })
    .finally(() => {
      renderApp();
    });
}

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { injectFonts } from './lib/fonts.js';

// Этап 7.3: @font-face инжектится с BASE_URL — работает и в корне, и в подпапке
injectFonts();

// Этап 6.6: регистрация Service Worker (офлайн-кеш) при первом визите
if ('serviceWorker' in navigator) {
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
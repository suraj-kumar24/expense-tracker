import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import './organic.css';
import './theme.css';
import './app.css';
import App from './App';

registerSW({ immediate: true });

// Track the visible viewport. Android Chrome also shrinks the page for the keyboard
// (interactive-widget in index.html); iPhone Safari doesn't, so this covers it.
const vv = window.visualViewport;
if (vv) {
  const fit = () => {
    document.documentElement.style.setProperty('--vv-height', vv.height + 'px');
    document.documentElement.style.setProperty('--vv-top', vv.offsetTop + 'px');
  };
  vv.addEventListener('resize', fit);
  vv.addEventListener('scroll', fit);
  fit();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

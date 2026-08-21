import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AppProvider } from './context/AppContext';
import './index.css';

// Prevent accidental double-tap zoom on iOS & Android browsers
if (typeof window !== 'undefined') {
  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false }
  );

  // Prevent gesture zoom (pinch zoom) on mobile browsers
  document.addEventListener(
    'gesturestart',
    (e) => {
      e.preventDefault();
    },
    { passive: false }
  );

  // Lock screen to Portrait globally (landscape only allowed inside video fullscreen).
  // Note: orientation lock only takes effect in installed PWA / fullscreen contexts;
  // regular browser tabs will silently ignore this (no error thrown to user).
  const lockPortrait = () => {
    try {
      const orientation = screen.orientation as any;
      if (orientation && typeof orientation.lock === 'function') {
        orientation.lock('portrait').catch(() => {
          // Ignored: browser doesn't allow lock outside fullscreen/PWA
        });
      }
    } catch {
      // ignore
    }
  };

  lockPortrait();
  window.addEventListener('load', lockPortrait);
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('PWA Service Worker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.error('PWA Service Worker registration failed:', error);
      });
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
);

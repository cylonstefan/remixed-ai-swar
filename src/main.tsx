import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safe sandbox-resilient polyfills for window.alert and window.confirm
if (typeof window !== 'undefined') {
  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  })();

  const nativeConfirm = window.confirm;
  window.confirm = (message?: string) => {
    console.log("[CONFIRM CALLED]:", message);
    if (isInIframe) {
      console.warn("[SANDBOX PROTECTION] window.confirm was auto-approved inside iframe sandbox:", message);
      return true;
    }
    try {
      return nativeConfirm.call(window, message);
    } catch (e) {
      console.warn("[SANDBOX PROTECTION] window.confirm fell back to auto-approve:", message);
      return true;
    }
  };

  const nativeAlert = window.alert;
  window.alert = (message?: any) => {
    console.log("[ALERT CALLED]:", message);
    if (isInIframe) {
      console.warn("[SANDBOX PROTECTION] window.alert was blocked inside iframe sandbox:", message);
      return;
    }
    try {
      nativeAlert.call(window, message);
    } catch (e) {
      console.warn("[SANDBOX PROTECTION] window.alert felt back to logging:", message);
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);


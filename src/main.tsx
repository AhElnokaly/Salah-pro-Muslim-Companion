import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Unregister active Service Workers ONLY in dev/preview environments to prevent cache interference
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isDevOrPreview = window.location.hostname.includes('run.app') || 
                         window.location.hostname.includes('aistudio') || 
                         window.location.hostname === 'localhost';
  if (isDevOrPreview) {
    try {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      }).catch(() => {
        // Ignore cleanup errors
      });
    } catch (e) {
      // Ignore
    }
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
  } catch (err) {
    console.error('[Root Mount Error]', err);
    rootElement.innerHTML = `
      <div style="min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background-color: #faf7f0; color: #1e293b; font-family: system-ui, sans-serif; padding: 24px; text-align: center;" dir="rtl">
        <h2 style="font-size: 20px; font-weight: bold; color: #047857; margin-bottom: 12px;">هِمَّتِي — جاري إعادة التهيئة</h2>
        <p style="color: #64748b; font-size: 14px; margin-bottom: 20px;">حدث تأخير أثناء تحميل الواجهة. اضغط الزر أدناه للتحديث الفوري.</p>
        <button onclick="window.location.reload()" style="background-color: #059669; color: white; border: none; padding: 10px 24px; border-radius: 9999px; font-weight: bold; cursor: pointer;">تحديث الصفحة</button>
      </div>
    `;
  }
}



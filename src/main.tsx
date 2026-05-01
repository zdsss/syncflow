import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import './i18n';

async function bootstrap() {
  if (import.meta.env.DEV) {
    try {
      const { worker } = await import('./mocks/browser');
      await worker.start({ onUnhandledRequest: 'bypass' });
    } catch (e) {
      console.warn('MSW failed to start:', e);
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

bootstrap();

import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { SalaryPrivacyProvider } from './context/SalaryPrivacyContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SalaryPrivacyProvider>
      <App />
    </SalaryPrivacyProvider>
  </StrictMode>,
);

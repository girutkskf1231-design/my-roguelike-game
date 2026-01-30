import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorFallback } from './components/ErrorFallback.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorFallback>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </ErrorFallback>
  </StrictMode>,
)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { WeaponCompendium } from './components/WeaponCompendium.tsx'
import { ErrorFallback } from './components/ErrorFallback.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ToastProvider } from './contexts/ToastContext.tsx'

// 요청 취소(탭 전환/언마운트 등)로 인한 AbortError는 정상 동작이므로 콘솔에 노출하지 않음
window.addEventListener('unhandledrejection', (event) => {
  const e = event.reason
  if (e instanceof Error && (e.name === 'AbortError' || e.message?.includes('aborted'))) {
    event.preventDefault()
    event.stopImmediatePropagation()
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorFallback>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/compendium" element={<WeaponCompendium />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorFallback>
  </StrictMode>,
)

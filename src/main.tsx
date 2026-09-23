import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Inicialización de tema corporativo (por defecto Modo Claro)
const savedTheme = localStorage.getItem('sfg_theme');
document.body.removeAttribute('data-theme');
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark');
  document.body.classList.remove('light-mode');
} else {
  document.documentElement.setAttribute('data-theme', 'light');
  document.body.classList.add('light-mode');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

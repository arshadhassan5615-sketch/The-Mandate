import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useGameStore } from './stores/gameStore'

// The game boots straight into the prologue, so every page load starts a new
// game — otherwise the persisted week from the previous session bleeds through.
useGameStore.getState().bootNewGame()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

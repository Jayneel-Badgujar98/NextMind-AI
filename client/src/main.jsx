import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)


// Original version of vite and not downgradade
//     // "vite": "^8.0.0"
// -  // "@vitejs/plugin-react": "^6.0.0",

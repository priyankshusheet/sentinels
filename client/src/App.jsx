import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [serverStatus, setServerStatus] = useState('Checking...')
  const [isOnline, setIsOnline] = useState(false)
  const [lastCheck, setLastCheck] = useState(null)

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await axios.get('/api/health')
        setServerStatus(response.data.message)
        setIsOnline(true)
        setLastCheck(new Date().toLocaleTimeString())
      } catch (error) {
        setServerStatus('Offline - Check backend terminal')
        setIsOnline(false)
        setLastCheck(new Date().toLocaleTimeString())
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30000) // Check every 30s
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="app-container">
      <header>
        <div className="logo">SENTINELS</div>
        <div className="status-badge" title={`Last checked: ${lastCheck}`}>
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`}></span>
          {isOnline ? 'Network Active' : 'Network Interrupted'}
        </div>
      </header>

      <main className="hero">
        <h1>Guardians of the Stack.</h1>
        <p>A high-performance MERN architecture configured for security, scalability, and speed.</p>
      </main>

      <section className="grid">
        <div className="card">
          <div className="glow" style={{ top: '-50px', right: '-50px', background: '#6366f1' }}></div>
          <h3>Backend Core</h3>
          <p>{serverStatus}</p>
          <p style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Node.js / Express / Mongoose
          </p>
        </div>

        <div className="card">
          <div className="glow" style={{ bottom: '-50px', left: '-50px', background: '#22d3ee' }}></div>
          <h3>Frontend Engine</h3>
          <p>Running on Vite 8.0 & React 19. Optimized for ultra-fast HMR and low bundle size.</p>
        </div>

        <div className="card">
          <h3>Database Layer</h3>
          <p>MongoDB connection established. Schema-ready with Mongoose models and validation.</p>
        </div>
      </section>

      <footer>
        <p>© {new Date().getFullYear()} Sentinels Project. Initialized with Premium Stack.</p>
      </footer>
    </div>
  )
}

export default App

import { useEffect, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? 'http://localhost:5000' : '')
const GITHUB_REPO_URL = 'https://github.com/Dhanajaysingh/documind-ai'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [authMode, setAuthMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authStatus, setAuthStatus] = useState('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [selectedFile, setSelectedFile] = useState(null)
  const [status, setStatus] = useState('')
  const [documentation, setDocumentation] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const loadDocuments = async () => {
    const response = await fetch(`${API_BASE_URL}/api/docs`, {
      credentials: 'include',
    })

    if (!response.ok) {
      return
    }

    const data = await response.json()
    setDocuments(data.documents || [])
  }

  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          credentials: 'include',
        })

        if (!response.ok) {
          return
        }

        const data = await response.json()
        setCurrentUser(data.user)
        await loadDocuments()
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkCurrentUser()
  }, [])

  const handleAuthSubmit = async (event) => {
    event.preventDefault()
    setAuthStatus('')

    const endpoint = authMode === 'login' ? 'login' : 'register'
    const payload = authMode === 'login'
      ? { email, password }
      : { name, email, password }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed')
      }

      setCurrentUser(data.user)
      setName('')
      setPassword('')
      setAuthStatus('')
      await loadDocuments()
    } catch (error) {
      setAuthStatus(
        error.message === 'Failed to fetch'
          ? 'Could not reach the backend. Make sure the server is running on port 5000.'
          : error.message
      )
    }
  }

  const handleLogout = async () => {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })

    setCurrentUser(null)
    setSelectedFile(null)
    setStatus('')
    setDocumentation('')
    setDownloadUrl('')
    setDocuments([])
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]
    setSelectedFile(file)
    setStatus('')
    setDocumentation('')
    setDownloadUrl('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!selectedFile) {
      setStatus('Please choose a zip file first.')
      return
    }

    const formData = new FormData()
    formData.append('codebase', selectedFile)

    try {
      setIsLoading(true)
      setStatus('Uploading codebase and generating documentation...')
      setDocumentation('')
      setDownloadUrl('')

      const response = await fetch(`${API_BASE_URL}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      setDocumentation(data.documentation)
      setDownloadUrl(`${API_BASE_URL}${data.documentationDownloadUrl}`)
      setStatus('Documentation generated successfully.')
      await loadDocuments()
    } catch (error) {
      setStatus(
        error.message === 'Failed to fetch'
          ? 'Could not reach the backend. Make sure the server is running on port 5000.'
          : error.message
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <main className="app-shell">
        <div className="loading-screen">Loading RepoDocs...</div>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <img className="brand-icon" src="/ai-technology.svg" alt="RepoDocs" />
            <div>
              <span>REPODOCS</span>
              <small>Code docs workspace</small>
            </div>
          </div>

          <nav className="header-nav" aria-label="Primary navigation">
            <a href="#features">FEATURES</a>
            <a href="#workspace">WORKSPACE</a>
            {currentUser && <a href="#dashboard">DASHBOARD</a>}
          </nav>

          <div className="header-actions">
            <a className="utility-pill" href={GITHUB_REPO_URL} target="_blank" rel="noreferrer" title="GitHub repository">
              <svg className="github-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z" />
              </svg>
            </a>

            {currentUser && (
              <div className="user-menu">
                <span
                  className="user-avatar"
                  title={currentUser.name}
                  aria-label={`Signed in as ${currentUser.name}`}
                >
                  {currentUser.name.charAt(0).toUpperCase()}
                </span>
                <button type="button" className="ghost-button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="hero-card" id="workspace">
        <div className="hero-top">
          <div className="hero-copy">
            <p className="eyebrow">AI documentation workspace</p>
            <h1>Turn any code archive into polished project documentation.</h1>
            <p className="subtitle">
              Upload a zipped project, let the backend scan the code, and receive clear Markdown documentation with a downloadable output.
            </p>

            <ul className="feature-list">
              <li>Zip uploads with secure account access</li>
              <li>Smart code scanning and extraction</li>
              <li>AI-generated Markdown with saved history</li>
            </ul>

            <div className="hero-actions">
              <a className="secondary-link" href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
                View source on GitHub
              </a>
            </div>
          </div>

          {currentUser ? (
            <div className="upload-card">
              <form className="upload-form" onSubmit={handleSubmit}>
                <label className="file-picker">
                  <span>{selectedFile ? selectedFile.name : 'Choose a .zip file'}</span>
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleFileChange}
                  />
                </label>

                <button type="submit" disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Documentation'}
                </button>
              </form>

              <p className={`status-text ${isLoading ? 'status-loading' : ''}`} role="status">
                {status || 'Drop in your project archive and create docs in seconds.'}
              </p>
            </div>
          ) : (
            <div className="auth-card">
              <div className="auth-tabs">
                <button
                  type="button"
                  className={authMode === 'login' ? 'active' : ''}
                  onClick={() => setAuthMode('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={authMode === 'register' ? 'active' : ''}
                  onClick={() => setAuthMode('register')}
                >
                  Register
                </button>
              </div>

              <form className="auth-form" onSubmit={handleAuthSubmit}>
                {authMode === 'register' && (
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                )}

                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />

                <button type="submit">
                  {authMode === 'login' ? 'Login' : 'Create Account'}
                </button>
              </form>

              {authStatus && <p className="status-text">{authStatus}</p>}
            </div>
          )}
        </div>
      </section>

      {currentUser && (
        <>
          <section className="dashboard-card" id="dashboard">
            <div className="result-header">
              <h2>Scanned Documents Dashboard</h2>
              <button type="button" className="ghost-button" onClick={loadDocuments}>
                Refresh
              </button>
            </div>

            {documents.length > 0 ? (
              <div className="document-list">
                {documents.map((document) => (
                  <article className="document-row" key={document.fileName}>
                    <div>
                      <h3>{document.fileName}</h3>
                      <p>
                        {Math.round(document.size / 1024)} KB - {new Date(document.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="document-actions">
                      <a href={`${API_BASE_URL}${document.viewUrl}`} target="_blank" rel="noreferrer">
                        View
                      </a>
                      <a href={`${API_BASE_URL}${document.downloadUrl}`}>
                        Download
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state small">
                Your generated documents will appear here.
              </div>
            )}
          </section>

          <section className="result-card">
            <div className="result-header">
              <h2>Documentation Output</h2>

              {downloadUrl && (
                <a className="download-output-link" href={downloadUrl}>
                  Download Markdown
                </a>
              )}
            </div>

            {documentation ? (
              <pre className="documentation-box">{documentation}</pre>
            ) : (
              <div className="empty-state">
                Generated documentation will appear here after your upload finishes.
              </div>
            )}
          </section>
        </>
      )}

      <section className="feature-band" id="features">
        <article>
          <span>01</span>
          <h2>Upload</h2>
          <p>Send a zipped codebase through the secured upload flow.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Analyze</h2>
          <p>Extract, scan, and prepare source files for AI documentation.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Export</h2>
          <p>Save generated Markdown in your dashboard and download it anytime.</p>
        </article>
      </section>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>
            <div className="brand footer-brand">
              <img className="brand-icon" src="/ai-technology.svg" alt="RepoDocs" />
              <div>
                <span>REPODOCS</span>
                <small>Built for fast project documentation.</small>
              </div>
            </div>
          </div>

          <div className="footer-meta">
            <span>© 2026 REPODOCS. OPEN SOURCE PROJECT.</span>
          </div>

          <div className="footer-links">
            <a href={GITHUB_REPO_URL} target="_blank" rel="noreferrer">
              <svg className="github-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="currentColor" d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.62-5.47 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0 0 12 .5Z" />
              </svg>
              <span>REPOSITORY</span>
            </a>
           
          </div>
        </div>
      </footer>
    </main>
  )
}

export default App

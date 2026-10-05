import { useEffect, useState, type FormEvent } from 'react'
import { getAuthStatus, loginWithPasskey, registerPasskey, type AuthStatus } from './auth'

// Pantalla provisional: estado del server y login con passkey. En la fase 1 esto pasa a Ajustes.
export function App() {
  const [status, setStatus] = useState<AuthStatus | 'offline' | null>(null)
  const [setupToken, setSetupToken] = useState('')
  const [error, setError] = useState<string | null>(null)

  const refresh = () =>
    getAuthStatus()
      .then(setStatus)
      .catch(() => setStatus('offline'))

  useEffect(() => {
    refresh()
  }, [])

  const run = (action: () => Promise<void>) => {
    setError(null)
    action()
      .then(refresh)
      .catch(() => setError('No se pudo completar. Inténtalo de nuevo.'))
  }

  const onRegister = (event: FormEvent) => {
    event.preventDefault()
    run(() => registerPasskey(setupToken.trim()))
  }

  return (
    <main className="hello">
      <img src="/icon.svg" alt="" width={96} height={96} />
      <h1>Self Grow</h1>

      {status === null && <p className="status">Conectando…</p>}

      {status === 'offline' && (
        <p className="status">
          <span className="dot red" />
          Server sin conexión (modo offline)
        </p>
      )}

      {status !== null && status !== 'offline' && (
        <p className="status">
          <span className="dot green" />
          {status.authenticated ? 'Server online · sesión iniciada' : 'Server online'}
        </p>
      )}

      {status !== null && status !== 'offline' && !status.authenticated && status.registered && (
        <button className="button" onClick={() => run(loginWithPasskey)}>
          Entrar con Face ID
        </button>
      )}

      {status !== null && status !== 'offline' && !status.authenticated && !status.registered && (
        <form className="setup" onSubmit={onRegister}>
          <input
            className="input"
            placeholder="Código de configuración"
            autoComplete="off"
            value={setupToken}
            onChange={(event) => setSetupToken(event.target.value)}
          />
          <button className="button" disabled={!setupToken.trim()}>
            Registrar este iPhone
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  )
}

import { useEffect, useState } from 'react'

type Health = { ok: boolean; time: string }

// Pantalla provisional de la fase 0: confirma que la PWA carga y si el server responde.
export function App() {
  const [health, setHealth] = useState<Health | 'offline' | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then(setHealth)
      .catch(() => setHealth('offline'))
  }, [])

  return (
    <main className="hello">
      <img src="/icon.svg" alt="" width={96} height={96} />
      <h1>Self Grow</h1>
      <p className="status">
        {health === null && 'Conectando…'}
        {health === 'offline' && <span className="dot red" />}
        {health === 'offline' && 'Server sin conexión (modo offline)'}
        {health && health !== 'offline' && <span className="dot green" />}
        {health && health !== 'offline' && 'Server online'}
      </p>
    </main>
  )
}

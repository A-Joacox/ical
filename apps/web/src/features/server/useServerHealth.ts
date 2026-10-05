import { useEffect, useState } from 'react'
import { api } from '../../api'

export type ServerHealth = 'checking' | 'online' | 'offline'

// Consulta /api/health (público) una vez al montar el componente.
export function useServerHealth(): ServerHealth {
  const [health, setHealth] = useState<ServerHealth>('checking')

  useEffect(() => {
    api('/health')
      .then(() => setHealth('online'))
      .catch(() => setHealth('offline'))
  }, [])

  return health
}

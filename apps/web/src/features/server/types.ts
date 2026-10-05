// Respuesta de GET /api/status. Misma forma que `ServerStatus` en apps/server/src/glances.ts.
export type ServerStatus = {
  hostname: string
  uptime: string
  cpuPercent: number
  load: [number, number, number]
  memPercent: number
  memUsed: number
  memTotal: number
  swapPercent: number
  disks: { mount: string; device: string; used: number; size: number; percent: number }[]
  temps: { label: string; value: number }[]
  battery?: { percent: number; charging: boolean }
  gpus: { name: string; temperature?: number; proc?: number }[]
  containers: { name: string; status: string; cpuPercent: number; memUsage: number }[]
}

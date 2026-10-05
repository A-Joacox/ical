// Lee las métricas del host desde la API REST de Glances (v4) y las resume para la app.

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

type Raw = Record<string, any>

// Docker monta estos archivos dentro del contenedor de Glances; viven en el disco raíz del host.
const CONTAINER_BIND_FILES = new Set(['/etc/hostname', '/etc/hosts', '/etc/resolv.conf'])
// Por debajo de esto son montajes de archivos sueltos o sistemas de solo lectura (p. ej. os-release).
const MIN_DISK_BYTES = 1e9

/** Un contenedor con healthcheck informa "healthy"/"starting" en vez de "running". */
export const isContainerUp = (status: string) => ['running', 'healthy', 'starting'].includes(status)

/** Convierte las respuestas crudas de Glances en el resumen que muestra la app. */
export function summarizeGlances(raw: {
  system: Raw
  uptime: string
  cpu: Raw
  load: Raw
  mem: Raw
  memswap: Raw
  fs: Raw[]
  sensors: Raw[]
  gpu: Raw[]
  containers: Raw[]
}): ServerStatus {
  // Dentro del contenedor los bind mounts repiten el disco del host: uno por dispositivo.
  const disks = new Map<string, ServerStatus['disks'][number]>()
  for (const fs of raw.fs) {
    if (fs.size < MIN_DISK_BYTES || disks.has(fs.device_name)) continue
    disks.set(fs.device_name, {
      mount: CONTAINER_BIND_FILES.has(fs.mnt_point) ? '/' : fs.mnt_point,
      device: fs.device_name,
      used: fs.used,
      size: fs.size,
      percent: fs.percent,
    })
  }
  const battery = raw.sensors.find((s) => s.type === 'battery')

  return {
    hostname: raw.system.hostname ?? '',
    uptime: raw.uptime,
    cpuPercent: raw.cpu.total ?? 0,
    load: [raw.load.min1 ?? 0, raw.load.min5 ?? 0, raw.load.min15 ?? 0],
    memPercent: raw.mem.percent ?? 0,
    memUsed: raw.mem.used ?? 0,
    memTotal: raw.mem.total ?? 0,
    swapPercent: raw.memswap.percent ?? 0,
    disks: [...disks.values()].sort((a, b) => b.size - a.size),
    temps: raw.sensors
      .filter((s) => s.type === 'temperature_core' && typeof s.value === 'number' && s.value > 0)
      .map((s) => ({ label: s.label, value: s.value })),
    battery: battery ? { percent: battery.value, charging: battery.status !== 'Discharging' } : undefined,
    gpus: raw.gpu.map((g) => ({ name: g.name, temperature: g.temperature ?? undefined, proc: g.proc ?? undefined })),
    containers: raw.containers
      .map((c) => ({ name: c.name, status: c.status, cpuPercent: c.cpu_percent ?? 0, memUsage: c.memory_usage ?? 0 }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  }
}

/** Pide todos los endpoints a Glances en paralelo. Lanza si Glances no responde. */
export async function fetchServerStatus(baseUrl: string): Promise<ServerStatus> {
  const get = async (endpoint: string) => {
    const res = await fetch(`${baseUrl}/api/4/${endpoint}`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`glances ${endpoint}: ${res.status}`)
    return res.json()
  }
  // GPU y contenedores son opcionales (sin GPU NVIDIA o sin acceso a Docker devuelven error).
  const optional = (endpoint: string) => get(endpoint).catch(() => [])

  const [system, uptime, cpu, load, mem, memswap, fs, sensors, gpu, containers] = await Promise.all([
    get('system'),
    get('uptime'),
    get('cpu'),
    get('load'),
    get('mem'),
    get('memswap'),
    get('fs'),
    get('sensors'),
    optional('gpu'),
    optional('containers'),
  ])
  return summarizeGlances({ system, uptime, cpu, load, mem, memswap, fs, sensors, gpu, containers })
}

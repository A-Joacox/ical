import type { ServerStatus } from './glances.ts'
import type { Lang, PushMessage } from './push.ts'

export const DISK_ALERT_PERCENT = 90
export const TEMP_ALERT_CELSIUS = 85
const COOLDOWN_MS = 60 * 60 * 1000

export type Alert =
  | { key: string; kind: 'disk'; mount: string; percent: number }
  | { key: string; kind: 'temp'; label: string; value: number }
  | { key: string; kind: 'container'; name: string; status: string }
  | { key: string; kind: 'power'; percent: number }

export type AlertState = {
  /** Última vez que se envió cada alerta (para no repetirla más de una vez por hora). */
  lastSent: Record<string, number>
  /** Estado de cada contenedor en la revisión anterior. */
  containers: Record<string, string>
}

export const initialAlertState = (): AlertState => ({ lastSent: {}, containers: {} })

/** Decide qué alertas enviar. Función pura: recibe el estado anterior y devuelve el nuevo. */
export function evaluateAlerts(status: ServerStatus, state: AlertState, now: number) {
  const candidates: Alert[] = []

  for (const disk of status.disks) {
    if (disk.percent >= DISK_ALERT_PERCENT) {
      candidates.push({ key: `disk:${disk.device}`, kind: 'disk', mount: disk.mount, percent: disk.percent })
    }
  }

  const hottest = [...status.temps, ...status.gpus.flatMap((g) => (g.temperature ? [{ label: g.name, value: g.temperature }] : []))]
    .sort((a, b) => b.value - a.value)[0]
  if (hottest && hottest.value >= TEMP_ALERT_CELSIUS) {
    candidates.push({ key: 'temp', kind: 'temp', label: hottest.label, value: hottest.value })
  }

  // Solo avisa cuando un contenedor que estaba corriendo deja de hacerlo.
  for (const container of status.containers) {
    if (state.containers[container.name] === 'running' && container.status !== 'running') {
      candidates.push({ key: `container:${container.name}`, kind: 'container', name: container.name, status: container.status })
    }
  }

  // La laptop funcionando con batería suele significar un corte de luz.
  if (status.battery && !status.battery.charging) {
    candidates.push({ key: 'power', kind: 'power', percent: status.battery.percent })
  }

  const alerts = candidates.filter((a) => {
    const last = state.lastSent[a.key]
    return a.kind === 'container' || last === undefined || now - last >= COOLDOWN_MS
  })
  const nextState: AlertState = {
    lastSent: { ...state.lastSent, ...Object.fromEntries(alerts.map((a) => [a.key, now])) },
    containers: Object.fromEntries(status.containers.map((c) => [c.name, c.status])),
  }
  return { alerts, state: nextState }
}

const TEXTS = {
  es: {
    disk: (a: Extract<Alert, { kind: 'disk' }>) => ['Disco casi lleno', `${a.mount} al ${Math.round(a.percent)}%`],
    temp: (a: Extract<Alert, { kind: 'temp' }>) => ['Temperatura alta', `${a.label}: ${Math.round(a.value)} °C`],
    container: (a: Extract<Alert, { kind: 'container' }>) => ['Contenedor detenido', `${a.name} (${a.status})`],
    power: (a: Extract<Alert, { kind: 'power' }>) => ['El server está usando la batería', `Batería al ${a.percent}%. ¿Corte de luz?`],
  },
  en: {
    disk: (a: Extract<Alert, { kind: 'disk' }>) => ['Disk almost full', `${a.mount} at ${Math.round(a.percent)}%`],
    temp: (a: Extract<Alert, { kind: 'temp' }>) => ['High temperature', `${a.label}: ${Math.round(a.value)} °C`],
    container: (a: Extract<Alert, { kind: 'container' }>) => ['Container stopped', `${a.name} (${a.status})`],
    power: (a: Extract<Alert, { kind: 'power' }>) => ['Server is on battery', `Battery at ${a.percent}%. Power outage?`],
  },
}

export function alertMessage(alert: Alert, lang: Lang): PushMessage {
  const [title, body] = (TEXTS[lang][alert.kind] as (a: Alert) => string[])(alert)
  return { title, body, tag: alert.key, url: '/server' }
}

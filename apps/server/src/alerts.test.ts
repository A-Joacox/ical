import { describe, expect, test } from 'vitest'
import { alertMessage, evaluateAlerts, initialAlertState } from './alerts.ts'
import type { ServerStatus } from './glances.ts'

const status = (overrides: Partial<ServerStatus> = {}): ServerStatus => ({
  hostname: 'server',
  uptime: '1:00:00',
  cpuPercent: 10,
  load: [0.1, 0.1, 0.1],
  memPercent: 40,
  memUsed: 1,
  memTotal: 2,
  swapPercent: 0,
  disks: [{ mount: '/', device: '/dev/sda1', used: 50, size: 100, percent: 50 }],
  temps: [{ label: 'Package id 0', value: 50 }],
  battery: { percent: 100, charging: true },
  gpus: [],
  containers: [{ name: 'app', status: 'running', cpuPercent: 1, memUsage: 1 }],
  ...overrides,
})

const HOUR = 60 * 60 * 1000

describe('evaluateAlerts', () => {
  test('sin problemas no hay alertas', () => {
    expect(evaluateAlerts(status(), initialAlertState(), 0).alerts).toEqual([])
  })

  test('disco lleno, temperatura alta y batería avisan una vez por hora', () => {
    const bad = status({
      disks: [{ mount: '/', device: '/dev/sda1', used: 95, size: 100, percent: 95 }],
      temps: [{ label: 'Package id 0', value: 92 }],
      battery: { percent: 80, charging: false },
    })
    const first = evaluateAlerts(bad, initialAlertState(), 0)
    expect(first.alerts.map((a) => a.kind)).toEqual(['disk', 'temp', 'power'])

    expect(evaluateAlerts(bad, first.state, HOUR - 1).alerts).toEqual([])
    expect(evaluateAlerts(bad, first.state, HOUR).alerts).toHaveLength(3)
  })

  test('avisa cuando un contenedor que corría se detiene (no si ya estaba detenido)', () => {
    const running = evaluateAlerts(status(), initialAlertState(), 0)
    const stopped = status({ containers: [{ name: 'app', status: 'exited', cpuPercent: 0, memUsage: 0 }] })

    const next = evaluateAlerts(stopped, running.state, 1000)
    expect(next.alerts).toEqual([{ key: 'container:app', kind: 'container', name: 'app', status: 'exited' }])
    expect(evaluateAlerts(stopped, next.state, 2000).alerts).toEqual([])
  })

  test('mensajes en el idioma de la suscripción', () => {
    const alert = { key: 'power', kind: 'power', percent: 70 } as const
    expect(alertMessage(alert, 'es').title).toBe('El server está usando la batería')
    expect(alertMessage(alert, 'en').body).toBe('Battery at 70%. Power outage?')
  })
})

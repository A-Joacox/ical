import { expect, test } from 'vitest'
import { summarizeGlances } from './glances.ts'

test('resume las respuestas de Glances', () => {
  const status = summarizeGlances({
    system: { hostname: 'j1-msi' },
    uptime: '3 days, 4:05:06',
    cpu: { total: 12.5 },
    load: { min1: 0.5, min5: 0.4, min15: 0.3 },
    mem: { percent: 61, used: 5e9, total: 8e9 },
    memswap: { percent: 3 },
    fs: [
      { device_name: '/dev/nvme0n1p2', mnt_point: '/', used: 50e9, size: 250e9, percent: 20 },
      // Bind mount del mismo disco dentro del contenedor: no debe repetirse.
      { device_name: '/dev/nvme0n1p2', mnt_point: '/etc/hosts', used: 50e9, size: 250e9, percent: 20 },
      { device_name: '/dev/sda1', mnt_point: '/media/data', used: 900e9, size: 1000e9, percent: 90 },
    ],
    sensors: [
      { label: 'Package id 0', type: 'temperature_core', value: 55, unit: 'C' },
      { label: 'acpitz 1', type: 'temperature_core', value: 0, unit: 'C' },
      { label: 'Battery', type: 'battery', value: 87, unit: '%', status: 'Discharging' },
      { label: 'cpu_fan', type: 'fan_speed', value: 2400, unit: 'R' },
    ],
    gpu: [{ name: 'GeForce GTX 1050 Ti', temperature: 48, proc: 3 }],
    containers: [
      { name: 'n8n', status: 'running', cpu_percent: 1.2, memory_usage: 200e6 },
      { name: 'app', status: 'running', cpu_percent: 0.4, memory_usage: 80e6 },
    ],
  })

  expect(status.hostname).toBe('j1-msi')
  expect(status.disks.map((d) => d.mount)).toEqual(['/media/data', '/'])
  expect(status.temps).toEqual([{ label: 'Package id 0', value: 55 }])
  expect(status.battery).toEqual({ percent: 87, charging: false })
  expect(status.gpus[0].temperature).toBe(48)
  expect(status.containers.map((c) => c.name)).toEqual(['app', 'n8n'])
})

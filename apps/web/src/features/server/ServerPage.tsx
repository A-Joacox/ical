import { Block, BlockFooter, BlockTitle, Button, List, ListItem } from 'konsta/react'
import { BatteryCharging, BatteryMedium } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ProgressRing } from '../../ui/ProgressRing'
import { TabPage } from '../../ui/TabPage'
import { useServerStatus } from './useServerStatus'
import { Navbar } from '../../ui/Navbar'

// Color según lo cerca que está del límite.
const level = (value: number, warn: number, danger: number) =>
  value >= danger ? 'text-danger' : value >= warn ? 'text-warning' : 'text-server'
const barLevel = (percent: number) => (percent >= 90 ? 'bg-danger' : percent >= 75 ? 'bg-warning' : 'bg-server')

// Glances da el uptime en inglés ("3 days, 4:05:06").
const translateUptime = (uptime: string, lang: string) =>
  lang.startsWith('es') ? uptime.replace(/\bdays?\b/, (word) => (word === 'day' ? 'día' : 'días')) : uptime

function formatBytes(bytes: number, lang: string) {
  const gb = bytes / 1e9
  const format = (n: number) => n.toLocaleString(lang, { maximumFractionDigits: 1 })
  return gb >= 1 ? `${format(gb)} GB` : `${format(bytes / 1e6)} MB`
}

export function ServerPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { status, updatedAt, error } = useServerStatus()
  const lang = i18n.language
  const time = (ms: number) => new Intl.DateTimeFormat(lang, { timeStyle: 'medium' }).format(ms)

  if (error === 'unauthorized') {
    return (
      <TabPage>
        <Navbar title={t('tabs.server')} large transparent centerTitle />
        <Block className="space-y-4 pt-10 text-center">
          <p className="text-[15px] text-label-2">{t('server.signIn')}</p>
          <Button rounded tonal className="mx-auto w-auto px-6" onClick={() => navigate('/settings')}>
            {t('settings.title')}
          </Button>
        </Block>
      </TabPage>
    )
  }

  const temps = status ? [...status.temps, ...status.gpus.flatMap((g) => (g.temperature ? [{ label: g.name, value: g.temperature }] : []))] : []
  const maxTemp = Math.max(0, ...temps.map((s) => s.value))
  const online = !error

  return (
    <TabPage>
      <Navbar title={t('tabs.server')} large transparent centerTitle />

      <div className="flex items-center gap-2 px-4 text-[15px] text-label-2">
        <span className={`h-2 w-2 shrink-0 rounded-full ${online ? 'bg-food' : 'bg-danger'}`} />
        <span className="truncate">{status?.hostname ?? ''}</span>
        {status?.battery && (
          <span className="ml-auto flex shrink-0 items-center gap-1">
            {status.battery.charging ? <BatteryCharging className="h-5 w-5" /> : <BatteryMedium className="h-5 w-5 text-warning" />}
            {status.battery.percent}%
          </span>
        )}
      </div>
      {status && (
        <p className="px-4 pl-8 text-[13px] text-label-2">{t('server.uptime', { time: translateUptime(status.uptime, lang) })}</p>
      )}

      {error && (
        <Block strong inset className="text-[15px] text-label-2">
          {error === 'offline' ? t('server.offline') : t('server.unavailable')}
          {updatedAt && ` · ${t('server.cachedAt', { time: time(updatedAt) })}`}
        </Block>
      )}

      {status && (
        <>
          <Block strong inset className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: t('server.cpu'), value: status.cpuPercent, text: `${Math.round(status.cpuPercent)}%`, color: level(status.cpuPercent, 75, 90) },
              { label: t('server.ram'), value: status.memPercent, text: `${Math.round(status.memPercent)}%`, color: level(status.memPercent, 75, 90) },
              { label: t('server.temp'), value: maxTemp, text: maxTemp ? `${Math.round(maxTemp)}°` : '—', color: level(maxTemp, 75, 85) },
            ].map((gauge) => (
              <div key={gauge.label} className="flex flex-col items-center gap-1.5">
                <ProgressRing progress={gauge.value / 100} colorClassName={gauge.color} size={88} stroke={9}>
                  <span className="text-[20px] font-bold tabular-nums">{gauge.text}</span>
                </ProgressRing>
                <span className="text-[13px] text-label-2">{gauge.label}</span>
              </div>
            ))}
          </Block>
          <BlockFooter inset className="-mt-4">
            {t('server.load')} {status.load.map((n) => n.toFixed(2)).join(' · ')} · RAM {formatBytes(status.memUsed, lang)} /{' '}
            {formatBytes(status.memTotal, lang)}
          </BlockFooter>

          <BlockTitle>{t('server.disks')}</BlockTitle>
          <Block strong inset className="space-y-3">
            {status.disks.map((disk) => (
              <div key={disk.device}>
                <div className="flex justify-between gap-3 text-[15px]">
                  <span className="truncate">{disk.mount}</span>
                  <span className="shrink-0 tabular-nums text-label-2">
                    {formatBytes(disk.used, lang)} / {formatBytes(disk.size, lang)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
                  <div className={`h-full rounded-full ${barLevel(disk.percent)}`} style={{ width: `${disk.percent}%` }} />
                </div>
              </div>
            ))}
          </Block>

          {temps.length > 0 && (
            <>
              <BlockTitle>{t('server.temps')}</BlockTitle>
              <List strong inset dividers>
                {temps.map((sensor) => (
                  <ListItem
                    key={sensor.label}
                    title={sensor.label}
                    after={<span className={`tabular-nums ${level(sensor.value, 75, 85)}`}>{Math.round(sensor.value)} °C</span>}
                  />
                ))}
              </List>
            </>
          )}

          <BlockTitle>{t('server.containers')}</BlockTitle>
          {status.containers.length ? (
            <List strong inset dividers>
              {status.containers.map((container) => (
                <ListItem
                  key={container.name}
                  title={container.name}
                  subtitle={container.status}
                  media={
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${container.status === 'running' ? 'bg-food' : container.status === 'exited' ? 'bg-danger' : 'bg-warning'}`}
                    />
                  }
                  after={
                    <span className="tabular-nums">
                      {container.cpuPercent.toFixed(1)}% · {formatBytes(container.memUsage, lang)}
                    </span>
                  }
                />
              ))}
            </List>
          ) : (
            <Block className="text-center text-[15px] text-label-2">{t('server.noContainers')}</Block>
          )}

          {updatedAt && !error && <BlockFooter className="text-center">{t('server.updated', { time: time(updatedAt) })}</BlockFooter>}
        </>
      )}
    </TabPage>
  )
}

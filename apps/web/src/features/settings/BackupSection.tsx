import { useState } from 'react'
import { BlockFooter, BlockTitle, List, ListButton, ListItem } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api'
import { backupNow, lastBackupAt, restoreBackup } from '../../db/backup'
import { ConfirmDialog } from '../../ui/ConfirmDialog'

// "hace 5 minutos", "hace 2 horas", "ayer"...
function timeAgo(ms: number, lang: string) {
  const minutes = Math.round((ms - Date.now()) / 60_000)
  const format = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' })
  if (minutes > -60) return format.format(minutes, 'minute')
  if (minutes > -24 * 60) return format.format(Math.round(minutes / 60), 'hour')
  return format.format(Math.round(minutes / (24 * 60)), 'day')
}

// Estado del backup en el server, backup manual y restaurar.
export function BackupSection() {
  const { t, i18n } = useTranslation()
  const [last, setLast] = useState(lastBackupAt)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmRestore, setConfirmRestore] = useState(false)

  const run = (action: () => Promise<unknown>, done: string) => {
    if (busy) return
    setBusy(true)
    setMessage(null)
    action()
      .then(() => setMessage(done))
      .catch((error) => setMessage(error instanceof ApiError && error.status === 401 ? t('settings.backupNeedSession') : t('settings.error')))
      .finally(() => {
        setBusy(false)
        setLast(lastBackupAt())
      })
  }

  return (
    <>
      <BlockTitle>{t('settings.backup')}</BlockTitle>
      <List strong inset dividers>
        <ListItem title={t('settings.lastBackup')} after={busy ? '…' : last ? timeAgo(last, i18n.language) : t('settings.never')} />
        <ListButton onClick={() => run(backupNow, t('settings.backupDone'))}>
          {t('settings.backupNow')}
        </ListButton>
        <ListButton onClick={() => setConfirmRestore(true)}>
          {t('settings.restore')}
        </ListButton>
      </List>
      <BlockFooter inset>{message ?? t('settings.backupFooter')}</BlockFooter>

      <ConfirmDialog
        opened={confirmRestore}
        title={t('settings.restoreTitle')}
        text={t('settings.restoreText')}
        confirmLabel={t('settings.restoreConfirm')}
        onConfirm={() => run(restoreBackup, t('settings.restoreDone'))}
        onClose={() => setConfirmRestore(false)}
      />
    </>
  )
}

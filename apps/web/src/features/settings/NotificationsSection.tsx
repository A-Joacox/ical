import { useEffect, useState } from 'react'
import { BlockFooter, BlockTitle, List, ListButton, ListItem } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { ApiError } from '../../api'
import { disablePush, enablePush, getPushState, sendTestPush, syncPush, type PushState } from '../../push'

// Activar/desactivar notificaciones push (descanso del gym y alertas del server).
export function NotificationsSection() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage ?? 'es'
  const [state, setState] = useState<PushState | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    getPushState().then(setState)
  }, [])

  // Las alertas del server se escriben en el idioma guardado con la suscripción.
  useEffect(() => {
    if (state === 'on') syncPush(lang).catch(() => {})
  }, [state, lang])

  const run = (action: () => Promise<unknown>, done?: string) => {
    setMessage(null)
    action()
      .then(() => done && setMessage(done))
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) setMessage(t('settings.notificationsNeedSession'))
        else if (error instanceof ApiError && error.status === 503) setMessage(t('settings.notificationsServerOff'))
        else setMessage(t('settings.error'))
      })
      .finally(() => getPushState().then(setState))
  }

  const footer = {
    unsupported: t('settings.notificationsUnsupported'),
    denied: t('settings.notificationsDenied'),
    off: t('settings.notificationsFooter'),
    on: t('settings.notificationsFooter'),
  }

  return (
    <>
      <BlockTitle>{t('settings.notifications')}</BlockTitle>
      <List strong inset dividers>
        <ListItem
          title={t('settings.notifications')}
          after={state === 'on' ? t('settings.notificationsOn') : state === null ? '…' : t('settings.notificationsOff')}
        />
        {state === 'off' && <ListButton onClick={() => run(() => enablePush(lang))}>{t('settings.enableNotifications')}</ListButton>}
        {state === 'on' && (
          <>
            <ListButton onClick={() => run(() => sendTestPush(t('settings.testTitle'), t('settings.testBody')), t('settings.testSent'))}>
              {t('settings.sendTest')}
            </ListButton>
            <ListButton colors={{ textIos: 'text-danger' }} onClick={() => run(disablePush)}>
              {t('settings.disableNotifications')}
            </ListButton>
          </>
        )}
      </List>
      <BlockFooter inset>{message ?? (state ? footer[state] : '')}</BlockFooter>
    </>
  )
}

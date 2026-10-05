import { useEffect, useState } from 'react'
import { BlockFooter, BlockTitle, List, ListButton, ListInput, ListItem } from 'konsta/react'
import { useTranslation } from 'react-i18next'
import { getAuthStatus, loginWithPasskey, logout, registerPasskey, type AuthStatus } from '../../auth'

// Estado de la sesión con el server y acciones de passkey según ese estado.
export function AccountSection() {
  const { t } = useTranslation()
  const [status, setStatus] = useState<AuthStatus | 'offline' | null>(null)
  const [setupToken, setSetupToken] = useState('')
  const [error, setError] = useState(false)

  const refresh = () => getAuthStatus().then(setStatus, () => setStatus('offline'))

  useEffect(() => {
    refresh()
  }, [])

  const run = (action: () => Promise<unknown>) => {
    setError(false)
    action().then(refresh, () => setError(true))
  }

  const auth = status !== null && status !== 'offline' ? status : null
  const sessionLabel =
    status === null
      ? t('server.checking')
      : status === 'offline'
        ? t('server.offline')
        : t(status.authenticated ? 'settings.signedIn' : 'settings.signedOut')

  return (
    <>
      <BlockTitle>{t('settings.account')}</BlockTitle>
      <List strong inset dividers>
        <ListItem title={t('settings.session')} after={sessionLabel} />

        {auth && !auth.authenticated && !auth.registered && (
          <>
            <ListInput
              label={t('settings.setupCode')}
              placeholder="••••••••"
              value={setupToken}
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(event) => setSetupToken(event.target.value)}
            />
            <ListButton onClick={() => setupToken.trim() && run(() => registerPasskey(setupToken.trim()))}>
              {t('settings.registerDevice')}
            </ListButton>
          </>
        )}

        {auth && !auth.authenticated && auth.registered && (
          <ListButton onClick={() => run(loginWithPasskey)}>{t('settings.signIn')}</ListButton>
        )}

        {auth?.authenticated && (
          <>
            <ListButton onClick={() => run(() => registerPasskey())}>{t('settings.addDevice')}</ListButton>
            <ListButton colors={{ textIos: 'text-danger' }} onClick={() => run(logout)}>
              {t('settings.signOut')}
            </ListButton>
          </>
        )}
      </List>
      <BlockFooter inset className={error ? 'text-danger' : undefined}>
        {error ? t('settings.error') : t('settings.accountFooter')}
      </BlockFooter>
    </>
  )
}

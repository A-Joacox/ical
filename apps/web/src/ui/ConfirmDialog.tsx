import { Dialog, DialogButton } from 'konsta/react'
import { useTranslation } from 'react-i18next'

type Props = {
  opened: boolean
  title: string
  text: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
}

// Diálogo de confirmación con "Cancelar" y una acción (botón rojo si es destructiva).
export function ConfirmDialog({ opened, title, text, confirmLabel, destructive, onConfirm, onClose }: Props) {
  const { t } = useTranslation()

  return (
    <Dialog
      opened={opened}
      onBackdropClick={onClose}
      title={title}
      content={text}
      buttons={
        <>
          <DialogButton onClick={onClose}>{t('gym.cancel')}</DialogButton>
          <DialogButton
            strong
            className={destructive ? 'bg-danger!' : undefined}
            onClick={() => {
              onClose()
              onConfirm()
            }}
          >
            {confirmLabel}
          </DialogButton>
        </>
      }
    />
  )
}

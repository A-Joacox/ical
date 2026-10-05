import type { LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { IconBadge, type Tone } from './IconBadge'
import { TabPage } from './TabPage'
import { Navbar } from './Navbar'

// Pestaña de un módulo que todavía no está implementado.
export function PlaceholderPage({ tone, Icon }: { tone: Tone; Icon: LucideIcon }) {
  const { t } = useTranslation()

  return (
    <TabPage>
      <Navbar title={t(`tabs.${tone}`)} large transparent centerTitle />
      <div className="flex flex-col items-center gap-3 px-10 pt-20 text-center">
        <IconBadge Icon={Icon} tone={tone} size="lg" />
        <p className="mt-2 text-xl font-semibold">{t('placeholder.soon')}</p>
        <p className="text-[15px] text-label-2">{t(`placeholder.${tone}`)}</p>
      </div>
    </TabPage>
  )
}

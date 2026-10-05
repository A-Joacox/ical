import { App, Tabbar, TabbarLink } from 'konsta/react'
import { Apple, CalendarDays, Dumbbell, House, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { SettingsPage } from '../features/settings/SettingsPage'
import { TodayPage } from '../features/today/TodayPage'
import { PlaceholderPage } from '../ui/PlaceholderPage'

const TABS = [
  { path: '/', label: 'tabs.today', Icon: House },
  { path: '/food', label: 'tabs.food', Icon: Apple },
  { path: '/gym', label: 'tabs.gym', Icon: Dumbbell },
  { path: '/agenda', label: 'tabs.agenda', Icon: CalendarDays },
  { path: '/server', label: 'tabs.server', Icon: Server },
] as const

export function AppShell() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  // Ajustes se abre desde Hoy, así que esa pestaña sigue activa.
  const activeTab = pathname === '/settings' ? '/' : pathname

  return (
    <App theme="ios" dark safeAreas>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/food" element={<PlaceholderPage tone="food" Icon={Apple} />} />
        <Route path="/gym" element={<PlaceholderPage tone="gym" Icon={Dumbbell} />} />
        <Route path="/agenda" element={<PlaceholderPage tone="agenda" Icon={CalendarDays} />} />
        <Route path="/server" element={<PlaceholderPage tone="server" Icon={Server} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Tabbar
        labels
        icons
        className="fixed bottom-0 left-0"
        colors={{ bgIos: 'bg-gradient-to-t from-black from-55% to-transparent' }}
      >
        {TABS.map(({ path, label, Icon }) => (
          <TabbarLink
            key={path}
            active={activeTab === path}
            colors={{ textIos: 'text-label-2' }}
            onClick={() => navigate(path)}
            icon={<Icon className="h-6 w-6" />}
            label={t(label)}
          />
        ))}
      </Tabbar>
    </App>
  )
}

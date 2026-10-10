import { App, Tabbar, TabbarLink } from 'konsta/react'
import { Apple, CalendarDays, Dumbbell, House, Server } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router'
import { AgendaPage } from '../features/agenda/AgendaPage'
import { FoodPage } from '../features/food/FoodPage'
import { ActiveWorkoutPage } from '../features/gym/ActiveWorkoutPage'
import { ExercisePage } from '../features/gym/ExercisePage'
import { ExercisesPage } from '../features/gym/ExercisesPage'
import { GymPage } from '../features/gym/GymPage'
import { RoutinePage } from '../features/gym/RoutinePage'
import { WorkoutPage } from '../features/gym/WorkoutPage'
import { ServerPage } from '../features/server/ServerPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { TodayPage } from '../features/today/TodayPage'

const TABS = [
  { path: '/', label: 'tabs.today', Icon: House },
  { path: '/food', label: 'tabs.food', Icon: Apple },
  { path: '/gym', label: 'tabs.gym', Icon: Dumbbell },
  { path: '/agenda', label: 'tabs.agenda', Icon: CalendarDays },
  { path: '/server', label: 'tabs.server', Icon: Server },
] as const

// Pestaña a la que pertenece una ruta. Ajustes se abre desde Hoy.
const tabOf = (pathname: string) =>
  TABS.find(({ path }) => path !== '/' && pathname.startsWith(path))?.path ?? '/'

export function AppShell() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const activeTab = tabOf(pathname)

  return (
    <App theme="ios" dark safeAreas>
      <Routes>
        <Route path="/" element={<TodayPage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/gym" element={<GymPage />} />
        <Route path="/gym/session" element={<ActiveWorkoutPage />} />
        <Route path="/gym/routines/:id" element={<RoutinePage />} />
        <Route path="/gym/workouts/:id" element={<WorkoutPage />} />
        <Route path="/gym/exercises" element={<ExercisesPage />} />
        <Route path="/gym/exercises/:id" element={<ExercisePage />} />
        <Route path="/agenda" element={<AgendaPage />} />
        <Route path="/server" element={<ServerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* La sesión de gym va a pantalla completa, sin tab bar.
          Konsta usa el estilo flotante de iOS 26 (zona segura + 16px, 64px de alto); lo bajamos
          a la posición de la tab bar clásica: solo la zona segura y 56px de alto. */}
      {pathname !== '/gym/session' && (
        <Tabbar
          labels
          icons
          className="fixed bottom-0 left-0 pb-safe!"
          innerClassName="h-14!"
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
      )}
    </App>
  )
}

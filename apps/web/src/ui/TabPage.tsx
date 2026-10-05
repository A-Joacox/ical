import type { ReactNode } from 'react'
import { Page } from 'konsta/react'

// Page de Konsta con espacio inferior para que la tab bar fija no tape el contenido.
export function TabPage({ children }: { children: ReactNode }) {
  return <Page className="pb-[calc(6rem+var(--k-safe-area-bottom))]">{children}</Page>
}

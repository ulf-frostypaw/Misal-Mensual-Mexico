import { Helmet } from 'react-helmet-async'
import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
  date?: string
  color?: string
}

// Mapea el nombre del color litúrgico (del frontmatter) a clases de Tailwind.
// Si no se reconoce, se usa un gris neutro.
const COLOR_STYLES = {
  verde: { dot: 'bg-liturgico-verde', label: 'text-liturgico-verde' },
  rojo: { dot: 'bg-liturgico-rojo', label: 'text-liturgico-rojo' },
  morado: { dot: 'bg-liturgico-morado', label: 'text-liturgico-morado' },
  blanco: { dot: 'bg-liturgico-blanco border border-slate-300', label: 'text-slate-700' },
  negro: { dot: 'bg-liturgico-negro', label: 'text-slate-800' },
  rosa: { dot: 'bg-liturgico-rosa', label: 'text-liturgico-rosa' },
  azul: { dot: 'bg-liturgico-azul', label: 'text-liturgico-azul' },
}

const DEFAULT_COLOR_STYLE = { dot: 'bg-liturgico-verde', label: 'text-liturgico-verde' }

function formatDate(iso?: string): string {
  if (!iso) return ''
  // Parseamos la fecha como local (sin UTC) para evitar que la zona horaria
  // desplace el día (ej. "2026-09-01" no debe retroceder al 31 de agosto).
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  const date = new Date(y, m - 1, d)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

// Layout principal con estética de misal litúrgico.
export default function Layout({ children, title, date, color }: LayoutProps) {
  const formattedDate = formatDate(date)
  const key = color?.toLowerCase() as keyof typeof COLOR_STYLES | undefined
  const colorStyle = (key && COLOR_STYLES[key]) ?? DEFAULT_COLOR_STYLE
  return (
    <div className="min-h-screen flex flex-col bg-misal-cream text-misal-ink font-misal">
      <Helmet>
        <title>{title ?? import.meta.env.VITE_APP_NAME}</title>
      </Helmet>
      <header className="bg-gradient-to-b from-misal-cream to-[#f6efe3] border-b border-[#e4ddcf] px-6 py-10 text-center">
        <div className="flex items-center justify-center gap-2 mb-5">
          <span className="text-2xl text-misal-gold leading-none">✠</span>
          <span className="text-sm tracking-[0.35em] uppercase text-misal-gold">{import.meta.env.VITE_APP_NAME}</span>
        </div>
        {title && <h1 className="text-4xl font-semibold text-misal-ink">{title}</h1>}
        <div className="mt-3 flex flex-col items-center gap-2">
          {color && (
            <span className={`inline-flex items-center gap-2 rounded-full border border-[#e4ddcf] bg-misal-cream px-3 py-1 text-sm font-medium ${colorStyle.label}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${colorStyle.dot}`} />
              Color: {color}
            </span>
          )}
          {formattedDate && <p className="text-lg italic text-misal-ink/70">{formattedDate}</p>}
        </div>
      </header>
      <main className="flex-1 w-full max-w-3xl mx-auto px-5 py-10">{children}</main>
      <footer className="border-t border-[#e8ddcf] py-6 text-center text-xs tracking-[0.2em] uppercase text-misal-ink/60">
        <span>{import.meta.env.VITE_APP_NAME}</span>
      </footer>
    </div>
  )
}

import { Helmet } from 'react-helmet-async'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  title?: string
  date?: string
  color?: string
  // Header sticky con auto-ocultado (se esconde al bajar y reaparece al subir).
  // Se usa solo en el calendario; en las páginas del misal el header es normal.
  autoHideHeader?: boolean
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
export default function Layout({ children, title, date, color, autoHideHeader = false }: LayoutProps) {
  const formattedDate = formatDate(date)
  const key = color?.toLowerCase() as keyof typeof COLOR_STYLES | undefined
  const colorStyle = (key && COLOR_STYLES[key]) ?? DEFAULT_COLOR_STYLE

  // Header auto-ocultable: se esconde al bajar y reaparece al subir. Cerca del
  // inicio de la página siempre permanece visible.
  const [hidden, setHidden] = useState(false)

  // Altura real del header, para reservar el espacio del índice lateral
  // mientras está visible (ver `--header-offset` abajo).
  const headerRef = useRef<HTMLElement>(null)
  const [headerHeight, setHeaderHeight] = useState(0)
  useLayoutEffect(() => {
    const measure = () => setHeaderHeight(headerRef.current?.offsetHeight ?? 0)
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    if (!autoHideHeader) {
      setHidden(false)
      return
    }
    let lastY = window.scrollY
    let frame = 0
    const update = () => {
      frame = 0
      const y = window.scrollY
      if (y < 80) {
        setHidden(false)
      } else if (y > lastY + 4) {
        setHidden(true)
      } else if (y < lastY - 4) {
        setHidden(false)
      }
      lastY = y
    }
    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
    }
  }, [autoHideHeader])

  return (
    <div
      className="min-h-screen flex flex-col bg-misal-cream text-misal-ink font-misal"
      // Cuando el header está oculto, el offset baja al margen del borde para que
      // el índice lateral se le pegue arriba.
      style={{ '--header-offset': hidden ? '1.5rem' : `${headerHeight}px` } as CSSProperties}
    >
      <Helmet>
        <title>{title ?? import.meta.env.VITE_APP_NAME}</title>
      </Helmet>
      <header ref={headerRef} className={`bg-gradient-to-b from-misal-cream to-[#f6efe3] border-b border-[#e4ddcf] px-6 py-10 text-center ${
        autoHideHeader
          ? `sticky top-0 z-40 transition-transform duration-300 ease-out ${hidden ? '-translate-y-full' : 'translate-y-0'}`
          : ''
      }`}>
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
      <main className="flex-1 w-[95%] mx-auto px-5 py-10">{children}</main>
      <footer className="border-t border-[#e8ddcf] py-6 text-center text-xs tracking-[0.2em] uppercase text-misal-ink/60">
        <span>{import.meta.env.VITE_APP_NAME}</span>
      </footer>
    </div>
  )
}

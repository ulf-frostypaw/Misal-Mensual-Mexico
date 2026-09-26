import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'

// Escanea todos los archivos .mdx dentro de pages/misal.
// Al poner un archivo (ej. src/pages/misal/2026/Septiembre/01.mdx) queda disponible en ./misal/2026/Septiembre/01
// remark-mdx-frontmatter expone el frontmatter como export nombrado `frontmatter`.
const modules = import.meta.glob('./pages/misal/**/*.mdx', {
  eager: true,
}) as Record<
  string,
  {
    default: ComponentType
    frontmatter?: {
      title?: string
      date?: string
      color?: string
      featured_saint?: string[]
      featured_image?: string
    }
  }
>

// Contenido crudo de cada .mdx, para localizar el número de línea de cada
// sección al generar anotaciones de corrección. El valor puede ser el string
// directo o un objeto { default: string } según la versión de Vite.
const rawModules = import.meta.glob('./pages/misal/**/*.mdx', {
  eager: true,
  query: '?raw',
}) as Record<string, unknown>

// Extrae el contenido crudo como string, soportando ambos formatos.
function getRawContent(filePath: string): string {
  const value = rawModules[filePath]
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'default' in value) {
    const def = (value as { default?: unknown }).default
    if (typeof def === 'string') return def
  }
  return ''
}

export interface MisalEntry {
  url: string
  year: string
  month: string
  monthNumber: string
  day: string
  title: string
  date: string
  filePath: string
  raw: string
  color?: string
  featured_saint?: string[]
  featured_image?: string
  component: ComponentType
}

// Nombres de mes (es) a su número, con y sin acento.
const MONTH_NUMBERS: Record<string, string> = {
  enero: '01',
  febrero: '02',
  marzo: '03',
  abril: '04',
  mayo: '05',
  junio: '06',
  julio: '07',
  agosto: '08',
  septiembre: '09',
  setiembre: '09',
  octubre: '10',
  noviembre: '11',
  diciembre: '12',
}

function monthNameToNumber(name: string): string | undefined {
  return MONTH_NUMBERS[name.toLowerCase()]
}

function buildEntries(): MisalEntry[] {
  const entries: MisalEntry[] = []
  for (const filePath of Object.keys(modules)) {
    // ej: ./pages/misal/2026/Septiembre/01.mdx -> year=2026, month=Septiembre, day=01
    const match = filePath.match(/\.\/pages\/misal\/([^/]+)\/([^/]+)\/([^/]+)\.mdx$/)
    if (!match) continue
    const [, year, monthName, day] = match
    const fm = modules[filePath].frontmatter ?? {}
    // Usa la carpeta del mes (nombre) en la URL y su número solo para calcular la fecha.
    const monthNumber = monthNameToNumber(monthName) ?? ''
    const fallbackDate = monthNumber ? `${year}-${monthNumber}-${day}` : ''
    entries.push({
      url: `/misal/${year}/${monthName}/${day}`,
      year,
      month: monthName,
      monthNumber,
      day,
      title: fm.title ?? (fallbackDate ? `Misal ${fallbackDate}` : `Misal ${year}/${monthName}/${day}`),
      date: fm.date ?? fallbackDate,
      color: fm.color,
      featured_saint: fm.featured_saint,
      featured_image: fm.featured_image,
      filePath: filePath.replace(/^\.\//, 'src/'),
      raw: getRawContent(filePath),
      component: modules[filePath].default,
    })
  }
  // Ordena por fecha del frontmatter (o por la fecha de la carpeta como respaldo).
  return entries
    .filter((e) => e.date)
    .sort((a, b) => a.date.localeCompare(b.date))
    .concat(entries.filter((e) => !e.date))
}

const entries = buildEntries()
const byUrl = new Map(entries.map((e) => [e.url, e]))

export function getMisalEntries(): MisalEntry[] {
  return entries
}

export function findMisalEntry(pathname: string): MisalEntry | undefined {
  return byUrl.get(pathname.replace(/\/+$/, ''))
}

export function usePathname() {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  return pathname
}
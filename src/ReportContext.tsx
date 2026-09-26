import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

// URL base del repositorio (se puede sobrescribir con VITE_REPO_URL).
const REPO_URL = import.meta.env.VITE_REPO_URL ?? 'https://github.com/ulf-frostypaw/Misal-Mensual-Mexico'

interface ReportContextValue {
  filePath?: string
  raw?: string
}

const ReportContext = createContext<ReportContextValue>({})

// Provee a las secciones la ruta del archivo y su contenido crudo para poder
// generar anotaciones que apunten al repositorio.
export function ReportProvider({
  filePath,
  raw,
  children,
}: ReportContextValue & { children: ReactNode }) {
  return <ReportContext.Provider value={{ filePath, raw }}>{children}</ReportContext.Provider>
}

export function useReport(): ReportContextValue {
  return useContext(ReportContext)
}

// Encuentra el número de línea de una sección (# Título) dentro del MDX crudo.
export function findSectionLine(raw: unknown, title: string): number | undefined {
  if (typeof raw !== 'string') return undefined
  const lines = raw.split('\n')
  const idx = lines.findIndex((l) => l.trim() === `# ${title}`)
  return idx >= 0 ? idx + 1 : undefined
}

// Normaliza un texto quitando marcadores de markdown y colapsando espacios,
// para poder comparar el texto renderizado con el fuente del MDX.
function normalizeForSearch(s: string): string {
  return s
    .replace(/\*\*|__|\*|_|`|#|>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Devuelve el rango de líneas (1-based, inicio-fin) donde aparece el texto
// seleccionado dentro del MDX crudo. Normaliza ambos textos para que coincidan
// aunque el texto renderizado difiera del fuente (markdown, saltos de línea).
export function findLineRange(
  raw: unknown,
  selected: string,
): { start: number; end: number } | undefined {
  if (typeof raw !== 'string' || !selected) return undefined

  const lines = raw.split('\n')
  const normLines = lines.map((l) => normalizeForSearch(l))
  const doc = normLines.join(' ')

  const needle = normalizeForSearch(selected)
  if (!needle) return undefined

  const idx = doc.indexOf(needle)
  if (idx === -1) return undefined

  // Línea donde empieza el texto.
  let pos = 0
  let start = 0
  for (let i = 0; i < normLines.length; i++) {
    if (pos + normLines[i].length > idx) {
      start = i
      break
    }
    pos += normLines[i].length + 1
    start = i + 1
  }

  // Línea donde termina el texto.
  const endIdx = idx + needle.length
  let end = start
  let pos2 = 0
  for (let i = 0; i < normLines.length; i++) {
    if (pos2 + normLines[i].length >= endIdx) {
      end = i
      break
    }
    pos2 += normLines[i].length + 1
    end = i + 1
  }

  return { start: start + 1, end: end + 1 }
}

// Encuentra el número de línea de un fragmento de texto dentro del MDX crudo.
// Busca los primeros caracteres del texto para localizar la línea aproximada.
export function findLineByText(raw: unknown, text: string): number | undefined {
  const range = findLineRange(raw, text)
  return range?.start
}

// Construye la URL de un issue de GitHub prellenado con el cuerpo que se le pase.
export function buildReportUrl(opts: { title?: string; body: string }): string {
  const issueTitle = opts.title ?? 'Sugerencia de edición'
  return `${REPO_URL}/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(opts.body)}`
}
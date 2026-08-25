import { useState } from 'react'
import type { MisalEntry } from './router'

interface CalendarProps {
  entries: MisalEntry[]
  onNavigate: (url: string) => void
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

// Mapea el nombre del color litúrgico a clases de Tailwind para el punto de color.
const COLOR_DOTS: Record<string, string> = {
  verde: 'bg-green-600',
  rojo: 'bg-misal-red',
  morado: 'bg-purple-700',
  blanco: 'bg-white border border-slate-300',
  negro: 'bg-slate-900',
  rosa: 'bg-pink-500',
  azul: 'bg-blue-600',
}

const DEFAULT_DOT = 'bg-green-600'

// Agrupa las entradas por año y mes (usando el número de mes de la carpeta).
function groupByMonth(entries: MisalEntry[]): Map<string, MisalEntry[]> {
  const groups = new Map<string, MisalEntry[]>()
  for (const e of entries) {
    if (!e.monthNumber) continue
    const key = `${e.year}-${e.monthNumber}`
    const list = groups.get(key) ?? []
    list.push(e)
    groups.set(key, list)
  }
  return groups
}

// Devuelve los años presentes en las entradas, ordenados.
function yearsOf(entries: MisalEntry[]): number[] {
  return [...new Set(entries.map((e) => Number(e.year)).filter((y) => !Number.isNaN(y)))].sort(
    (a, b) => a - b,
  )
}

// Devuelve el día de la semana (0 = domingo ... 6 = sábado) de una fecha YYYY-MM-DD.
function dayOfWeek(date: string): number {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getDay()
}

// Devuelve el número de días de un mes (año, mes 1-12).
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

export default function Calendar({ entries, onNavigate }: CalendarProps) {
  const byMonth = groupByMonth(entries)
  const years = yearsOf(entries)
  const [openYear, setOpenYear] = useState<number | null>(null)

  // Genera los meses desde septiembre del primer año en adelante: para el primer
  // año empieza en septiembre y los siguientes años arrancan en enero.
  const monthKeys: string[] = []
  years.forEach((year, idx) => {
    const startMonth = idx === 0 ? 9 : 1
    for (let m = startMonth; m <= 12; m++) {
      monthKeys.push(`${year}-${String(m).padStart(2, '0')}`)
    }
  })

  return (
    <div className="lg:grid lg:grid-cols-[16rem_1fr] lg:gap-8 items-start">
      {/* Índice lateral: dropdown por años de los próximos meses. Solo visible en pantallas grandes. */}
      <aside className="hidden lg:block bg-misal-cream border border-[#e4ddcf] rounded-xl p-5 lg:sticky lg:top-6">
        <h2 className="text-lg font-bold tracking-[0.1em] uppercase text-misal-red mb-4">
          Índice
        </h2>
        <div className="space-y-1">
          {years.map((year) => {
            const yearMonths = monthKeys.filter((k) => k.startsWith(`${year}-`))
            const isOpen = openYear === year
            return (
              <div key={year}>
                <button
                  type="button"
                  onClick={() => setOpenYear(isOpen ? null : year)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-misal-ink transition hover:bg-misal-red hover:text-white"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold">{year}</span>
                  <span className={`text-misal-ink/60 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▾
                  </span>
                </button>
                {isOpen && (
                  <ul className="ml-3 space-y-1">
                    {yearMonths.map((key) => {
                      const month = Number(key.split('-')[1])
                      return (
                        <li key={key}>
                          <a
                            href={`#mes-${key}`}
                            onClick={() => setOpenYear(null)}
                            className="block py-1 px-2 rounded-md text-misal-ink transition hover:bg-misal-red hover:text-white"
                          >
                            {MONTH_NAMES[month - 1]}
                          </a>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </aside>

      {/* Calendarios por mes */}
      <div className="space-y-8">
        {monthKeys.map((key) => {
          const [yearStr, monthStr] = key.split('-')
          const year = Number(yearStr)
          const month = Number(monthStr)
          const monthEntries = byMonth.get(key) ?? []
          const byDay = new Map(monthEntries.map((e) => [Number(e.day), e]))
          const totalDays = daysInMonth(year, month)
          const firstWeekday = dayOfWeek(`${key}-01`)
          // offset para que la semana empiece en lunes (getDay: 0=domingo).
          const leadingBlanks = (firstWeekday + 6) % 7

          return (
            <section
              key={key}
              id={`mes-${key}`}
              className="scroll-mt-6 bg-misal-cream border border-[#e4ddcf] rounded-xl p-6"
            >
              <h2 className="text-2xl font-bold tracking-[0.08em] uppercase text-misal-red mb-4">
                {MONTH_NAMES[month - 1]} {year}
              </h2>

              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-sm font-semibold text-misal-ink/60">
                    {wd}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} className="aspect-square" />
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1
                  const entry = byDay.get(day)
                  const dot = entry?.color
                    ? COLOR_DOTS[entry.color.toLowerCase()] ?? DEFAULT_DOT
                    : undefined
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => entry && onNavigate(entry.url)}
                      disabled={!entry}
                      className={`aspect-square rounded-lg border border-[#e4ddcf] text-misal-ink transition hover:bg-misal-red hover:text-white disabled:opacity-40 disabled:cursor-default ${
                        entry ? 'bg-misal-cream' : 'bg-transparent'
                      }`}
                    >
                      <span className="block text-center text-lg font-semibold">{day}</span>
                      {dot && <span className={`mx-auto block h-1.5 w-1.5 rounded-full ${dot}`} />}
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
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

// Mapea el nombre del color litúrgico a clases de Tailwind para la barra de acento.
const COLOR_DOTS: Record<string, string> = {
  verde: 'bg-liturgico-verde',
  rojo: 'bg-liturgico-rojo',
  morado: 'bg-liturgico-morado',
  blanco: 'bg-liturgico-blanco border border-slate-300',
  negro: 'bg-liturgico-negro',
  rosa: 'bg-liturgico-rosa',
  azul: 'bg-liturgico-azul',
}

const DEFAULT_DOT = 'bg-liturgico-verde'

// Estilos por tiempo litúrgico: fondo de la celda (sólido), color de texto y
// muestra para la leyenda. Solo se usan colores litúrgicos; los tiempos que
// comparten color (Adviento/Cuaresma en morado y Navidad/Pascua en blanco) se
// diferencian con un borde.
const SEASON_STYLES: Record<string, { bg: string; text: string; border: string; swatch: string }> = {
  Adviento: { bg: 'bg-liturgico-morado', text: 'text-white', border: 'border-purple-900', swatch: 'bg-liturgico-morado' },
  Navidad: { bg: 'bg-liturgico-blanco', text: 'text-misal-ink', border: 'border-amber-400', swatch: 'bg-liturgico-blanco border-2 border-amber-400' },
  'Tiempo Ordinario': { bg: 'bg-liturgico-verde', text: 'text-white', border: 'border-green-900', swatch: 'bg-liturgico-verde' },
  Cuaresma: { bg: 'bg-liturgico-morado', text: 'text-white', border: 'border-purple-300', swatch: 'bg-liturgico-morado border-2 border-purple-300' },
  'Triduo Pascual': { bg: 'bg-liturgico-rojo', text: 'text-white', border: 'border-red-900', swatch: 'bg-liturgico-rojo' },
  Pascua: { bg: 'bg-liturgico-blanco', text: 'text-misal-ink', border: 'border-sky-300', swatch: 'bg-liturgico-blanco border-2 border-sky-300' },
}

// Colores RGB por tiempo litúrgico, para el degradado de abajo hacia arriba
// que destaca el color litúrgico sobre la imagen.
const SEASON_RGB: Record<string, string> = {
  Adviento: '74, 0, 136',
  Navidad: '255, 255, 255',
  'Tiempo Ordinario': '1, 64, 52',
  Cuaresma: '74, 0, 136',
  'Triduo Pascual': '89, 2, 18',
  Pascua: '255, 255, 255',
}

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

// Fecha de Pascua (Domingo de Resurrección) para un año, usando el algoritmo
// de Meeus/Jones/Butcher (válido para el calendario gregoriano).
function easterDate(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

// Devuelve el nombre del tiempo litúrgico para una fecha dada.
function liturgicalSeason(date: Date): string {
  const y = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  // Navidad: 25 dic - 6 ene (hasta la Epifanía).
  if ((month === 12 && day >= 25) || (month === 1 && day <= 6)) return 'Navidad'

  // Adviento: 4 domingos antes de Navidad hasta el 24 de diciembre.
  const christmas = new Date(y, 11, 25)
  // El 4º domingo de Adviento es el domingo anterior a Navidad; el Adviento
  // comienza 21 días antes. Si Navidad cae en domingo, el domingo previo es 7
  // días antes (por eso el caso especial con getDay() === 0).
  const adventStart = new Date(christmas)
  const adventOffset = christmas.getDay() === 0 ? 28 : 21 + christmas.getDay()
  adventStart.setDate(adventStart.getDate() - adventOffset)
  if (date >= adventStart && date <= new Date(y, 11, 24)) return 'Adviento'

  // Cuaresma: Miércoles de Ceniza (46 días antes de Pascua) hasta el sábado
  // anterior al Domingo de Ramos.
  const easter = easterDate(y)
  const ashWednesday = new Date(easter)
  ashWednesday.setDate(ashWednesday.getDate() - 46)
  const palmSunday = new Date(easter)
  palmSunday.setDate(palmSunday.getDate() - 7)
  if (date >= ashWednesday && date < palmSunday) return 'Cuaresma'

  // Triduo Pascual: Jueves Santo, Viernes Santo, Sábado Santo y Domingo de Pascua.
  const holyThursday = new Date(easter)
  holyThursday.setDate(holyThursday.getDate() - 3)
  if (date >= holyThursday && date <= easter) return 'Triduo Pascual'

  // Pascua: desde el Domingo de Resurrección hasta Pentecostés (50 días después).
  const pentecost = new Date(easter)
  pentecost.setDate(pentecost.getDate() + 49)
  if (date >= easter && date <= pentecost) return 'Pascua'

  // Tiempo Ordinario: el resto.
  return 'Tiempo Ordinario'
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
    <div className="lg:grid lg:grid-cols-[14rem_1fr] lg:gap-6 items-start">
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
              <h2 className="mb-4 text-center text-2xl font-semibold tracking-wide text-misal-red">
                {MONTH_NAMES[month - 1]} {year}
              </h2>

              <div className="grid grid-cols-7 gap-1.5 mb-2">
                {WEEKDAYS.map((wd) => (
                  <div key={wd} className="text-center text-sm font-semibold text-misal-ink/60">
                    {wd}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {Array.from({ length: leadingBlanks }).map((_, i) => (
                  <div key={`blank-${i}`} className="aspect-square min-h-[2.75rem] sm:min-h-[5.5rem]" />
                ))}
                {Array.from({ length: totalDays }).map((_, i) => {
                  const day = i + 1
                  const entry = byDay.get(day)
                  const season = liturgicalSeason(new Date(year, month - 1, day))
                  const seasonStyle = SEASON_STYLES[season] ?? SEASON_STYLES['Tiempo Ordinario']
                  const accent = entry?.color
                    ? COLOR_DOTS[entry.color.toLowerCase()] ?? DEFAULT_DOT
                    : undefined
                  // Imagen de fondo: usa featured_image si existe (ruta del proxy o URL),
                  // si no usa el color sólido del tiempo litúrgico.
                  const saints = entry?.featured_saint ?? []
                  const featuredImage = entry?.featured_image
                  const bgUrl = featuredImage
                    ? featuredImage.startsWith('/') || featuredImage.startsWith('http')
                      ? featuredImage
                      : `/api/images/${featuredImage}`
                    : undefined
                  const seasonRgb = SEASON_RGB[season] ?? SEASON_RGB['Tiempo Ordinario']
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => entry && onNavigate(entry.url)}
                      disabled={!entry}
                      title={saints.length ? `${saints.join(', ')} — ${season}` : season}
                      className={`group relative isolate flex aspect-square min-h-[2.75rem] flex-col items-center overflow-hidden rounded border border-[#e4ddcf] p-0.5 transition disabled:opacity-60 disabled:cursor-default sm:min-h-[5.5rem] sm:p-1.5 ${seasonStyle.text} ${seasonStyle.border}`}
                    >
                      {entry && bgUrl ? (
                        <>
                          {/* Capa de fondo con la imagen; hace zoom al pasar el cursor.
                              Solo visible en pantallas medianas en adelante. */}
                          <span
                            aria-hidden
                            className="absolute inset-0 -z-20 hidden bg-cover bg-center transition-transform duration-500 ease-out group-hover:scale-110 sm:block"
                            style={{ backgroundImage: `url(${bgUrl})` }}
                          />
                          {/* Degradado de abajo hacia arriba con el color litúrgico.
                              Solo visible en pantallas medianas en adelante. */}
                          <span
                            aria-hidden
                            className="absolute inset-0 -z-10 hidden sm:block"
                            style={{
                              background: `linear-gradient(to top, rgba(${seasonRgb}, 0.95) 0%, rgba(${seasonRgb}, 0.6) 40%, rgba(${seasonRgb}, 0) 100%)`,
                            }}
                          />
                        </>
                      ) : (
                        /* Sin imagen: color sólido del tiempo litúrgico. */
                        <span aria-hidden className={`absolute inset-0 -z-20 ${seasonStyle.bg}`} />
                      )}
                      <span className="text-sm font-bold drop-shadow sm:text-lg">{day}</span>
                      {/* Badges y barra de acento anclados abajo. Los badges se ocultan en
                          pantallas muy pequeñas para que no se sobrepongan. */}
                      <span className="mt-auto flex w-full flex-col items-center gap-0.5">
                        {saints.length > 0 && (
                          <span className="hidden flex-col items-center gap-0.5 sm:flex">
                            {saints.map((s) => (
                              <span
                                key={s}
                                className="rounded bg-misal-red px-2 py-0.5 text-center text-xs font-semibold leading-tight text-white shadow-sm sm:text-sm"
                              >
                                {s}
                              </span>
                            ))}
                          </span>
                        )}
                        {accent && <span className={`block h-1 w-full rounded sm:h-1.5 ${accent}`} />}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {/* Leyenda de tiempos litúrgicos, al final de la página */}
      <div className="lg:col-span-2 mt-10 border-t border-[#e4ddcf] pt-6">
        <h3 className="text-lg font-bold tracking-[0.1em] uppercase text-misal-red mb-4">
          Tiempos Litúrgicos
        </h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(SEASON_STYLES).map(([season, style]) => (
            <span
              key={season}
              className="inline-flex items-center gap-2 rounded-full border border-[#e4ddcf] bg-misal-cream px-3 py-1.5 text-sm font-medium text-misal-ink"
            >
              <span className={`h-3.5 w-3.5 rounded-full ${style.swatch}`} />
              {season}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
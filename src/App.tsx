import { MDXProvider } from '@mdx-js/react'
import { useState } from 'react'
import Layout from './Layout'
import Calendar from './Calendar'
import BackToTop from './BackToTop'
import { ReportProvider } from './ReportContext'
import { mdxComponents } from './mdx'
import { findMisalEntry, getMisalEntries, usePathname } from './router'

const FONT_SCALE_STEP = 0.1
const FONT_SCALE_MIN = 0.8
const FONT_SCALE_MAX = 1.6

const App = () => {
  const pathname = usePathname()
  const entry = findMisalEntry(pathname)
  const [fontScale, setFontScale] = useState(1)
  const [fading, setFading] = useState(false)

  // navegación sin recargar, usando history.pushState, con transición de fade.
  // Se aplica a todas las páginas: al navegar se activa el fade-out, luego se
  // cambia la ruta y se fuerza el re-montaje (key por pathname) para el fade-in.
  const navigate = (url: string) => {
    setFading(true)
    window.setTimeout(() => {
      window.history.pushState({}, '', url)
      window.dispatchEvent(new PopStateEvent('popstate'))
      window.scrollTo({ top: 0, behavior: 'auto' })
      setFading(false)
    }, 150)
  }

  const entries = getMisalEntries()
  const idx = entry ? entries.findIndex((e) => e.url === entry.url) : -1
  const prevEntry = idx > 0 ? entries[idx - 1] : undefined
  const nextEntry = idx >= 0 && idx < entries.length - 1 ? entries[idx + 1] : undefined

  const increaseFont = () => setFontScale((s) => Math.min(FONT_SCALE_MAX, +(s + FONT_SCALE_STEP).toFixed(2)))
  const decreaseFont = () => setFontScale((s) => Math.max(FONT_SCALE_MIN, +(s - FONT_SCALE_STEP).toFixed(2)))

  return (
    <Layout title={entry?.title ?? import.meta.env.VITE_APP_NAME} date={entry?.date ?? ''} color={entry?.color} autoHideHeader={!entry}>
      <div key={pathname} className={fading ? 'misal-fade-out' : 'misal-fade-in'}>
        {entry ? (
          <>
            <div className="flex items-center justify-end gap-2 mb-6">
              <span className="text-sm text-misal-ink/60">Tamaño de letra</span>
              <button
                type="button"
                onClick={decreaseFont}
                disabled={fontScale <= FONT_SCALE_MIN}
                aria-label="Reducir letra"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#e4ddcf] text-misal-ink transition hover:bg-misal-red hover:text-white disabled:opacity-40 disabled:cursor-default"
              >
                A−
              </button>
              <button
                type="button"
                onClick={increaseFont}
                disabled={fontScale >= FONT_SCALE_MAX}
                aria-label="Aumentar letra"
                className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[#e4ddcf] text-misal-ink transition hover:bg-misal-red hover:text-white disabled:opacity-40 disabled:cursor-default"
              >
                A+
              </button>
            </div>
            <div style={{ zoom: fontScale }}>
              <ReportProvider filePath={entry.filePath} raw={entry.raw}>
                <MDXProvider components={mdxComponents}>
                  <entry.component />
                </MDXProvider>
              </ReportProvider>
            </div>
            <nav className="mt-8 flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={!prevEntry}
                onClick={() => prevEntry && navigate(prevEntry.url)}
                className="inline-flex items-center gap-1 rounded-full border border-[#e4ddcf] px-4 py-2 text-sm text-misal-ink transition hover:bg-misal-red hover:text-white disabled:opacity-40 disabled:cursor-default"
              >
                ← {prevEntry?.date ?? 'Anterior'}
              </button>
              <button
                type="button"
                disabled={!nextEntry}
                onClick={() => nextEntry && navigate(nextEntry.url)}
                className="inline-flex items-center gap-1 rounded-full border border-[#e4ddcf] px-4 py-2 text-sm text-misal-ink transition hover:bg-misal-red hover:text-white disabled:opacity-40 disabled:cursor-default"
              >
                {nextEntry?.date ?? 'Siguiente'} →
              </button>
            </nav>
          </>
        ) : (
          <Calendar entries={entries} onNavigate={navigate} />
        )}
      </div>
      <BackToTop />
    </Layout>
  )
}

export default App

import { useEffect, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import CopySection from './CopySection'
import { buildReportUrl, findLineRange, useReport } from './ReportContext'

// Envuelve cada línea de contenido con un botón flotante "Sugerir edición" que
// aparece al seleccionar texto, identifica la línea del texto seleccionado en
// el MDX y abre un issue de GitHub con el archivo, la línea y la sugerencia.
function SugerirMejora({ children }: { children?: ReactNode }) {
  const { filePath, raw } = useReport()
  const containerRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const [comment, setComment] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const [selRange, setSelRange] = useState<{ start: number; end: number } | undefined>(undefined)
  const [sel, setSel] = useState<{
    text: string
    range?: { start: number; end: number }
    top: number
    left: number
  } | null>(null)

  // Detecta selección de texto dentro de esta línea y muestra el botón flotante
  // con la línea aproximada del texto seleccionado en el MDX.
  useEffect(() => {
    const onMouseUp = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !containerRef.current) {
        setSel(null)
        return
      }
      const anchor = selection.anchorNode
      const focus = selection.focusNode
      if (
        !containerRef.current.contains(anchor) ||
        !containerRef.current.contains(focus)
      ) {
        setSel(null)
        return
      }
      const s = selection.toString().trim()
      if (!s) {
        setSel(null)
        return
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect()
      const range = findLineRange(raw, s)
      setSel({ text: s, range, top: rect.top, left: rect.left + rect.width / 2 })
    }
    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [raw])

  const openForm = (s: { text: string; range?: { start: number; end: number } }) => {
    setSelectedText(s.text)
    setSelRange(s.range)
    setNote('')
    setComment('')
    setOpen(true)
    setSel(null)
  }

  const handleSubmit = () => {
    const rangeLabel = selRange
      ? selRange.start === selRange.end
        ? ` (línea ${selRange.start})`
        : ` (líneas ${selRange.start}-${selRange.end})`
      : ''
    const body = [
      `**Archivo:** ${filePath ?? 'desconocido'}`,
      '',
      '**Texto seleccionado:**',
      `> ${selectedText}${rangeLabel}`,
      '',
      '**Remplazar por**',
      note.trim() || '(sin sugerencia)',
      '',
      '**Comentarios adicionales**',
      comment.trim() || '(opcional)',
    ].join('\n')
    const url = buildReportUrl({ title: 'Sugerencia de edición', body })
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
    setNote('')
    setComment('')
    setSelectedText('')
    setSelRange(undefined)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Botón flotante al seleccionar texto (solo escritorio). */}
      {sel && !open && (
        <button
          type="button"
          onClick={() => openForm(sel)}
          className="fixed z-20 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-misal-red px-3 py-1 text-xs font-medium text-white shadow-lg transition hover:bg-misal-gold sm:block"
          style={{ top: sel.top - 40, left: sel.left }}
        >
          Sugerir edición
          {sel.range
            ? sel.range.start === sel.range.end
              ? ` · línea ${sel.range.start}`
              : ` · líneas ${sel.range.start}-${sel.range.end}`
            : ''}
        </button>
      )}

      {open && (
        <div className="mb-2 rounded-lg border border-misal-red/30 bg-misal-red/5 p-3">
          {selectedText && (
            <p className="mb-2 rounded bg-white/70 p-2 text-xs italic text-misal-ink/80">
              «{selectedText}»
            </p>
          )}
          <label className="mb-1 block text-xs font-medium text-misal-ink/70">
            Remplazar por
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Escriba el texto con el que se debe reemplazar…"
            className="w-full rounded-lg border border-[#e4ddcf] bg-white p-2 text-sm text-misal-ink focus:outline-none focus:ring-2 focus:ring-misal-red"
          />
          <label className="mb-1 mt-3 block text-xs font-medium text-misal-ink/70">
            Comentarios adicionales (opcional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Describa el motivo del cambio…"
            className="w-full rounded-lg border border-[#e4ddcf] bg-white p-2 text-sm text-misal-ink focus:outline-none focus:ring-2 focus:ring-misal-red"
          />
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[0.65rem] text-misal-ink/50">
              {filePath}
              {selRange
                ? selRange.start === selRange.end
                  ? ` · línea ${selRange.start}`
                  : ` · líneas ${selRange.start}-${selRange.end}`
                : ''}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setNote('')
                  setComment('')
                  setSelectedText('')
                  setSelRange(undefined)
                }}
                className="rounded-full border border-[#e4ddcf] px-3 py-1 text-xs text-misal-ink/70 transition hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-full bg-misal-red px-3 py-1 text-xs font-medium text-white transition hover:bg-misal-gold"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

// Extrae el texto plano de un nodo React (para localizar la línea en el MDX).
export const mdxComponents = {
  Section: CopySection,
  h2: (props: { children?: ReactNode }) => (
    <h2 className="text-xl font-bold text-misal-ink">{props.children}</h2>
  ),
  p: (props: { children?: ReactNode }) => (
    <SugerirMejora>
      <p className="mb-4 text-lg leading-relaxed text-misal-ink">{props.children}</p>
    </SugerirMejora>
  ),
  ul: (props: ComponentProps<'ul'>) => (
    <SugerirMejora>
      <ul className="mb-4 list-disc space-y-1 pl-6 text-misal-ink">{props.children}</ul>
    </SugerirMejora>
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <SugerirMejora>
      <ol className="mb-4 list-decimal space-y-1 pl-6 text-misal-ink">{props.children}</ol>
    </SugerirMejora>
  ),
  li: (props: ComponentProps<'li'>) => <li className="leading-relaxed">{props.children}</li>,
  em: (props: ComponentProps<'em'>) => <em className="italic text-misal-ink">{props.children}</em>,
  strong: (props: ComponentProps<'strong'>) => (
    <strong className="font-bold text-misal-red">{props.children}</strong>
  ),
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <SugerirMejora>
      <blockquote className="mb-4 border-l-4 border-misal-gold pl-4 italic text-misal-ink/70">
        {props.children}
      </blockquote>
    </SugerirMejora>
  ),
}

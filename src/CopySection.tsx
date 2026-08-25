import { useState } from 'react'
import type { ReactNode } from 'react'

interface CopySectionProps {
  id: string
  title: string
  children: ReactNode
}

// Sección destacada (una lectura, salmo o evangelio) con su título, un botón
// para copiar el subtítulo (##) y un id con el que se enlaza de forma dinámica.
export default function CopySection({ id, title, children }: CopySectionProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const text = getSubtitle(children)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard puede fallar en algunos contextos; ignoramos en silencio.
    }
  }

  return (
    <section
      id={id}
      className="scroll-mt-6 bg-misal-cream border border-[#e4ddcf] rounded-xl p-7 shadow-sm"
    >
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-xl font-bold tracking-[0.12em] uppercase text-misal-red">{title}</h2>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#e4ddcf] bg-transparent px-4 py-1.5 text-sm font-medium text-misal-ink/70 transition hover:bg-misal-gold hover:text-white hover:border-misal-gold focus:outline-none focus:ring-2 focus:ring-misal-gold"
          aria-label={`Copiar ${title}`}
        >
          {copied ? <span>✓ Copiado</span> : <span>Copiar</span>}
        </button>
      </div>
      <div className="leading-relaxed text-misal-ink">{children}</div>
    </section>
  )
}

// Extrae el texto del primer subtítulo (##) de la sección, que es el primer
// elemento h2 dentro de los children. Es lo único que se copia.
function getSubtitle(node: ReactNode): string {
  const nodes = Array.isArray(node) ? node : [node]
  for (const child of nodes) {
    if (isHeading(child, 'h2')) {
      return getText((child as { props: { children?: ReactNode } }).props.children)
    }
  }
  return ''
}

// Detecta si un nodo React es un encabezado del tag dado. El `type` puede ser
// la cadena del tag (h2) o la función del componente (p. ej. el `h2` mapeado
// por MDXProvider), así que comparamos el nombre de la función como respaldo.
function isHeading(node: ReactNode, tag: string): boolean {
  if (!node || typeof node !== 'object' || !('type' in node)) return false
  const type = (node as { type?: unknown }).type
  if (typeof type === 'string') return type === tag
  if (typeof type === 'function' && type.name === tag) return true
  return false
}

// Extrae el texto plano de un nodo React.
function getText(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getText).join('\n')
  if (typeof node === 'object' && 'props' in node) {
    return getText((node as { props: { children?: ReactNode } }).props.children)
  }
  return ''
}

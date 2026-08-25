import type { ComponentProps, ReactNode } from 'react'
import CopySection from './CopySection'

export const mdxComponents = {
  Section: CopySection,
  h2: (props: { children?: ReactNode }) => (
    <h2 className="text-xl font-bold text-misal-ink">{props.children}</h2>
  ),
  p: (props: { children?: ReactNode }) => (
    <p className="mb-4 text-lg leading-relaxed text-misal-ink">{props.children}</p>
  ),
  ul: (props: ComponentProps<'ul'>) => (
    <ul className="mb-4 list-disc space-y-1 pl-6 text-misal-ink">{props.children}</ul>
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <ol className="mb-4 list-decimal space-y-1 pl-6 text-misal-ink">{props.children}</ol>
  ),
  li: (props: ComponentProps<'li'>) => <li className="leading-relaxed">{props.children}</li>,
  em: (props: ComponentProps<'em'>) => <em className="italic text-misal-ink">{props.children}</em>,
  strong: (props: ComponentProps<'strong'>) => (
    <strong className="font-bold text-misal-red">{props.children}</strong>
  ),
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <blockquote className="mb-4 border-l-4 border-misal-gold pl-4 italic text-misal-ink/70">
      {props.children}
    </blockquote>
  ),
}

import { useEffect, useState } from 'react'

// Botón flotante que aparece al hacer scroll y lleva de vuelta al inicio.
export default function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className={`fixed bottom-6 right-6 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full bg-misal-red text-white shadow-lg transition hover:bg-misal-gold focus:outline-none focus:ring-2 focus:ring-misal-gold ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      ↑
    </button>
  )
}
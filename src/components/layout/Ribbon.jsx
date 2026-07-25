import { useLocation } from 'react-router-dom'

// Panjang pita pembatas buku (bookmark ribbon) dibedakan per halaman —
// meniru pita asli yang terselip tidak rata di antara lembaran buku,
// jadi tiap halaman kelihatan sedikit berbeda & tidak kaku/mesin.
const PANJANG_PITA = {
  '/': 94,
  '/login': 130,
  '/register': 150,
  '/dashboard': 110,
  '/profile': 78,
  '/admin': 160,
}

function panjangUntuk(pathname) {
  if (PANJANG_PITA[pathname] != null) return PANJANG_PITA[pathname]
  if (pathname.startsWith('/post/')) return 118
  if (pathname.startsWith('/dashboard/tulis')) return 100
  return 94
}

export default function Ribbon() {
  const { pathname } = useLocation()
  const tinggi = panjangUntuk(pathname)

  return (
    <div
      className="absolute left-1/2 top-0 z-30 pointer-events-none transition-[height] duration-300 ease-out"
      style={{
        width: '24px',
        height: `${tinggi}px`,
        background: 'linear-gradient(180deg, #B4405C 0%, #8A2C43 100%)',
        clipPath: 'polygon(0 0, 100% 0, 100% 76%, 50% 100%, 0 76%)',
        transform: 'translateX(-50%) rotate(-1.3deg)',
        boxShadow: '1px 2px 5px rgba(28,28,19,0.3)',
      }}
    >
      <div className="absolute inset-y-0 left-1/2 w-px bg-black/20" style={{ transform: 'translateX(-50%)' }} />
    </div>
  )
}

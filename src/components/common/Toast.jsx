import { useEffect } from 'react'

export default function Toast({ message, type = 'sukses', onClose }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const warna = type === 'error' ? 'bg-red-600' : 'bg-stempel-dark'

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ${warna} text-white font-baca text-sm px-5 py-3 shadow-xl max-w-[90vw] text-center`}>
      {message}
    </div>
  )
}

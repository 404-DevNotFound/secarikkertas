import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'

const INTERVAL_POLLING_MS = 30000

function waktuRelatif(iso) {
  const detik = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (detik < 60) return 'baru saja'
  if (detik < 3600) return `${Math.floor(detik / 60)} menit lalu`
  if (detik < 86400) return `${Math.floor(detik / 3600)} jam lalu`
  return `${Math.floor(detik / 86400)} hari lalu`
}

// Bel notifikasi di navbar — polling ringan tiap 30 detik selagi halaman
// terbuka, sama pola pollingnya dengan WriterDashboard (bukan websocket,
// cukup sederhana buat kebutuhan situs ini).
export default function NotificationBell() {
  const navigate = useNavigate()
  const [buka, setBuka] = useState(false)
  const [notifikasi, setNotifikasi] = useState([])
  const [belumDibaca, setBelumDibaca] = useState(0)
  const intervalRef = useRef(null)
  const wrapRef = useRef(null)

  function muat() {
    api.get('/notifications').then((res) => {
      setNotifikasi(res.data.notifikasi)
      setBelumDibaca(res.data.belumDibaca)
    }).catch(() => {})
  }

  useEffect(() => {
    muat()
    intervalRef.current = setInterval(muat, INTERVAL_POLLING_MS)
    return () => clearInterval(intervalRef.current)
  }, [])

  useEffect(() => {
    function handleClickLuar(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setBuka(false)
    }
    document.addEventListener('mousedown', handleClickLuar)
    return () => document.removeEventListener('mousedown', handleClickLuar)
  }, [])

  async function bukaNotif(n) {
    if (!n.dibaca) {
      api.put(`/notifications/${n.id}/baca`).catch(() => {})
      setNotifikasi((prev) => prev.map((x) => (x.id === n.id ? { ...x, dibaca: true } : x)))
      setBelumDibaca((b) => Math.max(0, b - 1))
    }
    setBuka(false)
    if (n.link) navigate(n.link)
  }

  async function tandaiSemua() {
    await api.put('/notifications/baca-semua').catch(() => {})
    setNotifikasi((prev) => prev.map((x) => ({ ...x, dibaca: true })))
    setBelumDibaca(0)
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setBuka((v) => !v)}
        className="relative p-1.5 text-naskah-inksoft/70 hover:text-naskah-ink transition-colors"
        aria-label="Notifikasi"
      >
        <svg width="19" height="19" viewBox="0 0 19 19" fill="none">
          <path
            d="M4 14v-4.5a5.5 5.5 0 0 1 11 0V14l1.5 2H2.5L4 14Z"
            stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"
          />
          <path d="M7.5 17a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        {belumDibaca > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[9px] leading-none rounded-full w-4 h-4 flex items-center justify-center font-mono">
            {belumDibaca > 9 ? '9+' : belumDibaca}
          </span>
        )}
      </button>

      {buka && (
        <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-naskah-bg border border-naskah-aged shadow-xl z-50">
          <div className="flex items-center justify-between px-3 py-2 border-b border-naskah-aged/60">
            <span className="font-ketik text-[11px] uppercase tracking-widest text-naskah-inksoft/70">
              Notifikasi
            </span>
            {belumDibaca > 0 && (
              <button onClick={tandaiSemua} className="font-mono text-[10px] uppercase text-naskah-leather underline">
                Tandai semua dibaca
              </button>
            )}
          </div>
          {notifikasi.length === 0 && (
            <p className="font-baca italic text-sm text-naskah-inksoft/60 px-3 py-6 text-center">
              Belum ada notifikasi.
            </p>
          )}
          {notifikasi.map((n) => (
            <button
              key={n.id}
              onClick={() => bukaNotif(n)}
              className={`w-full text-left px-3 py-2.5 border-b border-naskah-aged/40 last:border-none hover:bg-naskah-surface/60 transition-colors ${
                !n.dibaca ? 'bg-naskah-mosslight/40' : ''
              }`}
            >
              <p className="font-baca text-[13px] text-naskah-ink leading-snug">{n.pesan}</p>
              <p className="font-mono text-[10px] text-naskah-inksoft/50 mt-1">{waktuRelatif(n.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'

// Efek mengetik huruf-demi-huruf, kursor berkedip di ujung teks setelah
// selesai — seperti mesin ketik. Dipakai di judul beranda ("secarikkertas").
export default function TypedText({ text, kecepatan = 90, jedaAwal = 300, className = '' }) {
  const [jumlahHuruf, setJumlahHuruf] = useState(0)
  const [selesai, setSelesai] = useState(false)

  useEffect(() => {
    // Kalau pengguna sudah pilih "Mode Nyaman" (kurangi animasi), langsung
    // tampilkan teksnya utuh tanpa mengetik satu-satu — lihat
    // src/context/AccessibilityContext.jsx.
    const modeNyaman = document.documentElement.classList.contains('mode-nyaman')
    if (modeNyaman) {
      setJumlahHuruf(text.length)
      setSelesai(true)
      return
    }

    setJumlahHuruf(0)
    setSelesai(false)

    let i = 0
    let timer
    const mulaiMengetik = () => {
      timer = setInterval(() => {
        i += 1
        setJumlahHuruf(i)
        if (i >= text.length) {
          clearInterval(timer)
          setSelesai(true)
        }
      }, kecepatan)
    }
    const jeda = setTimeout(mulaiMengetik, jedaAwal)

    return () => {
      clearTimeout(jeda)
      clearInterval(timer)
    }
  }, [text, kecepatan, jedaAwal])

  return (
    <span className={className}>
      <span aria-hidden="true">
        {text.slice(0, jumlahHuruf)}
        <span
          className={`inline-block w-[2px] sm:w-[3px] -mb-0.5 h-[0.85em] ml-0.5 bg-current align-middle ${
            selesai ? 'animate-[kedip_1s_step-end_infinite]' : 'opacity-100'
          }`}
        />
      </span>
      {/* Teks utuh untuk pembaca layar — tidak ikut animasi huruf-demi-huruf,
          supaya screen reader langsung membaca kata lengkapnya. */}
      <span className="sr-only">{text}</span>
    </span>
  )
}

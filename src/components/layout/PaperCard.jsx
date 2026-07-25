// Kartu berbentuk "secarik kertas" — dipakai di halaman Masuk & Daftar
// supaya form terasa seperti lembaran kertas bergaris yang diletakkan di
// atas buku, lengkap dengan tumpukan kertas di baliknya, washi tape, dan
// garis margin merah ala buku tulis (.margin-buku, sudah ada di index.css).
export default function PaperCard({ children }) {
  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Tumpukan lembar kertas di belakang, sedikit miring & mengintip */}
      <div className="absolute inset-0 top-2 bg-kertas-soft rotate-[3deg] shadow-sm" aria-hidden="true" />
      <div className="absolute inset-0 top-1 bg-kertas rotate-[-2deg] shadow-sm" aria-hidden="true" />

      {/* Lembar kertas utama */}
      <div
        className="relative bg-kertas shadow-lg -rotate-[0.6deg] margin-buku py-9 sm:py-11"
        style={{
          backgroundImage: 'linear-gradient(#C9DCEE 1px, transparent 1px)',
          backgroundSize: '100% 28px',
          backgroundPositionY: '10px',
        }}
      >
        {/* Washi tape nempel di pojok atas, kesan ditempel di buku */}
        <span className="washi-tape" style={{ backgroundColor: '#D98E3F', opacity: 0.55 }} aria-hidden="true" />

        <div className="pl-12 pr-6 sm:pl-16 sm:pr-9">{children}</div>
      </div>
    </div>
  )
}

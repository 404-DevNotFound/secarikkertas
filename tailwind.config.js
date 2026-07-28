/** @type {import('tailwindcss').Config} */

// Helper kecil: bikin fungsi warna Tailwind yang membaca CSS variable
// (didefinisikan di src/index.css, sebagai triplet RGB "R G B" tanpa
// koma — format yang dipakai Tailwind supaya opacity modifier semacam
// bg-kertas/60 tetap jalan). Ini fondasi dark mode: satu-satunya yang
// beda antara mode terang & gelap adalah NILAI variable-nya (di :root vs
// .dark pada index.css), bukan className di komponen — jadi hampir
// seluruh situs otomatis ikut berganti tema tanpa disentuh satu per satu.
function warnaVar(namaVar) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `rgb(var(${namaVar}) / ${opacityValue})`
      : `rgb(var(${namaVar}))`
}

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kertas: {
          DEFAULT: warnaVar('--color-kertas'),
          soft: warnaVar('--color-kertas-soft'),
          line: warnaVar('--color-kertas-line'),
        },
        tinta: {
          DEFAULT: warnaVar('--color-tinta'),
          soft: warnaVar('--color-tinta-soft'),
          faint: warnaVar('--color-tinta-faint'),
        },
        // Aksen utama (hijau tinta/stempel) — tetap dipakai untuk aksi utama
        stempel: {
          DEFAULT: warnaVar('--color-stempel'),
          dark: warnaVar('--color-stempel-dark'),
          light: warnaVar('--color-stempel-light'),
        },
        stabilo: {
          DEFAULT: warnaVar('--color-stabilo'),
          light: warnaVar('--color-stabilo-light'),
        },
        // Warna tambahan ala buku tulis — dipakai bergantian untuk kategori/badge,
        // supaya tidak monoton satu warna terus di semua tempat.
        biru: { DEFAULT: warnaVar('--color-biru'), light: warnaVar('--color-biru-light') },
        merahmuda: { DEFAULT: warnaVar('--color-merahmuda'), light: warnaVar('--color-merahmuda-light') },
        mustard: { DEFAULT: warnaVar('--color-mustard'), light: warnaVar('--color-mustard-light') },
        garisbuku: warnaVar('--color-garisbuku'), // warna garis biru muda khas buku tulis
        margin: warnaVar('--color-margin'), // garis merah margin

        // Palet "buku antik" — dipakai khusus di halaman ber-layout spread
        // dua-halaman (HomePage, WriterDashboard), terpisah dari palet
        // "buku tulis" (kertas/tinta/stempel) supaya halaman lain yang belum
        // diubah tidak ikut kena efek.
        naskah: {
          bg: warnaVar('--color-naskah-bg'),           // parchment dasar (permukaan halaman)
          surface: warnaVar('--color-naskah-surface'), // permukaan sedikit lebih gelap (meja/latar di luar buku)
          aged: warnaVar('--color-naskah-aged'),        // border & garis lipatan
          ink: warnaVar('--color-naskah-ink'),          // teks utama (iron gall ink)
          inksoft: warnaVar('--color-naskah-inksoft'),
          leather: warnaVar('--color-naskah-leather'),         // aksen utama (kulit buku) — tombol, link penting
          leatherdark: warnaVar('--color-naskah-leatherdark'),
          moss: warnaVar('--color-naskah-moss'),        // aksen sekunder (lumut/forest) — badge, status
          mosslight: warnaVar('--color-naskah-mosslight'),
          // Badge status "Dalam Antrean" — sebelumnya hex hardcode di
          // WriterDashboard/AdminDashboard, dipindah ke sini biar ikut tema juga.
          amber: warnaVar('--color-naskah-amber'),
          amberlight: warnaVar('--color-naskah-amberlight'),
        },
      },
      fontFamily: {
        // Font utama situs, disamakan dengan referensi desain "Stitch":
        // judul pakai Libre Caslon Text, teks baca pakai Courier Prime
        // (nuansa mesin ketik), label/navigasi pakai Work Sans.
        judul: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        baca: ['"Courier Prime"', 'monospace'],
        mono: ['"Work Sans"', 'sans-serif'],

        // Alias — dipakai di halaman ber-layout buku terbuka (Home, Dasbor,
        // Editor, Admin). Sengaja disamakan dengan judul/baca di atas supaya
        // seluruh situs konsisten satu sistem font.
        naskah: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        ketik: ['"Courier Prime"', 'monospace'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        kertas: {
          DEFAULT: '#FAF6EC',
          soft: '#F2ECDE',
          line: '#DDD5C0',
        },
        tinta: {
          DEFAULT: '#2B2A28',
          soft: '#5C574E',
          faint: '#8A8477',
        },
        // Aksen utama (hijau tinta/stempel) — tetap dipakai untuk aksi utama
        stempel: {
          DEFAULT: '#3F6C51',
          dark: '#2E5039',
          light: '#EAF0EA',
        },
        stabilo: {
          DEFAULT: '#D98E3F',
          light: '#FBEBD6',
        },
        // Warna tambahan ala buku tulis — dipakai bergantian untuk kategori/badge,
        // supaya tidak monoton satu warna terus di semua tempat.
        biru: { DEFAULT: '#2B5B8C', light: '#E3EDF6' },
        merahmuda: { DEFAULT: '#C4436B', light: '#FBE7ED' },
        mustard: { DEFAULT: '#B8860B', light: '#FBF1D6' },
        garisbuku: '#C9DCEE', // warna garis biru muda khas buku tulis
        margin: '#E08585', // garis merah margin

        // Palet "buku antik" — dipakai khusus di halaman ber-layout spread
        // dua-halaman (HomePage, WriterDashboard), terpisah dari palet
        // "buku tulis" (kertas/tinta/stempel) supaya halaman lain yang belum
        // diubah tidak ikut kena efek.
        naskah: {
          bg: '#F4F1E1',      // parchment dasar (permukaan halaman)
          surface: '#EBE7D5', // permukaan sedikit lebih gelap (meja/latar di luar buku)
          aged: '#DCD7C0',    // border & garis lipatan
          ink: '#1C1C13',     // teks utama (iron gall ink)
          inksoft: '#464741',
          leather: '#8B5E3C', // aksen utama (kulit buku) — tombol, link penting
          leatherdark: '#653D1E',
          moss: '#4A5D4E',    // aksen sekunder (lumut/forest) — badge, status
          mosslight: '#DDE6DC',
        },
      },
      fontFamily: {
        judul: ['Fraunces', 'Georgia', 'serif'],
        baca: ['Literata', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],

        // Font khusus halaman ber-layout buku terbuka
        naskah: ['"Libre Caslon Text"', 'Georgia', 'serif'],
        ketik: ['"Courier Prime"', 'monospace'],
      },
    },
  },
  plugins: [],
}

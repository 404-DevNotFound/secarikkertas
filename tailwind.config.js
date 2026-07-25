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
      },
      fontFamily: {
        judul: ['Fraunces', 'Georgia', 'serif'],
        baca: ['Literata', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}

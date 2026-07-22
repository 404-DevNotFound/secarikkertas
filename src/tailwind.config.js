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
        stempel: {
          DEFAULT: '#3F6C51',
          dark: '#2E5039',
          light: '#EAF0EA',
        },
        stabilo: {
          DEFAULT: '#D98E3F',
          light: '#FBEBD6',
        },
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

export default function Button({ children, variant = 'primary', ...props }) {
  const styles = {
    primary: 'bg-tinta text-kertas hover:bg-stempel-dark',
    outline: 'border border-tinta text-tinta hover:bg-tinta hover:text-kertas',
    danger: 'bg-stabilo text-kertas hover:opacity-90',
  }

  return (
    <button
      className={`px-5 py-2.5 font-baca text-sm transition-colors ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}

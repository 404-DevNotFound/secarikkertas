export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-tinta text-kertas hover:bg-stempel-dark disabled:opacity-50 disabled:cursor-not-allowed',
    outline: 'border border-tinta text-tinta hover:bg-tinta hover:text-kertas',
    danger: 'bg-stabilo text-kertas hover:opacity-90',
  }

  return (
    <button
      className={`px-5 py-2.5 font-baca text-sm transition-colors ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

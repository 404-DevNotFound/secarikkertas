export default function Button({ children, variant = 'primary', ...props }) {
  const styles = {
    primary: 'bg-slate-800 text-white hover:bg-slate-700',
    outline: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${styles[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}

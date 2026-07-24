export default function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmText = 'Hapus', danger = true }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/50 backdrop-blur-sm px-4">
      <div className="bg-kertas max-w-sm w-full p-6 shadow-xl border border-kertas-line">
        {title && <h3 className="font-judul text-lg font-semibold text-tinta mb-2">{title}</h3>}
        <p className="font-baca text-sm text-tinta-soft mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="font-mono text-xs uppercase px-4 py-2 border border-kertas-line text-tinta-soft hover:bg-kertas-soft transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={`font-mono text-xs uppercase px-4 py-2 text-white transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-700' : 'bg-stempel hover:bg-stempel-dark'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import api from '../api/axios'
import ConfirmModal from '../components/common/ConfirmModal'
import Toast from '../components/common/Toast'

export default function AdminDashboard() {
  const [tab, setTab] = useState('naskah')
  const [stats, setStats] = useState(null)
  const [naskah, setNaskah] = useState([])
  const [terbit, setTerbit] = useState([])
  const [users, setUsers] = useState([])
  const [catatanTolak, setCatatanTolak] = useState({})
  const [targetHapusUser, setTargetHapusUser] = useState(null)
  const [targetHapusPost, setTargetHapusPost] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data))
  }, [])

  useEffect(() => {
    if (tab === 'naskah') {
      api.get('/admin/naskah', { params: { status: 'diajukan' } }).then((res) => setNaskah(res.data))
    } else if (tab === 'terbit') {
      api.get('/admin/naskah', { params: { status: 'terbit' } }).then((res) => setTerbit(res.data))
    } else if (tab === 'user') {
      api.get('/admin/users').then((res) => setUsers(res.data))
    }
  }, [tab])

  async function setujui(id) {
    await api.put(`/admin/naskah/${id}/setujui`)
    setNaskah((prev) => prev.filter((n) => n.id !== id))
    setToast({ message: 'Naskah berhasil disetujui dan diterbitkan.', type: 'sukses' })
  }

  async function tolak(id) {
    await api.put(`/admin/naskah/${id}/tolak`, { catatan: catatanTolak[id] || '' })
    setNaskah((prev) => prev.filter((n) => n.id !== id))
    setToast({ message: 'Naskah ditolak.', type: 'sukses' })
  }

  async function toggleBan(id, banned) {
    await api.put(`/admin/users/${id}/banned`, { banned: !banned })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned: !banned } : u)))
    setToast({ message: !banned ? 'Akun diblokir.' : 'Blokir dibuka.', type: 'sukses' })
  }

  async function ubahRole(id, role) {
    const roleBaru = role === 'admin' ? 'penulis' : 'admin'
    await api.put(`/admin/users/${id}/role`, { role: roleBaru })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: roleBaru } : u)))
    setToast({ message: `Role diubah jadi ${roleBaru}.`, type: 'sukses' })
  }

  async function konfirmasiHapusUser() {
    if (!targetHapusUser) return
    try {
      await api.delete(`/admin/users/${targetHapusUser.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== targetHapusUser.id))
      setToast({ message: `Akun "${targetHapusUser.username}" berhasil dihapus.`, type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal menghapus akun', type: 'error' })
    } finally {
      setTargetHapusUser(null)
    }
  }

  async function konfirmasiHapusPost() {
    if (!targetHapusPost) return
    try {
      await api.delete(`/admin/posts/${targetHapusPost.id}`)
      setTerbit((prev) => prev.filter((p) => p.id !== targetHapusPost.id))
      setToast({ message: `Naskah "${targetHapusPost.judul}" berhasil dihapus.`, type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal menghapus naskah', type: 'error' })
    } finally {
      setTargetHapusPost(null)
    }
  }

  return (
    <div className="h-full overflow-y-auto p-6 sm:p-10 md:p-14">
      <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mb-2 block">
        Buku Besar
      </span>
      <h1 className="font-naskah text-3xl text-naskah-ink mb-6">Panel Admin</h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            ['Pengguna', stats.totalUser],
            ['Naskah', stats.totalPost],
            ['Terbit', stats.totalTerbit],
            ['Diajukan', stats.totalDiajukan],
            ['Komentar', stats.totalComment],
          ].map(([label, val]) => (
            <div key={label} className="bg-naskah-surface/50 p-3 sm:p-4 border border-naskah-aged">
              <p className="font-ketik text-[10px] uppercase text-naskah-inksoft/70">{label}</p>
              <p className="font-naskah text-xl sm:text-2xl text-naskah-ink">{val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 mb-6 font-ketik text-xs uppercase tracking-wide overflow-x-auto border-b border-naskah-aged/60">
        <button
          onClick={() => setTab('naskah')}
          className={`px-4 py-2 border-b-2 whitespace-nowrap -mb-px ${tab === 'naskah' ? 'border-naskah-leather text-naskah-ink' : 'border-transparent text-naskah-inksoft/60'}`}
        >
          Antrean Naskah
        </button>
        <button
          onClick={() => setTab('terbit')}
          className={`px-4 py-2 border-b-2 whitespace-nowrap -mb-px ${tab === 'terbit' ? 'border-naskah-leather text-naskah-ink' : 'border-transparent text-naskah-inksoft/60'}`}
        >
          Naskah Terbit
        </button>
        <button
          onClick={() => setTab('user')}
          className={`px-4 py-2 border-b-2 whitespace-nowrap -mb-px ${tab === 'user' ? 'border-naskah-leather text-naskah-ink' : 'border-transparent text-naskah-inksoft/60'}`}
        >
          Kelola Pengguna
        </button>
      </div>

      {tab === 'naskah' && (
        <div className="space-y-4">
          {naskah.length === 0 && <p className="font-ketik italic text-sm text-naskah-inksoft/70">Tidak ada naskah menunggu tinjauan.</p>}
          {naskah.map((n) => (
            <div key={n.id} className="bg-naskah-surface/50 p-4 border border-naskah-aged">
              <p className="font-naskah text-lg text-naskah-ink">{n.judul}</p>
              <p className="font-ketik text-[11px] text-naskah-inksoft/70 mb-2">oleh {n.penulis.namaPena} · {n.kategori}</p>
              <p className="font-baca text-sm text-naskah-inksoft mb-3">{n.isi.slice(0, 200)}...</p>
              <input
                placeholder="Catatan penolakan (opsional)"
                value={catatanTolak[n.id] || ''}
                onChange={(e) => setCatatanTolak((s) => ({ ...s, [n.id]: e.target.value }))}
                className="w-full mb-3 px-2 py-1.5 bg-white border border-naskah-aged text-sm font-baca outline-none focus:border-naskah-leather"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setujui(n.id)} className="px-3 py-1.5 bg-naskah-moss text-white text-xs font-ketik uppercase">
                  Setujui
                </button>
                <button onClick={() => tolak(n.id)} className="px-3 py-1.5 bg-naskah-leather text-white text-xs font-ketik uppercase">
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'terbit' && (
        <div className="space-y-3">
          <p className="font-ketik text-sm text-naskah-inksoft/70 italic mb-2">
            Naskah yang sudah terbit hanya bisa dihapus dari sini (admin), penulis tidak bisa menghapusnya sendiri.
          </p>
          {terbit.length === 0 && <p className="font-ketik italic text-sm text-naskah-inksoft/70">Belum ada naskah terbit.</p>}
          {terbit.map((p) => (
            <div key={p.id} className="bg-naskah-surface/50 p-4 border border-naskah-aged flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <div className="min-w-0">
                <p className="font-naskah text-lg text-naskah-ink truncate">{p.judul}</p>
                <p className="font-ketik text-[11px] text-naskah-inksoft/70">oleh {p.penulis.namaPena} · {p.kategori}</p>
              </div>
              <button
                onClick={() => setTargetHapusPost({ id: p.id, judul: p.judul })}
                className="font-ketik text-xs uppercase text-red-600 underline shrink-0"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'user' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-baca min-w-[600px]">
            <thead>
              <tr className="text-left font-ketik text-[10px] uppercase text-naskah-inksoft/70 border-b border-naskah-aged">
                <th className="py-2 pr-2">Username</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-naskah-aged/60">
                  <td className="py-2 pr-2">{u.username}</td>
                  <td className="py-2 pr-2">{u.role}</td>
                  <td className="py-2 pr-2">{u.banned ? 'Diblokir' : 'Aktif'}</td>
                  <td className="py-2 flex flex-wrap gap-3">
                    <button onClick={() => ubahRole(u.id, u.role)} className="text-xs underline text-naskah-leather">
                      {u.role === 'admin' ? 'Turunkan' : 'Jadikan Admin'}
                    </button>
                    <button onClick={() => toggleBan(u.id, u.banned)} className="text-xs underline text-naskah-moss">
                      {u.banned ? 'Buka Blokir' : 'Blokir'}
                    </button>
                    {u.role !== 'admin' && (
                      <button
                        onClick={() => setTargetHapusUser({ id: u.id, username: u.username })}
                        className="text-xs underline text-red-600"
                      >
                        Hapus Akun
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!targetHapusUser}
        title="Hapus Akun?"
        message={`Akun "${targetHapusUser?.username}" beserta semua tulisan, komentar, dan like miliknya akan dihapus permanen.`}
        onConfirm={konfirmasiHapusUser}
        onCancel={() => setTargetHapusUser(null)}
      />

      <ConfirmModal
        open={!!targetHapusPost}
        title="Hapus Naskah?"
        message={`Naskah "${targetHapusPost?.judul}" akan dihapus permanen dari halaman publik, beserta komentar dan like-nya.`}
        onConfirm={konfirmasiHapusPost}
        onCancel={() => setTargetHapusPost(null)}
      />

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </div>
  )
}

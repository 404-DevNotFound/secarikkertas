import { useState, useEffect } from 'react'
import api from '../api/axios'

export default function AdminDashboard() {
  const [tab, setTab] = useState('naskah')
  const [stats, setStats] = useState(null)
  const [naskah, setNaskah] = useState([])
  const [users, setUsers] = useState([])
  const [catatanTolak, setCatatanTolak] = useState({})

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data))
  }, [])

  useEffect(() => {
    if (tab === 'naskah') {
      api.get('/admin/naskah', { params: { status: 'diajukan' } }).then((res) => setNaskah(res.data))
    } else if (tab === 'user') {
      api.get('/admin/users').then((res) => setUsers(res.data))
    }
  }, [tab])

  async function setujui(id) {
    await api.put(`/admin/naskah/${id}/setujui`)
    setNaskah((prev) => prev.filter((n) => n.id !== id))
  }

  async function tolak(id) {
    await api.put(`/admin/naskah/${id}/tolak`, { catatan: catatanTolak[id] || '' })
    setNaskah((prev) => prev.filter((n) => n.id !== id))
  }

  async function toggleBan(id, banned) {
    await api.put(`/admin/users/${id}/banned`, { banned: !banned })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned: !banned } : u)))
  }

  async function ubahRole(id, role) {
    const roleBaru = role === 'admin' ? 'penulis' : 'admin'
    await api.put(`/admin/users/${id}/role`, { role: roleBaru })
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: roleBaru } : u)))
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <h1 className="font-judul text-2xl font-semibold text-tinta mb-6">Panel Admin</h1>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          {[
            ['Pengguna', stats.totalUser],
            ['Naskah', stats.totalPost],
            ['Terbit', stats.totalTerbit],
            ['Diajukan', stats.totalDiajukan],
            ['Komentar', stats.totalComment],
          ].map(([label, val]) => (
            <div key={label} className="bg-white p-3 sm:p-4 border border-kertas-line">
              <p className="font-mono text-[10px] uppercase text-tinta-faint">{label}</p>
              <p className="font-judul text-xl sm:text-2xl text-tinta">{val}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1 mb-6 font-mono text-xs uppercase tracking-wide overflow-x-auto">
        <button
          onClick={() => setTab('naskah')}
          className={`px-4 py-2 border-b-2 whitespace-nowrap ${tab === 'naskah' ? 'border-stempel text-tinta' : 'border-transparent text-tinta-faint'}`}
        >
          Antrean Naskah
        </button>
        <button
          onClick={() => setTab('user')}
          className={`px-4 py-2 border-b-2 whitespace-nowrap ${tab === 'user' ? 'border-stempel text-tinta' : 'border-transparent text-tinta-faint'}`}
        >
          Kelola Pengguna
        </button>
      </div>

      {tab === 'naskah' && (
        <div className="space-y-4">
          {naskah.length === 0 && <p className="font-baca italic text-tinta-faint">Tidak ada naskah menunggu tinjauan.</p>}
          {naskah.map((n) => (
            <div key={n.id} className="bg-white p-4 border border-kertas-line">
              <p className="font-judul text-lg text-tinta">{n.judul}</p>
              <p className="font-mono text-[11px] text-tinta-faint mb-2">oleh {n.penulis.namaPena} · {n.kategori}</p>
              <p className="font-baca text-sm text-tinta-soft mb-3">{n.isi.slice(0, 200)}...</p>
              <input
                placeholder="Catatan penolakan (opsional)"
                value={catatanTolak[n.id] || ''}
                onChange={(e) => setCatatanTolak((s) => ({ ...s, [n.id]: e.target.value }))}
                className="w-full mb-3 px-2 py-1.5 border border-kertas-line text-sm font-baca outline-none focus:border-stempel"
              />
              <div className="flex flex-col sm:flex-row gap-2">
                <button onClick={() => setujui(n.id)} className="px-3 py-1.5 bg-stempel text-white text-xs font-mono uppercase">
                  Setujui
                </button>
                <button onClick={() => tolak(n.id)} className="px-3 py-1.5 bg-stabilo text-white text-xs font-mono uppercase">
                  Tolak
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'user' && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-baca min-w-[500px]">
            <thead>
              <tr className="text-left font-mono text-[10px] uppercase text-tinta-faint border-b border-kertas-line">
                <th className="py-2 pr-2">Username</th>
                <th className="py-2 pr-2">Role</th>
                <th className="py-2 pr-2">Status</th>
                <th className="py-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-kertas-line">
                  <td className="py-2 pr-2">{u.username}</td>
                  <td className="py-2 pr-2">{u.role}</td>
                  <td className="py-2 pr-2">{u.banned ? 'Diblokir' : 'Aktif'}</td>
                  <td className="py-2 flex flex-wrap gap-2">
                    <button onClick={() => ubahRole(u.id, u.role)} className="text-xs underline text-stempel-dark">
                      {u.role === 'admin' ? 'Turunkan' : 'Jadikan Admin'}
                    </button>
                    <button onClick={() => toggleBan(u.id, u.banned)} className="text-xs underline text-stabilo">
                      {u.banned ? 'Buka Blokir' : 'Blokir'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

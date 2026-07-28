import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import ConfirmModal from '../components/common/ConfirmModal'
import Toast from '../components/common/Toast'
import BookSpread from '../components/layout/BookSpread'

// Label & urutan tahap pemeriksaan naskah — dipakai supaya admin dan
// penulis melihat istilah yang sama persis dengan yang ada di dasbor penulis.
const LABEL_TAHAP = {
  diajukan: { teks: 'Dalam Antrean', warna: 'bg-[#F4E3C7] text-[#8A5A1E]' },
  ditinjau: { teks: 'Sedang Diperiksa', warna: 'bg-biru-light text-biru' },
  siap_terbit: { teks: 'Siap Terbit', warna: 'bg-mustard-light text-mustard' },
}

const DAFTAR_TAB = [
  { id: 'naskah', label: 'Antrean Naskah' },
  { id: 'terbit', label: 'Naskah Terbit' },
  { id: 'laporan', label: 'Laporan' },
  { id: 'user', label: 'Kelola Pengguna' },
]

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('naskah')
  const [stats, setStats] = useState(null)
  const [naskah, setNaskah] = useState([])
  const [terbit, setTerbit] = useState([])
  const [users, setUsers] = useState([])
  const [laporan, setLaporan] = useState([])
  const [catatanTolak, setCatatanTolak] = useState({})
  const [targetHapusUser, setTargetHapusUser] = useState(null)
  const [targetHapusPost, setTargetHapusPost] = useState(null)
  const [toast, setToast] = useState(null)
  const [memproses, setMemproses] = useState({})

  useEffect(() => {
    api.get('/admin/stats').then((res) => setStats(res.data))
  }, [])

  function muatNaskah() {
    api.get('/admin/naskah', { params: { status: 'proses' } }).then((res) => setNaskah(res.data))
  }

  useEffect(() => {
    if (tab === 'naskah') {
      muatNaskah()
    } else if (tab === 'terbit') {
      api.get('/admin/naskah', { params: { status: 'terbit' } }).then((res) => setTerbit(res.data))
    } else if (tab === 'user') {
      api.get('/admin/users').then((res) => setUsers(res.data))
    } else if (tab === 'laporan') {
      api.get('/admin/laporan').then((res) => setLaporan(res.data))
    }
  }, [tab])

  function tandaiMemproses(id, v) {
    setMemproses((s) => ({ ...s, [id]: v }))
  }

  // Antrean -> Sedang Diperiksa
  async function mulaiPeriksa(id) {
    tandaiMemproses(id, true)
    try {
      const res = await api.put(`/admin/naskah/${id}/mulai-periksa`)
      setNaskah((prev) => prev.map((n) => (n.id === id ? { ...n, status: res.data.status } : n)))
      setToast({ message: 'Naskah ditandai sedang diperiksa.', type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal memperbarui status naskah', type: 'error' })
    } finally {
      tandaiMemproses(id, false)
    }
  }

  // Sedang Diperiksa -> Siap Terbit
  async function tandaiSiapTerbit(id) {
    tandaiMemproses(id, true)
    try {
      const res = await api.put(`/admin/naskah/${id}/siap-terbit`)
      setNaskah((prev) => prev.map((n) => (n.id === id ? { ...n, status: res.data.status } : n)))
      setToast({ message: 'Naskah ditandai siap terbit.', type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal memperbarui status naskah', type: 'error' })
    } finally {
      tandaiMemproses(id, false)
    }
  }

  // Siap Terbit -> Terbit
  async function setujui(id) {
    tandaiMemproses(id, true)
    try {
      await api.put(`/admin/naskah/${id}/setujui`)
      setNaskah((prev) => prev.filter((n) => n.id !== id))
      setToast({ message: 'Naskah berhasil disetujui dan diterbitkan.', type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal menerbitkan naskah', type: 'error' })
    } finally {
      tandaiMemproses(id, false)
    }
  }

  async function tolak(id) {
    tandaiMemproses(id, true)
    try {
      await api.put(`/admin/naskah/${id}/tolak`, { catatan: catatanTolak[id] || '' })
      setNaskah((prev) => prev.filter((n) => n.id !== id))
      setToast({ message: 'Naskah ditolak.', type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal menolak naskah', type: 'error' })
    } finally {
      tandaiMemproses(id, false)
    }
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

  async function selesaikanLaporan(id) {
    try {
      await api.put(`/admin/laporan/${id}/selesai`)
      setLaporan((prev) => prev.filter((l) => l.id !== id))
      setToast({ message: 'Laporan ditandai selesai.', type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal memperbarui laporan', type: 'error' })
    }
  }

  async function hapusKontenLaporan(l) {
    try {
      if (l.post) {
        await api.delete(`/admin/posts/${l.post.id}`)
      } else if (l.comment) {
        await api.delete(`/admin/comments/${l.comment.id}`)
      }
      await api.put(`/admin/laporan/${l.id}/selesai`)
      setLaporan((prev) => prev.filter((x) => x.id !== l.id))
      setToast({ message: 'Konten dihapus dan laporan ditandai selesai.', type: 'sukses' })
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Gagal menghapus konten', type: 'error' })
    }
  }

  return (
    <>
      <BookSpread
        kiri={
          <div className="flex flex-col h-full">
            <span className="font-ketik text-[11px] uppercase tracking-[0.25em] text-naskah-leather mb-3">
              Buku Besar
            </span>
            <h1 className="font-naskah text-3xl sm:text-4xl leading-tight text-naskah-ink mb-6">
              Panel Admin
            </h1>

            {stats && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  ['Pengguna', stats.totalUser],
                  ['Naskah', stats.totalPost],
                  ['Terbit', stats.totalTerbit],
                  ['Diajukan', stats.totalDiajukan],
                  ['Komentar', stats.totalComment],
                  ['Laporan Baru', stats.totalLaporanBaru],
                ].map(([label, val]) => (
                  <div key={label} className="bg-naskah-surface/50 p-3 border border-naskah-aged">
                    <p className="font-ketik text-[10px] uppercase text-naskah-inksoft/70">{label}</p>
                    <p className="font-naskah text-xl text-naskah-ink">{val}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-auto pt-6 border-t border-naskah-aged/60">
              <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-3">
                Kelola
              </h3>
              <ul className="space-y-2">
                {DAFTAR_TAB.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => setTab(t.id)}
                      className={`font-naskah text-left transition-colors ${
                        tab === t.id ? 'text-naskah-leather font-semibold' : 'text-naskah-inksoft hover:text-naskah-ink'
                      }`}
                    >
                      {t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        }
        kanan={
          <div>
            {tab === 'naskah' && (
              <div className="space-y-4">
                <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-2">
                  Antrean Naskah
                </h3>
                <p className="font-ketik text-sm text-naskah-inksoft/70 italic mb-2">
                  Naskah masuk berurutan: Dalam Antrean → Sedang Diperiksa → Siap Terbit → Terbit. Status ini juga
                  tampil otomatis di dasbor penulis.
                </p>
                {naskah.length === 0 && (
                  <p className="font-ketik italic text-sm text-naskah-inksoft/70">Tidak ada naskah menunggu tinjauan.</p>
                )}
                {naskah.map((n) => {
                  const tahap = LABEL_TAHAP[n.status] || LABEL_TAHAP.diajukan
                  const sedangProses = !!memproses[n.id]
                  return (
                    <div key={n.id} className="bg-naskah-surface/60 p-4 border border-naskah-aged/70">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-naskah text-lg text-naskah-ink">{n.judul}</p>
                        <span className={`font-ketik text-[10px] uppercase px-2 py-1 shrink-0 ${tahap.warna}`}>
                          {tahap.teks}
                        </span>
                      </div>
                      <p className="font-ketik text-[11px] text-naskah-inksoft/70 mb-2">
                        oleh {n.penulis.namaPena} · {n.tipe === 'artikel' ? 'Artikel' : 'Cerpen'} · {n.kategori}
                      </p>
                      <p className="font-baca text-sm text-naskah-inksoft mb-3">{n.isi.slice(0, 200)}...</p>
                      <input
                        placeholder="Catatan penolakan (opsional)"
                        value={catatanTolak[n.id] || ''}
                        onChange={(e) => setCatatanTolak((s) => ({ ...s, [n.id]: e.target.value }))}
                        className="w-full mb-3 px-2 py-1.5 bg-white border border-naskah-aged text-sm font-baca outline-none focus:border-naskah-leather"
                      />
                      <div className="flex flex-wrap gap-2">
                        {n.status === 'diajukan' && (
                          <button
                            onClick={() => mulaiPeriksa(n.id)}
                            disabled={sedangProses}
                            className="px-3 py-1.5 bg-biru text-white text-xs font-ketik uppercase disabled:opacity-60"
                          >
                            Mulai Periksa
                          </button>
                        )}
                        {n.status === 'ditinjau' && (
                          <button
                            onClick={() => tandaiSiapTerbit(n.id)}
                            disabled={sedangProses}
                            className="px-3 py-1.5 bg-mustard text-white text-xs font-ketik uppercase disabled:opacity-60"
                          >
                            Tandai Siap Terbit
                          </button>
                        )}
                        {n.status === 'siap_terbit' && (
                          <button
                            onClick={() => setujui(n.id)}
                            disabled={sedangProses}
                            className="px-3 py-1.5 bg-naskah-moss text-white text-xs font-ketik uppercase disabled:opacity-60"
                          >
                            Terbitkan
                          </button>
                        )}
                        <button
                          onClick={() => tolak(n.id)}
                          disabled={sedangProses}
                          className="px-3 py-1.5 bg-naskah-leather text-white text-xs font-ketik uppercase disabled:opacity-60"
                        >
                          Tolak
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'terbit' && (
              <div className="space-y-3">
                <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-2">
                  Naskah Terbit
                </h3>
                <p className="font-ketik text-sm text-naskah-inksoft/70 italic mb-2">
                  Naskah yang sudah terbit bisa diedit ulang isinya oleh admin lalu diterbitkan ulang, atau dihapus
                  dari sini.
                </p>
                {terbit.length === 0 && (
                  <p className="font-ketik italic text-sm text-naskah-inksoft/70">Belum ada naskah terbit.</p>
                )}
                {terbit.map((p) => (
                  <div
                    key={p.id}
                    className="bg-naskah-surface/60 p-4 border border-naskah-aged/70 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2"
                  >
                    <div className="min-w-0">
                      <p className="font-naskah text-lg text-naskah-ink truncate">{p.judul}</p>
                      <p className="font-ketik text-[11px] text-naskah-inksoft/70">
                        oleh {p.penulis.namaPena} · {p.tipe === 'artikel' ? 'Artikel' : 'Cerpen'} · {p.kategori}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <button
                        onClick={() => navigate(`/dashboard/tulis/${p.id}`)}
                        className="font-ketik text-xs uppercase text-naskah-leather underline"
                      >
                        Edit &amp; Terbitkan Ulang
                      </button>
                      <button
                        onClick={() => setTargetHapusPost({ id: p.id, judul: p.judul })}
                        className="font-ketik text-xs uppercase text-red-600 underline"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'laporan' && (
              <div className="space-y-3">
                <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-2">
                  Laporan Konten
                </h3>
                <p className="font-ketik text-sm text-naskah-inksoft/70 italic mb-2">
                  Laporan dari pembaca atas naskah atau komentar yang dianggap melanggar.
                </p>
                {laporan.length === 0 && (
                  <p className="font-ketik italic text-sm text-naskah-inksoft/70">Tidak ada laporan baru.</p>
                )}
                {laporan.map((l) => (
                  <div key={l.id} className="bg-naskah-surface/60 p-4 border border-naskah-aged/70">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-ketik text-[10px] uppercase px-2 py-1 bg-red-100 text-red-700 shrink-0">
                        {l.post ? 'Naskah' : 'Komentar'}
                      </span>
                      <span className="font-ketik text-[10px] text-naskah-inksoft/60">
                        {new Date(l.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="font-naskah text-base text-naskah-ink mb-1">
                      {l.post ? l.post.judul : `"${l.comment?.isi.slice(0, 100)}"`}
                    </p>
                    <p className="font-ketik text-[11px] text-naskah-inksoft/70 mb-1">
                      Alasan: <strong>{l.alasan}</strong>
                      {l.pelapor && ` · dilaporkan oleh @${l.pelapor.username}`}
                    </p>
                    {l.detail && <p className="font-baca text-sm text-naskah-inksoft mb-3 italic">"{l.detail}"</p>}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        onClick={() => selesaikanLaporan(l.id)}
                        className="px-3 py-1.5 bg-naskah-moss text-white text-xs font-ketik uppercase"
                      >
                        Tandai Selesai
                      </button>
                      <button
                        onClick={() => hapusKontenLaporan(l)}
                        className="px-3 py-1.5 bg-red-600 text-white text-xs font-ketik uppercase"
                      >
                        Hapus Konten
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'user' && (
              <div>
                <h3 className="font-ketik text-[11px] uppercase tracking-[0.2em] text-naskah-inksoft/70 mb-3">
                  Kelola Pengguna
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm font-baca min-w-[480px]">
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
              </div>
            )}
          </div>
        }
      />

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
    </>
  )
}

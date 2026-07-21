import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Button from '../components/common/Button'

export default function WriterDashboard() {
  const [drafts, setDrafts] = useState([])

  useEffect(() => {
    api.get('/posts/saya').then((res) => setDrafts(res.data))
  }, [])

  async function buatBaru() {
    const res = await api.post('/posts', { judul: 'Tanpa judul', tipe: 'cerpen' })
    window.location.href = `/dashboard/tulis/${res.data.id}`
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold text-slate-800">Dasbor Menulis</h1>
        <Button onClick={buatBaru}>+ Tulisan Baru</Button>
      </div>

      <div className="space-y-3">
        {drafts.map((d) => (
          <Link
            key={d.id}
            to={`/dashboard/tulis/${d.id}`}
            className="block p-4 bg-white rounded-lg shadow-sm hover:shadow-md"
          >
            <p className="font-medium text-slate-800">{d.judul}</p>
            <p className="text-xs text-slate-400">{d.status}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}

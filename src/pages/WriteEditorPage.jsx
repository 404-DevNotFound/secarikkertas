import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/axios'
import TextEditorContainer from '../components/feature/TextEditorContainer'
import InputField from '../components/common/InputField'

export default function WriteEditorPage() {
  const { id } = useParams()
  const [judul, setJudul] = useState('')
  const [isiAwal, setIsiAwal] = useState('')

  useEffect(() => {
    api.get(`/posts/${id}`).then((res) => {
      setJudul(res.data.judul)
      setIsiAwal(res.data.isi || '')
    })
  }, [id])

  async function handleJudulChange(e) {
    setJudul(e.target.value)
    await api.put(`/posts/${id}/draft`, { judul: e.target.value })
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <InputField
        value={judul}
        onChange={handleJudulChange}
        placeholder="Judul tulisan..."
        className="text-xl font-bold"
      />
      <TextEditorContainer postId={id} isiAwal={isiAwal} />
    </div>
  )
}

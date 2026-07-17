import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { listsApi } from '../services/api'
import { ListDefinition, ListRecord } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Plus, Upload, Search, Pencil, Trash2, Download } from 'lucide-react'

export function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [list, setList] = useState<ListDefinition | null>(null)
  const [records, setRecords] = useState<ListRecord[]>([])
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ListRecord | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})

  const loadList = async () => {
    try {
      const res = await listsApi.get(Number(id))
      setList(res.data)
    } catch (err) { console.error(err) }
  }

  const loadRecords = async () => {
    try {
      const params: any = {}
      if (search) params.search = search
      if (searchField) params.search_field = searchField
      const res = await listsApi.getRecords(Number(id), params)
      setRecords(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => {
    if (id) {
      loadList()
      loadRecords()
    }
  }, [id])

  useEffect(() => {
    if (id) loadRecords()
  }, [search, searchField])

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await listsApi.importExcel(Number(id), file)
      alert(res.data.message)
      loadRecords()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al importar')
    }
  }

  const handleSaveRecord = async () => {
    try {
      if (editingRecord) {
        await listsApi.updateRecord(Number(id), editingRecord.id, { data: formData })
      } else {
        await listsApi.createRecord(Number(id), { data: formData })
      }
      setShowModal(false)
      setEditingRecord(null)
      setFormData({})
      loadRecords()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar registro')
    }
  }

  const handleDeleteRecord = async (recordId: number) => {
    if (!confirm('¿Eliminar este registro?')) return
    try {
      await listsApi.deleteRecord(Number(id), recordId)
      loadRecords()
    } catch (err) { alert('Error al eliminar') }
  }

  const openEditRecord = (record: any) => {
    setEditingRecord(record)
    setFormData(record.data)
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => navigate('/lists')} className="text-sm text-blue-600 hover:text-blue-800 mb-1 block">
            ← Volver a listas
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{list?.name || 'Cargando...'}</h1>
          {list?.description && <p className="text-sm text-gray-500 mt-1">{list.description}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const res = await listsApi.exportExcel(Number(id))
                const url = window.URL.createObjectURL(new Blob([res.data]))
                const a = document.createElement('a')
                a.href = url
                a.download = `lista_${list?.name || id}.xlsx`
                a.click()
                window.URL.revokeObjectURL(url)
              } catch { alert('Error al exportar') }
            }}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm"
          >
            <Download size={18} />
            Exportar Excel
          </button>
          {(user?.role === 'admin' || user?.role === 'direccion') && (
            <>
              <label className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer text-sm">
                <Upload size={18} />
                Importar Excel
                <input type="file" accept=".xlsx,.xls" onChange={handleImport} className="hidden" />
              </label>
            </>
          )}
          <button
            onClick={() => {
              setEditingRecord(null)
              const empty: Record<string, any> = {}
              list?.columns_config.forEach(c => { empty[c.key] = '' })
              setFormData(empty)
              setShowModal(true)
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
          >
            <Plus size={18} />
            Nuevo Registro
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="">Todos los campos</option>
              {list?.columns_config.map((col) => (
                <option key={col.key} value={col.key}>{col.label}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {list?.columns_config.map((col) => (
                  <th key={col.key} className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                    {col.label}
                  </th>
                ))}
                {(user?.role === 'admin' || user?.role === 'direccion') && (
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                  {list?.columns_config.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                      {record.data[col.key] || '-'}
                    </td>
                  ))}
                  {(user?.role === 'admin' || user?.role === 'direccion') && (
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setEditingRecord(record)
                          setFormData(record.data)
                          setShowModal(true)
                        }}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Pencil size={16} className="text-blue-600" />
                      </button>
                      <button onClick={() => handleDeleteRecord(record.id)} className="p-1 hover:bg-gray-100 rounded ml-1">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">
              {editingRecord ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            <div className="space-y-3">
              {list?.columns_config.map((col) => (
                <div key={col.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{col.label}</label>
                  {col.type === 'date' ? (
                    <input
                      type="date"
                      value={formData[col.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  ) : col.type === 'number' ? (
                    <input
                      type="number"
                      value={formData[col.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[col.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setShowModal(false); setEditingRecord(null) }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleSaveRecord} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                {editingRecord ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { listsApi } from '../services/api'
import { ListDefinition } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Upload, Eye } from 'lucide-react'

export function Lists() {
  const [lists, setLists] = useState<ListDefinition[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', columns: [{ key: '', label: '', type: 'text' }] })
  const { user } = useAuth()
  const navigate = useNavigate()

  const loadLists = async () => {
    try {
      const res = await listsApi.list()
      setLists(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { loadLists() }, [])

  const addColumn = () => {
    setForm({ ...form, columns: [...form.columns, { key: '', label: '', type: 'text' }] })
  }

  const removeColumn = (idx: number) => {
    setForm({ ...form, columns: form.columns.filter((_, i) => i !== idx) })
  }

  const updateColumn = (idx: number, field: string, value: string) => {
    const cols = [...form.columns]
    cols[idx] = { ...cols[idx], [field]: value }
    if (field === 'label' && !cols[idx].key) {
      cols[idx].key = value.toLowerCase().replace(/\s+/g, '_')
    }
    setForm({ ...form, columns: cols })
  }

  const handleCreate = async () => {
    try {
      await listsApi.create({
        name: form.name,
        description: form.description,
        columns_config: form.columns,
      })
      setShowModal(false)
      setForm({ name: '', description: '', columns: [{ key: '', label: '', type: 'text' }] })
      loadLists()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al crear lista')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta lista?')) return
    try {
      await listsApi.delete(id)
      loadLists()
    } catch (err) { alert('Error al eliminar') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Listas Personalizables</h1>
        {(user?.role === 'admin' || user?.role === 'direccion') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nueva Lista
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <div key={list.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{list.name}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600"
                  title="Ver registros"
                >
                  <Eye size={16} />
                </button>
                {(user?.role === 'admin' || user?.role === 'direccion') && (
                  <button onClick={() => handleDelete(list.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-600">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            {list.description && (
              <p className="text-sm text-gray-500 mb-3">{list.description}</p>
            )}
            <div className="flex flex-wrap gap-1 mb-3">
              {list.columns_config.map((col, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                  {col.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate(`/lists/${list.id}`)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Ver registros →
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">Nueva Lista Personalizable</h2>
            <div className="space-y-3">
              <input
                placeholder="Nombre de la lista"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <input
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
              <div className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Columnas</span>
                  <button onClick={addColumn} className="text-xs text-blue-600 hover:text-blue-800">
                    + Agregar columna
                  </button>
                </div>
                {form.columns.map((col, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      placeholder="Etiqueta"
                      value={col.label}
                      onChange={(e) => updateColumn(idx, 'label', e.target.value)}
                      className="flex-1 px-2 py-1 border rounded text-sm"
                    />
                    <select
                      value={col.type}
                      onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                      className="px-2 py-1 border rounded text-sm"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="date">Fecha</option>
                    </select>
                    <button onClick={() => removeColumn(idx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                      ✕
                    </button>
                  </div>
                ))}
                <button onClick={addColumn} className="text-sm text-blue-600 hover:text-blue-800">
                  + Agregar columna
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Crear Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

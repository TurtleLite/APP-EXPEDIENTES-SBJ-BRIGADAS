import { useState, useEffect } from 'react'
import { listsApi } from '../services/api'
import { ListDefinition } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, Upload, Eye, Shield } from 'lucide-react'

export function Lists() {
  const [lists, setLists] = useState<ListDefinition[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', columns: [{ key: '', label: '', type: 'text' }] })
  const { user } = useAuth()
  const { toast, confirm } = useNotification()
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
      toast(err.response?.data?.detail || 'Error al crear lista', 'error')
    }
  }

  const handleDelete = async (id: number) => {
    if (!await confirm('¿Eliminar esta lista?')) return
    try {
      await listsApi.delete(id)
      loadLists()
      toast('Lista eliminada correctamente', 'success')
    } catch (err) { toast('Error al eliminar', 'error') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Listas Personalizables</h1>
          <p className="text-sm text-slate-500 mt-1">Administra las listas de registro del sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const firstList = lists[0]
              if (firstList) navigate(`/lists/${firstList.id}`)
            }}
            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl hover:bg-slate-50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-sm font-medium"
          >
            <Eye size={16} />
            Ver registros
          </button>
          {(user?.role === 'admin' || user?.role === 'direccion') && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 rounded-xl hover:from-slate-600 hover:to-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-sm font-medium"
            >
              <Plus size={16} />
              Nueva Lista
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {lists.map((list) => (
          <div key={list.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-200 transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-slate-900">{list.name}</h3>
                {list.is_system && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                    <Shield size={12} />
                    Sistema
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-500 transition-all duration-200 hover:scale-110 active:scale-95"
                  title="Ver registros"
                >
                  <Eye size={16} />
                </button>
                {(user?.role === 'admin' || user?.role === 'direccion') && (!list.is_system || user?.role === 'admin') && (
                  <button onClick={() => handleDelete(list.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-all duration-200 hover:scale-110 active:scale-95">
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
            {list.description && (
              <p className="text-sm text-slate-500 mb-3">{list.description}</p>
            )}
            <div className="flex flex-wrap gap-1 mb-3">
              {list.columns_config.map((col, i) => (
                <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">
                  {col.label}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate(`/lists/${list.id}`)}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors duration-200"
            >
              Ver registros →
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 w-[95vw] max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Nueva Lista Personalizable</h2>
            <div className="space-y-3">
              <input
                placeholder="Nombre de la lista"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
              <input
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
              <div className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Columnas</span>
                  <button onClick={addColumn} className="text-xs text-slate-500 hover:text-slate-700 transition-colors duration-200">
                    + Agregar columna
                  </button>
                </div>
                {form.columns.map((col, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input
                      placeholder="Etiqueta"
                      value={col.label}
                      onChange={(e) => updateColumn(idx, 'label', e.target.value)}
                      className="flex-1 px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                    <select
                      value={col.type}
                      onChange={(e) => updateColumn(idx, 'type', e.target.value)}
                      className="px-2 py-1.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="date">Fecha</option>
                    </select>
                    <button onClick={() => removeColumn(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-200">
                Cancelar
              </button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium">
                Crear Lista
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

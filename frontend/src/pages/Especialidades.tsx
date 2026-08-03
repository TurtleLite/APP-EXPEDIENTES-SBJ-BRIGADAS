import { useState, useEffect } from 'react'
import { specialtiesApi } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { Pencil, Trash2, Stethoscope, Users as UsersIcon } from 'lucide-react'

interface Specialty {
  name: string
  count: number
}

export function Especialidades() {
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Specialty | null>(null)
  const [newName, setNewName] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast, confirm } = useNotification()

  const load = async () => {
    try {
      setLoading(true)
      const res = await specialtiesApi.list()
      setSpecialties(res.data)
    } catch {
      toast('Error al cargar especialidades', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const openEdit = (s: Specialty) => {
    setEditing(s)
    setNewName(s.name)
  }

  const handleRename = async () => {
    if (!editing || !newName.trim()) {
      toast('El nombre nuevo es obligatorio', 'error')
      return
    }
    try {
      setSaving(true)
      const res = await specialtiesApi.rename(editing.name, newName.trim())
      toast(res.data?.message || 'Especialidad editada', 'success')
      setEditing(null)
      load()
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al editar la especialidad', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (s: Specialty) => {
    if (!await confirm(`¿Eliminar la especialidad "${s.name}"? Se quitará de ${s.count} expediente(s).`)) return
    try {
      const res = await specialtiesApi.remove(s.name)
      toast(res.data?.message || 'Especialidad eliminada', 'success')
      load()
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al eliminar la especialidad', 'error')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#3F4650]">Especialidades</h1>
          <p className="text-sm text-slate-500 mt-1">Edita o elimina las especialidades de los expedientes</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E3E6EB] flex flex-col min-h-0 flex-1">
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-slate-400 py-12">
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Cargando...</span>
            </div>
          ) : specialties.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-12">No hay especialidades registradas</p>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 border-b border-[#E3E6EB]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Especialidad</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expedientes</th>
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {specialties.map((s) => (
                  <tr key={s.name} className="border-b border-slate-100 transition-all duration-150 hover:bg-slate-100/50">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-[#6E7B91]/10 text-[#6E7B91] flex items-center justify-center shrink-0">
                          <Stethoscope size={15} />
                        </span>
                        {s.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F8F9FA] border border-[#E3E6EB] text-[#5F6B80] text-xs font-medium">
                        <UsersIcon size={12} />
                        {s.count}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEdit(s)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 mr-1"
                        title="Editar"
                      >
                        <Pencil size={15} className="text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(s)}
                        className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Eliminar"
                      >
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="p-3 border-t border-[#E3E6EB] text-xs text-slate-400">
          {specialties.length} especialidad(es) · {specialties.reduce((a, s) => a + s.count, 0)} expedientes en total
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-5 py-4 w-[95vw] max-w-md shadow-2xl">
            <h2 className="font-serif text-lg font-bold mb-4 text-[#3F4650]">Editar Especialidad</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre actual</label>
                <div className="px-3 py-2.5 border border-slate-100 bg-slate-100 rounded-xl text-sm text-slate-500">
                  {editing.name} <span className="text-slate-400">· {editing.count} expediente(s)</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre nuevo</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="w-full px-3 py-2.5 border border-[#E3E6EB] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleRename}
                disabled={saving}
                className="px-4 py-2 text-sm bg-[#6E7B91] text-white rounded-xl hover:bg-[#5F6B80] shadow-sm hover:shadow-md transition-all duration-200 font-medium disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

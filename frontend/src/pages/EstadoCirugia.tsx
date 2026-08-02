import { useState, useEffect } from 'react'
import { listsApi } from '../services/api'
import { ListRecord, ListDefinition } from '../types'
import { useNotification } from '../contexts/NotificationContext'
import { Search, ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = ['En espera', 'Reprogramar', 'Cancelado', 'Fuera de perfil San Benito', 'Operado', 'No se presentó']

const statusStyles: Record<string, string> = {
  'Operado': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  'Fuera de perfil San Benito': 'bg-red-100 text-red-600 border-red-200',
  'En espera': 'bg-yellow-100 text-yellow-600 border-yellow-200',
  'Reprogramar': 'bg-orange-100 text-orange-600 border-orange-200',
  'Cancelado': 'bg-slate-100 text-slate-500 border-slate-200',
  'No se presentó': 'bg-violet-100 text-violet-600 border-violet-200',
  'Fuera de perfil': 'bg-red-100 text-red-600 border-red-200',
}

export function EstadoCirugia() {
  const [records, setRecords] = useState<ListRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [listId, setListId] = useState<string | null>(null)
  const { toast } = useNotification()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        if (!listId) {
          const listsRes = await listsApi.list()
          const lists: ListDefinition[] = listsRes.data
          const system = lists.find((l) => l.is_system)
          if (!cancelled && system) {
            setListId(system.id)
            return
          }
          if (!cancelled) toast('No se encontró la lista de expedientes', 'error')
        } else {
          const res = await listsApi.getRecords(listId)
          if (!cancelled) setRecords(res.data)
        }
      } catch {
        if (!cancelled) toast('Error al cargar registros', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [listId])

  const filtered = records.filter((r) => {
    const matchesStatus = !filter || (r.data?.estatus_cirugia || '') === filter
    const q = search.trim().toLowerCase()
    const haystack = [r.data?.nombre, r.data?.apellido, r.data?.especialidad, r.data?.perfil, r.data?.estatus_cirugia]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    const matchesSearch = !q || haystack.includes(q)
    return matchesStatus && matchesSearch
  })

  const updateStatus = async (recordId: string, status: string) => {
    if (!listId) return
    try {
      const record = records.find((r) => r.id === recordId)
      if (!record) return
      await listsApi.updateRecord(listId, recordId, {
        data: { ...record.data, estatus_cirugia: status },
      })
      const res = await listsApi.getRecords(listId)
      setRecords(res.data)
      setEditingId(null)
      toast('Estatus actualizado', 'success')
    } catch {
      toast('Error al actualizar', 'error')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#5A5377]">Estatus de Cirugía</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E6E2F2] p-3 shrink-0 transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente, especialidad o perfil..."
              className="w-full pl-9 pr-3 py-2 border border-[#E6E2F2] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
            />
          </div>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 pr-8 border border-[#E6E2F2] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200 appearance-none"
            >
              <option value="">Todos los estatus</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <span className="text-sm text-slate-500 ml-auto">
            <span className="font-medium text-slate-700">{filtered.length}</span> de <span className="font-medium text-slate-700">{records.length}</span> registros
          </span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#E6E2F2] flex flex-col min-h-0 flex-1 transition-shadow duration-200 hover:shadow-md">
        <div className="flex-1 min-h-0 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-indigo-50 border-b border-[#E6E2F2]">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Paciente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Especialidad</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Perfil</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estatus de Cirugía</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-slate-400 text-sm">Sin registros</td></tr>
              ) : filtered.map((r, idx) => (
                <tr key={r.id} className={`border-b border-slate-100 transition-all duration-150 hover:bg-indigo-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50/20'}`}>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {`${r.data?.nombre || ''} ${r.data?.apellido || ''}`}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{r.data?.especialidad || <span className="text-slate-300">-</span>}</td>
                  <td className="px-6 py-4 text-slate-600">{r.data?.perfil || <span className="text-slate-300">-</span>}</td>
                  <td className="px-6 py-4">
                    {editingId === r.id ? (
                      <select
                        autoFocus
                        value={r.data?.estatus_cirugia || ''}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="px-2 py-1.5 border border-[#E6E2F2] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                      >
                        <option value="">Sin estatus</option>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    ) : (
                      <button
                        onClick={() => setEditingId(r.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-200 hover:scale-105 active:scale-95 ${
                          statusStyles[r.data?.estatus_cirugia] || 'bg-white text-slate-400 border-[#E6E2F2] hover:border-[#E6E2F2]'
                        }`}
                      >
                        {r.data?.estatus_cirugia || 'Asignar'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { listsApi } from '../services/api'
import { ListRecord } from '../types'
import { useNotification } from '../contexts/NotificationContext'
import { FileSpreadsheet, Search, ChevronDown } from 'lucide-react'

const STATUS_OPTIONS = ['Operado', 'No se presentó', 'Reprogramar', 'Fuera de perfil']
const EXPEDIENTE_LIST_ID = 1

const statusStyles: Record<string, string> = {
  'Operado': 'bg-emerald-100 text-emerald-600 border-emerald-200',
  'No se presentó': 'bg-rose-100 text-rose-600 border-rose-200',
  'Reprogramar': 'bg-amber-100 text-amber-600 border-amber-200',
  'Fuera de perfil': 'bg-rose-50 text-rose-400 border-rose-100',
}

export function EstadoCirugia() {
  const [records, setRecords] = useState<ListRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const { toast } = useNotification()

  const loadRecords = async () => {
    try {
      setLoading(true)
      const res = await listsApi.getRecords(EXPEDIENTE_LIST_ID)
      setRecords(res.data)
    } catch {
      toast('Error al cargar registros', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRecords() }, [])

  const filtered = filter
    ? records.filter((r) => (r.data?.estatus_cirugia || '') === filter)
    : records

  const updateStatus = async (recordId: number, status: string) => {
    try {
      const record = records.find((r) => r.id === recordId)
      if (!record) return
      await listsApi.updateRecord(EXPEDIENTE_LIST_ID, recordId, {
        data: { ...record.data, estatus_cirugia: status },
      })
      loadRecords()
      setEditingId(null)
      toast('Estatus actualizado', 'success')
    } catch {
      toast('Error al actualizar', 'error')
    }
  }

  const handleReport = async () => {
    try {
      const res = await listsApi.exportExcel(EXPEDIENTE_LIST_ID)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'reporte_estatus_cirugia.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast('Error al generar reporte', 'error')
    }
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-rose-900">Estatus de Cirugía</h1>
        </div>
        <button
          onClick={handleReport}
          className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-300 to-emerald-400 text-white px-4 py-2 rounded-xl hover:from-emerald-400 hover:to-emerald-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-sm font-medium"
        >
          <FileSpreadsheet size={16} />
          Reporte
        </button>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-rose-100 p-3 shrink-0 transition-shadow duration-200 hover:shadow-md">
        <div className="flex items-center gap-2.5">
          <Search size={16} className="text-rose-400" />
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 pr-8 border border-rose-100 rounded-xl text-sm bg-white focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 transition-all duration-200 appearance-none"
            >
              <option value="">Todos los estatus</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-rose-400 pointer-events-none" />
          </div>
          <span className="text-sm text-rose-500 ml-auto">
            <span className="font-medium text-rose-700">{filtered.length}</span> de <span className="font-medium text-rose-700">{records.length}</span> registros
          </span>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-rose-100 overflow-hidden flex flex-col min-h-0 flex-1 transition-shadow duration-200 hover:shadow-md">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-rose-50/50 border-b border-rose-100">
                <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Paciente</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Especialidad</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Perfil</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Estatus de Cirugía</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-rose-400">
                      <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm">Cargando...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-rose-400 text-sm">Sin registros</td></tr>
              ) : filtered.map((r, idx) => (
                <tr key={r.id} className={`border-b border-rose-50 transition-all duration-150 hover:bg-rose-50/50 ${idx % 2 === 0 ? 'bg-white' : 'bg-rose-50/20'}`}>
                  <td className="px-6 py-4 font-medium text-rose-900">
                    {`${r.data?.nombre || ''} ${r.data?.apellido || ''}`}
                  </td>
                  <td className="px-6 py-4 text-rose-600">{r.data?.especialidad || <span className="text-rose-300">-</span>}</td>
                  <td className="px-6 py-4 text-rose-600">{r.data?.perfil || <span className="text-rose-300">-</span>}</td>
                  <td className="px-6 py-4">
                    {editingId === r.id ? (
                      <select
                        autoFocus
                        value={r.data?.estatus_cirugia || ''}
                        onChange={(e) => updateStatus(r.id, e.target.value)}
                        onBlur={() => setEditingId(null)}
                        className="px-2 py-1.5 border border-rose-100 rounded-xl text-sm bg-white focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 transition-all duration-200"
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
                          statusStyles[r.data?.estatus_cirugia] || 'bg-rose-50 text-rose-400 border-rose-100 hover:border-rose-200'
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

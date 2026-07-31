import { useState, useEffect } from 'react'
import { reportsApi, listsApi } from '../services/api'
import { Report, ListDefinition } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { Plus, FileText, FileSpreadsheet, Download, Trash2, Eye, X, Search } from 'lucide-react'

const STATUS_OPTIONS = ['En espera', 'Reprogramar', 'Cancelado', 'Fuera de perfil San Benito', 'Operado']

interface PreviewData {
  name: string
  columns: string[]
  records: Record<string, any>[]
  count: number
}

export function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [lists, setLists] = useState<ListDefinition[]>([])
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [perfiles, setPerfiles] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', list_definition_id: '', especialidad: '', perfil: '',
    estatus_cirugia: '', nombre: '', edad_min: '', edad_max: '',
    fecha_inicio: '', fecha_fin: '', columns_selected: [] as string[],
  })
  const { user } = useAuth()
  const { toast } = useNotification()

  const loadEspecialidades = async (listId: string) => {
    try {
      const res = await listsApi.getEspecialidades(listId)
      setEspecialidades(res.data || [])
    } catch { setEspecialidades([]) }
  }

  const loadPerfiles = async (listId: string) => {
    try {
      const res = await listsApi.getFieldValues(listId, 'perfil')
      setPerfiles(res.data || [])
    } catch { setPerfiles([]) }
  }

  const loadReports = async () => {
    try {
      const res = await reportsApi.list()
      setReports(res.data)
    } catch (err) { console.error(err) }
  }

  const loadLists = async () => {
    try {
      const res = await listsApi.list()
      setLists(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { loadReports(); loadLists() }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast('El nombre del reporte es obligatorio', 'error')
      return
    }
    if (form.fecha_inicio && form.fecha_fin && form.fecha_fin < form.fecha_inicio) {
      toast('La fecha final no puede ser anterior a la fecha de inicio', 'error')
      return
    }
    try {
      await reportsApi.create({
        ...form,
        list_definition_id: form.list_definition_id || undefined,
        filters: {
          especialidad: form.especialidad || undefined,
          perfil: form.perfil || undefined,
          estatus_cirugia: form.estatus_cirugia || undefined,
          nombre: form.nombre.trim() || undefined,
          edad_min: form.edad_min || undefined,
          edad_max: form.edad_max || undefined,
          fecha_inicio: form.fecha_inicio || undefined,
          fecha_fin: form.fecha_fin || undefined,
        },
      })
      setShowModal(false)
      setForm({ name: '', description: '', list_definition_id: '', especialidad: '', perfil: '', estatus_cirugia: '', nombre: '', edad_min: '', edad_max: '', fecha_inicio: '', fecha_fin: '', columns_selected: [] })
      setEspecialidades([])
      setPerfiles([])
      loadReports()
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al crear reporte', 'error')
    }
  }

  const handlePreview = async (reportId: string | number) => {
    setLoadingPreview(true)
    try {
      const res = await reportsApi.preview(reportId)
      setPreview(res.data)
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al cargar vista previa', 'error')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleGenerate = async (reportId: string | number, type: 'excel' | 'pdf') => {
    try {
      if (type === 'excel') {
        await reportsApi.generateExcel(reportId)
      } else {
        await reportsApi.generatePdf(reportId)
      }
      loadReports()
      toast(`Reporte ${type.toUpperCase()} generado correctamente`, 'success')
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al generar reporte', 'error')
    }
  }

  const handleDownload = async (reportId: string | number, type: 'excel' | 'pdf') => {
    try {
      const res = await reportsApi.download(reportId, type)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${reportId}.${type === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      toast('Error al descargar. Genere el reporte primero.', 'error')
    }
  }

  const handleDelete = async (reportId: string) => {
    try {
      await reportsApi.delete(reportId)
      loadReports()
      setDeleteConfirm(null)
      toast('Reporte eliminado', 'success')
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al eliminar', 'error')
    }
  }

  const filterBadges = (filters: Record<string, any>) => {
    const items: { label: string; value: string; cls: string }[] = []
    if (filters?.especialidad) items.push({ label: 'Especialidad', value: filters.especialidad, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' })
    if (filters?.perfil) items.push({ label: 'Perfil', value: filters.perfil, cls: 'bg-sky-50 text-sky-700 border-sky-200' })
    if (filters?.estatus_cirugia) items.push({ label: 'Estatus', value: filters.estatus_cirugia, cls: 'bg-violet-50 text-violet-700 border-violet-200' })
    if (filters?.nombre) items.push({ label: 'Nombre', value: filters.nombre, cls: 'bg-amber-50 text-amber-700 border-amber-200' })
    if (filters?.edad_min || filters?.edad_max) items.push({ label: 'Edad', value: `${filters.edad_min || '?'}-${filters.edad_max || '?'}`, cls: 'bg-teal-50 text-teal-700 border-[#a9ded6]' })
    if (filters?.fecha_inicio || filters?.fecha_fin) items.push({ label: 'Fechas', value: `Del ${filters.fecha_inicio || 'inicio'} al ${filters.fecha_fin || 'hoy'}`, cls: 'bg-cyan-50 text-cyan-700 border-cyan-200' })
    return items
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#134e4a]">Reportes</h1>
        </div>
        {(user?.role === 'admin' || user?.role === 'direccion') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-[#0d9488] text-white px-4 py-2 rounded-xl hover:bg-[#0f766e] shadow-sm hover:shadow-md transition-all duration-200  text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Reporte
          </button>
        )}
      </div>

      {reports.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-sm">No hay reportes creados todavía. Crea el primero con "Nuevo Reporte".</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => {
          const badges = filterBadges(report.filters)
          return (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border border-[#a9ded6] p-6 hover:shadow-md hover:border-[#a9ded6] transition-all duration-200">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-slate-900">{report.name}</h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f0fdfa] text-[#0f766e] rounded-lg text-xs font-semibold border border-[#a9ded6] whitespace-nowrap">
                {report.record_count ?? 0} registros
              </span>
            </div>
            {report.description && (
              <p className="text-sm text-slate-500 mt-1 mb-3">{report.description}</p>
            )}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {badges.length === 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal-50 text-slate-500 rounded-lg text-xs font-medium border border-[#a9ded6]">
                  General
                </span>
              )}
              {badges.map((b, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium border">
                  {b.label}: {b.value}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => handlePreview(report.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-sky-50 text-sky-700 rounded-xl text-xs font-medium hover:bg-sky-100 border border-sky-200 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Eye size={14} />
                Vista previa
              </button>
              <button
                onClick={() => handleGenerate(report.id, 'excel')}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 border border-[#a9ded6] transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <FileSpreadsheet size={14} />
                Gen. Excel
              </button>
              <button
                onClick={() => handleGenerate(report.id, 'pdf')}
                className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 border border-[#a9ded6] transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <FileText size={14} />
                Gen. PDF
              </button>
              {report.file_path_excel && (
                <button
                  onClick={() => handleDownload(report.id, 'excel')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium hover:bg-emerald-100 border border-emerald-200 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Download size={14} />
                  Excel
                </button>
              )}
              {report.file_path_pdf && (
                <button
                  onClick={() => handleDownload(report.id, 'pdf')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium hover:bg-rose-100 border border-rose-200 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Download size={14} />
                  PDF
                </button>
              )}
            </div>
            <div className="flex justify-between items-end mt-4 pt-2 border-t border-[#a9ded6]">
              <span className="text-[11px] text-slate-400">
                Creado el {new Date(report.created_at).toLocaleDateString('es-ES')}
              </span>
              {(user?.role === 'admin' || user?.role === 'direccion') && (
                deleteConfirm === report.id ? (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">¿Eliminar?</span>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="px-2 py-1 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-all duration-200"
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all duration-200"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(report.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-400 hover:bg-red-50 rounded-lg transition-all duration-200"
                  >
                    <Trash2 size={12} />
                    Eliminar
                  </button>
                )
              )}
            </div>
          </div>
          )
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl px-5 py-4 w-[95vw] max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-bold text-[#134e4a]">Nuevo Reporte</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors duration-200">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="Nombre del reporte *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
              <input
                placeholder="Descripción (opcional)"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
              <select
                value={form.list_definition_id}
                onChange={(e) => {
                  const v = e.target.value
                  setForm({ ...form, list_definition_id: v, especialidad: '', perfil: '' })
                  if (v) { loadEspecialidades(v); loadPerfiles(v) }
                }}
                className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              >
                <option value="">Seleccionar lista</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>

              <div className="border border-[#a9ded6] rounded-xl p-3 space-y-3 bg-[#f0fdfa]/50">
                <p className="text-xs font-semibold text-[#0f766e] uppercase tracking-wider">Filtros</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    value={form.especialidad}
                    onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
                    disabled={!form.list_definition_id}
                    className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200 disabled:opacity-50"
                  >
                    <option value="">Especialidad (todas)</option>
                    {especialidades.map((esp) => (
                      <option key={esp} value={esp}>{esp}</option>
                    ))}
                  </select>
                  <select
                    value={form.perfil}
                    onChange={(e) => setForm({ ...form, perfil: e.target.value })}
                    disabled={!form.list_definition_id}
                    className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200 disabled:opacity-50"
                  >
                    <option value="">Perfil (todos)</option>
                    {perfiles.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select
                    value={form.estatus_cirugia}
                    onChange={(e) => setForm({ ...form, estatus_cirugia: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                  >
                    <option value="">Estatus de cirugía (todos)</option>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Nombre o apellido del paciente"
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      className="w-full pl-9 pr-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Edad mín"
                      value={form.edad_min}
                      onChange={(e) => setForm({ ...form, edad_min: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                    <input
                      type="number"
                      placeholder="Edad máx"
                      value={form.edad_max}
                      onChange={(e) => setForm({ ...form, edad_max: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de inicio</label>
                    <input
                      type="date"
                      value={form.fecha_inicio}
                      onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Fecha de fin</label>
                    <input
                      type="date"
                      value={form.fecha_fin}
                      onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-teal-50 rounded-xl transition-all duration-200">
                Cancelar
              </button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-[#0d9488] text-white rounded-xl hover:bg-[#0f766e] shadow-sm hover:shadow-md transition-all duration-200 font-medium">
                Crear Reporte
              </button>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-[95vw] max-w-6xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#a9ded6] shrink-0">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#134e4a]">{preview.name}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {preview.count} registros{preview.count > preview.records.length ? ` · mostrando ${preview.records.length}` : ''}
                </p>
              </div>
              <button onClick={() => setPreview(null)} className="text-slate-400 hover:text-slate-600 transition-colors duration-200">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-[#0d9488] text-white">
                    {preview.columns.map((col) => (
                      <th key={col} className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.records.length === 0 ? (
                    <tr>
                      <td colSpan={preview.columns.length} className="px-4 py-12 text-center text-slate-400">
                        {loadingPreview ? 'Cargando...' : 'Sin registros para este reporte'}
                      </td>
                    </tr>
                  ) : preview.records.map((record, idx) => (
                    <tr key={idx} className={`border-b border-[#a9ded6] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f0fdfa]'}`}>
                      {preview.columns.map((col) => (
                        <td key={col} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">
                          {record[col] || <span className="text-slate-300">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end px-6 py-3 border-t border-[#a9ded6] shrink-0">
              <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm bg-[#0d9488] text-white rounded-xl hover:bg-[#0f766e] shadow-sm transition-all duration-200 font-medium">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

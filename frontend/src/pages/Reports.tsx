import { useState, useEffect } from 'react'
import { reportsApi, listsApi } from '../services/api'
import { Report, ListDefinition } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { Plus, FileText, FileSpreadsheet, Download, Trash2 } from 'lucide-react'

export function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [lists, setLists] = useState<ListDefinition[]>([])
  const [showModal, setShowModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)
  const [form, setForm] = useState({
    name: '', description: '', list_definition_id: 0, columns_selected: [] as string[],
  })
  const { user } = useAuth()
  const { toast } = useNotification()

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
    try {
      await reportsApi.create(form)
      setShowModal(false)
      setForm({ name: '', description: '', list_definition_id: 0, columns_selected: [] })
      loadReports()
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al crear reporte', 'error')
    }
  }

  const handleGenerate = async (reportId: number, type: 'excel' | 'pdf') => {
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

  const handleDownload = async (reportId: number, type: 'excel' | 'pdf') => {
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

  const handleDelete = async (reportId: number) => {
    try {
      await reportsApi.delete(reportId)
      loadReports()
      setDeleteConfirm(null)
      toast('Reporte eliminado', 'success')
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al eliminar', 'error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500 mt-1">Genera y descarga reportes del sistema</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'direccion') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-4 py-2 rounded-xl hover:from-slate-600 hover:to-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-sm font-medium"
          >
            <Plus size={16} />
            Nuevo Reporte
          </button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md hover:border-slate-200 transition-all duration-200">
            <h3 className="font-semibold text-slate-900 mb-1">{report.name}</h3>
            {report.description && (
              <p className="text-sm text-slate-500 mb-3">{report.description}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => handleGenerate(report.id, 'excel')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 border border-slate-200 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <FileSpreadsheet size={14} />
                Gen. Excel
              </button>
              <button
                onClick={() => handleGenerate(report.id, 'pdf')}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 border border-slate-200 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <FileText size={14} />
                Gen. PDF
              </button>
              {report.file_path_excel && (
                <button
                  onClick={() => handleDownload(report.id, 'excel')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 border border-slate-200 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Download size={14} />
                  Excel
                </button>
              )}
              {report.file_path_pdf && (
                <button
                  onClick={() => handleDownload(report.id, 'pdf')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-medium hover:bg-slate-100 border border-slate-200 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Download size={14} />
                  PDF
                </button>
              )}
            </div>
            <div className="flex justify-end mt-2 pt-2 border-t border-slate-200">
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
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 w-[95vw] max-w-5xl shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-slate-900">Nuevo Reporte</h2>
            <div className="space-y-3">
              <input
                placeholder="Nombre del reporte"
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
              <select
                value={form.list_definition_id}
                onChange={(e) => setForm({ ...form, list_definition_id: Number(e.target.value) })}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              >
                <option value={0}>Seleccionar lista</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-200">
                Cancelar
              </button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium">
                Crear Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

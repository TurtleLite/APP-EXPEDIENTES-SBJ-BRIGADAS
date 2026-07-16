import { useState, useEffect } from 'react'
import { reportsApi, listsApi } from '../services/api'
import { Report, ListDefinition } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { Plus, FileText, FileSpreadsheet, Download } from 'lucide-react'

export function Reports() {
  const [reports, setReports] = useState<Report[]>([])
  const [lists, setLists] = useState<ListDefinition[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    name: '', description: '', list_definition_id: 0, columns_selected: [] as string[],
  })
  const { user } = useAuth()

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
      alert(err.response?.data?.detail || 'Error al crear reporte')
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
      alert(`Reporte ${type.toUpperCase()} generado correctamente`)
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al generar reporte')
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
      alert('Error al descargar. Genere el reporte primero.')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
        {(user?.role === 'admin' || user?.role === 'direccion') && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Nuevo Reporte
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-1">{report.name}</h3>
            {report.description && (
              <p className="text-sm text-gray-500 mb-3">{report.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleGenerate(report.id, 'excel')}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200"
              >
                <FileSpreadsheet size={14} />
                Gen. Excel
              </button>
              <button
                onClick={() => handleGenerate(report.id, 'pdf')}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
              >
                <FileText size={14} />
                Gen. PDF
              </button>
              {report.file_path_excel && (
                <button
                  onClick={() => handleDownload(report.id, 'excel')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200"
                >
                  <Download size={14} />
                  Excel
                </button>
              )}
              {report.file_path_pdf && (
                <button
                  onClick={() => handleDownload(report.id, 'pdf')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200"
                >
                  <Download size={14} />
                  PDF
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Nuevo Reporte</h2>
            <div className="space-y-3">
              <input
                placeholder="Nombre del reporte"
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
              <select
                value={form.list_definition_id}
                onChange={(e) => setForm({ ...form, list_definition_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value={0}>Seleccionar lista</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleCreate} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Crear Reporte
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

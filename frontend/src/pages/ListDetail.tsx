import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { listsApi, default as api } from '../services/api'
import { ListDefinition, ListRecord } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { ArrowLeft, Plus, Upload, Search, Pencil, Trash2, Download, Stethoscope, CheckSquare, Square } from 'lucide-react'
import { ExpedienteForm } from '../components/ExpedienteForm'

const RECORD_COLUMNS = ['nombre', 'edad', 'diagnostico', 'perfil', 'domicilio', 'telefono', 'albergue', 'nombre_medico', 'cirujano', 'fecha_cirugia']

export function ListDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { toast, confirm } = useNotification()
  const [list, setList] = useState<ListDefinition | null>(null)
  const [records, setRecords] = useState<ListRecord[]>([])
  const [search, setSearch] = useState('')
  const [searchField, setSearchField] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showExpedienteForm, setShowExpedienteForm] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ListRecord | null>(null)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [especialidadFilter, setEspecialidadFilter] = useState('')

  const loadEspecialidades = async () => {
    try {
      const res = await listsApi.getEspecialidades(Number(id))
      setEspecialidades(res.data)
    } catch { /* ignore */ }
  }

  const loadList = async () => {
    try {
      const res = await listsApi.get(Number(id))
      setList(res.data)
    } catch (err) { console.error(err) }
  }

  const loadRecords = async () => {
    try {
      const params: any = {}
      if (especialidadFilter) {
        params.search = especialidadFilter
        params.search_field = 'especialidad'
      } else if (search) {
        params.search = search
        if (searchField) params.search_field = searchField
      }
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
  }, [search, searchField, especialidadFilter])

  useEffect(() => {
    if (id && list?.is_system) loadEspecialidades()
  }, [id, list?.is_system])

  const toggleSelect = (recordId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(recordId)) next.delete(recordId)
      else next.add(recordId)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === records.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(records.map((r) => r.id)))
    }
  }

  const handleExportSelected = async () => {
    if (selectedIds.size === 0) return
    try {
      const ids = Array.from(selectedIds)
      let filename = 'lote_expedientes.xlsx'
      if (ids.length === 1) {
        const record = records.find(r => r.id === ids[0])
        if (record) {
          const nombre = record.data?.nombre || 'expediente'
          const apellido = record.data?.apellido || ''
          const especialidad = record.data?.especialidad || ''
          const nameParts = [nombre, apellido].filter(Boolean).join(' ')
          filename = `${nameParts}_${especialidad}.xlsx`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        }
      }
      const res = await api.post(`/lists/${id}/export-expediente-selected`, { ids }, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch { toast('Error al exportar', 'error') }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const res = await listsApi.importExcel(Number(id), file)
      toast(res.data.message, 'success')
      loadRecords()
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al importar', 'error')
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
      toast(err.response?.data?.detail || 'Error al guardar registro', 'error')
    }
  }

  const handleDeleteRecord = async (recordId: number) => {
    if (!await confirm('¿Eliminar este registro?')) return
    try {
      await listsApi.deleteRecord(Number(id), recordId)
      loadRecords()
      toast('Registro eliminado correctamente', 'success')
    } catch (err) { toast('Error al eliminar', 'error') }
  }

  const handleExportRecord = async (record: ListRecord) => {
    try {
      const nombre = record.data?.nombre || 'expediente'
      const apellido = record.data?.apellido || ''
      const especialidad = record.data?.especialidad || ''
      const nameParts = [nombre, apellido].filter(Boolean).join(' ')
      const filename = `${nameParts}_${especialidad}.xlsx`.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const res = await api.post(`/lists/${id}/export-expediente-selected`, { ids: [record.id] }, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch { toast('Error al exportar expediente', 'error') }
  }

  const openEditRecord = (record: any) => {
    setEditingRecord(record)
    setFormData(record.data)
    setShowModal(true)
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <button onClick={() => navigate('/lists')} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-700 mb-1 transition-colors duration-200">
            <ArrowLeft size={15} />
            Volver a listas
          </button>
          <h1 className="text-2xl font-bold text-slate-900">{list?.name || 'Cargando...'}</h1>
          {list?.description && <p className="text-sm text-slate-600 mt-1">{list.description}</p>}
        </div>
        <div className="flex gap-2">
          {user?.role !== 'direccion' && (list?.is_system ? (
            <button
              onClick={() => setShowExpedienteForm(true)}
              className="flex items-center gap-1.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-5 py-2.5 rounded-xl hover:from-slate-600 hover:to-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-sm font-medium"
            >
              <Stethoscope size={16} />
              Nuevo
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRecord(null)
                const empty: Record<string, any> = {}
                list?.columns_config.forEach(c => { empty[c.key] = '' })
                setFormData(empty)
                setShowModal(true)
              }}
              className="flex items-center gap-1.5 bg-gradient-to-r from-slate-500 to-slate-600 text-white px-5 py-2.5 rounded-xl hover:from-slate-600 hover:to-slate-700 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-sm font-medium"
            >
              <Plus size={16} />
              Nuevo
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-0 flex-1 transition-shadow duration-200 hover:shadow-md">
        <div className="p-3 border-b border-slate-200 space-y-2.5 shrink-0 bg-slate-50/30">
        <div className="flex gap-2.5 flex-wrap">
              <select
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              >
                <option value="">Todos los campos</option>
                {list?.columns_config.map((col) => (
                  <option key={col.key} value={col.key}>{col.label}</option>
                ))}
              </select>
              <div className="relative flex-1 min-w-[180px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                />
              </div>
            </div>
            {list?.is_system && (
              <div className="flex items-center gap-2.5 flex-wrap">
                <select
                  value={especialidadFilter}
                  onChange={(e) => { setEspecialidadFilter(e.target.value); setSelectedIds(new Set()) }}
                  className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                >
                <option value="">Todas las especialidades</option>
                {especialidades.map((esp) => (
                  <option key={esp} value={esp}>{esp}</option>
                ))}
              </select>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleExportSelected}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-slate-400 to-slate-500 text-white rounded-xl hover:from-slate-500 hover:to-slate-600 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-sm font-medium"
                >
                  <Download size={16} />
                  Exportar {selectedIds.size} seleccionados
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200">
                {list?.is_system && (
                  <th className="w-10 px-3 py-4">
                    <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600 transition-colors duration-200">
                      {selectedIds.size === records.length && records.length > 0
                        ? <CheckSquare size={16} className="text-slate-600" />
                        : <Square size={16} />}
                    </button>
                  </th>
                )}
                {list?.columns_config.filter(c => RECORD_COLUMNS.includes(c.key)).map((col) => (
                  <th key={col.key} className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    {col.label}
                  </th>
                ))}
                {(user?.role === 'admin' || user?.role === 'direccion' || user?.role === 'medico') && (
                  <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
                )}
              </tr>
            </thead>
            <tbody>
              {records.map((record, idx) => (
                <tr key={record.id} className={`border-b border-slate-100 transition-all duration-150 hover:bg-slate-100/50 ${selectedIds.has(record.id) ? 'bg-slate-50/30' : idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'}`}>
                  {list?.is_system && (
                    <td className="w-10 px-3 py-4">
                      <button onClick={() => toggleSelect(record.id)} className="text-slate-300 hover:text-slate-500 transition-colors duration-200">
                        {selectedIds.has(record.id) ? <CheckSquare size={16} className="text-slate-500" /> : <Square size={16} />}
                      </button>
                    </td>
                  )}
                  {list?.columns_config.filter(c => RECORD_COLUMNS.includes(c.key)).map((col) => (
                    <td key={col.key} className="px-6 py-4 text-sm text-slate-700">
                      {col.key === 'telefono'
                        ? [record.data.telefono, record.data.telefono2, record.data.telefono3]
                            .filter(Boolean)
                            .join(' / ') || <span className="text-slate-300">-</span>
                        : record.data[col.key] || <span className="text-slate-300">-</span>
                      }
                    </td>
                  ))}
                  {user?.role && ['admin', 'direccion', 'direccion_medica', 'medico'].includes(user.role as string) && (
                    <td className="px-6 py-4 text-right">
                      {list?.is_system && (
                        <button
                          onClick={() => handleExportRecord(record)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                          title="Exportar"
                        >
                          <Download size={15} className="text-slate-600" />
                        </button>
                      )}
                      {(['admin', 'direccion_medica'].includes(user.role as string) || (user.role === 'medico' && (!list?.is_system || (record.created_by === user.id)))) && (
                        <button
                          onClick={() => {
                            setEditingRecord(record)
                            setFormData(record.data)
                            setShowModal(true)
                          }}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          <Pencil size={15} className="text-slate-600" />
                        </button>
                      )}
                      {(['admin', 'direccion_medica'].includes(user.role as string) || (user.role === 'medico' && record.created_by === user.id)) && (
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ml-1"
                        >
                          <Trash2 size={15} className="text-red-400" />
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
              {records.length === 0 && (
                <tr>
                  <td colSpan={100} className="px-4 py-12 text-center text-slate-400 text-sm">
                    {search || especialidadFilter ? 'Sin resultados de búsqueda' : 'No hay registros aún'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showExpedienteForm && (
        <ExpedienteForm
          listId={Number(id)}
          role={user?.role}
          onClose={() => setShowExpedienteForm(false)}
          onSaved={loadRecords}
        />
      )}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 w-[95vw] max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <h2 className="text-lg font-bold mb-4 shrink-0 text-slate-900">
              {editingRecord ? 'Editar Registro' : 'Nuevo Registro'}
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3">
              {list?.columns_config.map((col) => (
                <div key={col.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{col.label}</label>
                  {col.type === 'date' ? (
                    <input
                      type="date"
                      value={formData[col.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                  ) : col.type === 'number' ? (
                    <input
                      type="number"
                      value={formData[col.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                  ) : (
                    <input
                      type="text"
                      value={formData[col.key] || ''}
                      onChange={(e) => setFormData({ ...formData, [col.key]: e.target.value })}
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4 shrink-0">
              <button onClick={() => { setShowModal(false); setEditingRecord(null) }} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200">
                Cancelar
              </button>
              <button onClick={handleSaveRecord} className="px-4 py-2 text-sm bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 shadow-sm hover:shadow-md transition-all duration-200 font-medium">
                {editingRecord ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useMemo } from 'react'
import { listsApi, dayListsApi } from '../services/api'
import { ListRecord, ListDefinition } from '../types'
import { useNotification } from '../contexts/NotificationContext'
import {
  Search, Plus, Trash2, ArrowUp, ArrowDown, Save, Printer,
  ChevronLeft, ChevronRight, X, ClipboardList,
} from 'lucide-react'

function isoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function patientName(r: ListRecord): string {
  const d = r.data || {}
  return [d.nombre, d.apellido].filter(Boolean).join(' ').trim() || 'Sin nombre'
}

export function DayList() {
  const { toast } = useNotification()
  const [listId, setListId] = useState<string | null>(null)
  const [records, setRecords] = useState<ListRecord[]>([])
  const [cart, setCart] = useState<ListRecord[]>([])
  const [date, setDate] = useState<string>(isoDate(new Date()))
  const [search, setSearch] = useState('')
  const [onlyWaiting, setOnlyWaiting] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingDate, setLoadingDate] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const listsRes = await listsApi.list()
        const lists: ListDefinition[] = listsRes.data
        const system = lists.find((l) => l.is_system)
        if (system) {
          setListId(system.id)
          const recRes = await listsApi.getRecords(system.id)
          if (!cancelled) setRecords(recRes.data)
        }
      } catch {
        if (!cancelled) toast('Error al cargar expedientes', 'error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!date) return
    let cancelled = false
    setLoadingDate(true)
    dayListsApi.get(date)
      .then((res) => {
        if (cancelled) return
        const ids = (res.data?.record_ids || []).map(String)
        const order: Record<string, number> = {}
        ids.forEach((id: string, idx: number) => { order[id] = idx })
        const byId: Record<string, ListRecord> = {}
        records.forEach((r) => { byId[r.id] = r })
        const items = ids
          .map((id: string) => byId[id])
          .filter(Boolean)
        items.sort((a, b) => (order[a.id] ?? 0) - (order[b.id] ?? 0))
        setCart(items)
        setSaved(res.data?.id != null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoadingDate(false) })
    return () => { cancelled = true }
  }, [date, listId, records])

  const available = useMemo(() => {
    const q = search.trim().toLowerCase()
    return records
      .filter((r) => {
        if (cart.some((c) => c.id === r.id)) return false
        if (waitingOnly && r.data?.estatus_cirugia && r.data.estatus_cirugia !== 'En espera') return false
        if (q) {
          const hay = [patientName(r), r.data?.especialidad, r.data?.perfil, r.data?.diagnostico]
            .filter(Boolean).join(' ').toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => patientName(a).localeCompare(patientName(b)))
  }, [records, cart, search, waitingOnly])

  const add = (r: ListRecord) => {
    if (cart.some((c) => c.id === r.id)) return
    setCart((prev) => [...prev, r])
    setSaved(false)
  }

  const remove = (id: string) => {
    setCart((prev) => prev.filter((r) => r.id !== id))
    setSaved(false)
  }

  const move = (id: string, dir: -1 | 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((r) => r.id === id)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
    setSaved(false)
  }

  const save = async () => {
    if (!date) return
    try {
      await dayListsApi.save(date, cart.map((r) => r.id))
      setSaved(true)
      toast('Listado guardado', 'success')
    } catch {
      toast('Error al guardar el listado', 'error')
    }
  }

  const clear = async () => {
    try {
      await dayListsApi.delete(date)
      setCart([])
      setSaved(true)
      toast('Listado del día vaciado', 'success')
    } catch {
      setCart([])
      setSaved(true)
    }
  }

  const shift = (n: number) => {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + n)
    setDate(isoDate(d))
  }

  const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('es-HN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
  const countByEspecialidad = useMemo(() => {
    const m: Record<string, number> = {}
    cart.forEach((r) => {
      const k = r.data?.especialidad || 'Sin especialidad'
      m[k] = (m[k] || 0) + 1
    })
    return m
  }, [cart])

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0">
        <h1 className="font-serif text-2xl font-bold text-[#3F4650]">Listado Diario de Cirugías</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500 hidden sm:block">Fecha del listado:</label>
          <div className="flex items-center gap-1 bg-white border border-[#E3E6EB] rounded-xl px-1.5 py-1 shadow-sm">
            <button onClick={() => shift(-1)} className="p-1 text-slate-400 hover:text-[#3F4650] rounded-lg hover:bg-[#F8F9FA] transition-colors">
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-sm text-slate-700 bg-transparent focus:outline-none"
            />
            <button onClick={() => shift(1)} className="p-1 text-slate-400 hover:text-[#3F4650] rounded-lg hover:bg-[#F8F9FA] transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => setDate(isoDate(new Date()))}
            className="px-2.5 py-1.5 text-xs font-medium text-[#5F6B80] bg-white border border-[#E3E6EB] rounded-xl hover:bg-[#F8F9FA] transition-colors"
          >
            Hoy
          </button>
          <button
            onClick={() => { const d = new Date(); d.setDate(d.getDate() + 1); setDate(isoDate(d)) }}
            className="px-2.5 py-1.5 text-xs font-medium text-[#5F6B80] bg-white border border-[#E3E6EB] rounded-xl hover:bg-[#F8F9FA] transition-colors"
          >
            Mañana
          </button>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 gap-4 min-h-0 mt-4 print:hidden">
        {/* Panel pacientes disponibles */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E3E6EB] flex flex-col min-h-0">
          <div className="p-3 border-b border-[#E3E6EB] space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#3F4650]">Pacientes disponibles</h2>
              <span className="text-xs text-slate-400">{available.length} pacientes</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar paciente, especialidad, perfil..."
                  className="w-full pl-8 pr-3 py-2 border border-[#E3E6EB] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                />
              </div>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 whitespace-nowrap cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={waitingOnly}
                  onChange={(e) => setWaitingOnly(e.target.checked)}
                  className="accent-[#6E7B91]"
                />
                Solo en espera
              </label>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-slate-400 py-12">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Cargando...</span>
              </div>
            ) : available.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-12">
                {search || waitingOnly ? 'Sin pacientes que coincidan' : 'No hay pacientes disponibles'}
              </p>
            ) : (
              <ul className="divide-y divide-[#E3E6EB]">
                {available.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => add(r)}
                      className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#F8F9FA] transition-colors group"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{patientName(r)}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {[r.data?.especialidad, r.data?.perfil].filter(Boolean).join(' · ') || <span className="text-slate-300">Sin datos</span>}
                        </p>
                      </div>
                      <StatusBadge status={r.data?.estatus_cirugia} />
                      <span className="w-7 h-7 rounded-lg bg-[#6E7B91] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Plus size={15} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Panel carrito del día */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E3E6EB] flex flex-col min-h-0">
          <div className="p-3 border-b border-[#E3E6EB] flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold text-[#3F4650]">
              Listado del día <span className="text-[#6E7B91]">· {dayLabel}</span>
            </h2>
            {loadingDate && <div className="w-4 h-4 border-2 border-[#6E7B91] border-t-transparent rounded-full animate-spin" />}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={save}
                disabled={loadingDate}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#6E7B91] text-white rounded-xl text-xs font-medium hover:bg-[#5F6B80] transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                {saved ? 'Guardado' : 'Guardar'}
              </button>
              <button
                onClick={() => window.print()}
                disabled={cart.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-medium border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <Printer size={14} />
                Imprimir
              </button>
              {cart.length > 0 && (
                <button
                  onClick={clear}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-red-400 bg-red-50 rounded-xl text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingDate ? (
              <div className="flex items-center justify-center gap-2 text-slate-400 py-12">
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Cargando listado...</span>
              </div>
            ) : cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                <ClipboardList size={32} />
                <p className="text-sm">Agrega pacientes del panel izquierdo para armar el listado del día.</p>
              </div>
            ) : (
              <ul className="divide-y divide-[#E3E6EB]">
                {cart.map((r, idx) => (
                  <li key={r.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-[#F8F9FA] transition-colors">
                    <span className="w-6 h-6 rounded-full bg-[#6E7B91] text-white text-xs font-semibold flex items-center justify-center flex-none">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{patientName(r)}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {[r.data?.edad && `Edad: ${r.data.edad}`, r.data?.especialidad, r.data?.perfil, r.data?.diagnostico]
                          .filter(Boolean).join(' · ') || 'Sin datos'}
                      </p>
                    </div>
                    <StatusBadge status={r.data?.estatus_cirugia} />
                    <div className="flex items-center gap-0.5 flex-none">
                      <button onClick={() => move(r.id, -1)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-[#3F4650] rounded-lg hover:bg-[#EDF0F4] transition-colors disabled:opacity-30">
                        <ArrowUp size={14} />
                      </button>
                      <button onClick={() => move(r.id, 1)} disabled={idx === cart.length - 1} className="p-1 text-slate-400 hover:text-[#3F4650] rounded-lg hover:bg-[#EDF0F4] transition-colors disabled:opacity-30">
                        <ArrowDown size={14} />
                      </button>
                      <button onClick={() => remove(r.id)} className="p-1 text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {cart.length > 0 && (
            <div className="p-3 border-t border-[#E3E6EB]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span><span className="font-semibold text-[#3F4650]">{cart.length}</span> pacientes</span>
                {Object.entries(countByEspecialidad).map(([esp, n]) => (
                  <span key={esp} className="px-2 py-0.5 rounded-full bg-[#F8F9FA] border border-[#E3E6EB] text-[#5F6B80]">
                    {esp}: {n}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Área imprimible */}
      <div id="print-root" className="hidden">
        <div style={{ fontFamily: 'Arial, sans-serif', color: '#1F2937', padding: '4px' }}>
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#3F4650' }}>
              Centro Médico San Benito José
            </p>
            <h1 style={{ margin: '2px 0', fontSize: '18px', fontWeight: 700, color: '#6E7B91' }}>
              Listado Diario de Cirugías
            </h1>
            <p style={{ margin: 0, fontSize: '11px', color: '#8A919C' }}>
              {dayLabel} · {cart.length} pacientes
            </p>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead>
              <tr style={{ background: '#6E7B91', color: '#FFFFFF' }}>
                <th style={{ border: '1px solid #D7DBE1', padding: '6px 8px', textAlign: 'left' }}>No</th>
                <th style={{ border: '1px solid #D7DBE1', padding: '6px 8px', textAlign: 'left' }}>Paciente</th>
                <th style={{ border: '1px solid #D7DBE1', padding: '6px 8px', textAlign: 'left' }}>Especialidad</th>
                <th style={{ border: '1px solid #D7DBE1', padding: '6px 8px', textAlign: 'left' }}>Perfil</th>
                <th style={{ border: '1px solid #D7DBE1', padding: '6px 8px', textAlign: 'left' }}>Diagnóstico</th>
                <th style={{ border: '1px solid #D7DBE1', padding: '6px 8px', textAlign: 'left' }}>Médico</th>
                <th style={{ border: '1px solid #D7DBE1', padding: '6px 8px', textAlign: 'left' }}>Teléfono</th>
                <th style={{ border: '1px solid #D7DBE1', padding: '6px 8px', textAlign: 'left' }}>Estatus</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((r, idx) => (
                <tr key={r.id} style={{ background: idx % 2 ? '#F4F6F8' : '#FFFFFF' }}>
                  <td style={{ border: '1px solid #D7DBE1', padding: '3px 8px' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #D7DBE1', padding: '3px 8px', fontWeight: 600 }}>{patientName(r)}</td>
                  <td style={{ border: '1px solid #D7DBE1', padding: '3px 8px' }}>{r.data?.especialidad || ''}</td>
                  <td style={{ border: '1px solid #D7DBE1', padding: '3px 8px' }}>{r.data?.perfil || ''}</td>
                  <td style={{ border: '1px solid #D7DBE1', padding: '3px 8px' }}>{r.data?.diagnostico || ''}</td>
                  <td style={{ border: '1px solid #D7DBE1', padding: '3px 8px' }}>{r.data?.nombre_medico || ''}</td>
                  <td style={{ border: '1px solid #D7DBE1', padding: '3px 8px' }}>{r.data?.telefono || ''}</td>
                  <td style={{ border: '1px solid #D7DBE1', padding: '3px 8px' }}>{r.data?.estatus_cirugia || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status?: string }) {
  const styles: Record<string, string> = {
    'Operado': 'bg-emerald-100 text-emerald-600 border-emerald-200',
    'En espera': 'bg-yellow-100 text-yellow-600 border-yellow-200',
    'Reprogramar': 'bg-orange-100 text-orange-600 border-orange-200',
    'Cancelado': 'bg-slate-100 text-slate-500 border-slate-200',
    'Fuera de perfil San Benito': 'bg-red-100 text-red-600 border-red-200',
    'No se presentó': 'bg-violet-100 text-violet-600 border-violet-200',
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border whitespace-nowrap ${styles[status || ''] || 'bg-white text-slate-400 border-[#E3E6EB]'}`}>
      {status || 'Sin estatus'}
    </span>
  )
}
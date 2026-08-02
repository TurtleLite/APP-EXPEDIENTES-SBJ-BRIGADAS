import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usersApi, listsApi, reportsApi } from '../services/api'
import {
  Users, FileText, Table2, BarChart3, ArrowRight, ChevronRight, FileSpreadsheet, Zap,
} from 'lucide-react'
import type { ListDefinition, Report } from '../types'
import { RoleAvatar } from '../components/RoleAvatar'

interface Stats {
  users?: number
  lists: number
  records: number
  reports: number
}

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  direccion: 'Dirección',
  direccion_medica: 'Dirección Médica',
  medico: 'Médico',
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ lists: 0, records: 0, reports: 0 })
  const [recentLists, setRecentLists] = useState<ListDefinition[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [listCounts, setListCounts] = useState<Record<string, number>>({})
  const [systemListId, setSystemListId] = useState<string | null>(null)

  const role = user?.role || 'medico'
  const canManageUsers = role === 'admin'
  const canReports = role === 'admin' || role === 'direccion' || role === 'direccion_medica'

  const goExpedientes = () => {
    if (systemListId) {
      navigate(`/lists/${systemListId}`)
      return
    }
    listsApi.list()
      .then((res) => {
        const system = res.data.find((l: any) => l.is_system)
        navigate(system ? `/lists/${system.id}` : '/lists')
      })
      .catch(() => navigate('/lists'))
  }

  useEffect(() => {
    async function load() {
      try {
        const [listsRes, reportsRes, usersRes] = await Promise.all([
          listsApi.list(),
          canReports ? reportsApi.list() : Promise.resolve({ data: [] }),
          canManageUsers ? usersApi.list() : Promise.resolve({ data: [] }),
        ])
        const lists: ListDefinition[] = listsRes.data
        const reports: Report[] = reportsRes.data

        const system = lists.find((l) => l.is_system)
        if (system) setSystemListId(system.id)

        const countsRes = await Promise.all(
          lists.map((list) =>
            listsApi.getRecordsCount(list.id)
              .then((res) => ({ id: list.id, count: res.data.count || 0 }))
              .catch(() => ({ id: list.id, count: 0 }))
          )
        )
        const countsMap: Record<string, number> = {}
        for (const c of countsRes) countsMap[c.id] = c.count
        setListCounts(countsMap)

        setStats({
          users: canManageUsers ? usersRes.data.length : undefined,
          lists: lists.length,
          records: Object.values(countsMap).reduce((a, b) => a + b, 0),
          reports: reports.length,
        })
        setRecentLists(lists.slice(0, 6))
        setRecentReports(reports.slice(0, 4))
      } catch {}
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const hoy = new Date().toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
  const showReports = canReports && recentReports.length > 0
  const maxCount = Math.max(1, ...Object.values(listCounts))

  const filterBadges = (filters?: Record<string, any>) => {
    const items: { label: string; value: string; cls: string }[] = []
    if (filters?.especialidad) items.push({ label: 'Especialidad', value: filters.especialidad, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' })
    if (filters?.perfil) items.push({ label: 'Perfil', value: filters.perfil, cls: 'bg-sky-50 text-sky-700 border-sky-200' })
    if (filters?.estatus_cirugia) items.push({ label: 'Estatus', value: filters.estatus_cirugia, cls: 'bg-violet-50 text-violet-700 border-violet-200' })
    return items
  }

  return (
    <div className="flex flex-col gap-5 h-full min-h-0">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 capitalize">{greeting} · {hoy}</p>
          <h1 className="font-serif text-2xl font-bold text-[#134e4a] truncate">Panel de {roleLabels[role]}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-[#a9ded6] text-xs font-medium text-[#0f766e]">
            <Table2 size={13} />
            {stats.lists} expedientes
          </span>
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 border border-[#a9ded6] text-xs font-medium text-[#0f766e]">
            <BarChart3 size={13} />
            {stats.records} registros
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Sesión activa
          </span>
          <RoleAvatar role={role} size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {canManageUsers && (
          <StatCard
            icon={<Users size={18} />}
            label="Usuarios"
            value={stats.users ?? 0}
            caption="Cuentas registradas"
            accent="border-l-sky-400"
            iconBg="bg-sky-100 text-sky-600"
            onClick={() => navigate('/users')}
          />
        )}
        <StatCard
          icon={<Table2 size={18} />}
          label="Expedientes"
          value={stats.lists}
          caption="Listas del sistema"
          accent="border-l-violet-400"
          iconBg="bg-violet-100 text-violet-600"
          onClick={goExpedientes}
        />
        <StatCard
          icon={<BarChart3 size={18} />}
          label="Registros"
          value={stats.records}
          caption="Pacientes en el banco"
          accent="border-l-emerald-400"
          iconBg="bg-emerald-100 text-emerald-600"
          onClick={goExpedientes}
        />
        {canReports && (
          <StatCard
            icon={<FileText size={18} />}
            label="Reportes"
            value={stats.reports}
            caption="Generados"
            accent="border-l-amber-400"
            iconBg="bg-amber-100 text-amber-600"
            onClick={() => navigate('/reports')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        <section className={`bg-white rounded-2xl shadow-sm border border-[#a9ded6] flex flex-col min-h-0 ${showReports ? 'lg:col-span-7' : 'lg:col-span-9'}`}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#a9ded6] shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-1 h-4 bg-[#0d9488] rounded-full" />
              <h2 className="font-serif text-sm font-semibold text-[#134e4a]">Expedientes</h2>
              <span className="text-[10px] font-semibold text-[#0f766e] bg-teal-50 border border-[#a9ded6] rounded-full px-2 py-0.5">
                {stats.lists} total
              </span>
            </div>
            <button
              onClick={goExpedientes}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
            >
              Ver todos
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {recentLists.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Table2 size={32} className="text-slate-200" />
                <p className="text-slate-500 text-sm mt-3">No hay expedientes aún</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-5 py-3">Expediente</th>
                    <th className="px-4 py-3 w-56">Registros</th>
                    <th className="px-4 py-3 w-14 text-right">Abrir</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLists.map((list, idx) => {
                    const count = listCounts[list.id] ?? 0
                    return (
                      <tr
                        key={list.id}
                        onClick={() => navigate(`/lists/${list.id}`)}
                        className={`cursor-pointer transition-colors duration-150 hover:bg-teal-50/60 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f0fdfa]/50'}`}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                              <Table2 size={15} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800 truncate">{list.name}</p>
                              {list.description && (
                                <p className="text-[11px] text-slate-400 truncate">{list.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xs font-bold text-slate-700 w-9 shrink-0">{count}</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#0d9488] to-[#06b6d4] rounded-full transition-all duration-500"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all duration-200">
                            <ChevronRight size={15} />
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="lg:col-span-5 flex flex-col gap-5 min-h-0">
          <section className="bg-white rounded-2xl shadow-sm border border-[#a9ded6] p-5 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1 h-4 bg-amber-400 rounded-full" />
              <h2 className="font-serif text-sm font-semibold text-[#134e4a]">Acceso rápido</h2>
              <Zap size={14} className="text-slate-300 ml-auto" />
            </div>
            <div className="space-y-2">
              <QuickAction
                icon={<Table2 size={16} />}
                label="Expedientes"
                hint="Abrir el banco de pacientes"
                color="bg-violet-500"
                onClick={goExpedientes}
              />
              {canReports && (
                <QuickAction
                  icon={<FileText size={16} />}
                  label="Nuevo reporte"
                  hint="Por especialidad o estatus"
                  color="bg-amber-500"
                  onClick={() => navigate('/reports')}
                />
              )}
              {role === 'admin' && (
                <QuickAction
                  icon={<Users size={16} />}
                  label="Gestionar usuarios"
                  hint="Administra cuentas y roles"
                  color="bg-sky-500"
                  onClick={() => navigate('/users')}
                />
              )}
            </div>
          </section>

          {showReports ? (
            <section className="bg-white rounded-2xl shadow-sm border border-[#a9ded6] flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#a9ded6] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 bg-amber-400 rounded-full" />
                  <h2 className="font-serif text-sm font-semibold text-[#134e4a]">Reportes recientes</h2>
                </div>
                <button
                  onClick={() => navigate('/reports')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
                >
                  Ver todos
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
                {recentReports.map((report) => {
                  const badges = filterBadges(report.filters)
                  return (
                    <button
                      key={report.id}
                      onClick={() => navigate('/reports')}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 text-left transition-all duration-200 group"
                    >
                      <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <FileSpreadsheet size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{report.name}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {badges.length === 0 ? (
                            <span className="px-1.5 py-0.5 bg-teal-50 text-slate-500 rounded text-[9px] font-medium border border-[#a9ded6]">
                              General
                            </span>
                          ) : badges.map((b, i) => (
                            <span key={i} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${b.cls}`}>
                              {b.value}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                    </button>
                  )
                })}
              </div>
            </section>
          ) : (
            <section className="bg-white rounded-2xl shadow-sm border border-[#a9ded6] p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[#0d9488] rounded-full" />
                <h2 className="font-serif text-sm font-semibold text-[#134e4a]">Resumen del sistema</h2>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f0fdfa] border border-[#a9ded6]">
                  <span className="text-slate-500">Expedientes registrados</span>
                  <span className="font-bold text-slate-800">{stats.lists}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f0fdfa] border border-[#a9ded6]">
                  <span className="text-slate-500">Registros en el banco</span>
                  <span className="font-bold text-slate-800">{stats.records}</span>
                </div>
                {canManageUsers && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f0fdfa] border border-[#a9ded6]">
                    <span className="text-slate-500">Usuarios activos</span>
                    <span className="font-bold text-slate-800">{stats.users ?? 0}</span>
                  </div>
                )}
                {canReports && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#f0fdfa] border border-[#a9ded6]">
                    <span className="text-slate-500">Reportes creados</span>
                    <span className="font-bold text-slate-800">{stats.reports}</span>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, caption, accent, iconBg, onClick }: {
  icon: React.ReactNode
  label: string
  value: number
  caption?: string
  accent: string
  iconBg: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden bg-white rounded-2xl border border-[#a9ded6] border-l-4 ${accent} p-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0`}>
          {icon}
        </div>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600">{label}</p>
      {caption && <p className="text-[10px] text-slate-400 mt-0.5">{caption}</p>}
    </button>
  )
}

function QuickAction({ icon, label, hint, color, onClick }: {
  icon: React.ReactNode
  label: string
  hint?: string
  color: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-white hover:border-[#a9ded6] hover:shadow-sm transition-all duration-200 group text-left"
    >
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {hint && <p className="text-[11px] text-slate-400 truncate">{hint}</p>}
      </div>
      <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
    </button>
  )
}

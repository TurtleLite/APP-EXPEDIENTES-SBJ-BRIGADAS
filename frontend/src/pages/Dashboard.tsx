import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usersApi, listsApi, reportsApi } from '../services/api'
import {
  Users, FileText, Table2, BarChart3, ArrowRight, ChevronRight, FileSpreadsheet,
  UserCircle2, Activity,
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
        setRecentLists(lists.slice(0, 5))
        setRecentReports(reports.slice(0, 3))
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

  const options: { label: string; icon: React.ReactNode; color: string; onClick: () => void }[] = [
    {
      label: 'Mi Perfil',
      icon: <UserCircle2 size={16} />,
      color: 'bg-sky-500',
      onClick: () => navigate('/perfil'),
    },
    ...(role === 'admin' ? [{
      label: 'Usuarios',
      icon: <Users size={16} />,
      color: 'bg-slate-600',
      onClick: () => navigate('/users'),
    }] : []),
    {
      label: 'Expedientes',
      icon: <Table2 size={16} />,
      color: 'bg-violet-500',
      onClick: goExpedientes,
    },
    ...(canReports ? [{
      label: 'Reportes',
      icon: <FileText size={16} />,
      color: 'bg-amber-500',
      onClick: () => navigate('/reports'),
    }] : []),
    ...(role === 'admin' || role === 'direccion' ? [{
      label: 'Estatus Cirugía',
      icon: <Activity size={16} />,
      color: 'bg-rose-500',
      onClick: () => navigate('/estado-cirugia'),
    }] : []),
  ]

  const filterBadges = (filters?: Record<string, any>) => {
    const items: { value: string; cls: string }[] = []
    if (filters?.especialidad) items.push({ value: filters.especialidad, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' })
    if (filters?.perfil) items.push({ value: filters.perfil, cls: 'bg-sky-50 text-sky-700 border-sky-200' })
    if (filters?.estatus_cirugia) items.push({ value: filters.estatus_cirugia, cls: 'bg-violet-50 text-violet-700 border-violet-200' })
    return items
  }

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 capitalize">{greeting} · {hoy}</p>
          <h1 className="font-serif text-xl font-bold text-[#134e4a] truncate">Hola, {user?.full_name}</h1>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        {canManageUsers && (
          <StatCard
            icon={<Users size={16} />}
            label="Usuarios"
            value={stats.users ?? 0}
            accent="border-l-sky-400"
            iconBg="bg-sky-100 text-sky-600"
            onClick={() => navigate('/users')}
          />
        )}
        <StatCard
          icon={<Table2 size={16} />}
          label="Expedientes"
          value={stats.lists}
          accent="border-l-violet-400"
          iconBg="bg-violet-100 text-violet-600"
          onClick={goExpedientes}
        />
        <StatCard
          icon={<BarChart3 size={16} />}
          label="Registros"
          value={stats.records}
          accent="border-l-emerald-400"
          iconBg="bg-emerald-100 text-emerald-600"
          onClick={goExpedientes}
        />
        {canReports && (
          <StatCard
            icon={<FileText size={16} />}
            label="Reportes"
            value={stats.reports}
            accent="border-l-amber-400"
            iconBg="bg-amber-100 text-amber-600"
            onClick={() => navigate('/reports')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <section className={`bg-white rounded-2xl shadow-sm border border-[#a9ded6] flex flex-col min-h-0 ${showReports ? 'lg:col-span-7' : 'lg:col-span-8'}`}>
          <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-[#a9ded6] shrink-0">
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
              <div className="flex flex-col items-center justify-center h-full text-center py-10">
                <Table2 size={30} className="text-slate-200" />
                <p className="text-slate-500 text-sm mt-3">No hay expedientes aún</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-white">
                  <tr className="text-left text-[10px] font-semibold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-4 py-2.5">Expediente</th>
                    <th className="px-3 py-2.5 w-44">Registros</th>
                    <th className="px-3 py-2.5 w-12 text-right">Abrir</th>
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
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                              <Table2 size={13} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-800 truncate">{list.name}</p>
                              {list.description && (
                                <p className="text-[10px] text-slate-400 truncate">{list.description}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700 w-8 shrink-0">{count}</span>
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#0d9488] to-[#06b6d4] rounded-full transition-all duration-500"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-all duration-200">
                            <ChevronRight size={14} />
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

        <div className={`${showReports ? 'lg:col-span-5' : 'lg:col-span-4'} flex flex-col gap-4 min-h-0`}>
          <section className="bg-white rounded-2xl shadow-sm border border-[#a9ded6] p-4 shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1 h-4 bg-amber-400 rounded-full" />
              <h2 className="font-serif text-sm font-semibold text-[#134e4a]">Acceso rápido</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {options.map((opt) => (
                <button
                  key={opt.label}
                  onClick={opt.onClick}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-slate-100 hover:border-[#a9ded6] hover:bg-slate-50/70 transition-all duration-200 group text-left"
                >
                  <div className={`w-8 h-8 rounded-lg ${opt.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0`}>
                    {opt.icon}
                  </div>
                  <p className="text-xs font-semibold text-slate-800 truncate">{opt.label}</p>
                </button>
              ))}
            </div>
          </section>

          {showReports ? (
            <section className="bg-white rounded-2xl shadow-sm border border-[#a9ded6] flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-[#a9ded6] shrink-0">
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 text-left transition-all duration-200 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                        <FileSpreadsheet size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 truncate">{report.name}</p>
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
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                    </button>
                  )
                })}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent, iconBg, onClick }: {
  icon: React.ReactNode
  label: string
  value: number
  accent: string
  iconBg: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group bg-white rounded-2xl border border-[#a9ded6] border-l-4 ${accent} px-4 py-3 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xl font-bold text-slate-900">{value}</p>
          <p className="text-[11px] font-semibold text-slate-500 mt-0.5 truncate">{label}</p>
        </div>
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center group-hover:scale-105 transition-transform duration-200 shrink-0`}>
          {icon}
        </div>
      </div>
    </button>
  )
}

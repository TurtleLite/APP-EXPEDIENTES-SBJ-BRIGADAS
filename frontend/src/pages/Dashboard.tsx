import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usersApi, listsApi, reportsApi } from '../services/api'
import {
  Users, FileText, Table2, BarChart3, ArrowRight, ChevronRight, FileSpreadsheet,
  UserCircle2, Activity,
} from 'lucide-react'
import type { ListDefinition, Report } from '../types'

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
  const firstName = (user?.full_name?.split(' ')[0] || user?.username || '').replace(/^./, (c) => c.toUpperCase())

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

  const statItems: { label: string; value: number; icon: React.ReactNode; onClick: () => void }[] = [
    ...(canManageUsers ? [{
      label: 'Usuarios',
      value: stats.users ?? 0,
      icon: <Users size={13} />,
      onClick: () => navigate('/users'),
    }] : []),
    {
      label: 'Expedientes',
      value: stats.lists,
      icon: <Table2 size={13} />,
      onClick: goExpedientes,
    },
    {
      label: 'Registros',
      value: stats.records,
      icon: <BarChart3 size={13} />,
      onClick: goExpedientes,
    },
    ...(canReports ? [{
      label: 'Reportes',
      value: stats.reports,
      icon: <FileText size={13} />,
      onClick: () => navigate('/reports'),
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
    <div className="h-full flex flex-col gap-3 min-h-0">
      <div className="shrink-0 flex items-center justify-between gap-4 px-1">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[#0f766e] text-xs font-semibold">{greeting}, {firstName}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0" />
          <span className="text-slate-400 text-xs capitalize truncate">{hoy}</span>
          <span className="w-1 h-1 rounded-full bg-slate-300 shrink-0 hidden sm:block" />
          <span className="text-slate-400 text-xs hidden sm:block">{roleLabels[role]}</span>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Sesión activa
        </span>
      </div>

      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0f766e] via-[#0d9488] to-[#06b6d4] shadow-lg shrink-0">
        <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 right-44 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-10 left-1/3 w-24 h-24 rounded-full bg-white/5" />
        <div className="relative px-8 pt-6 pb-1">
          <div className="flex items-center justify-between gap-6">
            <div className="flex items-center gap-5 min-w-0">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center shrink-0">
                <img src="/logo_sbj.png" alt="SBJ" className="w-12 h-12" />
              </div>
              <div className="min-w-0">
                <p className="text-[#ccfbf1] text-[10px] font-semibold uppercase tracking-[0.25em]">
                  Centro Médico San Benito José
                </p>
                <h1 className="font-serif text-2xl font-bold text-white mt-1 truncate">
                  {greeting}, {firstName}
                </h1>
              </div>
            </div>
            <button
              onClick={goExpedientes}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0d9488] rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200 shrink-0"
            >
              <Table2 size={16} />
              Abrir Expedientes
              <ArrowRight size={15} />
            </button>
          </div>
          <div className="flex items-center divide-x divide-white/20 mt-4 overflow-x-auto">
            {statItems.map((s) => (
              <button
                key={s.label}
                onClick={s.onClick}
                className="flex items-center gap-2 px-4 py-2.5 first:pl-0 hover:bg-white/10 transition-colors duration-200 shrink-0"
              >
                <span className="w-6 h-6 rounded-md bg-white/15 text-white flex items-center justify-center">{s.icon}</span>
                <span className="text-xl font-bold text-white leading-none">{s.value}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#ccfbf1]">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-[#a9ded6] shadow-sm flex-1 min-h-0 flex flex-col">
        <div className="flex gap-2 p-4 pb-3 overflow-x-auto shrink-0">
          {options.map((opt) => (
            <button
              key={opt.label}
              onClick={opt.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 hover:border-[#a9ded6] hover:bg-teal-50/50 transition-all duration-200 group shrink-0"
            >
              <div className={`w-7 h-7 rounded-lg ${opt.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                {opt.icon}
              </div>
              <span className="text-xs font-semibold text-slate-700">{opt.label}</span>
            </button>
          ))}
        </div>

        <div className="h-px bg-slate-100 mx-4 shrink-0" />

        {recentLists.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-10">
            <Table2 size={30} className="text-slate-200" />
            <p className="text-slate-500 text-sm mt-3">No hay expedientes aún</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                Expedientes
                <span className="text-[#0f766e] bg-teal-50 border border-[#a9ded6] rounded-full px-2 py-0.5 ml-2">{stats.lists}</span>
              </p>
              <button
                onClick={goExpedientes}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
              >
                Ver todos
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              {recentLists.map((list) => {
                const count = listCounts[list.id] ?? 0
                return (
                  <button
                    key={list.id}
                    onClick={() => navigate(`/lists/${list.id}`)}
                    className="w-full flex items-center gap-3 px-5 py-3 border-b border-slate-50 last:border-b-0 hover:bg-teal-50/50 transition-colors duration-150 text-left group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                      <Table2 size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{list.name}</p>
                      {list.description && (
                        <p className="text-[10px] text-slate-400 truncate">{list.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 w-40 shrink-0">
                      <span className="text-xs font-bold text-slate-700 w-6 text-right">{count}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0d9488] to-[#06b6d4] rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                  </button>
                )
              })}
            </div>
          </>
        )}

        {showReports ? (
          <>
            <div className="h-px bg-slate-100 mx-4 shrink-0" />
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Reportes recientes</p>
              <button
                onClick={() => navigate('/reports')}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
              >
                Ver todos
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="shrink-0 pb-4">
              {recentReports.map((report) => {
                const badges = filterBadges(report.filters)
                return (
                  <button
                    key={report.id}
                    onClick={() => navigate('/reports')}
                    className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-amber-50/40 transition-colors duration-150 text-left group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <FileSpreadsheet size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">{report.name}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
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
          </>
        ) : null}
      </section>
    </div>
  )
}

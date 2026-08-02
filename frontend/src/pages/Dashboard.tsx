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

  const statItems: { label: string; value: number; icon: React.ReactNode; color: string; onClick: () => void }[] = [
    ...(canManageUsers ? [{
      label: 'Usuarios',
      value: stats.users ?? 0,
      icon: <Users size={14} />,
      color: 'bg-sky-100 text-sky-600',
      onClick: () => navigate('/users'),
    }] : []),
    {
      label: 'Expedientes',
      value: stats.lists,
      icon: <Table2 size={14} />,
      color: 'bg-violet-100 text-violet-600',
      onClick: goExpedientes,
    },
    {
      label: 'Registros',
      value: stats.records,
      icon: <BarChart3 size={14} />,
      color: 'bg-emerald-100 text-emerald-600',
      onClick: goExpedientes,
    },
    ...(canReports ? [{
      label: 'Reportes',
      value: stats.reports,
      icon: <FileText size={14} />,
      color: 'bg-amber-100 text-amber-600',
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
    <div className="h-full overflow-y-auto pr-1">
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#0d9488] to-[#0f766e] text-white flex items-center justify-center shadow-md shrink-0">
              <img src="/logo_sbj.png" alt="SBJ" className="w-8 h-8" />
            </div>
            <div className="min-w-0">
              <p className="text-[#0f766e] text-[10px] font-semibold uppercase tracking-[0.25em] truncate">
                Centro Médico San Benito José
              </p>
              <p className="text-slate-400 text-[11px] capitalize truncate">{hoy}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sesión activa
          </span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-slate-900 mt-6">{greeting}, {firstName}</h1>
        <p className="text-slate-500 text-sm mt-1">{roleLabels[role]}</p>

        <div className="flex items-center gap-2 mt-5 flex-wrap">
          <button
            onClick={goExpedientes}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#0d9488] to-[#0f766e] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-200"
          >
            <Table2 size={16} />
            Abrir Expedientes
            <ArrowRight size={15} />
          </button>
          {canReports ? (
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-[#0f766e] rounded-xl text-sm font-bold border border-[#a9ded6] hover:bg-teal-50 transition-all duration-200"
            >
              <FileText size={16} />
              Ver reportes
            </button>
          ) : null}
        </div>
      </header>

      <div className="flex gap-2 mt-6 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={opt.onClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-100 hover:border-[#a9ded6] hover:shadow-sm transition-all duration-200 group"
          >
            <div className={`w-7 h-7 rounded-lg ${opt.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
              {opt.icon}
            </div>
            <span className="text-xs font-semibold text-slate-700">{opt.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-6">
        {statItems.map((s) => (
          <button
            key={s.label}
            onClick={s.onClick}
            className="group flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
          >
            <span className={`w-7 h-7 rounded-lg ${s.color} flex items-center justify-center`}>{s.icon}</span>
            <span className="text-xl font-bold text-[#0d9488] leading-none">{s.value}</span>
            <span className="text-xs font-medium text-slate-500">{s.label}</span>
          </button>
        ))}
      </div>

      <section className="mt-7">
        <div className="flex items-center justify-between mb-3">
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

        {recentLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-100">
            <Table2 size={30} className="text-slate-200" />
            <p className="text-slate-500 text-sm mt-3">No hay expedientes aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentLists.map((list) => {
              const count = listCounts[list.id] ?? 0
              return (
                <button
                  key={list.id}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#0d9488] px-4 py-3 hover:border-[#a9ded6] hover:shadow-sm transition-all duration-200 text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                    <Table2 size={15} />
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
        )}
      </section>

      {showReports ? (
        <section className="mt-7 pb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Reportes recientes</p>
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
            >
              Ver todos
              <ArrowRight size={13} />
            </button>
          </div>
          <div className="space-y-2">
            {recentReports.map((report) => {
              const badges = filterBadges(report.filters)
              return (
                <button
                  key={report.id}
                  onClick={() => navigate('/reports')}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#14b8a6] px-4 py-3 hover:border-[#a9ded6] hover:shadow-sm transition-all duration-200 text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <FileSpreadsheet size={15} />
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
        </section>
      ) : null}
    </div>
  )
}

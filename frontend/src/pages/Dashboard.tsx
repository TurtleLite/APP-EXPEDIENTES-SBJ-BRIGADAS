import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { listsApi, reportsApi } from '../services/api'
import {
  Users, FileText, Table2, ChevronRight, FileSpreadsheet, Lock,
  UserCircle2, Activity,
} from 'lucide-react'
import type { ListDefinition, Report } from '../types'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  direccion: 'Dirección',
  direccion_medica: 'Dirección Médica',
  medico: 'Médico',
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recentLists, setRecentLists] = useState<ListDefinition[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])
  const [listCounts, setListCounts] = useState<Record<string, number>>({})
  const [systemListId, setSystemListId] = useState<string | null>(null)
  const [denied, setDenied] = useState<string | null>(null)

  useEffect(() => {
    if (!denied) return
    const t = setTimeout(() => setDenied(null), 3500)
    return () => clearTimeout(t)
  }, [denied])

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
        const [listsRes, reportsRes] = await Promise.all([
          listsApi.list(),
          canReports ? reportsApi.list() : Promise.resolve({ data: [] }),
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

  const options: { label: string; icon: React.ReactNode; color: string; allowed: boolean; onClick: () => void }[] = [
    {
      label: 'Mi Perfil',
      icon: <UserCircle2 size={18} />,
      color: 'bg-sky-500',
      allowed: true,
      onClick: () => navigate('/perfil'),
    },
    {
      label: 'Usuarios',
      icon: <Users size={18} />,
      color: 'bg-slate-600',
      allowed: role === 'admin',
      onClick: () => navigate('/users'),
    },
    {
      label: 'Expedientes',
      icon: <Table2 size={18} />,
      color: 'bg-violet-500',
      allowed: true,
      onClick: goExpedientes,
    },
    {
      label: 'Reportes',
      icon: <FileText size={18} />,
      color: 'bg-amber-500',
      allowed: canReports,
      onClick: () => navigate('/reports'),
    },
    {
      label: 'Estatus Cirugía',
      icon: <Activity size={18} />,
      color: 'bg-rose-500',
      allowed: role === 'admin' || role === 'direccion',
      onClick: () => navigate('/estado-cirugia'),
    },
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
      {denied && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl shadow-lg animate-pulse">
          <Lock size={16} className="shrink-0" />
          <p className="text-sm font-semibold">No tienes acceso a {denied}</p>
        </div>
      )}
      <header className="shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[#0f766e] text-xs font-semibold uppercase tracking-[0.2em] truncate">
              Centro Médico San Benito José
            </p>
            <p className="text-slate-400 text-sm capitalize truncate">{hoy}</p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Sesión activa
          </span>
        </div>

        <h1 className="font-serif text-3xl font-bold text-slate-900 mt-6">{greeting}, {user?.full_name || user?.username || ''}</h1>
        <p className="text-slate-500 text-sm mt-1">{roleLabels[role]}</p>
      </header>

      <div className="flex gap-2.5 mt-7 flex-wrap">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => (opt.allowed ? opt.onClick() : setDenied(opt.label))}
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white border border-slate-100 hover:border-[#a9ded6] hover:shadow-sm transition-all duration-200 group"
          >
            <div className={`w-8 h-8 rounded-lg ${opt.color} text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
              {opt.icon}
            </div>
            <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
          </button>
        ))}
      </div>

      <section className="mt-7">
        {recentLists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-slate-100">
            <Table2 size={30} className="text-slate-200" />
            <p className="text-slate-500 text-sm mt-3">No hay expedientes aún</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentLists.map((list) => {
              const count = listCounts[list.id] ?? 0
              return (
                <button
                  key={list.id}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#0d9488] px-4 py-3.5 hover:border-[#a9ded6] hover:shadow-sm transition-all duration-200 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 shrink-0">
                    <Table2 size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{list.name}</p>
                    {list.description && (
                      <p className="text-xs text-slate-400 truncate">{list.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 w-44 shrink-0">
                    <span className="text-sm font-bold text-slate-700 w-7 text-right">{count}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#0d9488] to-[#06b6d4] rounded-full transition-all duration-500"
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </section>

      {showReports ? (
        <section className="mt-6 pb-4">
          <div className="space-y-2.5">
            {recentReports.map((report) => {
              const badges = filterBadges(report.filters)
              return (
                <button
                  key={report.id}
                  onClick={() => navigate('/reports')}
                  className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 border-l-4 border-l-[#14b8a6] px-4 py-3.5 hover:border-[#a9ded6] hover:shadow-sm transition-all duration-200 text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <FileSpreadsheet size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{report.name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {badges.length === 0 ? (
                        <span className="px-2 py-0.5 bg-teal-50 text-slate-600 rounded text-[11px] font-medium border border-[#a9ded6]">
                          General
                        </span>
                      ) : badges.map((b, i) => (
                        <span key={i} className={`px-2 py-0.5 rounded text-[11px] font-medium border ${b.cls}`}>
                          {b.value}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
              )
            })}
          </div>
        </section>
      ) : null}
    </div>
  )
}

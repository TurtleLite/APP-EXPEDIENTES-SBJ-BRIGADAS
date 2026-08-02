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

  const filterBadges = (filters?: Record<string, any>) => {
    const items: { label: string; value: string; cls: string }[] = []
    if (filters?.especialidad) items.push({ label: 'Especialidad', value: filters.especialidad, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' })
    if (filters?.perfil) items.push({ label: 'Perfil', value: filters.perfil, cls: 'bg-sky-50 text-sky-700 border-sky-200' })
    if (filters?.estatus_cirugia) items.push({ label: 'Estatus', value: filters.estatus_cirugia, cls: 'bg-violet-50 text-violet-700 border-violet-200' })
    return items
  }

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <header className="bg-gradient-to-r from-[#0f766e] via-[#0d9488] to-[#06b6d4] rounded-2xl shadow-lg px-6 py-5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <RoleAvatar role={role} size="lg" />
          <div className="min-w-0">
            <p className="text-[#ccfbf1] text-[11px] font-semibold uppercase tracking-widest">{greeting}</p>
            <h1 className="font-serif text-xl font-bold text-white truncate">{user?.full_name}</h1>
            <p className="text-white/75 text-xs capitalize truncate">{hoy}</p>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-[11px] font-medium text-white">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
          {roleLabels[role]} · Sesión activa
        </span>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {canManageUsers && (
          <StatCard
            icon={<Users size={20} />}
            label="Usuarios"
            value={stats.users ?? 0}
            caption="Cuentas registradas"
            iconBg="bg-sky-500"
            cardBg="bg-sky-50"
            onClick={() => navigate('/users')}
          />
        )}
        <StatCard
          icon={<Table2 size={20} />}
          label="Expedientes"
          value={stats.lists}
          caption="Listas del sistema"
          iconBg="bg-violet-500"
          cardBg="bg-violet-50"
          onClick={goExpedientes}
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Registros"
          value={stats.records}
          caption="Pacientes en el banco"
          iconBg="bg-emerald-500"
          cardBg="bg-emerald-50"
          onClick={goExpedientes}
        />
        {canReports && (
          <StatCard
            icon={<FileText size={20} />}
            label="Reportes"
            value={stats.reports}
            caption="Generados"
            iconBg="bg-amber-500"
            cardBg="bg-amber-50"
            onClick={() => navigate('/reports')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <section className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-[#a9ded6] p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <div>
              <h2 className="font-serif text-sm font-semibold text-[#134e4a]">Expedientes</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Registros por expediente del sistema</p>
            </div>
            <button
              onClick={goExpedientes}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
            >
              Ver todos
              <ArrowRight size={13} />
            </button>
          </div>
          {recentLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Table2 size={32} className="text-slate-200" />
              <p className="text-slate-500 text-sm mt-3">No hay expedientes aún</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto min-h-0 pr-1">
              {recentLists.map((list) => {
                const count = listCounts[list.id] ?? 0
                return (
                  <button
                    key={list.id}
                    onClick={() => navigate(`/lists/${list.id}`)}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border border-slate-100 hover:border-[#a9ded6] hover:bg-slate-50/70 text-left transition-all duration-200 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600 group-hover:scale-105 transition-transform duration-200 shrink-0">
                      <Table2 size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800 truncate">{list.name}</p>
                        <span className="text-[11px] font-semibold text-[#0f766e] bg-teal-50 border border-[#a9ded6] rounded-lg px-2 py-0.5 shrink-0">
                          {count} registros
                        </span>
                      </div>
                      {list.description && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{list.description}</p>
                      )}
                      <div className="mt-2 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0d9488] to-[#06b6d4] rounded-full transition-all duration-500"
                          style={{ width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                  </button>
                )
              })}
            </div>
          )}
        </section>

        <div className="lg:col-span-4 flex flex-col gap-4 min-h-0">
          <section className="bg-white rounded-2xl shadow-sm border border-[#a9ded6] p-5 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-sm font-semibold text-[#134e4a]">Acceso rápido</h2>
              <Zap size={15} className="text-slate-300" />
            </div>
            <div className="space-y-2.5">
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

          {showReports && (
            <section className="bg-white rounded-2xl shadow-sm border border-[#a9ded6] p-5 flex flex-col min-h-0 flex-1">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="font-serif text-sm font-semibold text-[#134e4a]">Reportes recientes</h2>
                <button
                  onClick={() => navigate('/reports')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
                >
                  Ver todos
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto min-h-0">
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
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, caption, iconBg, cardBg, onClick }: {
  icon: React.ReactNode
  label: string
  value: number
  caption?: string
  iconBg: string
  cardBg: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-[#a9ded6] ${cardBg} p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl ${iconBg} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}>
          {icon}
        </div>
        <ArrowRight size={16} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-slate-400 transition-all duration-200" />
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-600">{label}</p>
      {caption && <p className="text-[11px] text-slate-400 mt-0.5">{caption}</p>}
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

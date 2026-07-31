import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usersApi, listsApi, reportsApi } from '../services/api'
import { Users, FileText, Table2, BarChart3, Plus, Download, ArrowRight, ChevronRight, FileSpreadsheet } from 'lucide-react'
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

  const role = user?.role || 'medico'
  const canManageUsers = role === 'admin'
  const canManageLists = role === 'admin' || role === 'direccion'
  const canReports = role === 'admin' || role === 'direccion' || role === 'direccion_medica'

  useEffect(() => {
    async function load() {
      try {
        const [listsRes, reportsRes] = await Promise.all([
          listsApi.list(),
          canReports ? reportsApi.list() : Promise.resolve({ data: [] }),
        ])
        const lists: ListDefinition[] = listsRes.data
        const reports: Report[] = reportsRes.data

        let totalRecords = 0
        for (const list of lists.slice(0, 5)) {
          try {
            const recordsRes = await listsApi.getRecords(list.id, { limit: 0 })
            totalRecords += recordsRes.data.length
          } catch {}
        }

        let usersCount: number | undefined
        if (canManageUsers) {
          try {
            const usersRes = await usersApi.list()
            usersCount = usersRes.data.length
          } catch {}
        }

        setStats({
          users: usersCount,
          lists: lists.length,
          records: totalRecords,
          reports: reports.length,
        })
        setRecentLists(lists.slice(0, 4))
        setRecentReports(reports.slice(0, 3))
      } catch {}
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const hoy = new Date().toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const showReports = canReports && recentReports.length > 0

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <RoleAvatar role={role} size="md" />
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">Hola, {user?.full_name}</h1>
            <p className="text-xs text-slate-500 capitalize truncate">{hoy} · Panel de {roleLabels[role]}</p>
          </div>
        </div>
        <span className="shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sesión activa
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        {canManageUsers && (
          <StatCard
            icon={<Users size={20} />}
            label="Usuarios"
            value={stats.users ?? 0}
            iconBg="bg-sky-500"
            cardBg="from-sky-50 to-white"
            onClick={() => navigate('/users')}
          />
        )}
        <StatCard
          icon={<Table2 size={20} />}
          label="Listas"
          value={stats.lists}
          iconBg="bg-violet-500"
          cardBg="from-violet-50 to-white"
          onClick={() => navigate('/lists')}
        />
        <StatCard
          icon={<BarChart3 size={20} />}
          label="Registros"
          value={stats.records}
          iconBg="bg-emerald-500"
          cardBg="from-emerald-50 to-white"
          onClick={() => navigate('/lists')}
        />
        {canReports && (
          <StatCard
            icon={<FileText size={20} />}
            label="Reportes"
            value={stats.reports}
            iconBg="bg-amber-500"
            cardBg="from-amber-50 to-white"
            onClick={() => navigate('/reports')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <section className="lg:col-span-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-sm font-semibold text-slate-900">Acciones rápidas</h2>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Atajos</span>
          </div>
          <div className="space-y-2.5 overflow-y-auto min-h-0">
            <QuickAction
              icon={<Table2 size={16} />}
              label="Ver listas"
              hint="Explora las listas del sistema"
              color="bg-violet-500"
              onClick={() => navigate('/lists')}
            />
            {canManageLists && (
              <QuickAction
                icon={<Plus size={16} />}
                label="Nueva lista"
                hint="Crea una lista personalizada"
                color="bg-slate-600"
                onClick={() => navigate('/lists')}
              />
            )}
            {role === 'medico' && (
              <QuickAction
                icon={<Download size={16} />}
                label="Exportar lista a Excel"
                hint="Descarga los registros en Excel"
                color="bg-emerald-500"
                onClick={() => navigate('/lists')}
              />
            )}
            {canReports && (
              <QuickAction
                icon={<FileText size={16} />}
                label="Nuevo reporte"
                hint="Por especialidad o por fecha"
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

        <section className={`${showReports ? 'lg:col-span-5' : 'lg:col-span-9'} bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-0`}>
          <div className="flex items-center justify-between mb-4 shrink-0">
            <h2 className="text-sm font-semibold text-slate-900">Listas recientes</h2>
            <button
              onClick={() => navigate('/lists')}
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
            >
              Ver todas
              <ArrowRight size={13} />
            </button>
          </div>
          {recentLists.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Table2 size={28} className="text-slate-200" />
              <p className="text-slate-500 text-sm mt-3">No hay listas aún</p>
            </div>
          ) : (
            <div className="space-y-2 overflow-y-auto min-h-0">
              {recentLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/70 text-left transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-100 to-violet-200 flex items-center justify-center text-violet-600 group-hover:scale-105 transition-transform duration-200 shrink-0">
                    <Table2 size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{list.name}</p>
                    {list.description && (
                      <p className="text-xs text-slate-400 truncate">{list.description}</p>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 shrink-0">
                    {list.columns_config?.length || 0} columnas
                  </span>
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </section>

        {showReports && (
          <section className="lg:col-span-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-4 shrink-0">
              <h2 className="text-sm font-semibold text-slate-900">Reportes recientes</h2>
              <button
                onClick={() => navigate('/reports')}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors duration-200"
              >
                Ver todos
                <ArrowRight size={13} />
              </button>
            </div>
            <div className="space-y-2 overflow-y-auto min-h-0">
              {recentReports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => navigate('/reports')}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 text-left transition-all duration-200 group"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                    <FileSpreadsheet size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{report.name}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {report.filters?.especialidad && (
                        <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-medium border border-emerald-200">
                          {report.filters.especialidad}
                        </span>
                      )}
                      {(report.filters?.fecha_inicio || report.filters?.fecha_fin) && (
                        <span className="px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded text-[9px] font-medium border border-sky-200">
                          {report.filters.fecha_inicio || '...'} → {report.filters.fecha_fin || '...'}
                        </span>
                      )}
                      {!report.filters?.especialidad && !report.filters?.fecha_inicio && !report.filters?.fecha_fin && (
                        <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded text-[9px] font-medium border border-slate-200">
                          General
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={15} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, iconBg, cardBg, onClick }: {
  icon: React.ReactNode
  label: string
  value: number
  iconBg: string
  cardBg: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${cardBg} p-4 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
    >
      <div className={`w-10 h-10 rounded-lg ${iconBg} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
      <ArrowRight size={15} className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-slate-400 transition-all duration-200" />
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
      className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-200 group text-left"
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

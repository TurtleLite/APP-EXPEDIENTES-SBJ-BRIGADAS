import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { usersApi, listsApi, reportsApi } from '../services/api'
import { Users, FileText, Table2, BarChart3, Plus, Download, Activity } from 'lucide-react'
import type { User, ListDefinition, Report } from '../types'

interface Stats {
  users?: number
  lists: number
  records: number
  reports: number
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({ lists: 0, records: 0, reports: 0 })
  const [loading, setLoading] = useState(true)
  const [recentLists, setRecentLists] = useState<ListDefinition[]>([])
  const [recentReports, setRecentReports] = useState<Report[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [listsRes, reportsRes] = await Promise.all([
          listsApi.list(),
          reportsApi.list(),
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
        if (user?.role === 'admin' || user?.role === 'direccion') {
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
        setRecentReports(reports.slice(0, 4))
      } catch {}
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenido, {user?.full_name}
        </h1>
        <p className="text-gray-500 mt-1">Panel de {user?.role === 'admin' ? 'Administrador' : user?.role === 'direccion' ? 'Dirección' : 'Médico'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {(user?.role === 'admin' || user?.role === 'direccion') && (
          <StatCard
            icon={<Users size={24} />}
            label="Usuarios"
            value={stats.users ?? 0}
            color="bg-purple-500"
          />
        )}
        <StatCard
          icon={<Table2 size={24} />}
          label="Listas"
          value={stats.lists}
          color="bg-blue-500"
        />
        <StatCard
          icon={<Activity size={24} />}
          label="Registros"
          value={stats.records}
          color="bg-green-500"
        />
        <StatCard
          icon={<BarChart3 size={24} />}
          label="Reportes"
          value={stats.reports}
          color="bg-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="space-y-3">
            <QuickAction
              icon={<Table2 size={18} />}
              label="Ver listas"
              onClick={() => navigate('/lists')}
            />
            {(user?.role === 'admin' || user?.role === 'direccion') && (
              <QuickAction
                icon={<Plus size={18} />}
                label="Nueva lista"
                onClick={() => navigate('/lists')}
              />
            )}
            {user?.role === 'medico' && (
              <QuickAction
                icon={<Download size={18} />}
                label="Exportar lista a Excel"
                onClick={() => navigate('/lists')}
              />
            )}
            {(user?.role === 'admin' || user?.role === 'direccion') && (
              <QuickAction
                icon={<FileText size={18} />}
                label="Nuevo reporte"
                onClick={() => navigate('/reports')}
              />
            )}
            {(user?.role === 'admin' || user?.role === 'direccion') && (
              <QuickAction
                icon={<Users size={18} />}
                label="Gestionar usuarios"
                onClick={() => navigate('/users')}
              />
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Listas recientes</h2>
          {recentLists.length === 0 ? (
            <p className="text-gray-500 text-sm">No hay listas aún</p>
          ) : (
            <div className="space-y-3">
              {recentLists.map((list) => (
                <button
                  key={list.id}
                  onClick={() => navigate(`/lists/${list.id}`)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Table2 size={16} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{list.name}</p>
                    {list.description && (
                      <p className="text-xs text-gray-500 truncate">{list.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {list.columns_config?.length || 0} cols
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-white`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600">
        {icon}
      </div>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </button>
  )
}

import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { listsApi } from '../services/api'
import {
  Users, FileText, Table2, Lock,
  UserCircle2, Activity,
} from 'lucide-react'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  direccion: 'Dirección',
  direccion_medica: 'Dirección Médica',
  medico: 'Médico',
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [systemListId, setSystemListId] = useState<string | null>(null)
  const [denied, setDenied] = useState<string | null>(null)

  useEffect(() => {
    listsApi.list()
      .then((res) => {
        const system = res.data.find((l: any) => l.is_system)
        if (system) setSystemListId(system.id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!denied) return
    const t = setTimeout(() => setDenied(null), 3500)
    return () => clearTimeout(t)
  }, [denied])

  const role = user?.role || 'medico'
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

  const options: { label: string; icon: React.ReactNode; color: string; allowed: boolean; onClick: () => void }[] = [
    {
      label: 'Mi Perfil',
      icon: <UserCircle2 size={22} />,
      color: 'bg-sky-500',
      allowed: true,
      onClick: () => navigate('/perfil'),
    },
    {
      label: 'Usuarios',
      icon: <Users size={22} />,
      color: 'bg-slate-600',
      allowed: role === 'admin',
      onClick: () => navigate('/users'),
    },
    {
      label: 'Expedientes',
      icon: <Table2 size={22} />,
      color: 'bg-violet-500',
      allowed: true,
      onClick: goExpedientes,
    },
    {
      label: 'Reportes',
      icon: <FileText size={22} />,
      color: 'bg-amber-500',
      allowed: canReports,
      onClick: () => navigate('/reports'),
    },
    {
      label: 'Estatus Cirugía',
      icon: <Activity size={22} />,
      color: 'bg-rose-500',
      allowed: role === 'admin' || role === 'direccion',
      onClick: () => navigate('/estado-cirugia'),
    },
  ]

  const hoy = new Date().toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="h-full flex flex-col min-h-0">
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

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-3 mt-7 min-h-0">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => (opt.allowed ? opt.onClick() : setDenied(opt.label))}
            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-2xl bg-white border border-slate-100 hover:border-[#a9ded6] hover:shadow-md transition-all duration-200 group"
          >
            <div className={`w-10 h-10 rounded-xl ${opt.color} text-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200`}>
              {opt.icon}
            </div>
            <span className="text-base font-semibold text-slate-700">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

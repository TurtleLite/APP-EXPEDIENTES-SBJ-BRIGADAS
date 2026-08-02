import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { listsApi } from '../services/api'
import {
  UserCircle2, Users, Table2, FileText, Activity, ArrowRight, BarChart3,
} from 'lucide-react'
import type { ListDefinition } from '../types'
import { RoleAvatar } from '../components/RoleAvatar'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  direccion: 'Dirección',
  direccion_medica: 'Dirección Médica',
  medico: 'Médico',
}

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<{ lists: number; records: number }>({ lists: 0, records: 0 })
  const [systemListId, setSystemListId] = useState<string | null>(null)

  const role = user?.role || 'medico'

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
        const listsRes = await listsApi.list()
        const lists: ListDefinition[] = listsRes.data

        const system = lists.find((l) => l.is_system)
        if (system) setSystemListId(system.id)

        const countsRes = await Promise.all(
          lists.map((list) =>
            listsApi.getRecordsCount(list.id)
              .then((res) => res.data.count || 0)
              .catch(() => 0)
          )
        )
        setStats({
          lists: lists.length,
          records: countsRes.reduce((a, b) => a + b, 0),
        })
      } catch {}
    }
    load()
  }, [user])

  const hoy = new Date().toLocaleDateString('es-HN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  const options: { label: string; hint: string; icon: React.ReactNode; color: string; onClick: () => void }[] = [
    {
      label: 'Mi Perfil',
      hint: 'Datos personales y contraseña',
      icon: <UserCircle2 size={22} />,
      color: 'bg-sky-500',
      onClick: () => navigate('/perfil'),
    },
    ...(role === 'admin' ? [{
      label: 'Usuarios',
      hint: 'Administra cuentas y roles',
      icon: <Users size={22} />,
      color: 'bg-slate-600',
      onClick: () => navigate('/users'),
    }] : []),
    {
      label: 'Expedientes',
      hint: 'Banco de pacientes',
      icon: <Table2 size={22} />,
      color: 'bg-violet-500',
      onClick: goExpedientes,
    },
    ...(role === 'admin' || role === 'direccion' || role === 'direccion_medica' ? [{
      label: 'Reportes',
      hint: 'Crea y descarga reportes',
      icon: <FileText size={22} />,
      color: 'bg-amber-500',
      onClick: () => navigate('/reports'),
    }] : []),
    ...(role === 'admin' || role === 'direccion' ? [{
      label: 'Estatus Cirugía',
      hint: 'Asigna el estatus de cirugía',
      icon: <Activity size={22} />,
      color: 'bg-rose-500',
      onClick: () => navigate('/estado-cirugia'),
    }] : []),
  ]

  return (
    <div className="h-full flex flex-col gap-5 min-h-0">
      <div className="flex items-center justify-between gap-4 shrink-0">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 capitalize">{greeting} · {hoy}</p>
          <h1 className="font-serif text-2xl font-bold text-[#134e4a] truncate">Hola, {user?.full_name}</h1>
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

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-1 content-center min-h-0">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={opt.onClick}
            className="group relative overflow-hidden bg-white rounded-2xl border border-[#a9ded6] p-5 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={`w-12 h-12 rounded-xl ${opt.color} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-200`}>
              {opt.icon}
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">{opt.label}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{opt.hint}</p>
            <ArrowRight size={16} className="absolute top-4 right-4 text-slate-300 opacity-0 group-hover:opacity-100 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all duration-200" />
          </button>
        ))}
      </div>
    </div>
  )
}

import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Table2, LogOut, Shield, Activity,
} from 'lucide-react'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  direccion: 'Dirección',
  medico: 'Médico',
}

const roleColors: Record<string, string> = {
  admin: 'bg-slate-100 text-slate-700 border-slate-200',
  direccion: 'bg-slate-100 text-slate-700 border-slate-200',
  medico: 'bg-slate-100 text-slate-700 border-slate-200',
}

interface NavItem {
  label: string
  path: string
  icon: ReactNode
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'direccion', 'medico'] },
  { label: 'Usuarios', path: '/users', icon: <Users size={18} />, roles: ['admin'] },
  { label: 'Listas', path: '/lists', icon: <Table2 size={18} />, roles: ['admin', 'direccion', 'medico'] },
  { label: 'Reportes', path: '/reports', icon: <FileText size={18} />, roles: ['admin', 'direccion'] },
  { label: 'Estatus Cirugía', path: '/estado-cirugia', icon: <Activity size={18} />, roles: ['admin', 'direccion'] },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || ''))

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex overflow-hidden">
      <aside className="w-48 bg-gradient-to-b from-slate-100 to-slate-200 flex flex-col shrink-0 h-screen sticky top-0 shadow-xl">
        <div className="p-5 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-slate-500/20">
              SBJ
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">APP EXPEDIENTES</h1>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">SBJ Brigadas</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                  isActive
                    ? 'bg-white/40 text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-500 rounded-full shadow-lg shadow-slate-500/50" />}
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-200/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-slate-500/20 transition-transform duration-200 hover:scale-110">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {(() => {
                  const parts = user?.full_name?.split(' ') || []
                  const first = parts[0] || ''
                  const last = parts[2] || ''
                  return [first, last]
                    .filter(Boolean)
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' ')
                })()}
              </p>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${roleColors[user?.role || '']}`}>
                {roleLabels[user?.role || '']}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-400 hover:bg-white/40 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-6 py-2 flex items-center shadow-sm">
          <div className="flex-1 flex items-center justify-center gap-4">
            <img src="/logo_sbj.png" alt="Logo" className="w-[50px] h-auto" />
            <span className="font-bold text-base text-slate-800">Centro Médico San Benito José</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border shadow-sm ${roleColors[user?.role || '']}`}>
              {roleLabels[user?.role || '']}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 flex flex-col overflow-y-auto min-h-0 relative">
          {children}
          <div className="fixed bottom-2 right-6 text-[10px] font-semibold text-slate-300 tracking-[0.2em] select-none pointer-events-none z-0">
            TURTLELITE
          </div>
        </main>
      </div>
    </div>
  )
}

import { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, FileText, Table2, LogOut, Activity, UserCircle2,
} from 'lucide-react'
import { ROLE_META } from '../constants'
import { RoleAvatar } from './RoleAvatar'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  direccion: 'Dirección',
  direccion_medica: 'Dirección Médica',
  medico: 'Médico',
}

interface NavItem {
  label: string
  path: string
  icon: ReactNode
  roles: string[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard size={18} />, roles: ['admin', 'direccion', 'direccion_medica', 'medico'] },
  { label: 'Mi Perfil', path: '/perfil', icon: <UserCircle2 size={18} />, roles: ['admin', 'direccion', 'direccion_medica', 'medico'] },
  { label: 'Usuarios', path: '/users', icon: <Users size={18} />, roles: ['admin'] },
  { label: 'Listas', path: '/lists', icon: <Table2 size={18} />, roles: ['admin', 'direccion', 'direccion_medica', 'medico'] },
  { label: 'Reportes', path: '/reports', icon: <FileText size={18} />, roles: ['admin', 'direccion', 'direccion_medica'] },
  { label: 'Estatus Cirugía', path: '/estado-cirugia', icon: <Activity size={18} />, roles: ['admin', 'direccion'] },
]

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const filteredNav = navItems.filter(item => item.roles.includes(user?.role || ''))

  return (
    <div className="h-screen bg-[#f7f5f0] flex overflow-hidden">
      <aside className="w-48 bg-white flex flex-col shrink-0 h-screen sticky top-0 shadow-lg">
        <div className="p-5 border-b border-[#e8e3da] text-center">
          <h1 className="text-sm font-bold text-[#1c1c1c] mb-3 tracking-wide">EXPEDIENTES SBJ</h1>
          <img src="/logo_sbj.png" alt="Logo SBJ Cirugias" className="w-28 h-auto mx-auto" />
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {filteredNav.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 relative ${
                  isActive
                    ? 'bg-[#f4f1ec] text-[#1c1c1c]'
                    : 'text-[#6f6a61] hover:text-[#1c1c1c] hover:bg-[#f7f5f0]'
                }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#d9a441] rounded-full" />}
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            )
          })}
        </nav>
        <div className="p-4 border-t border-[#e8e3da]">
          <button
            onClick={() => navigate('/perfil')}
            className="w-full flex items-center gap-3 mb-3 text-left group"
          >
            <div className="transition-transform duration-200 group-hover:scale-110">
              <RoleAvatar role={user?.role} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#1c1c1c] truncate">
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
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium border ${ROLE_META[user?.role || '']?.badge || ''}`}>
                {roleLabels[user?.role || '']}
              </span>
            </div>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#6f6a61] hover:text-red-500 hover:bg-[#f7f5f0] rounded-lg transition-colors duration-200"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-[#e8e3da] px-12 py-1 flex items-center">
          <div className="flex-1 flex items-center justify-center gap-4">
            <img src="/logo_sbj.png" alt="Logo" className="w-12 h-auto" />
            <span className="font-serif font-bold text-base text-[#1c1c1c]">Centro Médico San Benito José</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${ROLE_META[user?.role || '']?.badge || ''}`}>
              {roleLabels[user?.role || '']}
            </span>
          </div>
        </header>
        <main className="flex-1 p-6 flex flex-col overflow-y-auto min-h-0 relative">
          <div className="flex-1">{children}</div>
          <footer className="pt-6 mt-6 text-center text-xs text-[#9a948a] border-t border-[#e8e3da]">
            © {new Date().getFullYear()} TurtleLite · Centro Médico San Benito José
          </footer>
        </main>
      </div>
    </div>
  )
}

import { ShieldCheck, Building2, Stethoscope, HeartPulse, UserCircle2 } from 'lucide-react'
import { ROLE_META } from '../constants'

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <ShieldCheck />,
  direccion: <Building2 />,
  direccion_medica: <Stethoscope />,
  medico: <HeartPulse />,
}

const SIZES = {
  sm: 'w-8 h-8 text-[11px] rounded-lg',
  md: 'w-11 h-11 text-sm rounded-xl',
  lg: 'w-16 h-16 text-2xl rounded-2xl',
}

export function RoleAvatar({ role, size = 'md' }: { role?: string; size?: 'sm' | 'md' | 'lg' }) {
  const meta = ROLE_META[role || ''] || ROLE_META.medico
  return (
    <div className={`bg-gradient-to-br ${meta.gradient} text-white flex items-center justify-center shadow-md shrink-0 ${SIZES[size]}`}>
      {ROLE_ICONS[role || ''] || <UserCircle2 />}
    </div>
  )
}

export interface RoleMeta {
  label: string
  badge: string
  gradient: string
  permissions: string[]
}

export const ROLE_META: Record<string, RoleMeta> = {
  admin: {
    label: 'Administrador',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    gradient: 'from-slate-700 to-slate-900',
    permissions: [
      'Acceso total al sistema',
      'Gestionar usuarios y roles',
      'Crear, editar y eliminar listas y expedientes',
      'Reportes general, por especialidad y por estatus de cirugía',
    ],
  },
  direccion: {
    label: 'Dirección',
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    gradient: 'from-sky-500 to-sky-700',
    permissions: [
      'Asignar y editar el estatus de cirugía',
      'Reporte por estatus de cirugía',
      'Reporte general y reporte por especialidad',
    ],
  },
  direccion_medica: {
    label: 'Dirección Médica',
    badge: 'bg-violet-100 text-violet-700 border-violet-200',
    gradient: 'from-violet-500 to-violet-700',
    permissions: [
      'Crear, editar y eliminar expedientes',
      'Reporte general y reporte por especialidad',
    ],
  },
  medico: {
    label: 'Médico',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    gradient: 'from-emerald-500 to-emerald-700',
    permissions: [
      'Crear y editar sus propios expedientes',
      'Exportar listas a Excel',
    ],
  },
}

export const roleLabel = (role?: string) => ROLE_META[role || '']?.label || 'Usuario'

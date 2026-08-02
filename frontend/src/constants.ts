export interface RoleMeta {
  label: string
  badge: string
  gradient: string
  permissions: string[]
}

export const ROLE_META: Record<string, RoleMeta> = {
  admin: {
    label: 'Administrador',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    gradient: 'from-[#6E7B91] to-[#5F6B80]',
    permissions: [
      'Acceso total al sistema',
      'Gestionar usuarios y roles',
      'Crear, editar y eliminar listas y expedientes',
      'Reportes general, por especialidad y por estatus de cirugía',
    ],
  },
  direccion: {
    label: 'Dirección',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    gradient: 'from-[#6E7B91] to-[#5F6B80]',
    permissions: [
      'Ver expedientes y listas (solo lectura)',
      'Asignar y editar el estatus de cirugía',
      'Reporte por estatus de cirugía',
      'Reporte general y reporte por especialidad',
    ],
  },
  direccion_medica: {
    label: 'Dirección Médica',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    gradient: 'from-[#6E7B91] to-[#5F6B80]',
    permissions: [
      'Crear, editar y eliminar expedientes',
      'Crear reportes generales y por especialidad',
      'Generar reportes en Excel y PDF',
    ],
  },
  medico: {
    label: 'Médico',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    gradient: 'from-[#6E7B91] to-[#5F6B80]',
    permissions: [
      'Crear y editar sus propios expedientes',
      'Exportar listas a Excel',
    ],
  },
}

export const roleLabel = (role?: string) => ROLE_META[role || '']?.label || 'Usuario'

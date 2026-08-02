export interface RoleMeta {
  label: string
  badge: string
  gradient: string
  permissions: string[]
}

export const ROLE_META: Record<string, RoleMeta> = {
  admin: {
    label: 'Administrador',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gradient: 'from-[#9B94C9] to-[#8A82BC]',
    permissions: [
      'Acceso total al sistema',
      'Gestionar usuarios y roles',
      'Crear, editar y eliminar listas y expedientes',
      'Reportes general, por especialidad y por estatus de cirugía',
    ],
  },
  direccion: {
    label: 'Dirección',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gradient: 'from-[#9B94C9] to-[#8A82BC]',
    permissions: [
      'Ver expedientes y listas (solo lectura)',
      'Asignar y editar el estatus de cirugía',
      'Reporte por estatus de cirugía',
      'Reporte general y reporte por especialidad',
    ],
  },
  direccion_medica: {
    label: 'Dirección Médica',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gradient: 'from-[#9B94C9] to-[#8A82BC]',
    permissions: [
      'Crear, editar y eliminar expedientes',
      'Crear reportes generales y por especialidad',
      'Generar reportes en Excel y PDF',
    ],
  },
  medico: {
    label: 'Médico',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    gradient: 'from-[#9B94C9] to-[#8A82BC]',
    permissions: [
      'Crear y editar sus propios expedientes',
      'Exportar listas a Excel',
    ],
  },
}

export const roleLabel = (role?: string) => ROLE_META[role || '']?.label || 'Usuario'

import { useState } from 'react'
import { listsApi } from '../services/api'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Stethoscope, User, Home, FileText, Activity, ClipboardList, FlaskConical, Syringe, UserCircle } from 'lucide-react'

interface ColumnDef {
  key: string
  label: string
  type: string
}

interface Section {
  title: string
  icon: React.ReactNode
  fields: ColumnDef[]
}

const SECTIONS: Section[] = [
  {
    title: 'Centro y Clasificación',
    icon: <Stethoscope size={18} />,
    fields: [
      { key: 'centro_medico', label: 'Centro Médico', type: 'text' },
      { key: 'especialidad', label: 'Especialidad', type: 'text' },
      { key: 'criticidad', label: 'Criticidad Clínica', type: 'text' },
      { key: 'estatus', label: 'Estatus del Paciente', type: 'text' },
    ],
  },
  {
    title: 'Datos Personales',
    icon: <User size={18} />,
    fields: [
      { key: 'nombre', label: 'Nombre / First Name', type: 'text' },
      { key: 'apellido', label: 'Apellido / Last Name', type: 'text' },
      { key: 'sexo', label: 'Sexo / Sex', type: 'text' },
      { key: 'edad', label: 'Age / Edad', type: 'number' },
      { key: 'fecha_elaboracion', label: 'Fecha de Elaboración', type: 'date' },
      { key: 'identidad', label: 'Nº Identidad', type: 'text' },
      { key: 'persona_responsable', label: 'Persona Responsable', type: 'text' },
      { key: 'procedencia', label: 'Procedencia', type: 'text' },
      { key: 'albergue', label: 'Albergue', type: 'text' },
      { key: 'perfil', label: 'Perfil', type: 'text' },
      { key: 'telefono', label: 'Teléfono', type: 'text' },
      { key: 'expediente', label: 'Expediente', type: 'text' },
    ],
  },
  {
    title: 'Domicilio',
    icon: <Home size={18} />,
    fields: [
      { key: 'domicilio', label: 'Domicilio del Paciente', type: 'text' },
    ],
  },
  {
    title: 'Historia de Enfermedad Actual',
    icon: <FileText size={18} />,
    fields: [
      { key: 'historia_enfermedad', label: 'Historia de Enfermedad Actual', type: 'text' },
    ],
  },
  {
    title: 'Antecedentes Médicos',
    icon: <ClipboardList size={18} />,
    fields: [
      { key: 'enfermedades_previas', label: 'Enfermedades Anteriores', type: 'text' },
      { key: 'cirugias_previas', label: 'Cirugías Anteriores', type: 'text' },
      { key: 'alergias', label: 'Alergias', type: 'text' },
      { key: 'otros_antecedentes', label: 'Otros Antecedentes', type: 'text' },
    ],
  },
  {
    title: 'Signos Vitales',
    icon: <Activity size={18} />,
    fields: [
      { key: 'presion_arterial', label: 'P.A. / B.P.', type: 'text' },
      { key: 'fc', label: 'F.C.', type: 'text' },
      { key: 'pulso', label: 'Pulso', type: 'text' },
      { key: 'temperatura', label: 'T°', type: 'text' },
      { key: 'fr', label: 'F.R.', type: 'text' },
      { key: 'peso', label: 'Peso / Weight', type: 'text' },
      { key: 'talla', label: 'Talla', type: 'text' },
      { key: 'bmi', label: 'B.M.I.', type: 'text' },
    ],
  },
  {
    title: 'Examen Físico',
    icon: <FlaskConical size={18} />,
    fields: [
      { key: 'examen_fisico', label: 'Examen Físico', type: 'text' },
    ],
  },
  {
    title: 'Diagnóstico',
    icon: <Syringe size={18} />,
    fields: [
      { key: 'diagnostico', label: 'Diagnóstico', type: 'text' },
    ],
  },
  {
    title: 'Médico y Cirugía',
    icon: <UserCircle size={18} />,
    fields: [
      { key: 'nombre_medico', label: 'Nombre del Médico', type: 'text' },
      { key: 'cirujano', label: 'Cirujano', type: 'text' },
      { key: 'fecha_cirugia', label: 'Fecha de Cirugía', type: 'date' },
    ],
  },
]

function isSectionComplete(section: Section, data: Record<string, any>): boolean {
  return section.fields.every((f) => {
    const val = data[f.key]
    return val !== undefined && val !== null && String(val).trim() !== ''
  })
}

function totalFieldsFrom(sections: Section[]): number {
  return sections.reduce((acc, s) => acc + s.fields.length, 0)
}

function filledFields(data: Record<string, any>): number {
  return Object.values(data).filter((v) => v !== undefined && v !== null && String(v).trim() !== '').length
}

interface Props {
  listId: number
  role?: string
  onClose: () => void
  onSaved: () => void
}

function filterSections(role?: string): Section[] {
  if (role === 'medico') {
    return SECTIONS.filter((s) => s.title !== 'Centro y Clasificación').map((s) => {
      if (s.title === 'Médico y Cirugía') {
        return { ...s, fields: s.fields.filter((f) => f.key === 'nombre_medico') }
      }
      return s
    })
  }
  return SECTIONS
}

export function ExpedienteForm({ listId, role, onClose, onSaved }: Props) {
  const sections = filterSections(role)
  const [data, setData] = useState<Record<string, any>>({})
  const [expanded, setExpanded] = useState<string>(sections.length > 0 ? sections[0].title : '')
  const [saving, setSaving] = useState(false)

  const allComplete = sections.every((s) => isSectionComplete(s, data))

  const setValue = (key: string, value: any) => {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const toggleSection = (title: string) => {
    setExpanded((prev) => (prev === title ? '' : title))
  }

  const handleSubmit = async () => {
    if (!allComplete) return
    setSaving(true)
    try {
      await listsApi.createRecord(listId, { data })
      onSaved()
      onClose()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al guardar el expediente')
    } finally {
      setSaving(false)
    }
  }

  const total = totalFieldsFrom(sections)
  const filled = filledFields(data)
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nuevo Expediente Médico</h2>
            <p className="text-sm text-gray-500 mt-1">Complete todas las secciones para crear el registro</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            ✕
          </button>
        </div>

        <div className="px-6 pt-4 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600 min-w-[4rem] text-right">
              {filled}/{total}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {sections.map((s) => {
              const done = isSectionComplete(s, data)
              return (
                <span
                  key={s.title}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    done ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  {s.title}
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3">
          {sections.map((section) => {
            const done = isSectionComplete(section, data)
            const isOpen = expanded === section.title
            return (
              <div key={section.title} className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    done ? 'bg-green-50' : 'bg-gray-50'
                  } hover:brightness-95`}
                >
                  <span className={done ? 'text-green-600' : 'text-gray-400'}>
                    {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </span>
                  <span className="text-gray-500">{section.icon}</span>
                  <span className={`flex-1 font-medium text-sm ${done ? 'text-green-800' : 'text-gray-700'}`}>
                    {section.title}
                  </span>
                  <span className="text-xs text-gray-400">
                    {section.fields.filter((f) => {
                      const v = data[f.key]
                      return v !== undefined && v !== null && String(v).trim() !== ''
                    }).length}/{section.fields.length}
                  </span>
                  {isOpen ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>
                {isOpen && (
                  <div className="px-4 py-3 space-y-3 bg-white">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                        </label>
                        {field.type === 'date' ? (
                          <input
                            type="date"
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            value={data[field.key] ?? ''}
                            onChange={(e) => setValue(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <textarea
                            rows={field.key === 'domicilio' || field.key === 'historia_enfermedad' || field.key === 'examen_fisico' || field.key === 'diagnostico' ? 3 : 1}
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="p-6 border-t border-gray-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allComplete || saving}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              allComplete && !saving
                ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {saving ? 'Guardando...' : allComplete ? 'Crear Expediente' : `Complete todas las secciones`}
          </button>
        </div>
      </div>
    </div>
  )
}
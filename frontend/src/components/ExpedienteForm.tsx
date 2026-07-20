import { useState, useEffect } from 'react'
import { listsApi } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, Stethoscope, User, Home, FileText, Activity, ClipboardList, FlaskConical, Syringe, UserCircle } from 'lucide-react'

interface ColumnDef {
  key: string
  label: string
  type: string
  optional?: boolean
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
      { key: 'especialidad', label: 'Especialidad', type: 'text' },
      { key: 'criticidad', label: 'Criticidad Clínica', type: 'text' },
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
      { key: 'albergue', label: 'Albergue', type: 'text' },
      { key: 'perfil', label: 'Perfil', type: 'text' },
      { key: 'telefono', label: 'Teléfono', type: 'text' },
      { key: 'telefono2', label: 'Teléfono 2', type: 'text', optional: true },
      { key: 'telefono3', label: 'Teléfono 3', type: 'text', optional: true },
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
    ],
  },
]

function isSectionComplete(section: Section, data: Record<string, any>): boolean {
  return section.fields.every((f) => {
    if (f.optional) return true
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
        return { ...s, fields: s.fields.filter((f) => ['nombre_medico'].includes(f.key)) }
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
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const { toast } = useNotification()

  useEffect(() => {
    listsApi.getEspecialidades(listId).then((res) => {
      if (Array.isArray(res.data)) setEspecialidades(res.data)
    }).catch(() => {})
  }, [listId])

  const allComplete = sections.every((s) => isSectionComplete(s, data))

  const setValue = (key: string, value: any) => {
    setData((prev) => {
      const next = { ...prev, [key]: value }
      if (key === 'perfil') next['estatus'] = value
      return next
    })
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
      toast(err.response?.data?.detail || 'Error al guardar el expediente', 'error')
    } finally {
      setSaving(false)
    }
  }

  const total = totalFieldsFrom(sections)
  const filled = filledFields(data)
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 rounded-xl w-[95vw] max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Nuevo Expediente Médico</h2>
            <p className="text-sm text-slate-500 mt-1">Complete todas las secciones para crear el registro</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
            ✕
          </button>
        </div>

        <div className="px-5 pt-2 shrink-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-slate-500 to-slate-600 rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-medium text-slate-600 min-w-[4rem] text-right">
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
                    done ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  {done ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                  {s.title}
                </span>
              )
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 h-0 px-5 pb-3 space-y-2">
          {sections.map((section) => {
            const done = isSectionComplete(section, data)
            const isOpen = expanded === section.title
            return (
              <div key={section.title} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    done ? 'bg-slate-50' : 'bg-slate-50'
                  } hover:brightness-95`}
                >
                  <span className={done ? 'text-slate-500' : 'text-slate-400'}>
                    {done ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                  </span>
                  <span className="text-slate-500">{section.icon}</span>
                  <span className={`flex-1 font-medium text-sm ${done ? 'text-slate-700' : 'text-slate-700'}`}>
                    {section.title}
                  </span>
                  <span className="text-xs text-slate-400">
                    {section.fields.filter((f) => {
                      const v = data[f.key]
                      return v !== undefined && v !== null && String(v).trim() !== ''
                    }).length}/{section.fields.length}
                  </span>
                  {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                </button>
                {isOpen && (
                  <div className="px-4 py-3 space-y-3 bg-white">
                    {section.fields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          {field.label}
                        </label>
                        {field.key === 'especialidad' ? (
                          <div className="relative">
                            <input
                              type="text"
                              list="especialidad-list"
                              value={data[field.key] || ''}
                              onChange={(e) => setValue(field.key, e.target.value.toUpperCase())}
                              placeholder="Escriba o seleccione una especialidad"
                              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                            />
                            <datalist id="especialidad-list">
                              {especialidades.map((esp) => (
                                <option key={esp} value={esp} />
                              ))}
                            </datalist>
                          </div>
                        ) : field.key === 'criticidad' ? (
                          <select
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          >
                            <option value="">Seleccione...</option>
                            <option value="baja">Baja</option>
                            <option value="media">Media</option>
                            <option value="alta">Alta</option>
                          </select>
                        ) : field.key === 'sexo' ? (
                          <select
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          >
                            <option value="">Seleccione...</option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                          </select>
                        ) : field.key === 'edad' ? (() => {
                          const edadStr = data.edad || ''
                          const edadParts = typeof edadStr === 'string' ? edadStr.match(/^(\d+)\s*([am])$/) : null
                          const edadNum = edadParts ? edadParts[1] : (typeof edadStr === 'string' ? edadStr : '')
                          const edadUnit = edadParts ? edadParts[2] : 'a'
                          return (
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={edadNum}
                                onChange={(e) => {
                                  const n = e.target.value
                                  setValue('edad', n === '' ? '' : `${n} ${edadUnit}`)
                                }}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                              />
                              <select
                                value={edadUnit}
                                onChange={(e) => {
                                  const u = e.target.value
                                  setValue('edad', edadNum === '' ? '' : `${edadNum} ${u}`)
                                }}
                                className="w-28 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                              >
                                <option value="a">Años</option>
                                <option value="m">Meses</option>
                              </select>
                            </div>
                          )
                        })() : field.key === 'perfil' ? (
                          <select
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          >
                            <option value="">Seleccione...</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                          </select>
                        ) : field.key === 'albergue' ? (
                          <select
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          >
                            <option value="">Seleccione...</option>
                            <option value="Si">Si</option>
                            <option value="No">No</option>
                          </select>
                        ) : field.key === 'estatus_cirugia' ? (
                          <select
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          >
                            <option value="">Seleccione...</option>
                            <option value="En espera">En espera</option>
                            <option value="Reprogramar">Reprogramar</option>
                            <option value="Cancelado">Cancelado</option>
                            <option value="Fuera de perfil San Benito">Fuera de perfil San Benito</option>
                            <option value="Operado">Operado</option>
                          </select>
                        ) : field.key === 'identidad' ? (
                          <input
                            type="text"
                            value={data[field.key] || ''}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 13)
                              let formatted = ''
                              if (digits.length > 0) formatted = digits.slice(0, 4)
                              if (digits.length > 4) formatted += '-' + digits.slice(4, 8)
                              if (digits.length > 8) formatted += '-' + digits.slice(8, 13)
                              setValue(field.key, formatted)
                            }}
                            placeholder="0000-0000-00000"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          />
                        ) : field.key.startsWith('telefono') ? (
                          <input
                            type="text"
                            value={data[field.key] || ''}
                            onChange={(e) => {
                              const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
                              let formatted = ''
                              if (digits.length > 0) formatted = digits.slice(0, 4)
                              if (digits.length > 4) formatted += '-' + digits.slice(4, 8)
                              setValue(field.key, formatted)
                            }}
                            placeholder="0000-0000"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          />
                        ) : field.key === 'presion_arterial' ? (
                          <input
                            type="text"
                            value={data[field.key] || ''}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[^0-9/]/g, '')
                              const parts = cleaned.split('/')
                              const left = (parts[0] || '').slice(0, 3)
                              const right = (parts[1] || '').slice(0, 3)
                              let formatted = left
                              if (right || cleaned.includes('/')) formatted += '/' + right
                              setValue(field.key, formatted)
                            }}
                            placeholder="000/000"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          />
                        ) : field.key === 'peso' ? (
                          <div className="relative">
                            <input
                              type="text"
                              value={(data[field.key] || '').replace(/\s*kg$/, '')}
                              onChange={(e) => setValue(field.key, e.target.value ? `${e.target.value} kg` : '')}
                              placeholder="0 kg"
                              className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">kg</span>
                          </div>
                        ) : field.key === 'talla' ? (
                          <div className="relative">
                            <input
                              type="text"
                              value={(data[field.key] || '').replace(/\s*mts$/, '')}
                              onChange={(e) => setValue(field.key, e.target.value ? `${e.target.value} mts` : '')}
                              placeholder="0.00 mts"
                              className="w-full px-3 py-2 pr-10 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">mts</span>
                          </div>
                        ) : field.key === 'nombre' || field.key === 'apellido' || field.key === 'persona_responsable' ? (
                          <textarea
                            rows={1}
                            value={data[field.key] || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              const titleCased = val.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                              setValue(field.key, titleCased)
                            }}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400 resize-none"
                          />
                        ) : field.key === 'domicilio' ? (
                          <textarea
                            rows={3}
                            value={data[field.key] || ''}
                            onChange={(e) => {
                              const val = e.target.value
                              const exceptions = new Set(['el','la','los','las','de','del','en','por','para','con','sin','a','y','e','o','u','un','una','unos','unas','que','como','entre','hasta','durante','sobre','tras','segun','ante','bajo','cabe','contra','desde','hacia','mediante','via','ni','mas','pero','sino','aunque'])
                              const titleCased = val.toLowerCase().replace(/\w+/g, (w, i) => 
                                i === 0 || !exceptions.has(w) ? w.charAt(0).toUpperCase() + w.slice(1) : w
                              )
                              setValue(field.key, titleCased)
                            }}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400 resize-none"
                          />
                        ) : field.type === 'date' ? (
                          <input
                            type="date"
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          />
                        ) : field.type === 'number' ? (
                          <input
                            type="number"
                            value={data[field.key] ?? ''}
                            onChange={(e) => setValue(field.key, e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400"
                          />
                        ) : (
                          <textarea
                            rows={field.key === 'domicilio' || field.key === 'historia_enfermedad' || field.key === 'examen_fisico' || field.key === 'diagnostico' ? 3 : 1}
                            value={data[field.key] || ''}
                            onChange={(e) => setValue(field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-slate-300 focus:border-slate-400 resize-none"
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

        <div className="px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allComplete || saving}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
              allComplete && !saving
                ? 'bg-slate-500 text-white hover:bg-slate-600 shadow-sm'
                : 'bg-slate-100 text-slate-300 cursor-not-allowed'
            }`}
          >
            {saving ? 'Guardando...' : allComplete ? 'Crear Expediente' : `Complete todas las secciones`}
          </button>
        </div>
      </div>
    </div>
  )
}
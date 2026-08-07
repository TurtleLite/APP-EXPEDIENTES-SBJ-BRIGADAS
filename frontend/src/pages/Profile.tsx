import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { ROLE_META } from '../constants'
import { RoleAvatar } from '../components/RoleAvatar'
import { PasswordInput } from '../components/PasswordInput'
import { formatPhone, isValidPhone } from '../utils/format'
import {
  KeyRound, ShieldCheck, CheckCircle2, AtSign, User,
} from 'lucide-react'

const capitalizeName = (value: string) =>
  value.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

const TITLE_RE = /^(Dr|Dra|Lic)\.?\s+(.*)$/i

const parseName = (fullName: string) => {
  const match = fullName.match(TITLE_RE)
  const name = (match ? match[2] : fullName).trim().split(/\s+/).filter(Boolean)
  const half = Math.ceil(name.length / 2)
  return {
    titulo: match ? `${match[1].charAt(0).toUpperCase() + match[1].slice(1)}.` : '',
    nombres: name.slice(0, half).join(' '),
    apellidos: name.slice(half).join(' '),
  }
}

const inputClass =
  'w-full px-3 py-2 border border-[#E3E6EB] rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200'
const labelClass =
  'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1'

const SectionTitle = ({ icon, title }: { icon: React.ReactNode; title: string }) => (
  <div className="flex items-center gap-2 text-slate-900">
    <span className="text-slate-400">{icon}</span>
    <h2 className="text-sm font-semibold uppercase tracking-wider">{title}</h2>
  </div>
)

export function Profile() {
  const { user, updateUser } = useAuth()
  const { toast } = useNotification()
  const [nameParts, setNameParts] = useState(() => parseName(user?.full_name || ''))
  const [telefono, setTelefono] = useState(() => formatPhone(user?.telefono || ''))
  const [password, setPassword] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null
  const meta = ROLE_META[user.role] || ROLE_META.medico

  const handleSave = async () => {
    const fullName = [nameParts.nombres, nameParts.apellidos].map((p) => (p || '').trim()).filter(Boolean).join(' ')
    if (!fullName || !telefono.trim()) {
      toast('El nombre y el teléfono son obligatorios', 'error')
      return
    }
    if (!isValidPhone(telefono)) {
      toast('El teléfono debe tener el formato 0000-0000', 'error')
      return
    }
    try {
      setSaving(true)
      const payload: any = {
        full_name: nameParts.titulo ? `${nameParts.titulo} ${fullName}` : fullName,
        telefono: telefono.trim(),
      }
      if (password) {
        if (!currentPassword) {
          toast('Ingresa tu contraseña actual para cambiarla', 'error')
          return
        }
        payload.password = password
        payload.current_password = currentPassword
      }
      const res = await usersApi.updateMe(payload)
      updateUser(res.data)
      setPassword('')
      setCurrentPassword('')
      toast('Perfil actualizado correctamente', 'success')
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al actualizar el perfil', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 min-h-0">
      <div className={`rounded-xl overflow-hidden bg-gradient-to-r ${meta.gradient} shadow-sm shrink-0`}>
        <div className="px-6 py-3.5 flex items-center gap-4">
          <RoleAvatar role={user.role} size="md" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate leading-tight">{user.full_name}</p>
            <div className="mt-1 flex items-center gap-2.5 text-xs text-white/80">
              <span className="font-medium">{meta.label}</span>
              <span className="text-white/40">·</span>
              <span>@{user.username}</span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-300' : 'bg-red-300'}`} />
                {user.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        <section className="bg-white rounded-xl shadow-sm border border-[#E3E6EB] p-5 flex flex-col lg:min-h-0">
          <SectionTitle icon={<User size={15} />} title="Datos personales" />
          <div className="mt-4 space-y-4">
            <div>
              <label className={labelClass}>Nombre y apellidos</label>
              <div className="flex gap-2.5">
                <select
                  value={nameParts.titulo}
                  onChange={(e) => setNameParts({ ...nameParts, titulo: e.target.value })}
                  className="w-20 shrink-0 px-2.5 py-2 border border-[#E3E6EB] rounded-lg text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                >
                  <option value="">Sin título</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Dra.">Dra.</option>
                  <option value="Lic.">Lic.</option>
                </select>
                <input
                  value={nameParts.nombres}
                  onChange={(e) => setNameParts({ ...nameParts, nombres: capitalizeName(e.target.value) })}
                  placeholder="Nombres"
                  className={inputClass}
                />
                <input
                  value={nameParts.apellidos}
                  onChange={(e) => setNameParts({ ...nameParts, apellidos: capitalizeName(e.target.value) })}
                  placeholder="Apellidos"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="flex-1">
                <label className={labelClass}>Usuario</label>
                <div className="flex items-center gap-2 px-3.5 py-2 border border-slate-100 bg-slate-100 rounded-lg text-sm text-slate-500 truncate">
                  <span className="truncate">{user.username}</span>
                </div>
              </div>
              <div className="flex-1">
                <label className={labelClass}>Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(formatPhone(e.target.value))}
                  placeholder="0000-0000"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3.5 border-t border-slate-100">
            <SectionTitle icon={<KeyRound size={15} />} title="Contraseña" />
            <div className="mt-2.5 flex gap-2.5">
              <div className="flex-1">
                <label className={labelClass}>Actual</label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder=""
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className={labelClass}>Nueva</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder=""
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`mt-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${meta.gradient} shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99] disabled:opacity-50`}
          >
            <CheckCircle2 size={15} />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-[#E3E6EB] p-5 flex flex-col lg:min-h-0">
          <SectionTitle icon={<ShieldCheck size={15} />} title="Accesos por rol" />
          <div className={`mt-3 inline-flex self-start items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold border ${meta.badge}`}>
            {meta.label}
          </div>
          <ul className="mt-4 space-y-1.5 flex-1">
            {meta.permissions.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-slate-600">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                {p}
              </li>
            ))}
          </ul>
          <p className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <KeyRound size={12} className="shrink-0" />
            El rol lo asigna el administrador del sistema.
          </p>
        </section>
      </div>
    </div>
  )
}
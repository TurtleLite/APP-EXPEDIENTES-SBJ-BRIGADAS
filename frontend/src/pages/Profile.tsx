import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { ROLE_META } from '../constants'
import { RoleAvatar } from '../components/RoleAvatar'
import { PasswordInput } from '../components/PasswordInput'
import { formatPhone, isValidPhone } from '../utils/format'
import {
  User, KeyRound, ShieldCheck, CheckCircle2, AtSign, Phone, CircleUserRound,
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
  'w-full px-3.5 py-2.5 border border-[#E3E6EB] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200'
const labelClass =
  'block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5'

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
    <div className="h-full flex flex-col gap-5 min-h-0">
      <div className={`rounded-2xl overflow-hidden shadow-md bg-gradient-to-br ${meta.gradient} shrink-0`}>
        <div className="px-8 py-7 flex items-center gap-6">
          <div className="ring-4 ring-white/25 rounded-2xl">
            <RoleAvatar role={user.role} size="lg" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/60 mb-1">
              Perfil de usuario
            </p>
            <h1 className="text-2xl font-bold text-white truncate">{user.full_name}</h1>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border bg-white/90 ${meta.badge}`}>
                {meta.label}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-white/30 bg-white/10 text-white">
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${user.is_active ? 'bg-emerald-300' : 'bg-red-300'}`} />
                {user.is_active ? 'Cuenta activa' : 'Cuenta inactiva'}
              </span>
              <span className="text-white/80 text-sm">@{user.username}</span>
            </div>
          </div>
          <div className="hidden lg:flex flex-col items-center justify-center gap-1.5 px-6 py-4 rounded-2xl bg-white/10 border border-white/15 text-white">
            <CircleUserRound size={22} className="opacity-90" />
            <span className="text-xs font-medium truncate max-w-[180px]">{user.username}</span>
            <span className="text-[10px] uppercase tracking-wider text-white/60">Centro Médico SBJ</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 flex-1 min-h-0">
        <section className="bg-white rounded-2xl shadow-sm border border-[#E3E6EB] p-6 flex flex-col xl:min-h-0">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <User size={17} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 leading-tight">Datos personales</h2>
              <p className="text-xs text-slate-400">Actualiza tu información de contacto</p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className={labelClass}>Nombre y apellidos</label>
              <div className="flex gap-3">
                <select
                  value={nameParts.titulo}
                  onChange={(e) => setNameParts({ ...nameParts, titulo: e.target.value })}
                  className="w-24 shrink-0 px-2.5 py-2.5 border border-[#E3E6EB] rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Usuario</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-100 bg-slate-100 rounded-xl text-sm text-slate-500 truncate">
                  <AtSign size={14} className="shrink-0" />
                  <span className="truncate">{user.username}</span>
                </div>
              </div>
              <div>
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

          <div className="my-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <KeyRound size={16} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900 leading-tight">Seguridad</h3>
                <p className="text-xs text-slate-400">Déjalo vacío si no deseas cambiar tu contraseña</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Contraseña actual</label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Solo para cambiarla"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nueva contraseña</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Elíjala una segura"
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`mt-auto w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${meta.gradient} shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50`}
          >
            <CheckCircle2 size={16} />
            {saving ? 'Guardando cambios...' : 'Guardar cambios'}
          </button>
        </section>

        <div className="flex flex-col gap-5 xl:min-h-0 min-h-0">
          <section className="bg-white rounded-2xl shadow-sm border border-[#E3E6EB] p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <ShieldCheck size={17} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 leading-tight">Accesos por rol</h2>
                <p className="text-xs text-slate-400">Rol: <span className="font-medium text-slate-600">{meta.label}</span></p>
              </div>
            </div>
            <ul className="space-y-3 flex-1">
              {meta.permissions.map((p) => (
                <li key={p} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-600">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
              <KeyRound size={14} className="shrink-0" />
              El rol lo asigna el administrador del sistema.
            </p>
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-[#E3E6EB] p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                <Phone size={16} />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900 leading-tight">Datos de la cuenta</h2>
                <p className="text-xs text-slate-400">Información registrada en el sistema</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Nombre completo', value: user.full_name },
                { label: 'Rol', value: meta.label },
                { label: 'Teléfono', value: formatPhone(user.telefono || '') || '—' },
                { label: 'Estado', value: user.is_active ? 'Activo' : 'Inactivo' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between gap-4 px-3.5 py-2.5 rounded-xl border border-slate-100 bg-slate-50/60"
                >
                  <span className="text-xs uppercase tracking-wide text-slate-400">{row.label}</span>
                  <span className="text-sm font-medium text-slate-700 truncate">{row.value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
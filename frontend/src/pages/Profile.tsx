import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { ROLE_META } from '../constants'
import { RoleAvatar } from '../components/RoleAvatar'
import { PasswordInput } from '../components/PasswordInput'
import { formatPhone, isValidPhone } from '../utils/format'
import { User as UserIcon, KeyRound, ShieldCheck, CheckCircle2, UserCircle2 } from 'lucide-react'

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
    <div className="h-full flex flex-col gap-4">
      <div className={`rounded-2xl overflow-hidden shadow-md bg-gradient-to-br ${meta.gradient} shrink-0`}>
        <div className="px-6 py-5 flex items-center gap-5">
          <RoleAvatar role={user.role} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{user.full_name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}>
                {meta.label}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-white/30 bg-white/10 text-white">
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${user.is_active ? 'bg-emerald-300' : 'bg-red-300'}`} />
                {user.is_active ? 'Activo' : 'Inactivo'}
              </span>
              <span className="text-white/80 text-sm">@{user.username}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-0">
        <section className="bg-white rounded-2xl shadow-sm border border-[#E3E6EB] p-6 lg:min-h-0 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <UserCircle2 size={18} className="text-slate-500" />
            Mis datos
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nombre y apellidos</label>
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
                  className="flex-1 min-w-0 px-3.5 py-2.5 border border-[#E3E6EB] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                />
                <input
                  value={nameParts.apellidos}
                  onChange={(e) => setNameParts({ ...nameParts, apellidos: capitalizeName(e.target.value) })}
                  placeholder="Apellidos"
                  className="flex-1 min-w-0 px-3.5 py-2.5 border border-[#E3E6EB] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Usuario</label>
                <div className="flex items-center gap-2 px-3.5 py-2.5 border border-slate-100 bg-slate-100 rounded-xl text-sm text-slate-500 truncate">
                  <UserIcon size={14} className="shrink-0" />
                  <span className="truncate">{user.username}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(formatPhone(e.target.value))}
                  placeholder="0000-0000"
                  className="w-full px-3.5 py-2.5 border border-[#E3E6EB] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Contraseña actual</label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Solo para cambiarla"
                  className="w-full px-3.5 py-2.5 border border-[#E3E6EB] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nueva contraseña</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Dejar vacío"
                  className="w-full px-3.5 py-2.5 border border-[#E3E6EB] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
                />
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r ${meta.gradient} shadow-md hover:shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50`}
            >
              <CheckCircle2 size={16} />
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-[#E3E6EB] p-6 lg:min-h-0 flex flex-col">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <ShieldCheck size={18} className="text-slate-500" />
            Accesos según tu rol
          </h2>
          <div className={`inline-flex self-start items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border mb-5 ${meta.badge}`}>
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${meta.gradient}`} />
            {meta.label}
          </div>
          <ul className="space-y-3 flex-1">
            {meta.permissions.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-400">
            <KeyRound size={14} />
            El rol lo asigna el administrador del sistema
          </div>
        </section>
      </div>
    </div>
  )
}

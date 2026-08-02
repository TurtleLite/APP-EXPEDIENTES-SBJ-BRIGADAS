import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usersApi } from '../services/api'
import { useNotification } from '../contexts/NotificationContext'
import { ROLE_META } from '../constants'
import { RoleAvatar } from '../components/RoleAvatar'
import { PasswordInput } from '../components/PasswordInput'
import { User as UserIcon, KeyRound, ShieldCheck, CheckCircle2, UserCircle2 } from 'lucide-react'

const capitalizeName = (value: string) =>
  value.replace(/\S+/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())

export function Profile() {
  const { user, updateUser } = useAuth()
  const { toast } = useNotification()
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [telefono, setTelefono] = useState(user?.telefono || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)

  if (!user) return null
  const meta = ROLE_META[user.role] || ROLE_META.medico

  const handleSave = async () => {
    if (!fullName.trim() || !telefono.trim()) {
      toast('El nombre y el teléfono son obligatorios', 'error')
      return
    }
    try {
      setSaving(true)
      const payload: any = { full_name: fullName.trim(), telefono: telefono.trim() }
      if (password) payload.password = password
      const res = await usersApi.updateMe(payload)
      updateUser(res.data)
      setPassword('')
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
        <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <RoleAvatar role={user.role} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white">{user.full_name}</h1>
            <p className="text-white/80 text-sm mt-0.5">@{user.username}</p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${meta.badge}`}>
                {meta.label}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-white/30 bg-white/10 text-white">
                <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${user.is_active ? 'bg-emerald-300' : 'bg-red-300'}`} />
                {user.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0 lg:grid-rows-[minmax(0,1fr)] overflow-y-auto">
        <section className="bg-white rounded-2xl shadow-sm border border-[#fde68a] p-5 lg:overflow-y-auto lg:min-h-0">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <UserCircle2 size={18} className="text-slate-500" />
            Mis datos
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nombre completo</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(capitalizeName(e.target.value))}
                className="w-full px-3 py-2.5 border border-[#fde68a] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Usuario</label>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-100 bg-amber-50 rounded-xl text-sm text-slate-500">
                <UserIcon size={14} />
                {user.username}
              </div>            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full px-3 py-2.5 border border-[#fde68a] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nueva contraseña</label>
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Dejar vacío para no cambiarla"
                className="w-full px-3 py-2.5 border border-[#fde68a] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
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

        <section className="bg-white rounded-2xl shadow-sm border border-[#fde68a] p-5 lg:overflow-y-auto lg:min-h-0">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-5">
            <ShieldCheck size={18} className="text-slate-500" />
            Accesos según tu rol
          </h2>
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border mb-5 ${meta.badge}`}>
            <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${meta.gradient}`} />
            {meta.label}
          </div>
          <ul className="space-y-3">
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

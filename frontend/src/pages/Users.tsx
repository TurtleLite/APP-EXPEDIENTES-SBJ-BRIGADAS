import { useState, useEffect } from 'react'
import { usersApi } from '../services/api'
import { User } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { Plus, Pencil, Trash2, UserPlus } from 'lucide-react'
import { RoleAvatar } from '../components/RoleAvatar'
import { PasswordInput } from '../components/PasswordInput'

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  direccion: 'Dirección',
  direccion_medica: 'Dirección Médica',
  medico: 'Médico',
}

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState({ username: '', telefono: '', full_name: '', password: '', role: 'medico' })
  const { user: currentUser } = useAuth()
  const { toast, confirm } = useNotification()

  const loadUsers = async () => {
    try {
      const res = await usersApi.list()
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { loadUsers() }, [])

  const handleSave = async () => {
    try {
      const payload: any = { ...form }
      if (editingUser && !payload.password) delete payload.password
      if (editingUser) {
        await usersApi.update(editingUser.id, payload)
      } else {
        await usersApi.create(payload)
      }
      setShowModal(false)
      setEditingUser(null)
      setForm({ username: '', telefono: '', full_name: '', password: '', role: 'medico' })
      loadUsers()
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al guardar usuario', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!await confirm('¿Eliminar este usuario?')) return
    try {
      await usersApi.delete(id)
      loadUsers()
      toast('Usuario eliminado correctamente', 'success')
    } catch (err) {
      toast('Error al eliminar usuario', 'error')
    }
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setForm({
      username: user.username,
      telefono: user.telefono,
      full_name: user.full_name,
      password: '',
      role: user.role,
    })
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#134e4a]">Usuarios</h1>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingUser(null)
              setForm({ username: '', telefono: '', full_name: '', password: '', role: 'medico' })
              setShowModal(true)
            }}
            className="flex items-center gap-1.5 bg-[#0d9488] text-white px-4 py-2 rounded-xl hover:bg-[#0f766e] shadow-sm hover:shadow-md transition-all duration-200  text-sm font-medium"
          >
            <UserPlus size={16} />
            Nuevo Usuario
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#a9ded6]">
        <table className="w-full">
          <thead className="sticky top-0 z-10">
            <tr className="bg-teal-50 border-b border-[#a9ded6]">
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Teléfono</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Rol</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 transition-all duration-150 hover:bg-teal-50/50">
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  <div className="flex items-center gap-3">
                    <RoleAvatar role={u.role} size="sm" />
                    {u.full_name}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{u.username}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{u.telefono}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-slate-100 text-slate-600' :
                    u.role === 'direccion' ? 'bg-slate-100 text-slate-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {roleLabels[u.role] || u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.is_active ? 'bg-slate-100 text-slate-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {currentUser?.role === 'admin' && (
                    <>
                      <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                        <Pencil size={15} className="text-slate-500" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-red-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ml-1">
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl px-5 py-3 w-[95vw] max-w-5xl shadow-2xl">
            <h2 className="font-serif text-lg font-bold mb-4 text-[#134e4a]">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <div className="space-y-3">
              <input
                placeholder="Nombre completo"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
              <input
                placeholder="Usuario"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
              <input
                placeholder="Teléfono"
                type="tel"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
              <PasswordInput
                placeholder={editingUser ? 'Nueva contraseña (dejar vacío)' : 'Contraseña'}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 border border-[#a9ded6] rounded-xl text-sm focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 transition-all duration-200"
              >
                <option value="medico">Médico</option>
                <option value="direccion_medica">Dirección Médica</option>
                <option value="direccion">Dirección</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-teal-50 rounded-xl transition-all duration-200">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-[#0d9488] text-white rounded-xl hover:bg-[#0f766e] shadow-sm hover:shadow-md transition-all duration-200 font-medium">
                {editingUser ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

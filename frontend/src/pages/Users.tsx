import { useState, useEffect } from 'react'
import { usersApi } from '../services/api'
import { User } from '../types'
import { useAuth } from '../contexts/AuthContext'
import { useNotification } from '../contexts/NotificationContext'
import { Plus, Pencil, Trash2, UserPlus } from 'lucide-react'

export function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState({ username: '', email: '', full_name: '', password: '', role: 'medico' })
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
      if (editingUser) {
        await usersApi.update(editingUser.id, form)
      } else {
        await usersApi.create(form)
      }
      setShowModal(false)
      setEditingUser(null)
      setForm({ username: '', email: '', full_name: '', password: '', role: 'medico' })
      loadUsers()
    } catch (err: any) {
      toast(err.response?.data?.detail || 'Error al guardar usuario', 'error')
    }
  }

  const handleDelete = async (id: number) => {
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
      email: user.email,
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
          <h1 className="text-2xl font-bold text-rose-900">Usuarios</h1>
          <p className="text-sm text-rose-500 mt-1">Gestiona los usuarios del sistema</p>
        </div>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => {
              setEditingUser(null)
              setForm({ username: '', email: '', full_name: '', password: '', role: 'medico' })
              setShowModal(true)
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-400 to-pink-400 text-white px-4 py-2 rounded-xl hover:from-rose-500 hover:to-pink-500 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] text-sm font-medium"
          >
            <UserPlus size={16} />
            Nuevo Usuario
          </button>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-rose-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-rose-50/50 border-b border-rose-100">
              <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Nombre</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Usuario</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Email</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Rol</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Estado</th>
              <th className="text-right px-6 py-4 text-xs font-semibold text-rose-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-rose-50 transition-all duration-150 hover:bg-rose-50/50">
                <td className="px-6 py-4 text-sm font-medium text-rose-900">{u.full_name}</td>
                <td className="px-6 py-4 text-sm text-rose-600">{u.username}</td>
                <td className="px-6 py-4 text-sm text-rose-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-600' :
                    u.role === 'direccion' ? 'bg-sky-100 text-sky-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    u.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {currentUser?.role === 'admin' && (
                    <>
                      <button onClick={() => openEdit(u)} className="p-1.5 hover:bg-rose-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95">
                        <Pencil size={15} className="text-rose-500" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-1.5 hover:bg-rose-100 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ml-1">
                        <Trash2 size={15} className="text-rose-400" />
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
        <div className="fixed inset-0 bg-rose-900/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 w-[95vw] max-w-5xl shadow-2xl">
            <h2 className="text-lg font-bold mb-4 text-rose-900">
              {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <div className="space-y-3">
              <input
                placeholder="Nombre completo"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-3 py-2.5 border border-rose-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 transition-all duration-200"
              />
              <input
                placeholder="Usuario"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full px-3 py-2.5 border border-rose-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 transition-all duration-200"
              />
              <input
                placeholder="Email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-rose-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 transition-all duration-200"
              />
              <input
                placeholder={editingUser ? 'Nueva contraseña (dejar vacío)' : 'Contraseña'}
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 border border-rose-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 transition-all duration-200"
              />
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full px-3 py-2.5 border border-rose-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 transition-all duration-200"
              >
                <option value="medico">Médico</option>
                <option value="direccion">Dirección</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200">
                Cancelar
              </button>
              <button onClick={handleSave} className="px-4 py-2 text-sm bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-xl hover:from-rose-500 hover:to-pink-500 shadow-sm hover:shadow-md transition-all duration-200 font-medium">
                {editingUser ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

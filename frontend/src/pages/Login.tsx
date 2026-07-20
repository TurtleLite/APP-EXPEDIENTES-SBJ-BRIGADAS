import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, User, Lock } from 'lucide-react'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      await login(username, password)
      navigate('/lists')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-pink-50 to-purple-100 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-400/20">
            <Stethoscope size={32} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-rose-900">APP EXPEDIENTES</h1>
          <p className="text-sm text-rose-500 mt-1">SBJ Brigadas · Inicie sesión para continuar</p>
        </div>
        {error && (
          <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm mb-4 border border-rose-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-rose-700 mb-1">Usuario</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-rose-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 outline-none transition-all duration-200"
                placeholder="Ingrese su usuario"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-rose-700 mb-1">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-rose-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-300/30 focus:border-rose-300 outline-none transition-all duration-200"
                placeholder="Ingrese su contraseña"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-gradient-to-r from-rose-400 to-pink-400 text-white rounded-xl font-medium hover:from-rose-500 hover:to-pink-500 transition-all duration-200 shadow-lg shadow-rose-400/20"
          >
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  )
}

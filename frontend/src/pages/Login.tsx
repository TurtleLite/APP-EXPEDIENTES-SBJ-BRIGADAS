import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Lock } from 'lucide-react'
import { PasswordInput } from '../components/PasswordInput'

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
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex flex-col justify-between w-[55%] bg-gradient-to-br from-[#fef3c7] to-[#fffbeb] p-12">
        <div className="text-center">
          <img src="/logo_sbj.png" alt="Logo San Benito José" className="w-64 h-auto mx-auto" />
          <p className="mt-10 text-xs font-semibold text-[#8f6a48] uppercase tracking-[0.3em]">
            Centro Médico San Benito José
          </p>
          <h1 className="font-serif text-4xl text-[#7c5636] mt-4 leading-tight">
            Sistema Web
            <span className="block text-2xl font-normal mt-1 text-[#7c5636]">
              Gestión de Expedientes Médicos
            </span>
          </h1>
        </div>

        <div className="text-center text-xs text-[#9a7857]">
          © {new Date().getFullYear()} TurtleLite · Centro Médico San Benito José
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-[#fffbeb] via-white to-[#fef3c7]">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-[#f0e0c0] p-8">
          <div className="lg:hidden text-center mb-10">
            <img src="/logo_sbj.png" alt="Logo San Benito José" className="w-40 h-auto mx-auto mb-6" />
            <h1 className="font-serif text-2xl text-[#7c5636]">
              Sistema Web
              <span className="block text-lg font-normal mt-1 text-[#7c5636]">
                Gestión de Expedientes Médicos
              </span>
            </h1>
          </div>

          <h2 className="font-serif text-2xl text-[#7c5636]">Iniciar sesión</h2>
          <p className="text-sm text-[#8f6a48] mt-1.5 mb-8">
            Ingrese sus credenciales para continuar.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-5 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#7c5636] mb-1.5">Usuario</label>
              <div className="relative">
                <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7857]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-[#f0e0c0] rounded-md text-sm bg-white focus:border-[#7c5636] outline-none transition-colors duration-200"
                  placeholder="Nombre de usuario"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#7c5636] mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a7857]" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 py-2.5 border border-[#f0e0c0] rounded-md text-sm bg-white focus:border-[#7c5636] outline-none transition-colors duration-200"
                  placeholder="Contraseña"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#b07a40] text-white rounded-md text-sm font-medium hover:bg-[#9c6a36] transition-colors duration-200"
            >
              Iniciar sesión
            </button>
          </form>
          </div>

          <p className="mt-6 text-center text-xs text-[#9a7857]">
            ¿Olvidó su contraseña? Contacte al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}

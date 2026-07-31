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
      navigate('/lists')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex flex-col justify-between w-[55%] bg-[#f4f1ec] p-12">
        <div className="text-center">
          <img src="/logo_sbj.png" alt="Logo San Benito José" className="w-64 h-auto mx-auto" />
          <p className="mt-10 text-xs font-semibold text-[#8a8378] uppercase tracking-[0.3em]">
            Centro Médico San Benito José
          </p>
          <h1 className="font-serif text-4xl text-[#1c1c1c] mt-4 leading-tight">
            Sistema Web
            <span className="block text-2xl font-normal mt-1 text-[#3d3a34]">
              Gestión de Expedientes Médicos
            </span>
          </h1>
          <p className="mt-8 text-sm text-[#6f6a61] max-w-sm mx-auto leading-relaxed">
            Registro y control de expedientes médicos para las brigadas quirúrgicas
            del centro médico.
          </p>
        </div>

        <div className="text-center text-xs text-[#9a948a]">
          © {new Date().getFullYear()} TurtleLite · Centro Médico San Benito José
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden text-center mb-10">
            <img src="/logo_sbj.png" alt="Logo San Benito José" className="w-40 h-auto mx-auto mb-6" />
            <h1 className="font-serif text-2xl text-[#1c1c1c]">
              Sistema Web
              <span className="block text-lg font-normal mt-1 text-[#3d3a34]">
                Gestión de Expedientes Médicos
              </span>
            </h1>
          </div>

          <h2 className="font-serif text-2xl text-[#1c1c1c]">Iniciar sesión</h2>
          <p className="text-sm text-[#6f6a61] mt-1.5 mb-8">
            Ingrese sus credenciales para continuar.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-5 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#3d3a34] mb-1.5">Usuario</label>
              <div className="relative">
                <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a948a]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-[#d8d2c8] rounded-md text-sm bg-white focus:border-[#1c1c1c] outline-none transition-colors duration-200"
                  placeholder="Nombre de usuario"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3d3a34] mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9a948a]" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 py-2.5 border border-[#d8d2c8] rounded-md text-sm bg-white focus:border-[#1c1c1c] outline-none transition-colors duration-200"
                  placeholder="Contraseña"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[#1c1c1c] text-white rounded-md text-sm font-medium hover:bg-black transition-colors duration-200"
            >
              Iniciar sesión
            </button>
          </form>

          <p className="mt-10 text-center text-xs text-[#9a948a]">
            ¿Olvidó su contraseña? Contacte al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Loader2 } from 'lucide-react'
import { PasswordInput } from '../components/PasswordInput'

export function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/dashboard')
    } catch (err: any) {
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('El servidor tardó demasiado en responder. Intente de nuevo en unos segundos.')
      } else if (!err.response) {
        setError('No se pudo conectar con el servidor. Verifique su conexión a internet e intente de nuevo.')
      } else {
        setError(err.response?.data?.detail || 'Error al iniciar sesión')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white">
      <div className="hidden lg:flex flex-col justify-between w-[55%] bg-gradient-to-br from-[#EDF0F4] to-[#F8F9FA] p-12">
        <div className="text-center">
          <img src="/logo_sbj.png" alt="Logo San Benito José" className="w-64 h-auto mx-auto" />
          <p className="mt-10 text-xs font-semibold text-[#6F7682] uppercase tracking-[0.3em]">
            Centro Médico San Benito José
          </p>
          <h1 className="font-serif text-4xl text-[#3F4650] mt-4 leading-tight">
            Sistema Web
            <span className="block text-2xl font-normal mt-1 text-[#3F4650]">
              Gestión de Expedientes Médicos
            </span>
          </h1>
        </div>

        <div className="text-center text-xs text-[#8A919C]">
          © {new Date().getFullYear()} TurtleLite · Centro Médico San Benito José
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-[#F8F9FA] via-white to-[#EDF0F4]">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E3E6EB] p-8">
          <div className="lg:hidden text-center mb-10">
            <img src="/logo_sbj.png" alt="Logo San Benito José" className="w-40 h-auto mx-auto mb-6" />
            <h1 className="font-serif text-2xl text-[#3F4650]">
              Sistema Web
              <span className="block text-lg font-normal mt-1 text-[#3F4650]">
                Gestión de Expedientes Médicos
              </span>
            </h1>
          </div>

          <h2 className="font-serif text-2xl text-[#3F4650]">Iniciar sesión</h2>
          <p className="text-sm text-[#6F7682] mt-1.5 mb-8">
            Ingrese sus credenciales para continuar.
          </p>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-md text-sm mb-5 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#3F4650] mb-1.5">Usuario</label>
              <div className="relative">
                <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A919C]" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 pr-3 py-2.5 border border-[#E3E6EB] rounded-md text-sm bg-white focus:border-[#3F4650] outline-none transition-colors duration-200 disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="Nombre de usuario"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#3F4650] mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A919C]" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-9 py-2.5 border border-[#E3E6EB] rounded-md text-sm bg-white focus:border-[#3F4650] outline-none transition-colors duration-200 disabled:bg-slate-50 disabled:text-slate-400"
                  placeholder="Contraseña"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#6E7B91] text-white rounded-md text-sm font-medium hover:bg-[#5F6B80] transition-colors duration-200 disabled:bg-[#9AA5B5] disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Iniciando sesión…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
          </div>

          <p className="mt-6 text-center text-xs text-[#8A919C]">
            ¿Olvidó su contraseña? Contacte al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  )
}

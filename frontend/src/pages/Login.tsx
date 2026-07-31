import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { User, Lock, CheckCircle2, ClipboardList, FileText, Activity } from 'lucide-react'
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

  const features = [
    { icon: <ClipboardList size={16} />, text: 'Gestión completa de expedientes médicos' },
    { icon: <FileText size={16} />, text: 'Reportes por especialidad, fechas y estatus' },
    { icon: <Activity size={16} />, text: 'Control del estatus de cirugía' },
  ]

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:flex flex-col justify-between w-[55%] bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 p-12 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/40" />
        <div className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-white/40" />
        <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/40" />

        <div className="relative z-10">
          <img src="/logo_sbj.png" alt="Logo SBJ Cirugias" className="w-40 h-auto" />
          <h1 className="text-4xl font-bold text-slate-900 mt-8">EXPEDIENTES SBJ</h1>
          <p className="text-lg text-slate-600 mt-2">Centro Médico San Benito José</p>
        </div>

        <div className="relative z-10 space-y-4">
          {features.map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-slate-700">
              <span className="w-9 h-9 rounded-xl bg-white/70 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
                {f.icon}
              </span>
              <span className="text-sm">{f.text}</span>
            </div>
          ))}
        </div>

        <div className="relative z-10 text-xs text-slate-500">
          © {new Date().getFullYear()} TurtleLite · Centro Médico San Benito José
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <img src="/logo_sbj.png" alt="Logo SBJ Cirugias" className="w-32 h-auto mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900">EXPEDIENTES SBJ</h1>
            <p className="text-sm text-slate-500 mt-1">Centro Médico San Benito José</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Inicie sesión</h2>
            <p className="text-sm text-slate-500 mt-1">Acceda a su cuenta para continuar</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm mb-4 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Usuario</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 outline-none transition-all duration-200 shadow-sm"
                  placeholder="Ingrese su usuario"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 py-3 border border-slate-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-slate-300/30 focus:border-slate-400 outline-none transition-all duration-200 shadow-sm"
                  placeholder="Ingrese su contraseña"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl font-medium hover:from-slate-600 hover:to-slate-700 transition-all duration-200 shadow-lg shadow-slate-500/20 hover:scale-[1.01] active:scale-[0.99]"
            >
              Iniciar sesión
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
            <CheckCircle2 size={13} />
            Sistema de expedientes · SBJ Cirugias
          </div>
        </div>
      </div>
    </div>
  )
}

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface ConfirmState {
  message: string
  resolve: (value: boolean) => void
}

interface NotificationContextType {
  toast: (message: string, type?: Toast['type']) => void
  confirm: (message: string) => Promise<boolean>
}

const NotificationContext = createContext<NotificationContextType>({} as NotificationContextType)

let nextId = 0

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const toast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve })
    })
  }, [])

  const handleConfirm = (value: boolean) => {
    confirmState?.resolve(value)
    setConfirmState(null)
  }

  return (
    <NotificationContext.Provider value={{ toast, confirm }}>
      {children}

      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white max-w-sm animate-slide-in ${
                t.type === 'success' ? 'bg-emerald-400' :
                t.type === 'error' ? 'bg-rose-400' :
                'bg-sky-400'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 bg-rose-900/20 backdrop-blur-sm flex items-center justify-center z-[200]">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl px-5 py-3 w-full max-w-sm shadow-xl">
            <p className="text-sm text-rose-700 mb-6">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleConfirm(false)}
                className="px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="px-4 py-2 text-sm bg-rose-400 text-white rounded-lg hover:bg-rose-500"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}

export const useNotification = () => useContext(NotificationContext)

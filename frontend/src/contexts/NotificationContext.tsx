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
                t.type === 'success' ? 'bg-green-600' :
                t.type === 'error' ? 'bg-red-600' :
                'bg-blue-600'
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      )}

      {confirmState && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-xl px-5 py-3 w-full max-w-sm shadow-xl">
            <p className="text-sm text-gray-700 mb-6">{confirmState.message}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleConfirm(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleConfirm(true)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
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

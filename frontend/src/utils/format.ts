export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}-${digits.slice(4)}`
}

export const isValidPhone = (value: string): boolean => /^\d{4}-\d{4}$/.test(value)

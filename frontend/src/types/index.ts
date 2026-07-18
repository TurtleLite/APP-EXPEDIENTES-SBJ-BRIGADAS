export interface User {
  id: number
  username: string
  email: string
  full_name: string
  role: 'admin' | 'direccion' | 'medico'
  is_active: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ListDefinition {
  id: number
  name: string
  description?: string
  columns_config: ColumnConfig[]
  is_system: boolean
  created_by: number
  created_at: string
}

export interface ColumnConfig {
  key: string
  label: string
  type: string
}

export interface ListRecord {
  id: number
  list_definition_id: number
  data: Record<string, any>
  created_by: number | null
  created_at: string
}

export interface Report {
  id: number
  name: string
  description?: string
  list_definition_id?: number
  filters?: Record<string, any>
  columns_selected?: string[]
  created_by: number
  file_path_excel?: string
  file_path_pdf?: string
  created_at: string
}

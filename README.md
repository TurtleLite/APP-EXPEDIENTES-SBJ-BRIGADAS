# APP EXPEDIENTES SBJ BRIGADAS

Aplicación web para gestión de usuarios con roles, listas personalizables desde Excel, y reportes exportables a Excel/PDF.

## Requisitos de Infraestructura

### ¿Necesito un servidor físico?

**Sí.** Para almacenar 256 GB de datos de forma gratuita, necesitas tu propio hardware. Opciones:

| Opción | Costo | Almacenamiento | Recomendación |
|--------|-------|----------------|---------------|
| PC/Laptop dedicada | $0 (si ya tienes) | Según tu disco | ✅ Recomendado |
| Raspberry Pi 4/5 (8GB) | ~$80-120 | SSD externo | ✅ Bueno para pruebas |
| VPS (DigitalOcean, etc.) | ~$6-12/mes | 25-80GB | ❌ No alcanza 256GB |
| AWS RDS / Supabase | Gratis solo 500MB | 500MB-1GB | ❌ No alcanza |

**Requisitos mínimos del servidor:**
- CPU: 2 núcleos
- RAM: 4 GB
- Disco: 256 GB+ (SSD recomendado)
- SO: Ubuntu 22.04 LTS o similar
- Conexión a internet (si accedes desde otros dispositivos)

## Stack Tecnológico (100% gratuito)

| Componente | Tecnología | Licencia |
|------------|-----------|----------|
| Frontend | React + Vite + TypeScript | MIT |
| Estilos | Tailwind CSS | MIT |
| Backend | Python + FastAPI | MIT |
| Base de Datos | PostgreSQL | PostgreSQL License |
| PDF | ReportLab | BSD |
| Excel | openpyxl | MIT |
| Autenticación | JWT | MIT |

## Instalación y Ejecución

### 1. Base de Datos (PostgreSQL)

```bash
# Instalar PostgreSQL
sudo apt update && sudo apt install postgresql postgresql-contrib -y

# Iniciar servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear base de datos y usuario
sudo -u postgres psql -c "CREATE USER gestion_user WITH PASSWORD 'gestion_pass';"
sudo -u postgres psql -c "CREATE DATABASE gestion_db OWNER gestion_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE gestion_db TO gestion_user;"
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run_seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Acceso

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Documentación API: http://localhost:8000/docs

## Usuarios por defecto

| Usuario | Contraseña | Rol | Permisos |
|---------|-----------|-----|----------|
| admin | admin123 | Administrador | CRUD usuarios, listas, reportes |
| direccion | direccion123 | Dirección | Ver usuarios, CRUD listas, reportes |
| medico | medico123 | Médico | Solo ver listas y registros |

## Estructura del Proyecto

```
gestion-app/
├── backend/
│   ├── app/
│   │   ├── api/          # Endpoints REST
│   │   ├── core/         # Config, DB, seguridad
│   │   ├── models/       # Modelos SQLAlchemy
│   │   ├── schemas/      # Schemas Pydantic
│   │   ├── services/     # Lógica de negocio
│   │   └── main.py       # Punto de entrada
│   ├── uploads/          # Archivos Excel importados
│   ├── reports/          # Reportes generados
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/   # Componentes reutilizables
    │   ├── contexts/     # Contextos (Auth)
    │   ├── pages/        # Páginas
    │   ├── services/     # API client
    │   └── types/        # TypeScript types
    └── package.json
```

## Permisos por Rol

| Funcionalidad | Admin | Dirección | Médico |
|---------------|-------|-----------|--------|
| Gestionar usuarios | ✅ CRUD | ✅ Solo ver | ❌ |
| Crear/editar listas | ✅ | ✅ | ❌ |
| Importar Excel | ✅ | ✅ | ❌ |
| Ver listas y registros | ✅ | ✅ | ✅ |
| Crear reportes | ✅ | ✅ | ❌ |
| Generar Excel/PDF | ✅ | ✅ | ❌ |
| Descargar reportes | ✅ | ✅ | ✅ |

## Despliegue

### Frontend (Render - Gratis)

1. Crea cuenta en https://render.com (con GitHub)
2. New + → **Static Site**
3. Conecta el repositorio `APP-EXPEDIENTES-SBJ-BRIGADAS`
4. Configura:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
5. Agrega variable de entorno:
   - `VITE_API_URL` → (la URL del túnel de Cloudflare, se agrega después)
6. Deploy

### Servidor (PC Windows)

1. Clona el repo en la PC
2. Ejecuta `setup.bat` como **Administrador** (instala dependencias y crea la DB)
3. Inicia el backend:
   ```cmd
   cd backend
   venv\Scripts\activate
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```
4. En otra terminal, expón con Cloudflare Tunnel:
   ```cmd
   cloudflared tunnel --url http://localhost:8000
   ```
5. Copia la URL `https://xxx.trycloudflare.com` y pégala en `VITE_API_URL` en Render
6. Render rebuild automáticamente el frontend apuntando a tu PC

### Cloudflare Tunnel (Gratis)

1. Descarga `cloudflared` desde https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
2. Ejecuta: `cloudflared tunnel --url http://localhost:8000`
3. Obtienes una URL pública tipo `https://xxxx.trycloudflare.com`

### Usuarios por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Administrador |
| direccion | direccion123 | Dirección |
| medico | medico123 | Médico |

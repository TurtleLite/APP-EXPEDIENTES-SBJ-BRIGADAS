# APP EXPEDIENTES SBJ BRIGADAS

Aplicación web para gestión de usuarios con roles, listas personalizables desde Excel, y reportes exportables a Excel/PDF.

## Requisitos de Infraestructura

**No necesitas ningún servidor físico.** Todo corre en la nube de forma gratuita:

| Componente | Dónde corre | Costo |
|------------|-------------|-------|
| Frontend (React) | Render (Static Site) | Gratis |
| Backend (FastAPI) | Render (Web Service) | Gratis |
| Base de datos | CockroachLabs Cloud | Gratis (500MB) |

## Stack Tecnológico (100% gratuito)

| Componente | Tecnología | Licencia |
|------------|-----------|----------|
| Frontend | React + Vite + TypeScript | MIT |
| Estilos | Tailwind CSS | MIT |
| Backend | Python + FastAPI | MIT |
| Base de Datos | CockroachDB (CockroachLabs Cloud) | BSL (gratuito en la nube) |
| PDF | ReportLab | BSD |
| Excel | openpyxl | MIT |
| Autenticación | JWT | MIT |

## Instalación y Ejecución (desarrollo local)

La base de datos ya está en la nube (ver [Despliegue](#despliegue-100-en-la-nube)); localmente solo configuras `backend/.env` con `DATABASE_URL` apuntando al cluster de CockroachLabs.

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run_seed.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 3. Acceso

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

| Funcionalidad | Admin | Dirección | Dir. Médica | Médico |
|---------------|-------|-----------|-------------|--------|
| Gestionar usuarios | ✅ CRUD | ✅ Solo ver | ❌ | ❌ |
| Crear/editar/borrar listas | ✅ | ❌ | ❌ | ❌ |
| Importar Excel | ✅ | ❌ | ❌ | ❌ |
| Ver listas y registros | ✅ | ✅ | ✅ | ✅ |
| Crear expedientes | ✅ | ❌ | ✅ | ✅ |
| Editar expedientes | ✅ | ❌ (solo estatus de cirugía) | ✅ | ✅ (solo propios) |
| Crear reportes | ✅ | ✅ | ✅ | ❌ |
| Generar Excel/PDF | ✅ | ✅ | ✅ | ❌ |
| Descargar reportes | ✅ | ✅ | ✅ | ✅ |

## Despliegue (100% en la nube)

### 1. Base de Datos (CockroachDB en CockroachLabs Cloud)

La base de datos está alojada en la nube de **CockroachLabs** (SQL distribuido, compatible con PostgreSQL). No requiere instalación ni servidor local.

- **Cluster:** `sanbenitojose-bancodepacientes-30660` (región `aws-us-east-1`)
- **Host:** `sanbenitojose-bancodepacientes-30660.j77.aws-us-east-1.cockroachlabs.cloud:26257`
- **Base de datos:** `defaultdb`
- **Credenciales:** se configuran como variable de entorno `DATABASE_URL` con formato `cockroachdb://usuario:password@host:26257/defaultdb`

### 2. Backend (Render — Web Service)

1. Crea cuenta en https://render.com (con GitHub)
2. New + → **Web Service**
3. Conecta el repositorio `APP-EXPEDIENTES-SBJ-BRIGADAS`
4. Configura:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Agrega variables de entorno:
   - `DATABASE_URL` → la URL de CockroachLabs (formato `cockroachdb://...`)
   - `SECRET_KEY` → una clave secreta aleatoria
6. Deploy. La API quedará en `https://<tu-servicio>.onrender.com` (docs en `/docs`)

### 3. Frontend (Render — Static Site)

1. New + → **Static Site**
2. Conecta el repositorio `APP-EXPEDIENTES-SBJ-BRIGADAS`
3. Configura:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Agrega variable de entorno:
   - `VITE_API_URL` → `https://<tu-servicio-backend>.onrender.com`
5. Deploy. El sitio queda en `https://<tu-sitio>.onrender.com`

### URLs actuales del sistema

| Servicio | URL |
|----------|-----|
| Frontend | https://sistema-web-expedientes-cmsbj.onrender.com |
| Backend API | https://expedientes-api-2dje.onrender.com |
| Docs API | https://expedientes-api-2dje.onrender.com/docs |

> **Nota:** el backend acepta peticiones CORS solo desde los orígenes listados en `ALLOWED_ORIGINS` (backend/app/main.py). Si cambias la URL del frontend o del backend, actualízala allí.

### Usuarios por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Administrador |
| direccion | direccion123 | Dirección |
| medico | medico123 | Médico |

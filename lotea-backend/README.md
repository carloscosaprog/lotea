# Lotea Backend

Backend REST API construido con **NestJS** + **Prisma** + **PostgreSQL**.

## Requisitos

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9

## Instalación

```bash
npm install
```

## Configuración

Copia el archivo de entorno y rellena tus valores:

```bash
cp .env.example .env
```

Variables necesarias en `.env`:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión PostgreSQL |
| `JWT_SECRET` | Secreto para firmar tokens JWT |
| `PORT` | Puerto del servidor (por defecto 3000) |

## Base de datos

```bash
# Generar el cliente Prisma
npm run prisma:generate

# Aplicar migraciones
npm run prisma:migrate

# Explorar la BD con interfaz visual (opcional)
npm run prisma:studio
```

## Arranque

```bash
# Desarrollo con hot-reload
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## Estructura de módulos

```
src/
├── auth/               → Login JWT, guards, decoradores
├── usuarios/           → CRUD de usuarios + registro
├── categorias/         → CRUD de categorías de lotes
├── lotes/              → CRUD de lotes (núcleo del negocio)
├── imagenes-lote/      → Imágenes asociadas a lotes
├── favoritos/          → Guardar/quitar lotes favoritos
├── pedidos/            → Crear y gestionar pedidos
├── grupos-compra/      → Grupos de compra colectiva
├── solicitudes-lote/   → Solicitudes de lotes por usuarios
├── mensajes/           → Mensajería directa entre usuarios
└── prisma/             → PrismaService global + schema + migraciones
```

## Endpoints principales

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/login` | Iniciar sesión → devuelve JWT |

### Usuarios
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/usuarios/register` | ❌ | Registrar nuevo usuario |
| GET | `/usuarios` | ✅ | Listar todos |
| GET | `/usuarios/:id` | ✅ | Ver uno |
| PATCH | `/usuarios/:id` | ✅ | Actualizar |
| DELETE | `/usuarios/:id` | ✅ | Eliminar |

### Lotes
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/lotes` | ❌ | Listar todos los lotes |
| GET | `/lotes/:id` | ❌ | Ver un lote |
| GET | `/lotes/vendedor/:id` | ❌ | Lotes de un vendedor |
| POST | `/lotes` | ✅ | Crear lote |
| PATCH | `/lotes/:id` | ✅ | Actualizar (solo propietario) |
| DELETE | `/lotes/:id` | ✅ | Eliminar (solo propietario) |

### Favoritos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/favoritos` | ✅ | Añadir a favoritos |
| GET | `/favoritos` | ✅ | Mis favoritos |
| DELETE | `/favoritos/:id_lote` | ✅ | Quitar de favoritos |

### Pedidos
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/pedidos` | ✅ | Crear pedido con detalles |
| GET | `/pedidos` | ✅ | Mis pedidos |
| GET | `/pedidos/:id` | ✅ | Ver pedido |
| PATCH | `/pedidos/:id` | ✅ | Cambiar estado |

### Grupos de Compra
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/grupos-compra` | ✅ | Crear grupo |
| GET | `/grupos-compra` | ❌ | Listar grupos abiertos |
| GET | `/grupos-compra/:id` | ❌ | Ver grupo |
| POST | `/grupos-compra/:id/unirse` | ✅ | Unirse a un grupo |
| PATCH | `/grupos-compra/:id/cerrar` | ✅ | Cerrar grupo (solo creador) |

### Solicitudes de Lote
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/solicitudes-lote` | ✅ | Crear solicitud |
| GET | `/solicitudes-lote` | ❌ | Ver todas |
| GET | `/solicitudes-lote/mis-solicitudes` | ✅ | Las mías |
| PATCH | `/solicitudes-lote/:id` | ✅ | Editar (solo autor) |
| DELETE | `/solicitudes-lote/:id` | ✅ | Eliminar (solo autor) |

### Mensajes
| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/mensajes` | ✅ | Enviar mensaje |
| GET | `/mensajes/conversaciones` | ✅ | Lista de conversaciones |
| GET | `/mensajes/conversacion/:id_otro` | ✅ | Hilo con un usuario |
| DELETE | `/mensajes/:id` | ✅ | Eliminar mensaje |

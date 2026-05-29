# LOTEA

Plataforma multiplataforma de compra y venta de productos por lotes desarrollada con:

- Frontend: React Native + Expo
- Backend: NestJS
- Base de datos: PostgreSQL + Prisma
- Infraestructura: AWS EC2

---

# Arquitectura del proyecto

El repositorio contiene dos proyectos:

```txt
lotea/
├── lotea-backend/
└── lotea-frontend/
```

---

# Requisitos previos

## Software necesario

Instalar previamente:

- Node.js 20+
- pnpm
- PostgreSQL 16+
- Expo CLI
- Java 17 (para generar APK Android)

---

# Instalación del proyecto

## 1. Clonar el repositorio

```bash
git clone https://github.com/carloscosaprog/lotea.git
```

Entrar en el proyecto:

```bash
cd lotea
```

---

# Backend

## Instalación dependencias

```bash
cd lotea-backend
pnpm install
```

Si PNPM bloquea scripts:

```bash
pnpm approve-builds
```

Aceptar los paquetes propuestos.

---

# Variables de entorno backend

Crear un archivo `.env` en:

```txt
lotea-backend/.env
```

Contenido:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/lotea"

JWT_SECRET="tu_jwt_secret"

PORT=3000
```

---

# Base de datos

## Crear base de datos PostgreSQL

Ejemplo:

```sql
CREATE USER carlosprog WITH PASSWORD '1234';

CREATE DATABASE lotea OWNER carlosprog;

GRANT ALL PRIVILEGES ON DATABASE lotea TO carlosprog;
```

---

# Migraciones Prisma

Ejecutar:

```bash
pnpm prisma generate --schema=src/prisma/schema.prisma

pnpm prisma migrate deploy --schema=src/prisma/schema.prisma
```

---

# Seed de la base de datos

Importante para cargar:

- categorías
- datos iniciales

Ejecutar:

```bash
pnpm prisma db seed --schema=src/prisma/schema.prisma
```

---

# Lanzar backend

Modo desarrollo:

```bash
pnpm start:dev
```

La API quedará disponible en:

```txt
http://localhost:3000
```

---

# Producción backend (AWS EC2)

El backend está desplegado en una instancia EC2 de AWS.

## PM2

Para mantener el backend activo:

```bash
pm2 start "pnpm start:dev" --name lotea-backend
```

Guardar configuración:

```bash
pm2 save
```

Autoarranque tras reinicio:

```bash
pm2 startup
```

---

# Frontend

## Instalación dependencias

```bash
cd lotea-frontend
pnpm install
```

---

# Variables de entorno frontend

Crear:

```txt
lotea-frontend/.env
```

---

## Desarrollo local

Si el backend se ejecuta en local:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
```

Ejemplo:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.34:3000
```

La IP debe ser la IP local del ordenador que ejecuta el backend.

---

## Producción EC2

Si el backend se ejecuta en AWS EC2:

```env
EXPO_PUBLIC_API_URL=http://IP_EC2:3000
```

Ejemplo:

```env
EXPO_PUBLIC_API_URL=http://52.5.91.195:3000
```

---

# Lanzar frontend

```bash
pnpm start
```

o:

```bash
npx expo start
```

---

# Generar APK Android

## Requisitos

- Java 17 instalado
- Carpeta android generada

---

# Generar carpeta Android nativa

Desde `lotea-frontend`:

```bash
npx expo prebuild --platform android --clean
```

---

# Configuración necesaria AndroidManifest

En:

```txt
android/app/src/main/AndroidManifest.xml
```

Añadir dentro de `<application>`:

```xml
android:usesCleartextTraffic="true"
```

Ejemplo:

```xml
<application
    android:name=".MainApplication"
    android:usesCleartextTraffic="true">
```

Esto es necesario para permitir conexiones HTTP hacia la API.

---

# Generar APK release

Desde:

```txt
lotea-frontend/android
```

Ejecutar:

```bash
.\gradlew assembleRelease
```

---

# Ubicación APK generada

```txt
android/app/build/outputs/apk/release/app-release.apk
```

---

# AWS EC2

## Configuración necesaria

Puertos abiertos en Security Group:

| Puerto | Uso            |
| ------ | -------------- |
| 22     | SSH            |
| 3000   | Backend NestJS |

---

# IP elástica AWS

Se recomienda asociar una Elastic IP a la instancia EC2 para evitar que la IP pública cambie al reiniciar la máquina.

---

# Tecnologías utilizadas

## Frontend

- React Native
- Expo
- TypeScript
- React Navigation
- AsyncStorage
- Expo Location
- React Native Maps

---

## Backend

- NestJS
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- PM2

---

# Autor

Carlos Cosa Sanchez

# LOTEA

Plataforma multiplataforma de compra y venta de productos por lotes.

---

## 🎥 Demo del proyecto

### 🎬 Video Demostrativo 2
[![Ver demo de LOTEA](https://img.youtube.com/vi/7YaI6ksjMEA/hqdefault.jpg)](https://www.youtube.com/watch?v=7YaI6ksjMEA)

### 🎬 Video Demostrativo 1
[![Ver demo de LOTEA](https://img.youtube.com/vi/3LwFtk3jYSE/hqdefault.jpg)](https://www.youtube.com/watch?v=3LwFtk3jYSE)

---

## Descripción

LOTEA es una aplicación orientada a la compra y venta de productos agrupados en lotes. Permite a los usuarios publicar lotes con imágenes, precio, cantidad y categoría, así como explorar y visualizar los productos disponibles.

El sistema está diseñado siguiendo una arquitectura cliente-servidor, con un backend en Node.js y una aplicación móvil desarrollada en React Native.

Inicialmente el frontend fue desarrollado en React (web), pero el proyecto ha sido migrado completamente a React Native para ofrecer una experiencia móvil nativa.

---

## Estructura del proyecto

lotea/

* lotea-backend/ → API REST (Node.js + Express)
* lotea-frontend/ → Aplicación móvil (React Native + Expo)
* lotea_base_datos.sql → Script de base de datos PostgreSQL
* lotea_estado-actual.txt → Documento con estado del proyecto

---

## Tecnologías utilizadas

### Backend

* Node.js
* Express
* PostgreSQL
* JWT (autenticación)
* bcrypt (cifrado de contraseñas)
* multer (subida de imágenes)

### App móvil

* React Native
* Expo
* TypeScript
* React Navigation
* AsyncStorage
* Expo Image Picker

---

## Funcionalidades actuales

* Registro e inicio de sesión de usuarios
* Autenticación mediante JWT
* Gestión completa de lotes:

  * Crear lote con imágenes
  * Editar lote
  * Eliminar lote
  * Obtener lotes
* Visualización de lotes
* Página de detalle de lote con:

  * Galería de imágenes
  * Información del producto
  * Información del vendedor
  * Lotes relacionados del mismo usuario
* Perfil de usuario:

  * Visualización de datos
  * Edición de nombre
  * Subida de avatar
  * Acceso a "Mis lotes"
* Página de "Mis lotes"
* Navegación mediante Tab Navigator
* Visualización de perfiles de otros usuarios

---

## Estado del proyecto

Aplicación funcional en entorno local con backend y app móvil conectados.

Migración completada de React (web) a React Native.

Para más detalles sobre el estado actual, trabajo realizado y planificación:
ver archivo `lotea_estado-actual.txt`.

---

## Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/TU_USUARIO/lotea.git
cd lotea
```

---

### 2. Backend

```bash
cd lotea-backend
npm install
npm run dev
```

---

### 3. App móvil (React Native)

```bash
cd lotea
npm install
npx expo start
```

---

### 4. Base de datos

Ejecutar el script:

```sql
lotea_base_datos.sql
```

en PostgreSQL.

---

## Notas

* El proyecto está preparado para ejecutarse en red local (IP del servidor en el código).
* Las imágenes se almacenan en el servidor mediante multer.
* El sistema de autenticación utiliza JWT almacenado en AsyncStorage.

---

## Autor

Carlos Cosa

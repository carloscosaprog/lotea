# LOTEA

Plataforma multiplataforma de compra y venta de productos por lotes.

---

## 🎥 Demo del proyecto

[![Ver demo de LOTEA](https://img.youtube.com/vi/3LwFtk3jYSE/hqdefault.jpg)](https://www.youtube.com/watch?v=3LwFtk3jYSE)

---

## Descripción

LOTEA es una aplicación orientada a la compra y venta de productos agrupados en lotes. Permite a los usuarios publicar lotes con imágenes, precio, cantidad y categoría, así como explorar y visualizar los productos disponibles.

El sistema está diseñado siguiendo una arquitectura cliente-servidor, con un backend en Node.js y un frontend en React.

---

## Estructura del proyecto

lotea/
- lotea-backend/ → API REST (Node.js + Express)
- lotea-frontend/ → Aplicación web (React + TypeScript)
- lotea_base_datos.sql → Script de base de datos PostgreSQL
- lotea_estado-actual.txt → Documento con estado del proyecto

---

## Tecnologías utilizadas

### Backend
- Node.js
- Express
- PostgreSQL
- JWT (autenticación)
- bcrypt (cifrado de contraseñas)
- multer (subida de imágenes)

### Frontend
- React
- TypeScript
- React Router
- Axios
- Tailwind CSS

---

## Funcionalidades actuales

- Registro e inicio de sesión de usuarios
- Autenticación mediante JWT
- Gestión completa de lotes:
  - Crear lote con imágenes
  - Editar lote
  - Eliminar lote
  - Obtener lotes
- Visualización de lotes en formato grid
- Página de detalle de lote con:
  - Galería de imágenes
  - Información del producto
  - Información del vendedor
  - Lotes relacionados del mismo usuario
- Perfil de usuario:
  - Visualización de datos
  - Edición de nombre
  - Acceso a "Mis lotes"
- Página de "Mis lotes"
- Navegación protegida mediante rutas privadas

---

## Estado del proyecto

Aplicación funcional en entorno local.

Para más detalles sobre el estado actual, trabajo realizado y planificación:
ver archivo `lotea_estado-actual.txt`.

---

## Instalación

### 1. Clonar repositorio

```bash
git clone https://github.com/TU_USUARIO/lotea-app.git
cd lotea

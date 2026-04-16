-- ======================
-- TABLA USUARIO
-- ======================
CREATE TABLE Usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    avatar TEXT,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- TABLA CATEGORIA
-- ======================
CREATE TABLE Categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

-- ======================
-- TABLA LOTE
-- ======================
CREATE TABLE Lote (
    id_lote SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL CHECK (precio >= 0),
    cantidad INTEGER NOT NULL CHECK (cantidad >= 0),
    id_vendedor INTEGER NOT NULL,
    id_categoria INTEGER,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_vendedor) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria) ON DELETE SET NULL
);

-- ======================
-- TABLA IMAGEN_LOTE
-- ======================
CREATE TABLE Imagen_Lote (
    id_imagen SERIAL PRIMARY KEY,
    id_lote INTEGER NOT NULL,
    url TEXT NOT NULL,
    es_principal BOOLEAN DEFAULT false,

    FOREIGN KEY (id_lote) REFERENCES Lote(id_lote) ON DELETE CASCADE
);

-- ======================
-- TABLA PEDIDO
-- ======================
CREATE TABLE Pedido (
    id_pedido SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado VARCHAR(20) CHECK (estado IN ('pendiente', 'completado', 'cancelado')) NOT NULL DEFAULT 'pendiente',

    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- ======================
-- TABLA DETALLE_PEDIDO
-- ======================
CREATE TABLE Detalle_Pedido (
    id_detalle SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL,
    id_lote INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario >= 0),

    FOREIGN KEY (id_pedido) REFERENCES Pedido(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_lote) REFERENCES Lote(id_lote) ON DELETE CASCADE
);

-- ======================
-- TABLA GRUPO_COMPRA
-- ======================
CREATE TABLE Grupo_Compra (
    id_grupo SERIAL PRIMARY KEY,
    id_lote INTEGER NOT NULL,
    id_creador INTEGER NOT NULL,
    cantidad_objetivo INTEGER NOT NULL CHECK (cantidad_objetivo > 0),
    estado VARCHAR(20) DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),

    FOREIGN KEY (id_lote) REFERENCES Lote(id_lote) ON DELETE CASCADE,
    FOREIGN KEY (id_creador) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- ======================
-- TABLA PARTICIPACION_GRUPO
-- ======================
CREATE TABLE Participacion_Grupo (
    id_participacion SERIAL PRIMARY KEY,
    id_grupo INTEGER NOT NULL,
    id_usuario INTEGER NOT NULL,
    cantidad_aportada INTEGER NOT NULL CHECK (cantidad_aportada > 0),

    FOREIGN KEY (id_grupo) REFERENCES Grupo_Compra(id_grupo) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- ======================
-- TABLA SOLICITUD_LOTE
-- ======================
CREATE TABLE Solicitud_Lote (
    id_solicitud SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL,
    descripcion TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- ======================
-- TABLA MENSAJE
-- ======================
CREATE TABLE Mensaje (
    id_mensaje SERIAL PRIMARY KEY,
    id_emisor INTEGER NOT NULL,
    id_receptor INTEGER NOT NULL,
    contenido TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (id_emisor) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_receptor) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

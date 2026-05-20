"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function createCategoria(nombre, slug, icono, id_padre) {
    return prisma.categoria.upsert({
        where: {
            slug,
        },
        update: {
            nombre,
            icono,
            id_padre: id_padre ?? null,
        },
        create: {
            nombre,
            slug,
            icono,
            id_padre: id_padre ?? null,
        },
    });
}
async function main() {
    const hashedPassword = await bcrypt.hash("root", 10);
    await prisma.usuario.upsert({
        where: {
            email: "root@gmail.com",
        },
        update: {},
        create: {
            nombre: "root",
            email: "root@gmail.com",
            contrasena: hashedPassword,
        },
    });
    const tecnologia = await createCategoria("Tecnología y electrónica", "tecnologia-electronica", "smartphone");
    const moda = await createCategoria("Moda y accesorios", "moda-accesorios", "shirt");
    const hogar = await createCategoria("Hogar y jardín", "hogar-jardin", "home");
    const electrodomesticos = await createCategoria("Electrodomésticos", "electrodomesticos", "washing-machine");
    const deporte = await createCategoria("Deporte y ocio", "deporte-ocio", "dumbbell");
    const gaming = await createCategoria("Videojuegos y gaming", "videojuegos-gaming", "gamepad-2");
    const cine = await createCategoria("Cine, libros y música", "cine-libros-musica", "book");
    const ninos = await createCategoria("Niños y bebés", "ninos-bebes", "baby");
    const mascotas = await createCategoria("Mascotas", "mascotas", "paw-print");
    const coleccionismo = await createCategoria("Coleccionismo", "coleccionismo", "package");
    const bricolaje = await createCategoria("Herramientas y bricolaje", "herramientas-bricolaje", "hammer");
    const industria = await createCategoria("Industria y negocio", "industria-negocio", "briefcase");
    const motor = await createCategoria("Motor y accesorios", "motor-accesorios", "car");
    const salud = await createCategoria("Salud y belleza", "salud-belleza", "heart-pulse");
    const otros = await createCategoria("Otros", "otros", "boxes");
    await createCategoria("Smartphones", "smartphones", "smartphone", tecnologia.id_categoria);
    await createCategoria("Ordenadores", "ordenadores", "computer", tecnologia.id_categoria);
    await createCategoria("Tablets", "tablets", "tablet", tecnologia.id_categoria);
    await createCategoria("Gaming", "gaming-tech", "gamepad-2", tecnologia.id_categoria);
    await createCategoria("Audio", "audio", "headphones", tecnologia.id_categoria);
    await createCategoria("Fotografía", "fotografia", "camera", tecnologia.id_categoria);
    await createCategoria("Smartwatch", "smartwatch", "watch", tecnologia.id_categoria);
    await createCategoria("Componentes PC", "componentes-pc", "cpu", tecnologia.id_categoria);
    await createCategoria("Monitores", "monitores", "monitor", tecnologia.id_categoria);
    await createCategoria("Accesorios", "accesorios-tech", "cable", tecnologia.id_categoria);
    await createCategoria("Hombre", "moda-hombre", "shirt", moda.id_categoria);
    await createCategoria("Mujer", "moda-mujer", "shirt", moda.id_categoria);
    await createCategoria("Infantil", "moda-infantil", "baby", moda.id_categoria);
    await createCategoria("Calzado", "calzado", "footprints", moda.id_categoria);
    await createCategoria("Bolsos", "bolsos", "briefcase", moda.id_categoria);
    await createCategoria("Joyería", "joyeria", "gem", moda.id_categoria);
    await createCategoria("Relojes", "relojes", "watch", moda.id_categoria);
    await createCategoria("Muebles", "muebles", "sofa", hogar.id_categoria);
    await createCategoria("Decoración", "decoracion", "lamp", hogar.id_categoria);
    await createCategoria("Cocina", "hogar-cocina", "chef-hat", hogar.id_categoria);
    await createCategoria("Jardinería", "jardineria", "trees", hogar.id_categoria);
    await createCategoria("Iluminación", "iluminacion", "lightbulb", hogar.id_categoria);
    await createCategoria("Cocina", "electro-cocina", "microwave", electrodomesticos.id_categoria);
    await createCategoria("Limpieza", "limpieza", "spray-can", electrodomesticos.id_categoria);
    await createCategoria("Climatización", "climatizacion", "fan", electrodomesticos.id_categoria);
    await createCategoria("Fitness", "fitness", "dumbbell", deporte.id_categoria);
    await createCategoria("Camping", "camping", "tent", deporte.id_categoria);
    await createCategoria("Running", "running", "person-standing", deporte.id_categoria);
    await createCategoria("Fútbol", "futbol", "goal", deporte.id_categoria);
    await createCategoria("Consolas", "consolas", "gamepad-2", gaming.id_categoria);
    await createCategoria("Videojuegos", "videojuegos", "disc-3", gaming.id_categoria);
    await createCategoria("Mandos", "mandos", "gamepad", gaming.id_categoria);
    await createCategoria("PC Gaming", "pc-gaming", "monitor", gaming.id_categoria);
    await createCategoria("Libros", "libros", "book-open", cine.id_categoria);
    await createCategoria("Cómics", "comics", "book-copy", cine.id_categoria);
    await createCategoria("Películas", "peliculas", "film", cine.id_categoria);
    await createCategoria("Vinilos", "vinilos", "disc-3", cine.id_categoria);
    await createCategoria("Ropa infantil", "ropa-infantil", "baby", ninos.id_categoria);
    await createCategoria("Juguetes", "juguetes", "toy-brick", ninos.id_categoria);
    await createCategoria("Carritos", "carritos", "baby", ninos.id_categoria);
    await createCategoria("Cartas", "cartas", "package", coleccionismo.id_categoria);
    await createCategoria("Figuras", "figuras", "package", coleccionismo.id_categoria);
    await createCategoria("Retro", "retro", "radio", coleccionismo.id_categoria);
    await createCategoria("Herramientas eléctricas", "herramientas-electricas", "drill", bricolaje.id_categoria);
    await createCategoria("Herramientas manuales", "herramientas-manuales", "hammer", bricolaje.id_categoria);
    await createCategoria("Pintura", "pintura", "paintbrush", bricolaje.id_categoria);
    await createCategoria("Oficina", "oficina", "briefcase", industria.id_categoria);
    await createCategoria("Hostelería", "hosteleria", "utensils", industria.id_categoria);
    await createCategoria("Comercio", "comercio", "store", industria.id_categoria);
    await createCategoria("Recambios", "recambios", "wrench", motor.id_categoria);
    await createCategoria("Accesorios coche", "accesorios-coche", "car", motor.id_categoria);
    await createCategoria("Accesorios moto", "accesorios-moto", "bike", motor.id_categoria);
    await createCategoria("Cosmética", "cosmetica", "sparkles", salud.id_categoria);
    await createCategoria("Cuidado personal", "cuidado-personal", "heart", salud.id_categoria);
    await createCategoria("Perfumería", "perfumeria", "spray-can", salud.id_categoria);
    console.log("Seed ejecutado correctamente");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map
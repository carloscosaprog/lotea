import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMensajeDto } from './dto/CreateMensajeDto';

@Injectable()
export class MensajesService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateMensajeDto, id_emisor: number) {
    return this.prisma.mensaje.create({
      data: { id_emisor, id_receptor: dto.id_receptor, contenido: dto.contenido },
      include: {
        emisor: { select: { id_usuario: true, nombre: true, avatar: true } },
        receptor: { select: { id_usuario: true, nombre: true, avatar: true } },
      },
    });
  }

  /** Conversación entre dos usuarios */
  getConversacion(id_usuario: number, id_otro: number) {
    return this.prisma.mensaje.findMany({
      where: {
        OR: [
          { id_emisor: id_usuario, id_receptor: id_otro },
          { id_emisor: id_otro, id_receptor: id_usuario },
        ],
      },
      orderBy: { fecha: 'asc' },
      include: {
        emisor: { select: { id_usuario: true, nombre: true, avatar: true } },
        receptor: { select: { id_usuario: true, nombre: true, avatar: true } },
      },
    });
  }

  /** Lista de conversaciones (últimos mensajes con cada interlocutor) */
  async getConversaciones(id_usuario: number) {
    const mensajes = await this.prisma.mensaje.findMany({
      where: {
        OR: [{ id_emisor: id_usuario }, { id_receptor: id_usuario }],
      },
      orderBy: { fecha: 'desc' },
      include: {
        emisor: { select: { id_usuario: true, nombre: true, avatar: true } },
        receptor: { select: { id_usuario: true, nombre: true, avatar: true } },
      },
    });

    // Agrupar por interlocutor, quedarse con el último mensaje de cada uno
    const mapaConversaciones = new Map<number, (typeof mensajes)[0]>();
    for (const m of mensajes) {
      const interlocutorId = m.id_emisor === id_usuario ? m.id_receptor : m.id_emisor;
      if (!mapaConversaciones.has(interlocutorId)) {
        mapaConversaciones.set(interlocutorId, m);
      }
    }
    return Array.from(mapaConversaciones.values());
  }

  async remove(id: number) {
    const msg = await this.prisma.mensaje.findUnique({ where: { id_mensaje: id } });
    if (!msg) throw new NotFoundException(`Mensaje ${id} no encontrado`);
    await this.prisma.mensaje.delete({ where: { id_mensaje: id } });
    return { message: `Mensaje ${id} eliminado` };
  }
}

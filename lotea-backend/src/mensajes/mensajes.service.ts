import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateMensajeDto } from "./dto/CreateMensajeDto";

type MensajeRow = {
  id_mensaje: number;
  id_emisor: number;
  id_receptor: number;
  id_lote: number | null;
  contenido: string;
  fecha: Date;
  leido: boolean;
  emisor_nombre: string;
  emisor_avatar: string | null;
  receptor_nombre: string;
  receptor_avatar: string | null;
  lote_titulo: string | null;
  lote_imagen: string | null;
};

@Injectable()
export class MensajesService {
  constructor(private readonly prisma: PrismaService) {}

  private toMensaje(row: MensajeRow) {
    return {
      id_mensaje: row.id_mensaje,
      id_emisor: row.id_emisor,
      id_receptor: row.id_receptor,
      id_lote: row.id_lote,
      contenido: row.contenido,
      fecha: row.fecha,
      leido: row.leido,
      emisor: {
        id_usuario: row.id_emisor,
        nombre: row.emisor_nombre,
        avatar: row.emisor_avatar,
      },
      receptor: {
        id_usuario: row.id_receptor,
        nombre: row.receptor_nombre,
        avatar: row.receptor_avatar,
      },
      lote: row.id_lote
        ? {
            id_lote: row.id_lote,
            titulo: row.lote_titulo,
            imagenes: row.lote_imagen ? [{ url: row.lote_imagen }] : [],
          }
        : null,
    };
  }

  async create(dto: CreateMensajeDto, id_emisor: number) {
    const id_receptor = dto.id_receptor ?? dto.receiverId;
    const id_lote = dto.id_lote ?? dto.loteId;
    const contenido = dto.contenido ?? dto.text;

    if (!id_receptor || !id_lote || !contenido?.trim()) {
      throw new BadRequestException("Faltan id_receptor, id_lote o contenido");
    }

    const rows = await this.prisma.$queryRaw<MensajeRow[]>`
      WITH inserted AS (
        INSERT INTO mensaje (id_emisor, id_receptor, id_lote, contenido)
        VALUES (${id_emisor}, ${id_receptor}, ${id_lote}, ${contenido.trim()})
        RETURNING *
      )
      SELECT
        m.id_mensaje,
        m.id_emisor,
        m.id_receptor,
        m.id_lote,
        m.contenido,
        m.fecha,
        m.leido,
        emisor.nombre AS emisor_nombre,
        emisor.avatar AS emisor_avatar,
        receptor.nombre AS receptor_nombre,
        receptor.avatar AS receptor_avatar,
        lote.titulo AS lote_titulo,
        imagen.url AS lote_imagen
      FROM inserted m
      JOIN usuario emisor ON emisor.id_usuario = m.id_emisor
      JOIN usuario receptor ON receptor.id_usuario = m.id_receptor
      LEFT JOIN lote ON lote.id_lote = m.id_lote
      LEFT JOIN LATERAL (
        SELECT url
        FROM imagen_lote
        WHERE id_lote = m.id_lote
        ORDER BY es_principal DESC, id_imagen ASC
        LIMIT 1
      ) imagen ON true
    `;

    return this.toMensaje(rows[0]);
  }

  async getConversacion(id_usuario: number, id_lote: number, id_otro: number) {
    const rows = await this.prisma.$queryRaw<MensajeRow[]>`
      SELECT
        m.id_mensaje,
        m.id_emisor,
        m.id_receptor,
        m.id_lote,
        m.contenido,
        m.fecha,
        m.leido,
        emisor.nombre AS emisor_nombre,
        emisor.avatar AS emisor_avatar,
        receptor.nombre AS receptor_nombre,
        receptor.avatar AS receptor_avatar,
        lote.titulo AS lote_titulo,
        imagen.url AS lote_imagen
      FROM mensaje m
      JOIN usuario emisor ON emisor.id_usuario = m.id_emisor
      JOIN usuario receptor ON receptor.id_usuario = m.id_receptor
      LEFT JOIN lote ON lote.id_lote = m.id_lote
      LEFT JOIN LATERAL (
        SELECT url
        FROM imagen_lote
        WHERE id_lote = m.id_lote
        ORDER BY es_principal DESC, id_imagen ASC
        LIMIT 1
      ) imagen ON true
      WHERE m.id_lote = ${id_lote}
        AND (
          (m.id_emisor = ${id_usuario} AND m.id_receptor = ${id_otro})
          OR
          (m.id_emisor = ${id_otro} AND m.id_receptor = ${id_usuario})
        )
      ORDER BY m.fecha ASC
    `;

    return rows.map((row) => this.toMensaje(row));
  }

  async getConversaciones(id_usuario: number) {
    const rows = await this.prisma.$queryRaw<
      (MensajeRow & { unread_count: bigint })[]
    >`
      WITH ranked AS (
        SELECT
          m.*,
          CASE
            WHEN m.id_emisor = ${id_usuario} THEN m.id_receptor
            ELSE m.id_emisor
          END AS id_otro,
          ROW_NUMBER() OVER (
            PARTITION BY m.id_lote,
              CASE
                WHEN m.id_emisor = ${id_usuario} THEN m.id_receptor
                ELSE m.id_emisor
              END
            ORDER BY m.fecha DESC
          ) AS rn
        FROM mensaje m
        WHERE (m.id_emisor = ${id_usuario} OR m.id_receptor = ${id_usuario})
          AND m.id_lote IS NOT NULL
      ),
      unread AS (
        SELECT id_lote, id_emisor AS id_otro, COUNT(*) AS unread_count
        FROM mensaje
        WHERE id_receptor = ${id_usuario} AND leido = false
        GROUP BY id_lote, id_emisor
      )
      SELECT
        r.id_mensaje,
        r.id_emisor,
        r.id_receptor,
        r.id_lote,
        r.contenido,
        r.fecha,
        r.leido,
        emisor.nombre AS emisor_nombre,
        emisor.avatar AS emisor_avatar,
        receptor.nombre AS receptor_nombre,
        receptor.avatar AS receptor_avatar,
        lote.titulo AS lote_titulo,
        imagen.url AS lote_imagen,
        COALESCE(unread.unread_count, 0) AS unread_count
      FROM ranked r
      JOIN usuario emisor ON emisor.id_usuario = r.id_emisor
      JOIN usuario receptor ON receptor.id_usuario = r.id_receptor
      LEFT JOIN lote ON lote.id_lote = r.id_lote
      LEFT JOIN unread ON unread.id_lote = r.id_lote AND unread.id_otro = r.id_otro
      LEFT JOIN LATERAL (
        SELECT url
        FROM imagen_lote
        WHERE id_lote = r.id_lote
        ORDER BY es_principal DESC, id_imagen ASC
        LIMIT 1
      ) imagen ON true
      WHERE r.rn = 1
      ORDER BY r.fecha DESC
    `;

    return rows.map((row) => {
      const mensaje = this.toMensaje(row);
      const otherUser =
        mensaje.id_emisor === id_usuario ? mensaje.receptor : mensaje.emisor;

      return {
        id:
          mensaje.id_lote && otherUser.id_usuario
            ? `${mensaje.id_lote}-${otherUser.id_usuario}`
            : `${mensaje.id_mensaje}`,
        id_lote: mensaje.id_lote,
        otherUserId: otherUser.id_usuario,
        otherUserName: otherUser.nombre,
        otherUserAvatar: otherUser.avatar,
        loteTitulo: mensaje.lote?.titulo,
        loteImagen: mensaje.lote?.imagenes?.[0]?.url ?? null,
        lastMessage: mensaje.contenido,
        lastMessageAt: mensaje.fecha,
        unreadCount: Number(row.unread_count ?? 0),
      };
    });
  }

  async marcarConversacionLeida(
    id_usuario: number,
    id_lote: number,
    id_otro: number,
  ) {
    await this.prisma.$executeRaw`
      UPDATE mensaje
      SET leido = true
      WHERE id_lote = ${id_lote}
        AND id_emisor = ${id_otro}
        AND id_receptor = ${id_usuario}
        AND leido = false
    `;

    return { ok: true };
  }

  async remove(id: number) {
    const msg = await this.prisma.mensaje.findUnique({
      where: { id_mensaje: id },
    });
    if (!msg) throw new NotFoundException(`Mensaje ${id} no encontrado`);
    await this.prisma.mensaje.delete({ where: { id_mensaje: id } });
    return { message: `Mensaje ${id} eliminado` };
  }

  async removeConversacion(
    id_usuario: number,
    id_lote: number,
    id_otro: number,
  ) {
    await this.prisma.$executeRaw`
      DELETE FROM mensaje
      WHERE id_lote = ${id_lote}
        AND (
          (id_emisor = ${id_usuario} AND id_receptor = ${id_otro})
          OR
          (id_emisor = ${id_otro} AND id_receptor = ${id_usuario})
        )
    `;

    return { ok: true };
  }
}

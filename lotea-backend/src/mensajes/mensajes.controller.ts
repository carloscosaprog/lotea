import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CreateMensajeDto } from './dto/CreateMensajeDto';
import { MensajesService } from './mensajes.service';

@UseGuards(JwtAuthGuard)
@Controller('mensajes')
export class MensajesController {
  constructor(private readonly mensajesService: MensajesService) {}

  @Post()
  create(@Body() dto: CreateMensajeDto, @CurrentUser() user: JwtUser) {
    return this.mensajesService.create(dto, user.sub);
  }

  /** GET /mensajes/conversaciones → lista de últimos mensajes por interlocutor */
  @Get('conversaciones')
  getConversaciones(@CurrentUser() user: JwtUser) {
    return this.mensajesService.getConversaciones(user.sub);
  }

  /** GET /mensajes/conversacion/:id_otro → hilo completo con un usuario */
  @Get('conversacion/:id_otro')
  getConversacion(
    @Param('id_otro', ParseIntPipe) id_otro: number,
    @CurrentUser() user: JwtUser,
  ) {
    return this.mensajesService.getConversacion(user.sub, id_otro);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mensajesService.remove(id);
  }
}

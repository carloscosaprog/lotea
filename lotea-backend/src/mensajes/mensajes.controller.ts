import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
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

  @Get('conversaciones')
  getConversaciones(@CurrentUser() user: JwtUser) {
    return this.mensajesService.getConversaciones(user.sub);
  }

  @Get('conversacion/:id_lote/:id_otro')
  getConversacion(
    @Param('id_lote', ParseIntPipe) id_lote: number,
    @Param('id_otro', ParseIntPipe) id_otro: number,
    @CurrentUser() user: JwtUser,
  ) {
    return this.mensajesService.getConversacion(user.sub, id_lote, id_otro);
  }

  @Patch('conversacion/:id_lote/:id_otro/leido')
  marcarConversacionLeida(
    @Param('id_lote', ParseIntPipe) id_lote: number,
    @Param('id_otro', ParseIntPipe) id_otro: number,
    @CurrentUser() user: JwtUser,
  ) {
    return this.mensajesService.marcarConversacionLeida(user.sub, id_lote, id_otro);
  }

  @Delete('conversacion/:id_lote/:id_otro')
  removeConversacion(
    @Param('id_lote', ParseIntPipe) id_lote: number,
    @Param('id_otro', ParseIntPipe) id_otro: number,
    @CurrentUser() user: JwtUser,
  ) {
    return this.mensajesService.removeConversacion(user.sub, id_lote, id_otro);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.mensajesService.remove(id);
  }
}

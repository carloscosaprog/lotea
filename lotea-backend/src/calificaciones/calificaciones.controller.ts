import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CalificacionesService } from './calificaciones.service';
import { CreateCalificacionDto } from './dto/CreateCalificacionDto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CalificacionesController {
  constructor(private readonly calificacionesService: CalificacionesService) {}

  @Post('calificaciones')
  create(@Body() dto: CreateCalificacionDto, @CurrentUser() user: JwtUser) {
    return this.calificacionesService.create(dto, user.sub);
  }

  @Get('usuarios/:id/calificaciones')
  findByVendedor(@Param('id', ParseIntPipe) id: number) {
    return this.calificacionesService.findByVendedor(id);
  }

  @Get('usuarios/:id/resumen-calificaciones')
  getResumenByVendedor(@Param('id', ParseIntPipe) id: number) {
    return this.calificacionesService.getResumenByVendedor(id);
  }
}

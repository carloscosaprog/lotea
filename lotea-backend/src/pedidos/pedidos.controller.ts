import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtUser } from '../auth/interfaces/jwt-user.interface';
import { CreatePedidoDto } from './dto/CreatePedidoDto';
import { UpdatePedidoDto } from './dto/UpdatePedidoDto';
import { PedidosService } from './pedidos.service';

@UseGuards(JwtAuthGuard)
@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Post()
  create(@Body() dto: CreatePedidoDto, @CurrentUser() user: JwtUser) {
    return this.pedidosService.create(dto, user.sub);
  }

  @Get()
  findMine(@CurrentUser() user: JwtUser) {
    return this.pedidosService.findByUsuario(user.sub);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePedidoDto) {
    return this.pedidosService.update(id, dto);
  }
}

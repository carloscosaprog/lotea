import { IsEnum } from 'class-validator';

export class UpdatePedidoDto {
  @IsEnum(['pendiente', 'completado', 'cancelado'])
  estado: 'pendiente' | 'completado' | 'cancelado';
}

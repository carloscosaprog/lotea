import { IsEnum } from 'class-validator';

export class UpdatePedidoDto {
  @IsEnum([
    'pendiente_pago',
    'pagado',
    'preparando',
    'enviado',
    'entregado',
    'cancelado',
  ])
  estado:
    | 'pendiente_pago'
    | 'pagado'
    | 'preparando'
    | 'enviado'
    | 'entregado'
    | 'cancelado';
}

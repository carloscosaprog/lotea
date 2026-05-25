import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export enum MetodoPagoDto {
  tarjeta = 'tarjeta',
  paypal = 'paypal',
  bizum = 'bizum',
  transferencia = 'transferencia',
}

export class DetallePedidoDto {
  @IsInt()
  id_lote: number;

  @IsInt()
  @Min(1)
  cantidad: number;

  @IsNumber()
  @Min(0)
  precio_unitario: number;
}

export class CreatePedidoDto {
  @IsOptional()
  @IsInt()
  id_lote?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  cantidad?: number;

  @IsEnum(MetodoPagoDto)
  metodo_pago: MetodoPagoDto;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  direccion_entrega?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetallePedidoDto)
  detalles?: DetallePedidoDto[];
}

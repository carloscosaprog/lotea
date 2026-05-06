import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateMensajeDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_receptor?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  contenido?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  receiverId?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  text?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  senderId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  conversationId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_lote?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  loteId?: number;
}

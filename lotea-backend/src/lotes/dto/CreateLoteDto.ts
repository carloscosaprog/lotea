import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateLoteDto {
  @IsString()
  titulo: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  precio: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  cantidad: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  id_categoria?: number;
}

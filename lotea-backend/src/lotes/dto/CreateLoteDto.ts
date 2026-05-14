import { Transform, Type } from "class-transformer";
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from "class-validator";

const parseCategoriasIds = (value: unknown): number[] | undefined => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const rawValues = Array.isArray(value) ? value : [value];

  return rawValues
    .flatMap((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();

        if (!trimmed) return [];

        if (trimmed.startsWith("[")) {
          try {
            const parsed = JSON.parse(trimmed);
            return Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            return [trimmed];
          }
        }

        return trimmed.split(",");
      }

      return [item];
    })
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item));
};

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

  @Transform(({ value }) => parseCategoriasIds(value))
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: false })
  categoriasIds: number[];
}

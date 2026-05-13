import { Type } from "class-transformer";
import { IsIn, IsNumber, IsOptional, Min } from "class-validator";

export class LoteQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxDistance?: number;

  @IsOptional()
  @IsIn(["newest", "nearest"])
  sortBy?: "newest" | "nearest";
}

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
} from "@nestjs/common";
import { CurrentUser } from "../auth/current-user.decorator";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { JwtUser } from "../auth/interfaces/jwt-user.interface";
import { CreateLoteDto } from "./dto/CreateLoteDto";
import { UpdateLoteDto } from "./dto/UpdateLoteDto";
import { LotesService } from "./lotes.service";
import { UseInterceptors, UploadedFiles } from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";

@Controller("lotes")
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(FilesInterceptor("imagenesFiles"))
  create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() dto: CreateLoteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.lotesService.create(dto, user.sub, files);
  }
  @Get()
  findAll() {
    return this.lotesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.lotesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLoteDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.lotesService.update(id, dto, user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number, @CurrentUser() user: JwtUser) {
    return this.lotesService.remove(id, user.sub);
  }

  @Get("vendedor/:id")
  findByVendedor(@Param("id", ParseIntPipe) id: number) {
    return this.lotesService.findByVendedor(id);
  }
}

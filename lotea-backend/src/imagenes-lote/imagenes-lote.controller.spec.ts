import { Test, TestingModule } from '@nestjs/testing';
import { ImagenesLoteController } from './imagenes-lote.controller';
import { ImagenesLoteService } from './imagenes-lote.service';

describe('ImagenesLoteController', () => {
  let controller: ImagenesLoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImagenesLoteController],
      providers: [{ provide: ImagenesLoteService, useValue: {} }],
    }).compile();

    controller = module.get<ImagenesLoteController>(ImagenesLoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

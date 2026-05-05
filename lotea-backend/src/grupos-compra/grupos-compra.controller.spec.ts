import { Test, TestingModule } from '@nestjs/testing';
import { GruposCompraController } from './grupos-compra.controller';
import { GruposCompraService } from './grupos-compra.service';

describe('GruposCompraController', () => {
  let controller: GruposCompraController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GruposCompraController],
      providers: [{ provide: GruposCompraService, useValue: {} }],
    }).compile();

    controller = module.get<GruposCompraController>(GruposCompraController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SolicitudesLoteController } from './solicitudes-lote.controller';
import { SolicitudesLoteService } from './solicitudes-lote.service';

describe('SolicitudesLoteController', () => {
  let controller: SolicitudesLoteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SolicitudesLoteController],
      providers: [{ provide: SolicitudesLoteService, useValue: {} }],
    }).compile();

    controller = module.get<SolicitudesLoteController>(SolicitudesLoteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

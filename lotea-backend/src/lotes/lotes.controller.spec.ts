import { Test, TestingModule } from '@nestjs/testing';
import { LotesController } from './lotes.controller';
import { LotesService } from './lotes.service';

describe('LotesController', () => {
  let controller: LotesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LotesController],
      providers: [{ provide: LotesService, useValue: {} }],
    }).compile();

    controller = module.get<LotesController>(LotesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

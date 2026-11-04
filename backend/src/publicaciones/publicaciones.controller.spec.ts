import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { PublicacionesController } from './publicaciones.controller.js';
import { PublicacionesService } from './publicaciones.service.js';
import { FileService } from '../archivos/file.service.js';

describe('PublicacionesController', () => {
  let controller: PublicacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicacionesController],
      providers: [
        // Dependencias simuladas: acá sólo probamos que el controller se cree
        { provide: PublicacionesService, useValue: {} },
        { provide: FileService, useValue: {} },
        { provide: JwtService, useValue: {} }, // lo necesita el AuthGuard
      ],
    }).compile();

    controller = module.get<PublicacionesController>(PublicacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

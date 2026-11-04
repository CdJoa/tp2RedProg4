import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PublicacionesService } from './publicaciones.service.js';

describe('PublicacionesService', () => {
  let service: PublicacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicacionesService,
        // Modelo de Mongoose simulado: el test no se conecta a la base
        { provide: getModelToken('Publicacion'), useValue: {} },
      ],
    }).compile();

    service = module.get<PublicacionesService>(PublicacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

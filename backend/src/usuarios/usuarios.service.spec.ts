import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PasswordHasher } from '@nestjs/authentication';
import { UsuariosService } from './usuarios.service.js';

describe('UsuariosService', () => {
  let service: UsuariosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        // Modelo de Mongoose simulado: el test no se conecta a la base
        { provide: getModelToken('Usuario'), useValue: {} },
        // Hasher barato para tests (logN bajo)
        { provide: PasswordHasher, useValue: new PasswordHasher({ logN: 10 }) },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

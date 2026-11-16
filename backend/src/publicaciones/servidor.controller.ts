import { Controller, Get } from '@nestjs/common';
import { ServidorService } from './servidor.service.js';

// GET /servidor/estado → { online: boolean, desde: fecha | null }
// Es PÚBLICA (sin AuthGuard): la usa la pantalla de login, donde todavía no hay token.
// No devuelve datos privados, sólo si el servidor está online o en mantenimiento.
@Controller('servidor')
export class ServidorController {
  constructor(private readonly servidorService: ServidorService) {}

  @Get('estado')
  estado() {
    return this.servidorService.estado();
  }
}

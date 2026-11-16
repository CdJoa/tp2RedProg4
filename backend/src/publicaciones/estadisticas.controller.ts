import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service.js';
import { AuthGuard } from '../guards/auth/auth.guard.js';
import { AdminGuard } from '../guards/admin/admin.guard.js';

// Rutas para los gráficos del dashboard. Sólo administradores.
// Todas aceptan ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD (sin fechas: últimos 30 días)
@UseGuards(AuthGuard, AdminGuard)
@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly estadisticasService: EstadisticasService) {}

  // GET /estadisticas/publicaciones-por-usuario  → [{ nombreUsuario, cantidad }]
  @Get('publicaciones-por-usuario')
  publicacionesPorUsuario(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.publicacionesPorUsuario(desde, hasta);
  }

  // GET /estadisticas/comentarios  → { total, dias: [{ fecha, cantidad }] }
  @Get('comentarios')
  comentarios(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.comentariosPorDia(desde, hasta);
  }

  // GET /estadisticas/comentarios-por-publicacion  → [{ titulo, cantidad }]
  @Get('comentarios-por-publicacion')
  comentariosPorPublicacion(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.comentariosPorPublicacion(desde, hasta);
  }

  // GET /estadisticas/usuarios  → { total, dias: [{ fecha, cantidad }] } (registros por día)
  @Get('usuarios')
  usuarios(@Query('desde') desde?: string, @Query('hasta') hasta?: string) {
    return this.estadisticasService.usuariosPorDia(desde, hasta);
  }
}

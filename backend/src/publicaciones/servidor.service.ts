import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion } from './entities/publicacion.entity.js';

// Títulos que publica la pestaña "Mantenimiento" del panel de administración
const INICIO = /mantenimiento en curso/i;
const FIN = /mantenimiento finalizado/i;

// Estado del servidor de juego "simulado" (online / en mantenimiento).
// No se guarda en ningún lado: se deduce del último comunicado de mantenimiento
// publicado por un administrador.
//   - último = "Mantenimiento en curso"   → offline
//   - último = "Mantenimiento finalizado" → online
//   - no hay ninguno (o lo borraron)       → online
@Injectable()
export class ServidorService {
  constructor(@InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>) {}

  async estado() {
    // Las últimas publicaciones activas con alguno de esos títulos, más nuevas primero
    const candidatas = await this.publicacionModel
      .find({ activa: true, titulo: { $regex: /mantenimiento (en curso|finalizado)/i } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate<{ usuario: { perfil?: string } | null }>('usuario', 'perfil')
      .exec();

    // Sólo cuentan las del staff: un usuario común no puede "apagar" el servidor
    const ultima = candidatas.find((p) => p.usuario?.perfil === 'administrador');
    const enMantenimiento = !!ultima && INICIO.test(ultima.titulo) && !FIN.test(ultima.titulo);

    return {
      online: !enMantenimiento,
      // Desde cuándo está en ese estado (fecha del comunicado), o null si nunca hubo
      desde: (ultima as { createdAt?: Date } | undefined)?.createdAt ?? null,
    };
  }
}

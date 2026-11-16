import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Publicacion } from './entities/publicacion.entity.js';
import { Comentario } from './entities/comentario.entity.js';

// Zona horaria para agrupar por día y para interpretar las fechas desde/hasta
const ZONA = 'America/Argentina/Buenos_Aires';

// $lookup que trae el documento relacionado aunque el id esté guardado como texto.
// (Los ids de usuario/publicación quedaron guardados como string en la base y el
// _id de la otra colección es ObjectId: un $lookup común nunca los encuentra.
// $toObjectId convierte el string; si ya es ObjectId, lo deja igual.)
function buscarPorId(from: string, as: string) {
  return {
    $lookup: {
      from,
      let: { id: { $toObjectId: '$_id' } },
      pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$id'] } } }],
      as,
    },
  };
}

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>,
    @InjectModel(Comentario.name) private readonly comentarioModel: Model<Comentario>,
  ) {}

  // Convierte ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD en un rango de fechas.
  // "hasta" incluye todo ese día. Sin parámetros: los últimos 30 días.
  private rango(desde?: string, hasta?: string) {
    const formato = /^\d{4}-\d{2}-\d{2}$/;
    if ((desde && !formato.test(desde)) || (hasta && !formato.test(hasta))) {
      throw new BadRequestException('Las fechas deben tener el formato YYYY-MM-DD');
    }

    const fin = hasta ? new Date(`${hasta}T23:59:59.999-03:00`) : new Date();
    const inicio = desde
      ? new Date(`${desde}T00:00:00.000-03:00`)
      : new Date(fin.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      throw new BadRequestException('Alguna de las fechas no es válida');
    }
    if (inicio > fin) {
      throw new BadRequestException("La fecha 'desde' no puede ser posterior a 'hasta'");
    }
    return { $gte: inicio, $lte: fin };
  }

  // Cantidad de publicaciones de cada usuario en el lapso (más publicaciones primero)
  async publicacionesPorUsuario(desde?: string, hasta?: string) {
    return this.publicacionModel.aggregate([
      { $match: { activa: true, createdAt: this.rango(desde, hasta) } },
      { $group: { _id: '$usuario', cantidad: { $sum: 1 } } },
      // Trae los datos del usuario (como un populate)
      buscarPorId('usuarios', 'usuario'),
      { $unwind: '$usuario' },
      {
        $project: {
          _id: 0,
          usuarioId: '$_id',
          nombreUsuario: '$usuario.nombreUsuario',
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, nombreUsuario: 1 } },
    ]);
  }

  // Cantidad de comentarios en el lapso, agrupados por día (para un gráfico de líneas)
  async comentariosPorDia(desde?: string, hasta?: string) {
    const dias: { fecha: string; cantidad: number }[] = await this.comentarioModel.aggregate([
      { $match: { activo: { $ne: false }, createdAt: this.rango(desde, hasta) } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ZONA } },
          cantidad: { $sum: 1 },
        },
      },
      { $project: { _id: 0, fecha: '$_id', cantidad: 1 } },
      { $sort: { fecha: 1 } },
    ]);
    const total = dias.reduce((suma, d) => suma + d.cantidad, 0);
    return { total, dias };
  }

  // Cantidad de usuarios registrados en el lapso, agrupados por día
  async usuariosPorDia(desde?: string, hasta?: string) {
    // La colección de usuarios es de otro módulo: se lee directo desde la conexión
    const dias = (await this.publicacionModel.db
      .collection('usuarios')
      .aggregate([
        { $match: { createdAt: this.rango(desde, hasta) } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: ZONA } },
            cantidad: { $sum: 1 },
          },
        },
        { $project: { _id: 0, fecha: '$_id', cantidad: 1 } },
        { $sort: { fecha: 1 } },
      ])
      .toArray()) as { fecha: string; cantidad: number }[];
    const total = dias.reduce((suma, d) => suma + d.cantidad, 0);
    return { total, dias };
  }

  // Cantidad de comentarios de cada publicación en el lapso (más comentadas primero)
  async comentariosPorPublicacion(desde?: string, hasta?: string) {
    return this.comentarioModel.aggregate([
      { $match: { activo: { $ne: false }, createdAt: this.rango(desde, hasta) } },
      { $group: { _id: '$publicacion', cantidad: { $sum: 1 } } },
      buscarPorId(this.publicacionModel.collection.name, 'publicacion'),
      { $unwind: '$publicacion' },
      // Las publicaciones dadas de baja no se muestran
      { $match: { 'publicacion.activa': true } },
      {
        $project: {
          _id: 0,
          publicacionId: '$_id',
          titulo: '$publicacion.titulo',
          cantidad: 1,
        },
      },
      { $sort: { cantidad: -1, titulo: 1 } },
    ]);
  }
}

import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { Publicacion } from './entities/publicacion.entity.js';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name) private readonly publicacionModel: Model<Publicacion>,
  ) {}

  // Guarda la publicación con el id del autor (viene del token)
  // y la URL de la imagen ('' si no subió ninguna)
  async create(createPublicacionDto: CreatePublicacionDto, usuarioId: string, imagen = '') {
    return this.publicacionModel.create({
      ...createPublicacionDto,
      usuario: usuarioId,
      imagen,
    });
  }

  // GET /publicaciones?orden=fecha|meGusta&direccion=desc|asc&usuario=<id>&offset=0&limit=10
  async findAll(
    orden: string,
    direccion: string,
    usuario: string | undefined,
    offset: number,
    limit: number,
  ) {
    if (orden !== 'fecha' && orden !== 'meGusta') {
      throw new BadRequestException("orden debe ser 'fecha' o 'meGusta'");
    }
    if (direccion !== 'desc' && direccion !== 'asc') {
      throw new BadRequestException("direccion debe ser 'desc' o 'asc'");
    }
    if (offset < 0 || limit < 1 || limit > 50) {
      throw new BadRequestException('offset debe ser 0 o más, y limit entre 1 y 50');
    }

    // Sólo las activas; si viene usuario, sólo las de ese usuario
    const filtro: { activa: boolean; usuario?: string } = { activa: true };
    if (usuario) {
      if (!isValidObjectId(usuario)) {
        throw new BadRequestException('El id de usuario no es válido');
      }
      filtro.usuario = usuario;
    }

    // En Mongo: -1 = descendente (mayor a menor), 1 = ascendente (menor a mayor)
    // desc: más nuevas / más gustadas primero; asc: al revés
    const sentido = direccion === 'asc' ? 1 : -1;
    // Con meGusta, entre las que tienen la misma cantidad desempata por fecha
    const ordenamiento: Record<string, 1 | -1> =
      orden === 'meGusta'
        ? { cantidadMeGusta: sentido, createdAt: sentido }
        : { createdAt: sentido };

    const publicaciones = await this.publicacionModel
      .find(filtro)
      .sort(ordenamiento)
      .skip(offset) // saltea las primeras "offset"
      .limit(limit) // y trae como máximo "limit"
      .populate('usuario', 'nombre apellido nombreUsuario imagenPerfil')
      .exec();

    // total: cuántas hay en total con ese filtro (para saber cuántas páginas hay)
    const total = await this.publicacionModel.countDocuments(filtro);

    return { publicaciones, total, offset, limit };
  }

  // DELETE /publicaciones/:id  → baja lógica (sólo el autor)
  async remove(id: string, usuarioId: string) {
    const publicacion = await this.buscarActiva(id);

    if (publicacion.usuario.toString() !== usuarioId) {
      throw new ForbiddenException('Sólo el autor puede eliminar la publicación');
    }

    // No se borra de la base: se marca como inactiva
    publicacion.activa = false;
    await publicacion.save();
    return { message: 'Publicación eliminada' };
  }

  // POST /publicaciones/:id/me-gusta  → un solo me gusta por usuario
  async darMeGusta(id: string, usuarioId: string) {
    const publicacion = await this.buscarActiva(id);

    if (publicacion.meGusta.some((u) => u.toString() === usuarioId)) {
      throw new ConflictException('Ya le diste me gusta a esta publicación');
    }

    // $addToSet agrega el usuario sólo si no está; $inc suma 1 al contador
    await this.publicacionModel.updateOne(
      { _id: id, meGusta: { $ne: usuarioId } },
      { $addToSet: { meGusta: usuarioId }, $inc: { cantidadMeGusta: 1 } },
    );
    return { message: 'Me gusta agregado' };
  }

  // DELETE /publicaciones/:id/me-gusta  → sólo si el usuario lo había dado
  async quitarMeGusta(id: string, usuarioId: string) {
    const publicacion = await this.buscarActiva(id);

    if (!publicacion.meGusta.some((u) => u.toString() === usuarioId)) {
      throw new BadRequestException('No le habías dado me gusta a esta publicación');
    }

    // $pull saca al usuario del array; $inc resta 1 al contador
    await this.publicacionModel.updateOne(
      { _id: id, meGusta: usuarioId },
      { $pull: { meGusta: usuarioId }, $inc: { cantidadMeGusta: -1 } },
    );
    return { message: 'Me gusta quitado' };
  }

  // Busca una publicación activa por id; 400 si el id es inválido, 404 si no existe
  private async buscarActiva(id: string) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('El id de la publicación no es válido');
    }
    const publicacion = await this.publicacionModel.findOne({ _id: id, activa: true });
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe');
    }
    return publicacion;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreatePublicacionDto } from './dto/create-publicacion.dto.js';
import { UpdatePublicacionDto } from './dto/update-publicacion.dto.js';
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

  // Lista las publicaciones activas, las más nuevas primero,
  // con los datos del autor (populate reemplaza el _id por el usuario)
  findAll() {
    return this.publicacionModel
      .find({ activa: true })
      .sort({ createdAt: -1 })
      .populate('usuario', 'nombre apellido nombreUsuario imagenPerfil')
      .exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} publicacione`;
  }

  update(id: number, updatePublicacionDto: UpdatePublicacionDto) {
    return `This action updates a #${id} publicacione`;
  }

  remove(id: number) {
    return `This action removes a #${id} publicacione`;
  }
}

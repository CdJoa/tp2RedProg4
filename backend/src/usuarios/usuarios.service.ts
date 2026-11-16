import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { Usuario } from './entities/usuario.entity.js';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { Error as MongooseError, mongo } from 'mongoose';
import { PasswordHasher } from '@nestjs/authentication';


@Injectable()
export class UsuariosService {

  constructor(
    @InjectModel('Usuario') private readonly UsuarioModel: Model<Usuario>,
    private readonly hasher: PasswordHasher,
  ) {}

  async create(createUsuarioDto: CreateUsuarioDto) {
    try {
      const password = await this.hasher.hash(createUsuarioDto.password);
      const usuario = await this.UsuarioModel.create({ ...createUsuarioDto, password });
      const { password: _, ...usuarioSinPassword } = usuario.toObject();
      return usuarioSinPassword;
    } catch (error) {
      if (error instanceof MongooseError.ValidationError) {
        throw new BadRequestException(
          Object.values(error.errors).map((error) => error.message),
        );
      }

      if (error instanceof mongo.MongoServerError && error.code === 11000) {
        const campo = Object.keys(error.keyValue)[0];
        throw new ConflictException(`Ya existe un usuario con ese ${campo}`);
      }

      throw error;
    }
  }


  
  // Para el login: busca por email o nombre de usuario e incluye el password
  // (en la entidad tiene select: false).
  async findCredentials(identificador: string) {
    return this.UsuarioModel.findOne({
      $or: [{ email: identificador }, { nombreUsuario: identificador }],
    })
      .select('+password')
      .exec();
  }

  async updatePassword(id: string, passwordHash: string) {
    await this.UsuarioModel.updateOne({ _id: id }, { password: passwordHash }).exec();
  }

  // Cambia la foto de perfil y devuelve el usuario actualizado (sin password)
  async updateImagenPerfil(id: string, imagenPerfil: string) {
    return this.UsuarioModel.findByIdAndUpdate(id, { imagenPerfil }, { new: true }).exec();
  }

  async findById(id: string) {
    return this.UsuarioModel.findById(id).exec();
  }

  // GET /usuarios (admin): todos, los más nuevos primero (password no viene: select: false)
  async findAll() {
    return this.UsuarioModel.find().sort({ createdAt: -1 }).exec();
  }

  // DELETE /usuarios/:id (admin) → activo: false   |   POST /usuarios/:id/habilitar → activo: true
  async cambiarActivo(id: string, activo: boolean) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('El id de usuario no es válido');
    }
    const usuario = await this.UsuarioModel.findByIdAndUpdate(id, { activo }, { new: true }).exec();
    if (!usuario) {
      throw new NotFoundException('El usuario no existe');
    }
    return usuario;
  }
}

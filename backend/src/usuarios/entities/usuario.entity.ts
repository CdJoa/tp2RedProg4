import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Prop } from '@nestjs/mongoose';


@Schema({ timestamps: true })
export class Usuario {
    @Prop({ required: true })
    nombre: string;

    @Prop({ required: true })
    apellido: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true, unique: true })
    nombreUsuario: string;

    @Prop({ required: true, select: false })
    password: string;

    @Prop({ required: true })
    fechaNacimiento: Date;

    @Prop({ default: '' })
    descripcion: string;

    @Prop({ default: '' })
    imagenPerfil: string;

    @Prop({ enum: ['usuario', 'administrador'], default: 'usuario' })
    perfil: string;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);

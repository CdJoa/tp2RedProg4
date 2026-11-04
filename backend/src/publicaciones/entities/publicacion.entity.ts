import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class Publicacion {
    // Autor: guarda el _id del usuario y apunta a la colección de usuarios
    @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
    usuario: Types.ObjectId;

    @Prop({ required: true })
    titulo: string;

    @Prop({ required: true })
    descripcion: string;

    // URL de la imagen en Cloudinary ('' si no tiene)
    @Prop({ default: '' })
    imagen: string;

    // _id de los usuarios que dieron me gusta
    @Prop({ type: [Types.ObjectId], ref: 'Usuario', default: [] })
    meGusta: Types.ObjectId[];

    // Cantidad de me gusta, guardada aparte para poder ordenar por ella
    // (Mongo no ordena por el largo de un array con un find común)
    @Prop({ default: 0 })
    cantidadMeGusta: number;

    // Baja lógica: al eliminar se pone en false en vez de borrarla
    @Prop({ default: true })
    activa: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);

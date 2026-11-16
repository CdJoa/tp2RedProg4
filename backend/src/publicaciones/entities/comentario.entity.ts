import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

// timestamps: true agrega automáticamente createdAt (fecha de creación) y updatedAt
@Schema({ timestamps: true })
export class Comentario {
  // Publicación a la que pertenece el comentario
  @Prop({ type: Types.ObjectId, ref: 'Publicacion', required: true })
  publicacion: Types.ObjectId;

  // Autor del comentario
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuario: Types.ObjectId;

  @Prop({ required: true, trim: true })
  mensaje: string;

  // Se pone en true cuando el autor edita el comentario (PUT)
  @Prop({ default: false })
  modificado: boolean;

  // Baja lógica: al eliminar se pone en false en vez de borrarlo
  @Prop({ default: true })
  activo: boolean;
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);


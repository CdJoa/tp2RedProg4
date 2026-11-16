import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

// Se usa tanto para crear (POST) como para editar (PUT) un comentario.
// El autor sale del token y la publicación sale del parámetro :id de la URL.
export class ComentarioDto {
  @IsString({ message: 'El mensaje debe ser texto' })
  @IsNotEmpty({ message: 'El mensaje del comentario es obligatorio' })
  @MaxLength(500, { message: 'El comentario no puede superar los 500 caracteres' })
  mensaje: string;
}


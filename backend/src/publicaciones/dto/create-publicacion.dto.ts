import { IsNotEmpty, IsString } from 'class-validator';

// Lo que manda el usuario para crear una publicación.
// El autor NO se recibe acá: sale del token.
export class CreatePublicacionDto {
    @IsString({ message: 'El título debe ser texto' })
    @IsNotEmpty({ message: 'El título es obligatorio' })
    titulo: string;

    @IsString({ message: 'La descripción debe ser texto' })
    @IsNotEmpty({ message: 'La descripción es obligatoria' })
    descripcion: string;
}

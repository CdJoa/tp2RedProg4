export interface Usuario {
  _id: string;
  nombre: string;
  apellido: string;
  email: string;
  nombreUsuario: string;
  fechaNacimiento: string;
  descripcion: string;
  imagenPerfil: string;
  perfil: 'usuario' | 'administrador';
  createdAt: string;
  updatedAt: string;
}

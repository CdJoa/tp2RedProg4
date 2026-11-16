// Un comentario como lo devuelve GET /publicaciones/:id/comentarios
export interface Comentario {
  _id: string;
  publicacion: string; // id de la publicación
  mensaje: string;
  modificado: boolean; // true si el autor lo editó
  createdAt: string;
  // El back hace populate: en vez del id viene el autor
  usuario: {
    _id: string;
    nombre: string;
    apellido: string;
    nombreUsuario: string;
    imagenPerfil: string;
  };
}

// Respuesta paginada de GET /publicaciones/:id/comentarios
export interface PaginaComentarios {
  comentarios: Comentario[];
  total: number; // cuántos hay en total (para saber si mostrar "Cargar más")
  offset: number;
  limit: number;
}

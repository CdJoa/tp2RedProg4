import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { PaginaPublicaciones, Publicacion } from '../modelos/publicacion';
import { Comentario, PaginaComentarios } from '../modelos/comentario';
import { environment } from '../../environments/environment';
import { prepararImagen } from '../validadores/preparar-imagen';

export type Orden = 'fecha' | 'meGusta';
export type Direccion = 'desc' | 'asc';

@Service()
export class PublicacionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/publicaciones`;

  // GET /publicaciones?orden=...&direccion=...&offset=...&limit=...&usuario=...
  listar(
    orden: Orden,
    offset: number,
    limit: number,
    usuario?: string,
    direccion: Direccion = 'desc',
  ): Observable<PaginaPublicaciones> {
    let params = new HttpParams()
      .set('orden', orden)
      .set('direccion', direccion)
      .set('offset', offset)
      .set('limit', limit);
    if (usuario) {
      params = params.set('usuario', usuario);
    }
    return this.http.get<PaginaPublicaciones>(this.apiUrl, { params });
  }

  // Las que siguen necesitan token: lo agrega el tokenInterceptor

  // POST /publicaciones espera multipart/form-data (titulo, descripcion + archivo "imagen")
  // Si hay imagen, primero se achica (ver prepararImagen)
  crear(titulo: string, descripcion: string, archivo: File | null) {
    const imagen$: Observable<File | null> = archivo ? prepararImagen(archivo) : of(null);
    return imagen$.pipe(
      switchMap((imagen) => {
        const formData = new FormData();
        formData.append('titulo', titulo);
        formData.append('descripcion', descripcion);
        if (imagen) {
          formData.append('imagen', imagen);
        }
        return this.http.post(this.apiUrl, formData);
      }),
    );
  }

  darMeGusta(id: string) {
    return this.http.post(`${this.apiUrl}/${id}/me-gusta`, {});
  }

  quitarMeGusta(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}/me-gusta`);
  }

  eliminar(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  // GET /publicaciones/:id  → una sola publicación (para la página publicación)
  obtener(id: string) {
    return this.http.get<Publicacion>(`${this.apiUrl}/${id}`);
  }

  // --- Comentarios ---

  // GET /publicaciones/:id/comentarios?offset=...&limit=...  (más recientes primero)
  listarComentarios(id: string, offset: number, limit: number) {
    const params = new HttpParams().set('offset', offset).set('limit', limit);
    return this.http.get<PaginaComentarios>(`${this.apiUrl}/${id}/comentarios`, { params });
  }

  // POST /publicaciones/:id/comentarios  (JSON: { mensaje })
  comentar(id: string, mensaje: string) {
    return this.http.post<Comentario>(`${this.apiUrl}/${id}/comentarios`, { mensaje });
  }

  // PUT /publicaciones/:id/comentarios/:comentarioId  (JSON: { mensaje })
  editarComentario(id: string, comentarioId: string, mensaje: string) {
    return this.http.put<Comentario>(`${this.apiUrl}/${id}/comentarios/${comentarioId}`, {
      mensaje,
    });
  }
}

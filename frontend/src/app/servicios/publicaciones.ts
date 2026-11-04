import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginaPublicaciones } from '../modelos/publicacion';
import { environment } from '../../environments/environment';

export type Orden = 'fecha' | 'meGusta';

@Service()
export class PublicacionesService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/publicaciones`;

  // GET /publicaciones?orden=...&offset=...&limit=...&usuario=...
  listar(orden: Orden, offset: number, limit: number, usuario?: string): Observable<PaginaPublicaciones> {
    let params = new HttpParams().set('orden', orden).set('offset', offset).set('limit', limit);
    if (usuario) {
      params = params.set('usuario', usuario);
    }
    return this.http.get<PaginaPublicaciones>(this.apiUrl, { params });
  }

  // Las que siguen necesitan token: lo agrega el tokenInterceptor

  // POST /publicaciones espera multipart/form-data (titulo, descripcion + archivo "imagen")
  crear(titulo: string, descripcion: string, imagen: File | null) {
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('descripcion', descripcion);
    if (imagen) {
      formData.append('imagen', imagen);
    }
    return this.http.post(this.apiUrl, formData);
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
}

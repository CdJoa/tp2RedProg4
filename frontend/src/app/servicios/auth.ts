import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Usuario } from '../modelos/usuario';
import { environment } from '../../environments/environment';

export interface RegistroDatos {
  nombre: string;
  apellido: string;
  email: string;
  nombreUsuario: string;
  password: string;
  fechaNacimiento: string;
  descripcion?: string;
  imagenPerfil?: File | null;
}

export interface LoginDatos {
  identificador: string; // email o nombre de usuario
  password: string;
}

@Service()
export class Auth {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // usuario logueado (se guarda en localStorage para no perderlo al recargar)
  usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());

  // POST /auth/registro espera multipart/form-data (datos + archivo "imagenPerfil")
  registrar(datos: RegistroDatos): Observable<Usuario> {
    const formData = new FormData();
    formData.append('nombre', datos.nombre);
    formData.append('apellido', datos.apellido);
    formData.append('email', datos.email);
    formData.append('nombreUsuario', datos.nombreUsuario);
    formData.append('password', datos.password);
    formData.append('fechaNacimiento', datos.fechaNacimiento);
    if (datos.descripcion) {
      formData.append('descripcion', datos.descripcion);
    }
    if (datos.imagenPerfil) {
      formData.append('imagenPerfil', datos.imagenPerfil);
    }
    return this.http.post<Usuario>(`${this.apiUrl}/auth/registro`, formData);
  }

  login(datos: LoginDatos): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/auth/login`, datos).pipe(
      tap((usuario) => {
        globalThis.localStorage?.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
      }),
    );
  }

  logout() {
    globalThis.localStorage?.removeItem('usuario');
    this.usuarioActual.set(null);
  }

  private leerUsuarioGuardado(): Usuario | null {
    // globalThis.localStorage? evita romper donde no existe (tests, SSR)
    const guardado = globalThis.localStorage?.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  }
}

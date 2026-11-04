import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
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
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  // usuario logueado y su token (se guardan en localStorage para no perderlos al recargar)
  usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());
  token = signal<string | null>(globalThis.localStorage?.getItem('token') ?? null);

  // Temporizador que cierra la sesión cuando vence el token
  private temporizador?: ReturnType<typeof setTimeout>;

  constructor() {
    // Si al abrir la página ya había un token guardado, programa su vencimiento
    const token = this.token();
    if (token) {
      this.programarCierre(token);
    }
  }

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

  // El back responde { access_token, usuario }: se guardan los dos.
  // El token lo agrega el tokenInterceptor a cada pedido al back.
  login(datos: LoginDatos): Observable<{ access_token: string; usuario: Usuario }> {
    return this.http
      .post<{ access_token: string; usuario: Usuario }>(`${this.apiUrl}/auth/login`, datos)
      .pipe(
        tap(({ access_token, usuario }) => {
          globalThis.localStorage?.setItem('token', access_token);
          globalThis.localStorage?.setItem('usuario', JSON.stringify(usuario));
          this.token.set(access_token);
          this.usuarioActual.set(usuario);
          this.programarCierre(access_token);
        }),
      );
  }

  logout() {
    clearTimeout(this.temporizador);
    globalThis.localStorage?.removeItem('token');
    globalThis.localStorage?.removeItem('usuario');
    this.token.set(null);
    this.usuarioActual.set(null);
  }

  // Cierra la sesión porque venció el token y manda al login
  cerrarSesionVencida() {
    this.logout();
    this.router.navigate(['/login'], { queryParams: { vencida: true } });
  }

  // El JWT tiene 3 partes separadas por puntos: header.payload.firma.
  // El payload es JSON en base64 y trae "exp": cuándo vence (en segundos).
  private programarCierre(token: string) {
    clearTimeout(this.temporizador);
    let vence: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      vence = payload.exp * 1000; // a milisegundos
    } catch {
      this.cerrarSesionVencida(); // token mal formado
      return;
    }

    const faltan = vence - Date.now();
    if (faltan <= 0) {
      this.cerrarSesionVencida(); // ya venció (ej: se reabrió la página tarde)
    } else {
      this.temporizador = setTimeout(() => this.cerrarSesionVencida(), faltan);
    }
  }

  private leerUsuarioGuardado(): Usuario | null {
    // globalThis.localStorage? evita romper donde no existe (tests, SSR)
    const guardado = globalThis.localStorage?.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  }
}

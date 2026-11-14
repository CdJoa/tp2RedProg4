import { Service, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, switchMap, tap } from 'rxjs';
import { Usuario } from '../modelos/usuario';
import { environment } from '../../environments/environment';
import { prepararImagen } from '../validadores/preparar-imagen';

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

export interface RespuestaAuth {
  access_token: string;
  usuario: Usuario;
}

// El token dura 15m en entrega (o 20s en prueba) y el aviso sale a los 2/3 del tiempo
// (a los 10m si el token es de 15m; a los ~13s si el token es de 20s).
const PROPORCION_AVISO_RESTANTE = 1 / 3;

@Service()
export class Auth {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.apiUrl;

  // usuario logueado y su token (se guardan en localStorage para no perderlos al recargar)
  usuarioActual = signal<Usuario | null>(this.leerUsuarioGuardado());
  token = signal<string | null>(globalThis.localStorage?.getItem('token') ?? null);

  // Indica si ya se pasó por la pantalla de cargando (/auth/autorizar) al iniciar la app
  sesionValidada = signal(false);

  // Controla el modal que avisa que quedan 5 minutos de sesión
  mostrarModalSesion = signal(false);
  refrescandoSesion = signal(false);

  // Segundos de vida que le quedan al token (para el reloj de la barra superior)
  segundosRestantes = signal(0);
  enTiempoDeAviso = signal(false);

  // Temporizador para mostrar el modal de aviso, cierre y reloj segundo a segundo
  private temporizadorAviso?: ReturnType<typeof setTimeout>;
  private temporizadorCierre?: ReturnType<typeof setTimeout>;
  private intervaloReloj?: ReturnType<typeof setInterval>;

  // POST /auth/registro espera multipart/form-data (datos + archivo "imagenPerfil").
  // Devuelve { access_token, usuario } igual que el login y guarda la sesión.
  registrar(datos: RegistroDatos): Observable<RespuestaAuth> {
    const imagen$: Observable<File | null> = datos.imagenPerfil ? prepararImagen(datos.imagenPerfil) : of(null);
    return imagen$.pipe(
      switchMap((imagen) => {
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
        if (imagen) {
          formData.append('imagenPerfil', imagen);
        }
        return this.http.post<RespuestaAuth>(`${this.apiUrl}/auth/registro`, formData);
      }),
      tap(({ access_token, usuario }) => this.guardarSesion(access_token, usuario)),
    );
  }

  // El back responde { access_token, usuario }: se guardan los dos.
  // El token lo agrega el tokenInterceptor a cada pedido al back.
  login(datos: LoginDatos): Observable<RespuestaAuth> {
    return this.http
      .post<RespuestaAuth>(`${this.apiUrl}/auth/login`, datos)
      .pipe(tap(({ access_token, usuario }) => this.guardarSesion(access_token, usuario)));
  }

  // POST /auth/autorizar: valida en el back si el token guardado sigue siendo válido
  // y devuelve los datos actualizados del usuario.
  autorizar(): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.apiUrl}/auth/autorizar`, {}).pipe(
      tap((usuario) => {
        const tokenActual = this.token();
        globalThis.localStorage?.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
        this.sesionValidada.set(true);
        if (tokenActual) {
          this.programarTemporizadores(tokenActual);
        }
      }),
    );
  }

  // POST /auth/refrescar: pide un nuevo token de 15 minutos y reinicia el contador de 10 minutos.
  refrescar(): Observable<{ access_token: string }> {
    this.refrescandoSesion.set(true);
    return this.http.post<{ access_token: string }>(`${this.apiUrl}/auth/refrescar`, {}).pipe(
      tap({
        next: ({ access_token }) => {
          globalThis.localStorage?.setItem('token', access_token);
          this.token.set(access_token);
          this.mostrarModalSesion.set(false);
          this.refrescandoSesion.set(false);
          this.programarTemporizadores(access_token);
        },
        error: () => {
          this.refrescandoSesion.set(false);
        },
      }),
    );
  }

  // Si el usuario elige "No, gracias", cierra el modal y programa el cierre de sesión
  // para el instante exacto en que venza el tiempo restante del token (o cierra ya si ya venció).
  cerrarModalSesion() {
    this.mostrarModalSesion.set(false);
    const tokenActual = this.token();
    if (!tokenActual) {
      this.cerrarSesionVencida();
      return;
    }
    const faltan = this.tiempoRestanteMs(tokenActual);
    if (faltan <= 0) {
      this.cerrarSesionVencida();
    } else {
      clearTimeout(this.temporizadorCierre);
      this.temporizadorCierre = setTimeout(() => this.cerrarSesionVencida(), faltan);
    }
  }

  // Devuelve cuántos milisegundos le quedan al token actual (<= 0 si ya venció)
  tiempoRestanteMs(token: string | null = this.token()): number {
    if (!token) return 0;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000 - Date.now();
    } catch {
      return 0;
    }
  }

  // PATCH /usuarios/foto: sube una foto de perfil nueva (requiere token).
  // Actualiza el usuario guardado para que se vea al instante en toda la app.
  cambiarFoto(archivo: File): Observable<Usuario> {
    return prepararImagen(archivo).pipe(
      switchMap((imagen) => {
        const formData = new FormData();
        formData.append('imagenPerfil', imagen);
        return this.http.patch<Usuario>(`${this.apiUrl}/usuarios/foto`, formData);
      }),
      tap((usuario) => {
        globalThis.localStorage?.setItem('usuario', JSON.stringify(usuario));
        this.usuarioActual.set(usuario);
      }),
    );
  }

  logout() {
    this.limpiarTemporizadores();
    this.mostrarModalSesion.set(false);
    this.refrescandoSesion.set(false);
    this.segundosRestantes.set(0);
    this.enTiempoDeAviso.set(false);
    globalThis.localStorage?.removeItem('token');
    globalThis.localStorage?.removeItem('usuario');
    this.token.set(null);
    this.usuarioActual.set(null);
  }

  // Cierra la sesión porque venció el token (o dio 401) y manda al login
  cerrarSesionVencida() {
    this.logout();
    this.sesionValidada.set(true);
    this.router.navigate(['/login'], { queryParams: { vencida: true } });
  }

  private guardarSesion(access_token: string, usuario: Usuario) {
    globalThis.localStorage?.setItem('token', access_token);
    globalThis.localStorage?.setItem('usuario', JSON.stringify(usuario));
    this.token.set(access_token);
    this.usuarioActual.set(usuario);
    this.sesionValidada.set(true);
    this.mostrarModalSesion.set(false);
    this.programarTemporizadores(access_token);
  }

  private limpiarTemporizadores() {
    clearTimeout(this.temporizadorAviso);
    clearTimeout(this.temporizadorCierre);
    clearInterval(this.intervaloReloj);
  }

  // Lee la duración del token ("exp" - "iat") y programa el modal a los 2/3 del tiempo:
  // - Si el token es de 15 minutos -> abre el modal a los 10 minutos (quedan 5 min).
  // - Si el token es de 20 segundos -> abre el modal a los ~13 segundos.
  // Además actualiza el reloj segundo a segundo para mostrar el tiempo restante en el navbar.
  private programarTemporizadores(token: string) {
    this.limpiarTemporizadores();
    let vence: number;
    let duracionTotal: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      vence = payload.exp * 1000; // a milisegundos
      duracionTotal = payload.iat ? (payload.exp - payload.iat) * 1000 : 15 * 60 * 1000;
    } catch {
      this.cerrarSesionVencida(); // token mal formado
      return;
    }

    const faltan = vence - Date.now();
    if (faltan <= 0) {
      this.cerrarSesionVencida();
      return;
    }

    const avisoAntesDeVencer = duracionTotal * PROPORCION_AVISO_RESTANTE;
    const tiempoHastaAviso = Math.max(0, faltan - avisoAntesDeVencer);

    // Actualiza el reloj en el acto y después cada 1 segundo
    const actualizarReloj = () => {
      const restanteMs = Math.max(0, vence - Date.now());
      this.segundosRestantes.set(Math.ceil(restanteMs / 1000));
      this.enTiempoDeAviso.set(restanteMs <= avisoAntesDeVencer);
    };
    actualizarReloj();
    this.intervaloReloj = setInterval(actualizarReloj, 1000);

    this.temporizadorAviso = setTimeout(() => {
      this.enTiempoDeAviso.set(true);
      this.mostrarModalSesion.set(true);
    }, tiempoHastaAviso);
  }

  private leerUsuarioGuardado(): Usuario | null {
    // globalThis.localStorage? evita romper donde no existe (tests, SSR)
    const guardado = globalThis.localStorage?.getItem('usuario');
    return guardado ? JSON.parse(guardado) : null;
  }
}

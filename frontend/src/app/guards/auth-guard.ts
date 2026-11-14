import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

// Rutas que se pueden ver sin estar logueado
const RUTAS_PUBLICAS = ['/login', '/registro'];

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  // Al iniciar la aplicación, primero pasa por la pantalla de cargando
  // para validar el token frente a POST /auth/autorizar.
  if (!authService.sesionValidada()) {
    const esPublica = RUTAS_PUBLICAS.some((ruta) => state.url.startsWith(ruta));
    if (!esPublica && state.url !== '/home' && state.url !== '/publicaciones') {
      return router.createUrlTree(['/cargando'], { queryParams: { returnUrl: state.url } });
    }
    return router.createUrlTree(['/cargando']);
  }

  const usuario = authService.usuarioActual();

  // Si había sesión pero el token ya se venció, cierra la sesión y manda al login
  if (usuario && authService.tiempoRestanteMs() <= 0) {
    authService.cerrarSesionVencida();
    return false;
  }

  if (usuario) {
    // Ya logueado: no tiene sentido volver a login/registro
    if (state.url.startsWith('/login') || state.url.startsWith('/registro')) {
      return router.parseUrl('/publicaciones');
    }
    return true;
  }

  // No logueado: sólo las rutas públicas
  if (RUTAS_PUBLICAS.some((ruta) => state.url.startsWith(ruta))) {
    return true;
  }

  // Al login. Si quería ir a otra página, se recuerda para volver ahí después de loguearse.
  if (state.url.startsWith('/home') || state.url.startsWith('/publicaciones')) {
    return router.createUrlTree(['/login']);
  }
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

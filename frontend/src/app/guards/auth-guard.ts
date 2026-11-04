import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

// Rutas que se pueden ver sin estar logueado
const RUTAS_PUBLICAS = ['/home', '/login', '/registro'];

export const authGuard: CanActivateFn = (_route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  // La sesión se restaura de localStorage al iniciar, así que al recargar
  // la página el usuario ya está disponible.
  const usuario = authService.usuarioActual();

  if (usuario) {
    // Ya logueado: no tiene sentido volver a login/registro
    if (state.url.startsWith('/login') || state.url.startsWith('/registro')) {
      return router.parseUrl('/home');
    }
    return true;
  }

  // No logueado: sólo las rutas públicas
  if (RUTAS_PUBLICAS.some((ruta) => state.url.startsWith(ruta))) {
    return true;
  }

  // Al login, recordando a dónde quería ir
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

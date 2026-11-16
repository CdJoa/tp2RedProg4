import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../servicios/auth';

// Páginas sólo para administradores (dashboard).
// Va DESPUÉS del authGuard, que ya se encargó de la sesión:
//   canActivate: [authGuard, adminGuard]
// Un usuario común que escribe la URL a mano vuelve a publicaciones.
// (El back igual responde 403 si no es admin: esto es sólo para no mostrar la página)
export const adminGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  return auth.esAdmin() ? true : inject(Router).parseUrl('/publicaciones');
};

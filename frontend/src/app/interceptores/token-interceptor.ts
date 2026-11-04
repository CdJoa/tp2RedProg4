import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { Auth } from '../servicios/auth';

// Se ejecuta en cada pedido HTTP:
// 1) si hay token, lo agrega en el header "Authorization: Bearer <token>"
// 2) si el back responde 401 (token vencido o inválido), cierra la sesión
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(Auth);
  const token = auth.token();

  const pedido = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(pedido).pipe(
    catchError((err: HttpErrorResponse) => {
      // Sólo si mandamos token: un 401 en el login (contraseña mal) no cierra nada
      if (err.status === 401 && token) {
        auth.cerrarSesionVencida();
      }
      return throwError(() => err);
    }),
  );
};

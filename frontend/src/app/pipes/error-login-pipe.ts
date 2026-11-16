import { Pipe, PipeTransform } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

// Convierte el error de un login fallido en un mensaje claro según el status.
//   {{ error | errorLogin }}
@Pipe({
  name: 'errorLogin',
})
export class ErrorLoginPipe implements PipeTransform {
  transform(error: HttpErrorResponse | null | undefined): string {
    if (!error) return '';

    switch (error.status) {
      case 0:
        return '📡 No se pudo conectar con el servidor. Revisá tu conexión.';
      case 401:
        return '🔑 Usuario o contraseña incorrectos.';
      case 403:
        // El back responde 403 cuando un administrador deshabilitó la cuenta
        return '⛔ Tu cuenta fue bloqueada por un administrador. No podés ingresar.';
      case 400: {
        // Datos inválidos: se muestra lo que explica el back
        const mensaje = error.error?.message;
        const texto = Array.isArray(mensaje) ? mensaje.join('. ') : mensaje;
        return `⚠️ ${texto || 'Los datos ingresados no son válidos.'}`;
      }
      default:
        return error.status >= 500
          ? '💥 Algo falló del lado del servidor. Probá de nuevo en un rato.'
          : '⚠️ No se pudo iniciar sesión.';
    }
  }
}

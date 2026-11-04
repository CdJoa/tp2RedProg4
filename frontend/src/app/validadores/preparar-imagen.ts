import { HttpErrorResponse } from '@angular/common/http';
import { Observable, from, switchMap, throwError } from 'rxjs';
import { MAXIMO_A_SUBIR, comprimirImagen } from './comprimir-imagen';

// Achica la imagen y, si aun así pesa más de 1 MB, corta con un error claro
// (con la misma forma que un error del back, así los formularios lo muestran).
export function prepararImagen(archivo: File): Observable<File> {
  return from(comprimirImagen(archivo)).pipe(
    switchMap((imagen) =>
      imagen.size > MAXIMO_A_SUBIR
        ? throwError(
            () =>
              new HttpErrorResponse({
                status: 413,
                error: { message: 'La imagen es demasiado grande (máximo 1 MB)' },
              }),
          )
        : [imagen],
    ),
  );
}

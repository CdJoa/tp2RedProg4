import { Pipe, PipeTransform } from '@angular/core';

// Convierte una cantidad de segundos en formato reloj "MM:SS" (ej: 90 -> "01:30")
@Pipe({
  name: 'tiempoRestante',
})
export class TiempoRestantePipe implements PipeTransform {
  transform(segundosTotales: number | null | undefined): string {
    const total = Math.max(0, Math.floor(segundosTotales ?? 0));
    const minutos = Math.floor(total / 60);
    const segundos = total % 60;
    return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
  }
}


import { Pipe, PipeTransform } from '@angular/core';

// Convierte el estado del servidor en el texto que se muestra.
//   {{ online | estadoServidor }}                     → "Online" / "Offline · Mantenimiento"
//   {{ online | estadoServidor: desde : 'largo' }}    → "Online" / "En mantenimiento desde las 15:49"
// "desde" es la fecha del comunicado de mantenimiento (viene del back).
@Pipe({
  name: 'estadoServidor',
})
export class EstadoServidorPipe implements PipeTransform {
  transform(online: boolean, desde?: string | null, formato: 'corto' | 'largo' = 'corto'): string {
    if (online) return 'Online';
    if (formato === 'corto') return 'Offline · Mantenimiento';
    if (!desde) return 'En mantenimiento';

    const fecha = new Date(desde);
    const hora = fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
    // Si empezó otro día, también se muestra la fecha
    const hoy = new Date().toDateString() === fecha.toDateString();
    const dia = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' });
    return hoy ? `En mantenimiento desde las ${hora}` : `En mantenimiento desde el ${dia} a las ${hora}`;
  }
}

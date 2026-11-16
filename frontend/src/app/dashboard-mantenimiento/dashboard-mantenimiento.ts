import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PublicacionesService } from '../servicios/publicaciones';
import { SERVIDOR } from '../servidor';
import { EstadoServidor } from '../servicios/estado-servidor';
import { EstadoServidorPipe } from '../pipes/estado-servidor-pipe';
import { LuzServidor } from '../directivas/luz-servidor';

type Tipo = 'inicio' | 'fin';

interface Comunicado {
  tipo: Tipo;
  titulo: string;
  descripcion: string;
}

// Pestaña "Mantenimiento" del panel (/dashboard/mantenimiento).
// Dos botones: avisar que empezó el mantenimiento y avisar que terminó.
// Cada uno publica un comunicado en el foro (como el admin logueado),
// y la directiva anuncioOficial lo muestra con la cinta del staff.
// El back deduce el estado del servidor del último de estos comunicados:
// "en curso" = offline (amarillo en navbar y login), "finalizado" = online.
@Component({
  imports: [ReactiveFormsModule, RouterLink, EstadoServidorPipe, LuzServidor],
  selector: 'app-dashboard-mantenimiento',
  styleUrl: './dashboard-mantenimiento.css',
  templateUrl: './dashboard-mantenimiento.html',
})
export class DashboardMantenimiento {
  private publicaciones = inject(PublicacionesService);
  // Estado actual (online / en mantenimiento): se deduce de estos mismos comunicados
  protected estado = inject(EstadoServidor);

  // Texto opcional que se agrega al comunicado (motivo, duración, cambios...)
  protected detalle = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(400)] });

  // Comunicado que se está por publicar (se muestra en el modal para confirmar)
  protected aConfirmar = signal<Comunicado | null>(null);
  protected publicando = signal(false);
  protected publicado = signal<{ tipo: Tipo; id: string } | null>(null);
  protected error = signal<string | null>(null);

  // Arma el comunicado y abre el modal con la vista previa
  protected preparar(tipo: Tipo) {
    this.publicado.set(null);
    this.error.set(null);
    this.aConfirmar.set(tipo === 'inicio' ? this.armarInicio() : this.armarFin());
  }

  protected confirmar() {
    const comunicado = this.aConfirmar();
    if (!comunicado) return;

    this.publicando.set(true);
    this.publicaciones.crear(comunicado.titulo, comunicado.descripcion, null).subscribe({
      next: (creada) => {
        this.publicando.set(false);
        this.aConfirmar.set(null);
        this.detalle.reset();
        this.publicado.set({ tipo: comunicado.tipo, id: (creada as { _id: string })._id });
        // La navbar y el login pasan a amarillo / verde enseguida (sin esperar los 30 s)
        this.estado.actualizar();
      },
      error: () => {
        this.publicando.set(false);
        this.aConfirmar.set(null);
        this.error.set('No se pudo publicar el comunicado. Probá de nuevo.');
      },
    });
  }

  private armarInicio(): Comunicado {
    const detalle = this.detalle.value.trim();
    return {
      tipo: 'inicio',
      titulo: `🛠️ Mantenimiento en curso · ${this.ahora()}`,
      descripcion:
        `El servidor ${SERVIDOR.nombre} entra en mantenimiento a partir de este momento.\n\n` +
        `- No intenten conectarse hasta el aviso de finalización.\n` +
        `- Las partidas se guardaron antes del apagado: no se pierde nada.\n` +
        `- Sigan este foro: acá avisamos cuando vuelva.\n\n` +
        (detalle ? `Motivo: ${detalle}\n\n` : '') +
        `Gracias por la paciencia, supervivientes.`,
    };
  }

  private armarFin(): Comunicado {
    const detalle = this.detalle.value.trim();
    return {
      tipo: 'fin',
      titulo: `✅ Mantenimiento finalizado · Servidor en línea`,
      descripcion:
        `Terminó el mantenimiento: ${SERVIDOR.nombre} ya está en línea otra vez (${this.ahora()}).\n\n` +
        `- IP: ${SERVIDOR.ip}:${SERVIDOR.puerto} (ficticia)\n` +
        `- Si tu personaje aparece en un lugar raro, avisen acá con [BUG] en el título.\n\n` +
        (detalle ? `Cambios aplicados: ${detalle}\n\n` : '') +
        `¡A sobrevivir!`,
    };
  }

  // "16/11 18:45" (hora de Argentina)
  private ahora() {
    return new Date().toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'America/Argentina/Buenos_Aires',
    });
  }
}

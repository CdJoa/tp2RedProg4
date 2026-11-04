import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Publicacion as PublicacionModelo } from '../modelos/publicacion';
import { Auth } from '../servicios/auth';
import { PublicacionesService } from '../servicios/publicaciones';

// Una publicación (tarjeta). La usan la lista de publicaciones y Mi Perfil.
@Component({
  imports: [DatePipe],
  selector: 'app-publicacion',
  styleUrl: './publicacion.css',
  templateUrl: './publicacion.html',
})
export class Publicacion {
  private auth = inject(Auth);
  private publicacionesService = inject(PublicacionesService);

  // La recibe del componente padre: <app-publicacion [publicacion]="p" />
  publicacion = input.required<PublicacionModelo>();
  // Avisa al padre que se eliminó, para que la saque de la lista
  eliminada = output<string>();

  private miId = computed(() => this.auth.usuarioActual()?._id);

  // ¿La publicación es mía? (para mostrar el botón eliminar)
  protected esMia = computed(() => this.publicacion().usuario._id === this.miId());

  // Estado del me gusta: arranca con lo que vino del back (linkedSignal)
  // y después se actualiza en la tarjeta al tocar el botón.
  protected leDiMeGusta = linkedSignal(() => {
    const id = this.miId();
    return !!id && this.publicacion().meGusta.includes(id);
  });
  protected cantidadMeGusta = linkedSignal(() => this.publicacion().cantidadMeGusta ?? 0);

  protected procesando = signal(false);

  protected alternarMeGusta() {
    if (this.procesando()) return;
    this.procesando.set(true);

    const id = this.publicacion()._id;
    const pedido = this.leDiMeGusta()
      ? this.publicacionesService.quitarMeGusta(id)
      : this.publicacionesService.darMeGusta(id);

    pedido.subscribe({
      next: () => {
        // Si salió bien, actualiza la tarjeta sin volver a pedir la lista
        this.cantidadMeGusta.update((n) => n + (this.leDiMeGusta() ? -1 : 1));
        this.leDiMeGusta.update((v) => !v);
        this.procesando.set(false);
      },
      error: () => this.procesando.set(false),
    });
  }

  protected eliminar() {
    if (!confirm('¿Eliminar esta publicación?')) return;
    this.publicacionesService.eliminar(this.publicacion()._id).subscribe({
      next: () => this.eliminada.emit(this.publicacion()._id),
    });
  }
}

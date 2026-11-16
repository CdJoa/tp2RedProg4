import { Component, OnInit, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Publicacion as PublicacionModelo } from '../modelos/publicacion';
import { Auth } from '../servicios/auth';
import { PublicacionesService } from '../servicios/publicaciones';
import { Comentario } from '../modelos/comentario';
import { ComentarioItem } from '../comentario-item/comentario-item';

// Cuántos comentarios se muestran en la tarjeta (el resto, en el hilo completo)
const COMENTARIOS_EN_TARJETA = 3;

// Una publicación (tarjeta). La usan la lista de publicaciones y Mi Perfil.
@Component({
  imports: [DatePipe, RouterLink, ComentarioItem],
  selector: 'app-publicacion',
  styleUrl: './publicacion.css',
  templateUrl: './publicacion.html',
})
export class Publicacion implements OnInit {
  private auth = inject(Auth);
  private publicacionesService = inject(PublicacionesService);

  // La recibe del componente padre: <app-publicacion [publicacion]="p" />
  publicacion = input.required<PublicacionModelo>();
  // false en la página del hilo: ahí los comentarios se muestran completos aparte
  vistaPrevia = input(true);
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
  // true si la foto del autor no se pudo cargar
  protected fotoFallo = signal(false);
  // Controla el modal de confirmación para eliminar (sin usar confirm/alert nativos)
  protected confirmandoEliminar = signal(false);
  protected eliminando = signal(false);

  // Vista previa de comentarios: los últimos 3 y cuántos hay en total
  protected comentarios = signal<Comentario[]>([]);
  protected totalComentarios = signal(0);
  // Cuántos quedan sin mostrar (para el aviso "hay N comentarios más")
  protected comentariosOcultos = computed(() =>
    Math.max(0, this.totalComentarios() - this.comentarios().length),
  );

  ngOnInit() {
    if (!this.vistaPrevia()) return;
    // El input ya está disponible acá: pide los últimos 3 comentarios
    this.publicacionesService
      .listarComentarios(this.publicacion()._id, 0, COMENTARIOS_EN_TARJETA)
      .subscribe({
        next: (respuesta) => {
          this.comentarios.set(respuesta.comentarios);
          this.totalComentarios.set(respuesta.total);
        },
      });
  }

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

  protected confirmarEliminar() {
    if (this.eliminando()) return;
    this.eliminando.set(true);
    this.publicacionesService.eliminar(this.publicacion()._id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.confirmandoEliminar.set(false);
        this.eliminada.emit(this.publicacion()._id);
      },
      error: () => {
        this.eliminando.set(false);
      },
    });
  }
}

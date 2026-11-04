import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { PublicacionesService, Orden } from '../servicios/publicaciones';
import { Publicacion as PublicacionModelo } from '../modelos/publicacion';
import { Publicacion } from '../publicacion/publicacion';
import { NuevaPublicacion } from '../nueva-publicacion/nueva-publicacion';

const POR_PAGINA = 5;

@Component({
  imports: [Publicacion, NuevaPublicacion],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit {
  private publicacionesService = inject(PublicacionesService);

  protected publicaciones = signal<PublicacionModelo[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  // Ordenamiento y paginación
  protected orden = signal<Orden>('fecha');
  protected pagina = signal(0); // empieza en 0
  protected total = signal(0);
  protected totalPaginas = computed(() => Math.max(1, Math.ceil(this.total() / POR_PAGINA)));

  // Muestra u oculta el formulario de nueva publicación
  protected mostrarFormulario = signal(false);

  ngOnInit() {
    this.cargar();
  }

  // Pide al back la página actual con el orden elegido
  protected cargar() {
    this.cargando.set(true);
    this.error.set(null);
    const offset = this.pagina() * POR_PAGINA;

    this.publicacionesService.listar(this.orden(), offset, POR_PAGINA).subscribe({
      next: (respuesta) => {
        this.publicaciones.set(respuesta.publicaciones);
        this.total.set(respuesta.total);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las publicaciones');
        this.cargando.set(false);
      },
    });
  }

  protected cambiarOrden(orden: Orden) {
    this.orden.set(orden);
    this.pagina.set(0); // al cambiar el orden vuelve a la primera página
    this.cargar();
  }

  protected irAPagina(pagina: number) {
    this.pagina.set(pagina);
    this.cargar();
  }

  // Se creó una publicación: cierra el formulario y vuelve a la primera
  // página ordenada por fecha, así la nueva aparece arriba de todo
  protected alCrear() {
    this.mostrarFormulario.set(false);
    this.orden.set('fecha');
    this.pagina.set(0);
    this.cargar();
  }

  // Una tarjeta avisó que se eliminó: se vuelve a pedir la página
  // (así se completa con la siguiente publicación)
  protected alEliminar() {
    // si era la única de la última página, retrocede una
    if (this.publicaciones().length === 1 && this.pagina() > 0) {
      this.pagina.update((p) => p - 1);
    }
    this.cargar();
  }
}

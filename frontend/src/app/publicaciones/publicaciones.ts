import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { PublicacionesService } from '../servicios/publicaciones';
import { Publicacion } from '../modelos/publicacion';

@Component({
  imports: [DatePipe],
  selector: 'app-publicaciones',
  styleUrl: './publicaciones.css',
  templateUrl: './publicaciones.html',
})
export class Publicaciones implements OnInit {
  private publicacionesService = inject(PublicacionesService);

  protected publicaciones = signal<Publicacion[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  // Al mostrarse el componente, pide la lista al back
  ngOnInit() {
    this.publicacionesService.listar().subscribe({
      next: (lista) => {
        this.publicaciones.set(lista);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las publicaciones');
        this.cargando.set(false);
      },
    });
  }
}

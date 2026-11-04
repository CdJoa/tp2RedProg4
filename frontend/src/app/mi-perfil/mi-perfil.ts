import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Auth } from '../servicios/auth';
import { PublicacionesService } from '../servicios/publicaciones';
import { Publicacion as PublicacionModelo } from '../modelos/publicacion';
import { Publicacion } from '../publicacion/publicacion';

@Component({
  imports: [DatePipe, Publicacion],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil implements OnInit {
  protected auth = inject(Auth);
  private publicacionesService = inject(PublicacionesService);

  protected misPublicaciones = signal<PublicacionModelo[]>([]);

  ngOnInit() {
    this.cargarMisPublicaciones();
  }

  // Mis últimas 3: filtra por mi id, ordena por fecha y trae 3
  protected cargarMisPublicaciones() {
    const usuario = this.auth.usuarioActual();
    if (!usuario) return;
    this.publicacionesService.listar('fecha', 0, 3, usuario._id).subscribe({
      next: (respuesta) => this.misPublicaciones.set(respuesta.publicaciones),
    });
  }
}

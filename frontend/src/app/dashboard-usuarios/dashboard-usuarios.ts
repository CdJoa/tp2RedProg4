import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { UsuariosService } from '../servicios/usuarios';
import { Auth } from '../servicios/auth';
import { Usuario } from '../modelos/usuario';
import { Registro } from '../registro/registro';
import { mensajeDeError } from '../validadores/validadores';

// Dashboard/usuarios (sólo administradores): listado, alta, baja y alta lógica
@Component({
  imports: [Registro],
  selector: 'app-dashboard-usuarios',
  styleUrl: './dashboard-usuarios.css',
  templateUrl: './dashboard-usuarios.html',
})
export class DashboardUsuarios implements OnInit {
  private usuariosService = inject(UsuariosService);
  private auth = inject(Auth);

  protected usuarios = signal<Usuario[]>([]);
  protected cargando = signal(true);
  protected error = signal<string | null>(null);

  protected mostrarFormulario = signal(false);
  // Mensaje verde después de crear un usuario
  protected aviso = signal<string | null>(null);

  // Usuario elegido para deshabilitar (abre el modal de confirmación)
  protected aDeshabilitar = signal<Usuario | null>(null);
  // id del usuario que se está procesando (deshabilitar/habilitar)
  protected procesandoId = signal<string | null>(null);
  protected errorAccion = signal<string | null>(null);

  protected miId = computed(() => this.auth.usuarioActual()?._id);
  protected cantidadActivos = computed(() => this.usuarios().filter((u) => u.activo !== false).length);

  ngOnInit() {
    this.cargar();
  }

  protected cargar() {
    this.cargando.set(true);
    this.error.set(null);
    this.usuariosService.listar().subscribe({
      next: (usuarios) => {
        this.usuarios.set(usuarios);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeDeError(err, 'No se pudo cargar el listado de usuarios'));
        this.cargando.set(false);
      },
    });
  }

  // El formulario (Registro en modo admin) avisa que se creó: se agrega arriba de la lista
  protected alCrear(usuario: Usuario) {
    this.usuarios.update((lista) => [usuario, ...lista]);
    this.mostrarFormulario.set(false);
    this.aviso.set(`Se creó el usuario @${usuario.nombreUsuario} (${usuario.perfil})`);
  }

  protected confirmarDeshabilitar() {
    const usuario = this.aDeshabilitar();
    if (!usuario) return;
    this.cambiarEstado(usuario, false);
  }

  protected habilitar(usuario: Usuario) {
    this.cambiarEstado(usuario, true);
  }

  private cambiarEstado(usuario: Usuario, activo: boolean) {
    if (this.procesandoId()) return;
    this.procesandoId.set(usuario._id);
    this.errorAccion.set(null);

    const pedido = activo
      ? this.usuariosService.habilitar(usuario._id)
      : this.usuariosService.deshabilitar(usuario._id);

    pedido.subscribe({
      next: (actualizado) => {
        // Reemplaza el usuario en la lista con lo que devolvió el back
        this.usuarios.update((lista) => lista.map((u) => (u._id === actualizado._id ? actualizado : u)));
        this.procesandoId.set(null);
        this.aDeshabilitar.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.errorAccion.set(mensajeDeError(err, 'No se pudo cambiar el estado del usuario'));
        this.procesandoId.set(null);
        this.aDeshabilitar.set(null);
      },
    });
  }
}

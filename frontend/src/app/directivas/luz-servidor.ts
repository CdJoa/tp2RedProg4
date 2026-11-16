import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

// "Luz" de estado del servidor: pinta el elemento de verde (online) o amarillo (en mantenimiento).
//   <small [luzServidor]="estado.online()">● 203.0.113.47:16261 · Online</small>
// Agrega la clase "luz-online" o "luz-offline" (los colores van en el CSS de cada componente)
// y un title para que al pasar el mouse se lea el estado.
@Directive({
  selector: '[luzServidor]',
})
export class LuzServidor {
  luzServidor = input.required<boolean>();

  private elemento = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      const el: HTMLElement = this.elemento.nativeElement;
      const online = this.luzServidor();
      this.renderer.removeClass(el, online ? 'luz-offline' : 'luz-online');
      this.renderer.addClass(el, online ? 'luz-online' : 'luz-offline');
      this.renderer.setAttribute(el, 'title', online ? 'Servidor en línea' : 'Servidor en mantenimiento');
    });
  }
}

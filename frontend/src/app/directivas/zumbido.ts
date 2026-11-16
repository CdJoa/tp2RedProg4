import { Directive, ElementRef, Renderer2, effect, inject, input } from '@angular/core';

// Hace temblar el elemento como el "zumbido" del MSN Messenger.
//   <form [zumbido]="intentosFallidos()">
// Cada vez que el valor CAMBIA a algo distinto de 0/null/false, el elemento tiembla.
// (Por eso conviene pasarle un contador: cada fallo nuevo suma 1 y vuelve a temblar)
@Directive({
  selector: '[zumbido]',
})
export class Zumbido {
  zumbido = input<unknown>();

  private elemento = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);

  constructor() {
    effect(() => {
      if (this.zumbido()) {
        this.temblar();
      }
    });
  }

  private temblar() {
    const el = this.elemento.nativeElement;
    // Si ya estaba temblando, reinicia la animación:
    // se saca la clase, se fuerza al navegador a "repintar" y se vuelve a poner
    this.renderer.removeClass(el, 'zumbando');
    void el.offsetWidth;
    this.renderer.addClass(el, 'zumbando');

    // Al terminar la animación (definida en styles.css) se saca la clase
    const quitar = this.renderer.listen(el, 'animationend', () => {
      this.renderer.removeClass(el, 'zumbando');
      quitar();
    });
  }
}

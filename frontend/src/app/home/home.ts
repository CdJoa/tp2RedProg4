import { Component, inject } from '@angular/core';
import { Auth } from '../servicios/auth';
import { Publicaciones } from '../publicaciones/publicaciones';

@Component({
  imports: [Publicaciones],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  protected auth = inject(Auth);
}

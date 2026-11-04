import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Auth } from '../servicios/auth';
import { Publicaciones } from '../publicaciones/publicaciones';

@Component({
  imports: [RouterLink, Publicaciones],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})
export class Home {
  protected auth = inject(Auth);
}

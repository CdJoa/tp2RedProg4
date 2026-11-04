import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Auth } from '../servicios/auth';

@Component({
  imports: [DatePipe],
  selector: 'app-mi-perfil',
  styleUrl: './mi-perfil.css',
  templateUrl: './mi-perfil.html',
})
export class MiPerfil {
  protected auth = inject(Auth);
}

import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Registro } from './registro/registro';
import { Home } from './home/home';
import { Publicaciones } from './publicaciones/publicaciones';
import { MiPerfil } from './mi-perfil/mi-perfil';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [authGuard] },
  { path: 'registro', component: Registro, canActivate: [authGuard] },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'publicaciones', component: Publicaciones, canActivate: [authGuard] },
  { path: 'mi-perfil', component: MiPerfil, canActivate: [authGuard] },
];

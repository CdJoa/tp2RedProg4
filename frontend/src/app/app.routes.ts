import { Routes } from '@angular/router';
import { Login } from './paginas/login/login';
import { Registro } from './paginas/registro/registro';
import { Home } from './paginas/home/home';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'home', component: Home },
];

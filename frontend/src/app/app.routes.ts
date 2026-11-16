import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Registro } from './registro/registro';
import { Home } from './home/home';
import { Publicaciones } from './publicaciones/publicaciones';
import { MiPerfil } from './mi-perfil/mi-perfil';
import { Cargando } from './cargando/cargando';
import { PaginaPublicacion } from './pagina-publicacion/pagina-publicacion';
import { Panel } from './panel/panel';
import { DashboardUsuarios } from './dashboard-usuarios/dashboard-usuarios';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/cargando', pathMatch: 'full' },
  { path: 'cargando', component: Cargando },
  { path: 'login', component: Login, canActivate: [authGuard] },
  { path: 'registro', component: Registro, canActivate: [authGuard] },
  { path: 'home', component: Home, canActivate: [authGuard] },
  { path: 'publicaciones', component: Publicaciones, canActivate: [authGuard] },
  { path: 'publicacion/:id', component: PaginaPublicacion, canActivate: [authGuard] },
  { path: 'mi-perfil', component: MiPerfil, canActivate: [authGuard] },
  // Panel de administración: sólo administradores. Pestañas = rutas hijas
  {
    path: 'dashboard',
    component: Panel,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
      { path: 'usuarios', component: DashboardUsuarios },
      // Lazy: Chart.js pesa bastante, así se descarga recién al entrar a esta pestaña
      {
        path: 'estadisticas',
        loadComponent: () =>
          import('./dashboard-estadisticas/dashboard-estadisticas').then((m) => m.DashboardEstadisticas),
      },
    ],
  },
];

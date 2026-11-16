import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

// Deja pasar sólo a los administradores.
// Va DESPUÉS del AuthGuard, que es el que valida el token y deja el payload en req.user:
//   @UseGuards(AuthGuard, AdminGuard)
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // El perfil viene adentro del token (lo pone el login/registro)
    if (request.user?.perfil !== 'administrador') {
      // 403: el token es válido, pero no tiene permiso
      throw new ForbiddenException('Sólo un administrador puede hacer esto');
    }
    return true;
  }
}

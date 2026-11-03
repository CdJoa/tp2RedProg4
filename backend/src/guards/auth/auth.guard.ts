import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  
  constructor(private readonly jwtService: JwtService) {}

  // Execution context: información de la instancia de la llamada.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest(); //Cambiamos el contexto de la llamada a HTTP
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de acceso');
    }
    try {
      // 💡 Here the JWT secret key that's used for verifying the payload 
      // is the key that was passed in the JwtModule
      const payload = await this.jwtService.verifyAsync(token);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      // firma inválida o token vencido
      throw new UnauthorizedException('Token inválido o vencido');
    }
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
  
  // private extractTokenFromCookie(request: Request): string | undefined {
  //   // 💡 This is where we extract the token from the cookie
  //   // The name of the cookie should match the name used when setting the cookie in the login route
  //   if(request.cookies && request.cookies['access_token']) {
  //     return request.cookies['access_token'];
  //   }
    
  //   return undefined;
  // }


}
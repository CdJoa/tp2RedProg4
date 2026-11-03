import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { origenesPermitidos } from './config/origenes.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: origenesPermitidos() });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}
// void (no await): en Vercel, app.listen() queda interceptado y nunca termina;
// con "await" el módulo no termina de cargar y cada request se cuelga.
void bootstrap();

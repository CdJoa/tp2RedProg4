# Librerías del backend

Instalar todo con:

```bash
npm install
```

## Dependencias

| Librería | Para qué se usa |
| --- | --- |
| `@nestjs/common` | Decoradores y utilidades base de Nest (controllers, pipes, etc.) |
| `@nestjs/core` | Núcleo del framework Nest |
| `@nestjs/platform-express` | Adaptador HTTP de Nest sobre Express |
| `@nestjs/config` | Variables de entorno (`.env`) |
| `@nestjs/mapped-types` | `PartialType` y similares para los DTOs de update |
| `@nestjs/mongoose` | Integración de Mongoose con Nest |
| `mongoose` | ODM para MongoDB |
| `class-validator` | Validaciones en los DTOs (`@IsString`, `@IsNotEmpty`, ...) |
| `class-transformer` | Transforma el body en instancias de los DTOs (lo usa `ValidationPipe`) |
| `reflect-metadata` | Metadata de decoradores (requerido por Nest) |
| `rxjs` | Observables (requerido por Nest) |

```bash
npm install @nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config @nestjs/mapped-types @nestjs/mongoose mongoose class-validator class-transformer reflect-metadata rxjs
```

## Dependencias de desarrollo

| Librería | Para qué se usa |
| --- | --- |
| `@nestjs/cli` | CLI de Nest (`nest start`, `nest generate`) |
| `@nestjs/schematics` | Plantillas que usa el CLI para generar código |
| `@nestjs/testing` | Utilidades para tests en Nest |
| `typescript` | Compilador de TypeScript |
| `@types/node`, `@types/express`, `@types/supertest` | Tipos de TypeScript |
| `vitest`, `@vitest/coverage-v8`, `vite` | Tests y cobertura |
| `supertest` | Tests e2e de endpoints HTTP |
| `oxlint`, `oxlint-tsgolint` | Linter |
| `prettier` | Formateo de código |
| `source-map-support` | Stack traces con líneas del código TS |

```bash
npm install -D @nestjs/cli @nestjs/schematics @nestjs/testing typescript @types/node @types/express @types/supertest vitest @vitest/coverage-v8 vite supertest oxlint oxlint-tsgolint prettier source-map-support
```

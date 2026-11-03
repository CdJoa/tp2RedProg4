// URLs del front permitidas, desde FRONTEND_URL.
// Acepta varias separadas por coma, por ejemplo:
// FRONTEND_URL=https://mi-app.vercel.app,https://www.midominio.com
export function origenesPermitidos(): string[] {
  const valor = process.env.FRONTEND_URL ?? 'http://localhost:4200';
  return valor
    .split(',')
    .map((url) => url.trim().replace(/\/+$/, '')) // sin espacios ni "/" final
    .filter(Boolean);
}

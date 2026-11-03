import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

// Al menos una mayúscula y un número (igual que el @Matches del back).
// La longitud mínima se valida aparte con Validators.minLength(8).
export function passwordFuerte(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor: string = control.value ?? '';
    if (!valor) return null; // de eso se encarga Validators.required
    const errores: ValidationErrors = {};
    if (!/[A-Z]/.test(valor)) errores['sinMayuscula'] = true;
    if (!/\d/.test(valor)) errores['sinNumero'] = true;
    return Object.keys(errores).length ? errores : null;
  };
}

// Validador de grupo: los dos campos deben coincidir.
export function camposIguales(campo: string, confirmacion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const a = grupo.get(campo)?.value;
    const b = grupo.get(confirmacion)?.value;
    return a && b && a !== b ? { noCoinciden: true } : null;
  };
}

// La fecha no puede ser futura y la persona debe tener al menos `edadMinima` años.
export function edadMinima(edadMinima: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const fecha = new Date(control.value);
    if (isNaN(fecha.getTime())) return { fechaInvalida: true };
    const hoy = new Date();
    if (fecha > hoy) return { fechaFutura: true };
    const limite = new Date(hoy.getFullYear() - edadMinima, hoy.getMonth(), hoy.getDate());
    return fecha > limite ? { edadMinima: { requerida: edadMinima } } : null;
  };
}

// Para controles que guardan un File (input type="file").
export function archivoImagen(maxMB: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const archivo: File | null = control.value;
    if (!archivo) return null; // la imagen es opcional
    if (!archivo.type.startsWith('image/')) return { noEsImagen: true };
    if (archivo.size > maxMB * 1024 * 1024) return { muyGrande: { maxMB } };
    return null;
  };
}

// Valida que no sea sólo espacios en blanco.
export function sinEspaciosVacios(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const valor = control.value;
    return typeof valor === 'string' && valor.length > 0 && valor.trim().length === 0
      ? { soloEspacios: true }
      : null;
  };
}

// Convierte el error que devuelve Nest en un texto para mostrar.
// ValidationPipe devuelve { message: string[] }, las excepciones { message: string }.
export function mensajeDeError(err: HttpErrorResponse, porDefecto: string): string {
  if (err.status === 0) return 'No se pudo conectar con el servidor';
  const mensaje = err.error?.message;
  if (Array.isArray(mensaje)) return mensaje.join('. ');
  if (typeof mensaje === 'string') return mensaje;
  return porDefecto;
}

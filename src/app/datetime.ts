/**
 * Helpers de fecha/hora en TZ Argentina (America/Argentina/Buenos_Aires)
 * para el lado renderer (React).
 *
 * Por qué duplicado del archivo equivalente en electron/datetime.ts:
 *   Vite separa los bundles renderer y main; un import cruzado obligaría
 *   a configurar paths/build adicional. Como son ~40 líneas y no cambian
 *   con frecuencia, se aceptan dos copias idénticas con el mismo contrato.
 *
 * Si en el futuro la zona horaria del negocio cambia, modificar APP_TZ
 * en ambos archivos (renderer y main).
 */

export const APP_TZ = 'America/Argentina/Buenos_Aires';

export function todayInAppTz(now: Date = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);
}

export function nowPartsInAppTz(now: Date = new Date()): { year: number; month: number; day: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(now);
    const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
    return { year: get('year'), month: get('month'), day: get('day') };
}

/**
 * Helpers de fecha/hora en TZ Argentina (America/Argentina/Buenos_Aires).
 *
 * Por qué este archivo existe:
 *   El backend almacena `date` en UTC. Si el cliente usa `new Date().getDate()`
 *   (TZ local del SO), un encargado que abre el panel a las 22:30 ART está
 *   ya en el día siguiente en UTC, así que pregunta `?date=YYYY-MM-DD` con
 *   un día desfasado y los sectores aparecen como "Faltante" cuando en
 *   realidad ya cargaron las asistencias del día.
 *
 *   Fijando TZ Argentina en cliente y server, ambos hablan del mismo "hoy".
 */

export const APP_TZ = 'America/Argentina/Buenos_Aires';

/**
 * Devuelve "YYYY-MM-DD" representando "hoy" en la TZ del negocio,
 * sin importar la TZ del SO del cliente.
 */
export function todayInAppTz(now: Date = new Date()): string {
    // en-CA produce "YYYY-MM-DD" naturalmente con Intl.
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: APP_TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(now);
}

/**
 * Descompone "ahora" en {year, month (1-12), day} usando TZ Argentina.
 * Útil para lógica de período (ej. 21→20) que depende del día calendario.
 */
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

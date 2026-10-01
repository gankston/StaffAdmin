/**
 * Certificado medico: la regla de cuantas horas suma cada dia.
 *
 * Esta en un solo archivo porque la usan la vista previa (pantalla) y el Excel
 * (proceso de Electron): si la regla cambia, cambia en los dos a la vez.
 * No importa nada de Node ni del navegador, asi lo pueden usar los dos lados.
 *
 *   lunes a viernes -> 8 h
 *   sabado          -> 4 h
 *   domingo         -> 0 h (la casilla dice CERTIFICADO MEDICO igual)
 */

export const TEXTO_CELDA_CM = 'CERTIFICADO MEDICO';
export const SIGLA_CM = 'CM';
export const GLOSARIO_CM =
    'CM = Certificado médico. Suma 8 h de lunes a viernes y 4 h los sábados (el domingo no suma).';

/** 0 = domingo ... 6 = sabado, para una fecha 'YYYY-MM-DD' (sin corrimiento de zona horaria). */
const diaDeLaSemana = (fecha: string): number => new Date(`${fecha}T12:00:00Z`).getUTCDay();

export function horasDeCertificado(fecha: string): number {
    const d = diaDeLaSemana(fecha);
    if (d === 0) return 0;
    if (d === 6) return 4;
    return 8;
}

/** "2026-10-04" -> "04/10" */
const corta = (fecha: string) => `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;

/** "04/10 (sáb)" o "05/10 (dom)"; los dias de semana van sin aclaracion. */
const conDia = (fecha: string) => {
    const d = diaDeLaSemana(fecha);
    return d === 6 ? `${corta(fecha)} (sáb)` : d === 0 ? `${corta(fecha)} (dom)` : corta(fecha);
};

const enumerar = (xs: string[]) =>
    xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}`;

/**
 * El texto para OBSERVACIONES, explicito para que no haya confusiones:
 *   "Certificado médico: 01/10, 02/10 y 04/10 (sáb) = 20 h (8 h por día de
 *    semana, 4 h el sábado). El 02/10 tenía 6 h cargadas: se reemplazaron por
 *    las del certificado."
 */
export function observacionCertificado(
    fechas: string[],
    reemplazadasCrudas: Array<{ fecha: string; horas: number; otros?: boolean }> = [],
): string {
    // Dos tarjas el mismo dia se cuentan juntas: "el 01/03 tenia 9 h", no dos veces.
    const porFecha = new Map<string, { fecha: string; horas: number; otros: boolean }>();
    for (const r of reemplazadasCrudas) {
        const prev = porFecha.get(r.fecha) ?? { fecha: r.fecha, horas: 0, otros: false };
        porFecha.set(r.fecha, { fecha: r.fecha, horas: prev.horas + (r.horas > 0 ? r.horas : 0), otros: prev.otros || !!r.otros });
    }
    const reemplazadas = [...porFecha.values()].sort((a, b) => a.fecha.localeCompare(b.fecha));
    if (!fechas.length) return '';
    const ordenadas = [...fechas].sort();
    const total = ordenadas.reduce((acc, f) => acc + horasDeCertificado(f), 0);
    const semana = ordenadas.filter((f) => horasDeCertificado(f) === 8).length;
    const sabados = ordenadas.filter((f) => diaDeLaSemana(f) === 6).length;
    const domingos = ordenadas.filter((f) => diaDeLaSemana(f) === 0).length;

    const regla = [
        semana ? '8 h por día de semana' : '',
        sabados ? `4 h ${sabados === 1 ? 'el sábado' : 'por sábado'}` : '',
        domingos ? `el domingo no suma` : '',
    ].filter(Boolean).join(', ');

    let texto = `Certificado médico: ${enumerar(ordenadas.map(conDia))} = ${total} h (${regla})`;
    if (reemplazadas.length) {
        const partes = reemplazadas.map((r) => {
            const que = r.horas > 0 ? `${r.horas} h${r.otros ? ' y otros datos' : ''}` : 'datos cargados';
            return `el ${corta(r.fecha)} tenía ${que}`;
        });
        texto += `. Se reemplazó lo cargado: ${enumerar(partes)}`;
    }
    return texto + '.';
}

import { BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { nowPartsInAppTz } from './datetime';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExportParams {
    sectorName: string;
    sectorId?: string;
    encargado?: string | null;
    employees: Array<{
        id: string;
        first_name: string;
        last_name: string;
        dni?: string | null;
        is_active: boolean;
    }>;
    attendances?: Array<{    // filas reales de /api/attendances
        employee_id?: string;
        first_name?: string;
        last_name?: string;
        dni?: string | null;
        date?: string;
        hours?: number | null;
        status?: string | null;
        record_sector_name?: string | null;
        notes?: string | null;
        motivo_rechazo?: string | null;
        km_viajes?: number | null;
        has_fumigadas?: number | null;
        siembra_trilla?: number | null;
        bolseros?: number | null;
        etiquetado?: number | null;
        carga_camion_kg50?: boolean | null;
        carga_camion_kg25?: boolean | null;
        carga_camion_otro?: string | null;
        movimiento_estiba_kg50?: boolean | null;
        movimiento_estiba_kg25?: boolean | null;
        movimiento_estiba_otro?: string | null;
        [key: string]: any;
    }>;
    absences?: Array<{       // ausencias de /api/absences
        employee_id: string;
        start_date: string;  // YYYY-MM-DD
        end_date: string;    // YYYY-MM-DD
        [key: string]: any;
    }>;
    transfers?: Array<{      // traslados del período
        employee_id: string;
        from_sector_id: string | null;
        to_sector_id: string;
        from_sector_name: string | null;
        to_sector_name: string;
        [key: string]: any;
    }>;
    periodMonth: number;
    periodYear: number;
}

// ─── Date helpers for the 21→20 business period ──────────────────────────────

const MONTH_NAMES_ES = [
    '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export async function exportExcel(
    _window: BrowserWindow | null,
    params?: ExportParams
): Promise<{ success: boolean; base64?: string; fileName?: string; error?: string }> {
    try {
        // Defaults de período en TZ Argentina (no TZ del SO).
        const _today = nowPartsInAppTz();
        const pMonth = params?.periodMonth ?? _today.month;
        const pYear = params?.periodYear ?? _today.year;

        // ── Generate days array for columns ──────────────────────────────────
        // From 21st of previous month to 20th of current month.
        // Iteramos con UTC para que la suma de días no sufra DST/TZ shifts.
        // Las fechas resultantes son strings puros "YYYY-MM-DD", sin TZ.
        const fromMonth = pMonth === 1 ? 12 : pMonth - 1;
        const fromYear = pMonth === 1 ? pYear - 1 : pYear;
        const startUtc = Date.UTC(fromYear, fromMonth - 1, 21);
        const endUtc = Date.UTC(pYear, pMonth - 1, 20);
        const ONE_DAY_MS = 86_400_000;

        const daysArr: string[] = [];
        const dateStrings: string[] = []; // YYYY-MM-DD to match attendances

        for (let t = startUtc; t <= endUtc; t += ONE_DAY_MS) {
            const d = new Date(t);
            daysArr.push(String(d.getUTCDate()));
            dateStrings.push(
                `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
            );
        }

        // ── Build filename: asistenciaSECTOR_DD_MM_YYYY.xlsx (TZ Argentina) ──
        const dd = String(_today.day).padStart(2, '0');
        const mm = String(_today.month).padStart(2, '0');
        const yyyy = String(_today.year);
        const sectorSlug = (params?.sectorName ?? 'SECTOR').replace(/\s+/g, '_').toUpperCase();
        const fileName = `asistencia${sectorSlug}_${dd}_${mm}_${yyyy}.xlsx`;

        // ── Create workbook and matrix ────────────────────────────────────
        const wb = XLSX.utils.book_new();

        // Formatea un total numérico: entero sin decimales, decimal con coma (ej: 19,58)
        const fmtNum = (n: number): string => {
            const r = Math.round(n * 100) / 100;
            return Number.isInteger(r) ? String(r) : r.toFixed(2).replace('.', ',');
        };
        // Celda de total por tipo: "<sigla> <numero>", vacía si no hay dato
        const celdaTotal = (sigla: string, n: number): string => (n > 0 ? `${sigla} ${fmtNum(n)}` : '');
        // "Abonada y Otros" es texto libre (concepto y/o monto): se muestra tal cual se
        // cargo. Por eso no lleva fila de total abajo — sumar texto daria un numero falso.
        const celdaAbonada = (textos: string[]): string => textos.filter(Boolean).join(' | ');

        // Tipos de carga nuevos — cada uno con su columna propia (ya no JSON). Se
        // muestran en OBSERVACIONES como texto legible en vez de sumarse a columnas
        // (todavía no hay volumen de datos real para justificar columnas propias).
        const formatTiposNuevos = (a: Record<string, any>): string => {
            const partes: string[] = [];
            if (a.km_viajes) partes.push(`Km ${a.km_viajes}`);
            if (a.has_fumigadas) partes.push(`Ha fumigadas ${a.has_fumigadas}`);
            if (a.siembra_trilla) partes.push(`Siembra/Trilla ${a.siembra_trilla}`);
            if (a.bolseros) partes.push(`Bolseros ${a.bolseros}`);
            if (a.etiquetado) partes.push(`Etiquetado ${a.etiquetado}`);
            const camion = [a.carga_camion_kg50 ? '50kg' : '', a.carga_camion_kg25 ? '25kg' : '', a.carga_camion_otro ? `Otro:${a.carga_camion_otro}` : '']
                .filter(Boolean).join(' ');
            if (camion) partes.push(`Carga Camión ${camion}`);
            const estiba = [a.movimiento_estiba_kg50 ? '50kg' : '', a.movimiento_estiba_kg25 ? '25kg' : '', a.movimiento_estiba_otro ? `Otro:${a.movimiento_estiba_otro}` : '']
                .filter(Boolean).join(' ');
            if (estiba) partes.push(`Mov. Estiba ${estiba}`);
            return partes.join(' | ');
        };

        // Estado de aprobación del supervisor. Solo se marca cuando un supervisor
        // intervino de verdad (aprobada_por_nombre cargado) — las auto-aprobadas, que
        // son la enorme mayoria y nadie reviso, no muestran nada para no ensuciar.
        const formatEstadoAprobacion = (a: Record<string, any>): string => {
            const quien = a.aprobada_por_nombre;
            if (a.status === 'rejected') {
                const base = quien ? `Rechazada por ${quien}` : 'Rechazada';
                return a.motivo_rechazo ? `${base}: ${a.motivo_rechazo}` : base;
            }
            if (a.status === 'pending') return 'Pendiente de aprobación';
            if (a.status === 'approved' && quien) return `Aprobada por ${quien}`;
            return '';
        };

        // ── Totales verticales por día (lo que cierra la jornada para RRHH) ──
        // Se acumulan leyendo las celdas ya normalizadas de cada empleado ("8H",
        // "0H|C:33", "$36400"), asi hay un solo criterio y no se duplica el parseo.
        const totalesPorDia = dateStrings.map(() => ({ horas: 0, cosecha: 0, cajas: 0, cajones: 0, importe: 0 }));
        const numDe = (s: string | undefined): number => {
            if (!s) return 0;
            const n = parseFloat(s.replace(',', '.'));
            return isNaN(n) ? 0 : n;
        };
        const acumularPorDia = (celdas: string[]): void => {
            celdas.forEach((celda, i) => {
                const acc = totalesPorDia[i];
                if (!acc || !celda || celda === 'AUSENTE') return;
                acc.horas    += numDe(celda.match(/(?:^|\|)\s*([0-9]+(?:[.,][0-9]+)?)H/)?.[1]);
                acc.cosecha  += numDe(celda.match(/C:([0-9]+(?:[.,][0-9]+)?)/)?.[1]);
                acc.cajas    += numDe(celda.match(/Cajas ([0-9]+(?:[.,][0-9]+)?)/)?.[1]);
                acc.cajones  += numDe(celda.match(/Cajones ([0-9]+(?:[.,][0-9]+)?)/)?.[1]);
                const ab = celda.match(/AB:([0-9]+(?:[.,][0-9]+)?)/)?.[1];
                if (ab) acc.importe += numDe(ab);
                else if (celda.startsWith('$')) acc.importe += numDe(celda.slice(1));
            });
        };

        // 1. Inicializar la matriz con las filas iniciales
        // Una columna de total separada por cada tipo de dato
        // Los tipos de carga nuevos llevan columna propia igual que los viejos.
        // Solo se agregan las que el sector realmente usa, para no ensuciar la planilla
        // con columnas vacias en los sectores que no las tienen.
        const tieneDato = (campo: string) =>
            (params?.attendances ?? []).some(a => a[campo] !== null && a[campo] !== undefined && a[campo] !== false);
        const columnasNuevas: Array<{ header: string; campo: string; tipo: 'num' | 'peso' }> = [
            { header: 'KM/VIAJES', campo: 'km_viajes', tipo: 'num' },
            { header: 'HAS FUMIGADAS', campo: 'has_fumigadas', tipo: 'num' },
            { header: 'SIEMBRA/TRILLA', campo: 'siembra_trilla', tipo: 'num' },
            { header: 'BOLSEROS', campo: 'bolseros', tipo: 'num' },
            { header: 'ETIQUETADO', campo: 'etiquetado', tipo: 'num' },
            { header: 'CARGA CAMION', campo: 'carga_camion', tipo: 'peso' },
            { header: 'MOV. ESTIBA', campo: 'movimiento_estiba', tipo: 'peso' },
        ].filter(c => c.tipo === 'num'
            ? tieneDato(c.campo)
            : tieneDato(`${c.campo}_kg50`) || tieneDato(`${c.campo}_kg25`) || tieneDato(`${c.campo}_otro`));

        // Resumen corto de los tipos nuevos de UNA tarja, para la celda del dia.
        const tiposDelDia = (a: Record<string, any>): string => {
            const partes: string[] = [];
            if (a.km_viajes) partes.push(`Km ${a.km_viajes}`);
            if (a.has_fumigadas) partes.push(`Ha ${a.has_fumigadas}`);
            if (a.siembra_trilla) partes.push(`S/T ${a.siembra_trilla}`);
            if (a.bolseros) partes.push(`Bols ${a.bolseros}`);
            if (a.etiquetado) partes.push(`Etiq ${a.etiquetado}`);
            const cc = pesosDe(a, 'carga_camion');
            if (cc.length) partes.push('CC ' + cc.join('/'));
            const me = pesosDe(a, 'movimiento_estiba');
            if (me.length) partes.push('ME ' + me.join('/'));
            return partes.join(' ');
        };

        // Pesos de una tarja de camion/estiba: "50kg", "25kg" y/o lo escrito en "Otro".
        const pesosDe = (a: Record<string, any>, campo: string): string[] => [
            a[`${campo}_kg50`] ? '50kg' : '',
            a[`${campo}_kg25`] ? '25kg' : '',
            a[`${campo}_otro`] || '',
        ].filter(Boolean);

        const filaCabeceras = ['N', 'DNI', params?.sectorName ?? 'SECTOR', ...daysArr,
            'HORAS', 'COSECHA', 'CAJAS', 'CAJONES', 'ABONADA Y OTROS',
            ...columnasNuevas.map(c => c.header), 'OBSERVACIONES'];
        // Indices calculados por nombre: antes se hacia con restas sobre la posicion de
        // IMPORTE y cualquier columna nueva rompia silenciosamente los totales.
        const colDe = (header: string) => filaCabeceras.indexOf(header);
        const excelData: (string | number | null)[][] = [
            ['ENCARGADO'],
            [params?.encargado || 'SERGIO GODOY'],
            [],
            filaCabeceras
        ];

        let granTotalHoras = 0;
        let granTotalCosecha = 0;
        let granTotalCajas = 0;
        let granTotalCajones = 0;
        let granTotalImporte = 0;

        // ── Mapeo de Empleados (Filas 5 en adelante) ─────────────────────
        const attendances = params?.attendances ?? [];
        const absences = params?.absences ?? [];
        const employees = params?.employees ?? [];
        const transfers = params?.transfers ?? [];

        // Lookup rápido de traslados por employee_id
        // "saliente": from_sector_id == este sector → "Se fue a X"
        // "entrante": to_sector_id   == este sector → "Viene de X"
        const transferOutMap = new Map<string, string>(); // empId → nombre sector destino
        const transferInMap  = new Map<string, string>(); // empId → nombre sector origen
        const currentSectorId = params?.sectorId;
        transfers.forEach(t => {
            if (currentSectorId && t.to_sector_id === currentSectorId) {
                // El empleado ENTRÓ a este sector, viene de from_sector_name
                if (t.from_sector_name) transferInMap.set(t.employee_id, t.from_sector_name);
            } else if (currentSectorId && t.from_sector_id === currentSectorId) {
                // El empleado SALIÓ de este sector, se fue a to_sector_name
                if (t.to_sector_name) transferOutMap.set(t.employee_id, t.to_sector_name);
            } else {
                // Sin sectorId disponible: fallback (ambos mapas como antes)
                if (t.to_sector_name) transferOutMap.set(t.employee_id, t.to_sector_name);
                if (t.from_sector_name) transferInMap.set(t.employee_id, t.from_sector_name);
            }
        });

        console.log(`[exportExcel] Procesando ${employees.length} empleados, ${attendances.length} asistencias, ${absences.length} ausencias`);

        // Agrupar ausencias por employee_id para lookup O(1)
        const absencesByEmp = new Map<string, Array<{ start: string; end: string }>>();
        absences.forEach(a => {
            const empId = String(a.employee_id);
            if (!absencesByEmp.has(empId)) absencesByEmp.set(empId, []);
            absencesByEmp.get(empId)!.push({ start: a.start_date, end: a.end_date });
        });

        // 2. Iterar sobre los empleados y agregarlos a la matriz
        employees.forEach((emp, index) => {
            let totalHorasEmpleado = 0;
            let totalCosechaEmpleado = 0;
            let totalImporteEmpleado = 0;
            let totalCajasEmpleado = 0;
            let totalCajonesEmpleado = 0;
            // Totales de los tipos nuevos: los numericos se suman, camion/estiba cuentan dias
            const totalNuevos: Record<string, number> = {};
            const pesosNuevos: Record<string, Set<string>> = {};
            const abonadaTextos: string[] = [];
            const empAtts = attendances.filter(a => String(a.employee_id) === String(emp.id) || (emp.dni && a.dni === emp.dni));
            empAtts.forEach(a => {
                columnasNuevas.forEach(c => {
                    if (c.tipo === 'num') {
                        totalNuevos[c.campo] = (totalNuevos[c.campo] ?? 0) + (Number(a[c.campo]) || 0);
                    } else {
                        const pesos = pesosDe(a, c.campo);
                        if (pesos.length) {
                            pesosNuevos[c.campo] = pesosNuevos[c.campo] ?? new Set();
                            pesos.forEach(x => pesosNuevos[c.campo].add(x));
                        }
                    }
                });
                // Abonada: se guarda el texto tal cual, sin convertirlo a numero
                const segAB = String(a.work_value ?? '').split('|').find(x => x.startsWith('AB:'));
                if (segAB) abonadaTextos.push(segAB.slice(3).trim());
            });
            const empAbsences = absencesByEmp.get(emp.id) ?? [];

            // Mapa para desglose por sector anterior
            const foreignSectorsMap = new Map<string, number>();

            const horasDelEmpleado = dateStrings.map(dateStr => {
                // PRIORIDAD 1: ausencia registrada que cubre este día → AUSENTE
                const isAbsent = empAbsences.some(abs => abs.start <= dateStr && dateStr <= abs.end);
                if (isAbsent) return 'AUSENTE';

                // PRIORIDAD 2: asistencia registrada
                const att = empAtts.find(a => a.date && a.date.startsWith(dateStr));
                if (att) {
                    if (att.status === 'Faltante') {
                        return 'AUSENTE';
                    } else {
                        // work_value puede ser 'H 8', 'C', '$500', 'H 4|C:33', 'H 0|AB:47573,53',
                        // 'H 4|Cajas 32 Cajones 43', etc. Las horas llevan prefijo "H " desde la app.
                        const rawVal = att.work_value ?? att.hours ?? '';
                        const valStr = String(rawVal).trim();
                        const extraDia = tiposDelDia(att);
                        if (valStr === '' || valStr === 'null') return extraDia;

                        const parseHorasSegment = (seg: string): number => {
                            const s = seg.startsWith('H ') ? seg.slice(2) : seg;
                            const n = parseFloat(s);
                            return isNaN(n) ? 0 : n;
                        };

                        // Formato compuesto: primer segmento son las horas, el resto son tipos ("C:", "AB:", "Cajas ", "Cajones ")
                        if (valStr.includes('|')) {
                            const segs = valStr.split('|');
                            const hrsNum = parseHorasSegment(segs[0]);
                            if (hrsNum > 0) totalHorasEmpleado += hrsNum;

                            for (const seg of segs.slice(1)) {
                                if (seg.startsWith('C:')) {
                                    const kg = parseFloat(seg.slice(2).replace(',', '.'));
                                    if (!isNaN(kg)) totalCosechaEmpleado += kg;
                                } else if (seg.startsWith('AB:')) {
                                    const imp = parseFloat(seg.slice(3).replace(',', '.'));
                                    if (!isNaN(imp)) totalImporteEmpleado += imp;
                                } else if (seg.startsWith('Cajas ') || seg.startsWith('Cajones ')) {
                                    const cajasM = seg.match(/Cajas ([0-9]+(?:[.,][0-9]+)?)/);
                                    const cajonesM = seg.match(/Cajones ([0-9]+(?:[.,][0-9]+)?)/);
                                    if (cajasM) {
                                        const v = parseFloat(cajasM[1].replace(',', '.'));
                                        if (!isNaN(v)) totalCajasEmpleado += v;
                                    }
                                    if (cajonesM) {
                                        const v = parseFloat(cajonesM[1].replace(',', '.'));
                                        if (!isNaN(v)) totalCajonesEmpleado += v;
                                    }
                                }
                            }
                            // Con 0 horas pero OTROS datos cargados, el "0H" solo ensucia: se muestran solo
                            // los otros datos. Una tarja de 0 horas sin nada mas SI muestra el 0,
                            // para no confundirla con un dia que no se tarjo.
                            const base = hrsNum > 0
                                ? `${hrsNum}H|${segs.slice(1).join('|')}`
                                : segs.slice(1).join('|');
                            return [base, extraDia].filter(Boolean).join(' ');
                        }

                        // Valor standalone '$36400' → importe
                        if (valStr.startsWith('$')) {
                            const imp = parseFloat(valStr.slice(1).replace(',', '.'));
                            if (!isNaN(imp) && imp > 0) totalImporteEmpleado += imp;
                            return valStr;
                        }

                        // "H 4" (formato nuevo, sin tipos especiales)
                        if (valStr.startsWith('H ')) {
                            const numericVal = parseHorasSegment(valStr);
                            if (numericVal > 0) {
                                totalHorasEmpleado += numericVal;
                                if (att.record_sector_name && att.record_sector_name !== params?.sectorName) {
                                    const currentSum = foreignSectorsMap.get(att.record_sector_name) ?? 0;
                                    foreignSectorsMap.set(att.record_sector_name, currentSum + numericVal);
                                }
                            }
                            // 0 horas con algun tipo de carga nuevo: se muestra solo el tipo,
                            // el "0H" al lado no aporta nada y ensucia la planilla.
                            if (numericVal === 0 && extraDia) return extraDia;
                            return [`${numericVal}H`, extraDia].filter(Boolean).join(' ');
                        }

                        // Número plano sin prefijo — datos viejos (compatibilidad)
                        const numericVal = parseFloat(valStr);
                        if (!isNaN(numericVal)) {
                            totalHorasEmpleado += numericVal;
                            if (att.record_sector_name && att.record_sector_name !== params?.sectorName) {
                                const currentSum = foreignSectorsMap.get(att.record_sector_name) ?? 0;
                                foreignSectorsMap.set(att.record_sector_name, currentSum + numericVal);
                            }
                            return `${numericVal}H`;
                        }
                        // 'C' standalone — cosecha sin cantidad
                        return valStr;
                    }
                } else {
                    return '';
                }
            });

            acumularPorDia(horasDelEmpleado);

            granTotalHoras   += totalHorasEmpleado;
            granTotalCosecha += totalCosechaEmpleado;
            granTotalCajas   += totalCajasEmpleado;
            granTotalCajones += totalCajonesEmpleado;
            granTotalImporte += totalImporteEmpleado;

            // Notas de asistencias del empleado (una por día que tenga nota)
            const empNotasParts: string[] = [];
            empAtts.forEach(a => {
                const day = a.date ? String(a.date).slice(8, 10) : '?';
                const nota = a.notes;
                if (nota && String(nota).trim()) {
                    empNotasParts.push(`${day}: ${String(nota).trim()}`);
                }
                // OBSERVACIONES queda SOLO con lo que escribio el tarjador: los tipos de
                // carga tienen columna propia y el estado de aprobacion se ve en el cartel
                // de StaffAdmin, no hace falta duplicarlos aca.
            });
            const notasAsistencias = empNotasParts.join(' | ');

            let notaOtrosSectores = '';
            foreignSectorsMap.forEach((horas, sectorName) => {
                if (notaOtrosSectores) notaOtrosSectores += ' | ';
                notaOtrosSectores += `${horas} hs en ${sectorName.toUpperCase()}`;
            });

            const fromSector = transferInMap.get(emp.id);
            if (fromSector && !notaOtrosSectores) notaOtrosSectores = `Viene de ${fromSector.toUpperCase()}`;

            if (notasAsistencias) {
                notaOtrosSectores = notaOtrosSectores
                    ? `${notasAsistencias} | ${notaOtrosSectores}`
                    : notasAsistencias;
            }

            excelData.push([
                index + 1,
                emp.dni || (emp as any).document_number || (emp as any).document || 'Sin datos',
                `${emp.last_name} ${emp.first_name}`.trim(),
                ...horasDelEmpleado,
                celdaTotal('H',  totalHorasEmpleado),
                celdaTotal('C',  totalCosechaEmpleado),
                celdaTotal('CJ', totalCajasEmpleado),
                celdaTotal('CN', totalCajonesEmpleado),
                celdaAbonada(abonadaTextos),
                ...columnasNuevas.map(c => {
                    if (c.tipo === 'peso') return [...(pesosNuevos[c.campo] ?? [])].join(', ');
                    const v = totalNuevos[c.campo] ?? 0;
                    return v > 0 ? fmtNum(v) : '';
                }),
                notaOtrosSectores
            ]);
        });

        // 3. Empleados trasladados: asistencias del período cuyo employee_id ya no está en la lista actual
        const employeeIds = new Set(employees.map(e => String(e.id)));
        const empIdsDni = new Set(employees.map(e => e.dni).filter(Boolean));

        // Agrupar asistencias huérfanas por employee_id
        const orphanMap = new Map<string, { first_name: string; last_name: string; dni: string; is_active: boolean; atts: typeof attendances }>();
        attendances.forEach(a => {
            const empId = String(a.employee_id ?? '');
            if (!empId || employeeIds.has(empId)) return;
            // Antes se descartaba si el DNI coincidia con un empleado activo actual,
            // para no duplicar a la misma persona en dos filas. Pero cuando alguien
            // termina con DOS fichas de empleado (mismo DNI, dos id distintos — un bug
            // de creacion que se esta arreglando aparte), este chequeo tapaba horas
            // reales de la ficha vieja en vez de mostrarlas como corresponde.
            if (!orphanMap.has(empId)) {
                orphanMap.set(empId, {
                    first_name: a.first_name ?? '',
                    last_name: a.last_name ?? '',
                    dni: a.dni ?? 'Sin datos',
                    // El reporte trae is_active=false para los dados de baja: sin esto
                    // los marcariamos como trasladados, que es otra cosa.
                    is_active: a.is_active !== false,
                    atts: [],
                });
            }
            orphanMap.get(empId)!.atts.push(a);
        });

        let orphanIndex = employees.length + 1;
        orphanMap.forEach(({ first_name, last_name, dni, is_active, atts }, empId) => {
            let totalHorasOrphan = 0;
            let totalCosechaOrphan = 0;
            let totalImporteOrphan = 0;
            let totalCajasOrphan = 0;
            let totalCajonesOrphan = 0;
            const parseHorasSegmentOrphan = (seg: string): number => {
                const s = seg.startsWith('H ') ? seg.slice(2) : seg;
                const n = parseFloat(s);
                return isNaN(n) ? 0 : n;
            };
            const horasOrphan = dateStrings.map(dateStr => {
                const att = atts.find(a => a.date && a.date.startsWith(dateStr));
                if (!att) return '';
                const rawVal = att.work_value ?? att.hours ?? '';
                const valStr = String(rawVal).trim();
                if (valStr === '' || valStr === 'null') return '';
                if (valStr.includes('|')) {
                    const segs = valStr.split('|');
                    const hrsNum = parseHorasSegmentOrphan(segs[0]);
                    if (hrsNum > 0) totalHorasOrphan += hrsNum;
                    for (const seg of segs.slice(1)) {
                        if (seg.startsWith('C:')) {
                            const kg = parseFloat(seg.slice(2).replace(',', '.'));
                            if (!isNaN(kg)) totalCosechaOrphan += kg;
                        } else if (seg.startsWith('AB:')) {
                            const imp = parseFloat(seg.slice(3).replace(',', '.'));
                            if (!isNaN(imp)) totalImporteOrphan += imp;
                        } else if (seg.startsWith('Cajas ') || seg.startsWith('Cajones ')) {
                            const cajasM = seg.match(/Cajas ([0-9]+(?:[.,][0-9]+)?)/);
                            const cajonesM = seg.match(/Cajones ([0-9]+(?:[.,][0-9]+)?)/);
                            if (cajasM) {
                                const v = parseFloat(cajasM[1].replace(',', '.'));
                                if (!isNaN(v)) totalCajasOrphan += v;
                            }
                            if (cajonesM) {
                                const v = parseFloat(cajonesM[1].replace(',', '.'));
                                if (!isNaN(v)) totalCajonesOrphan += v;
                            }
                        }
                    }
                    // Con 0 horas pero OTROS datos cargados, el "0H" solo ensucia: se muestran solo
                            // los otros datos. Una tarja de 0 horas sin nada mas SI muestra el 0,
                            // para no confundirla con un dia que no se tarjo.
                            return hrsNum > 0
                                ? `${hrsNum}H|${segs.slice(1).join('|')}`
                                : segs.slice(1).join('|');
                }
                if (valStr.startsWith('$')) {
                    const imp = parseFloat(valStr.slice(1).replace(',', '.'));
                    if (!isNaN(imp) && imp > 0) totalImporteOrphan += imp;
                    return valStr;
                }
                if (valStr.startsWith('H ')) {
                    const numericVal = parseHorasSegmentOrphan(valStr);
                    if (numericVal > 0) totalHorasOrphan += numericVal;
                    return `${numericVal}H`;
                }
                const numericVal = parseFloat(valStr);
                if (!isNaN(numericVal)) {
                    totalHorasOrphan += numericVal;
                    return `${numericVal}H`;
                }
                return valStr;
            });
            acumularPorDia(horasOrphan);

            granTotalHoras   += totalHorasOrphan;
            granTotalCosecha += totalCosechaOrphan;
            granTotalCajas   += totalCajasOrphan;
            granTotalCajones += totalCajonesOrphan;
            granTotalImporte += totalImporteOrphan;
            const toSector = transferOutMap.get(empId)
                ?? atts.find(a => a.current_sector_name && a.current_sector_name !== params?.sectorName)?.current_sector_name
                ?? atts[0]?.current_sector_name;
            // Un traslado real gana sobre la baja: si se fue a otro sector eso es lo
            // que hay que leer. Recien si no se movio a ningun lado decimos que es baja.
            const notaOrphan = (toSector && toSector !== params?.sectorName)
                ? `Se fue a ${String(toSector).toUpperCase()}`
                : !is_active
                    ? 'Inactivo'
                    : 'Se trasladó a otro sector';
            excelData.push([
                orphanIndex++,
                dni,
                `${last_name} ${first_name}`.trim(),
                ...horasOrphan,
                celdaTotal('H',  totalHorasOrphan),
                celdaTotal('C',  totalCosechaOrphan),
                celdaTotal('CJ', totalCajasOrphan),
                celdaTotal('CN', totalCajonesOrphan),
                celdaAbonada(atts.map(a =>
                    String(a.work_value ?? '').split('|').find(x => x.startsWith('AB:'))?.slice(3).trim() ?? ''
                )),
                // Mismos totales de tipos nuevos que en las filas normales, para que la
                // columna OBSERVACIONES no se corra de lugar en estas filas.
                ...columnasNuevas.map(c => {
                    if (c.tipo === 'peso') {
                        const set = new Set<string>();
                        atts.forEach(a => pesosDe(a, c.campo).forEach(x => set.add(x)));
                        return [...set].join(', ');
                    }
                    const v = atts.reduce((acc, a) => acc + (Number(a[c.campo]) || 0), 0);
                    return v > 0 ? fmtNum(v) : '';
                }),
                notaOrphan,
            ]);
        });

        // 4. Construir e insertar la fila del Gran Total al final
        // Las 5 columnas de total van antes de OBSERVACIONES (última)
        const importeColIdx = colDe('ABONADA Y OTROS');
        const filaFinal = Array(filaCabeceras.length).fill('');
        filaFinal[2] = 'TOTAL';
        filaFinal[colDe('HORAS')]   = celdaTotal('H',  granTotalHoras);
        filaFinal[colDe('COSECHA')] = celdaTotal('C',  granTotalCosecha);
        filaFinal[colDe('CAJAS')]   = celdaTotal('CJ', granTotalCajas);
        filaFinal[colDe('CAJONES')] = celdaTotal('CN', granTotalCajones);
        // ABONADA Y OTROS no lleva gran total: es texto libre, sumarlo daria un numero falso.
        columnasNuevas.forEach(c => {
            if (c.tipo === 'peso') {
                const set = new Set<string>();
                attendances.forEach(a => pesosDe(a, c.campo).forEach(x => set.add(x)));
                if (set.size) filaFinal[colDe(c.header)] = [...set].join(', ');
                return;
            }
            const total = attendances.reduce((acc, a) => acc + (Number(a[c.campo]) || 0), 0);
            if (total > 0) filaFinal[colDe(c.header)] = fmtNum(total);
        });
        excelData.push(filaFinal);

        // 5. Cierre por jornada: una fila por concepto con el total de cada día.
        // La fila TOTAL de arriba resume el período; estas cierran día por día.
        const PRIMER_DIA_COL = 3; // N, DNI, SECTOR y recién ahí arrancan los días
        const filasExtra: (string | number | null)[][] = [];
        const filasPorConcepto: Array<{
            etiqueta: string;
            colTotal: number;
            valor: (t: typeof totalesPorDia[number]) => number;
            celda: (n: number) => string;
        }> = [
            { etiqueta: 'TOTAL HORAS',   colTotal: colDe('HORAS'),   valor: t => t.horas,   celda: n => `${fmtNum(n)}H` },
            { etiqueta: 'TOTAL COSECHA', colTotal: colDe('COSECHA'), valor: t => t.cosecha, celda: n => fmtNum(n) },
            { etiqueta: 'TOTAL CAJAS',   colTotal: colDe('CAJAS'),   valor: t => t.cajas,   celda: n => fmtNum(n) },
            { etiqueta: 'TOTAL CAJONES', colTotal: colDe('CAJONES'), valor: t => t.cajones, celda: n => fmtNum(n) },
            // Sin fila para ABONADA Y OTROS: al ser texto libre no se puede sumar.
        ];

        // Mismo contador por dia para los tipos de carga nuevos. Los numericos se suman;
        // camion y estiba listan que pesos hubo ese dia, igual que en la columna TOTAL.
        columnasNuevas.forEach(c => {
            const porDia = dateStrings.map(fecha => {
                const delDia = attendances.filter(a => a.date && String(a.date).startsWith(fecha));
                if (c.tipo === 'peso') {
                    const set = new Set();
                    delDia.forEach(a => pesosDe(a, c.campo).forEach(x => set.add(x)));
                    return set.size ? [...set].join(', ') : '';
                }
                const n = delDia.reduce((acc, a) => acc + (Number(a[c.campo]) || 0), 0);
                return n > 0 ? fmtNum(n) : '';
            });
            if (porDia.every(x => x === '')) return;   // el sector no uso este tipo

            const fila = Array(filaCabeceras.length).fill('');
            fila[2] = 'TOTAL ' + c.header;
            porDia.forEach((v, i) => { if (v) fila[PRIMER_DIA_COL + i] = v; });
            if (c.tipo === 'peso') {
                const set = new Set();
                attendances.forEach(a => pesosDe(a, c.campo).forEach(x => set.add(x)));
                fila[colDe(c.header)] = [...set].join(', ');
            } else {
                fila[colDe(c.header)] = fmtNum(attendances.reduce((acc, a) => acc + (Number(a[c.campo]) || 0), 0));
            }
            filasExtra.push(fila);
        });

        filasPorConcepto.forEach(({ etiqueta, colTotal, valor, celda }) => {
            // Si en todo el período no hubo nada de este tipo, no ensuciamos la planilla
            const totalPeriodo = totalesPorDia.reduce((acc, t) => acc + valor(t), 0);
            if (totalPeriodo <= 0) return;

            const fila = Array(filaCabeceras.length).fill('');
            fila[2] = etiqueta;
            totalesPorDia.forEach((t, i) => {
                const n = valor(t);
                if (n > 0) fila[PRIMER_DIA_COL + i] = celda(n);
            });
            fila[colTotal] = celda(totalPeriodo);
            excelData.push(fila);
        });

        filasExtra.forEach(f => excelData.push(f));

        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // ── Setup Column Widths for better reading ───────────────────────
        const cols = [
            { wch: 5 },  // N (Indice)
            { wch: 12 }, // DNI
            { wch: 30 }, // Nombre completo
        ];
        // Add width for days
        for (let i = 0; i < daysArr.length; i++) cols.push({ wch: 6 });

        // Una columna por cada tipo de total
        cols.push({ wch: 10 }); // HORAS    -> "H 43"
        cols.push({ wch: 11 }); // COSECHA  -> "C 338"
        cols.push({ wch: 11 }); // CAJAS    -> "CJ 19,58"
        cols.push({ wch: 11 }); // CAJONES  -> "CN 42,02"
        cols.push({ wch: 13 }); // IMPORTE  -> "$47.573"
        columnasNuevas.forEach(() => cols.push({ wch: 14 })); // tipos de carga nuevos
        cols.push({ wch: 30 }); // OBSERVACIONES

        ws['!cols'] = cols;

        XLSX.utils.book_append_sheet(wb, ws, 'Asistencias');

        // ── Return base64 string to frontend ──────────────────────────────
        const base64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

        console.log(`[exportExcel] Archivo generado en memoria: ${fileName}`);
        return { success: true, base64, fileName };

    } catch (error: any) {
        console.error('[exportExcel] Error al generar el Excel:', error);
        return { success: false, error: error.message ?? 'Error desconocido' };
    }
}

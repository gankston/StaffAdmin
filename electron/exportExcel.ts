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
        // 1. Inicializar la matriz con las filas iniciales
        const filaCabeceras = ['N', 'DNI', params?.sectorName ?? 'SECTOR', ...daysArr, 'TOTAL', 'OBSERVACIONES'];
        const excelData: (string | number | null)[][] = [
            ['ENCARGADO'],
            [params?.encargado || 'SERGIO GODOY'],
            [],
            filaCabeceras
        ];

        let granTotalHoras = 0;

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
            const empAtts = attendances.filter(a => String(a.employee_id) === String(emp.id) || (emp.dni && a.dni === emp.dni));
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
                        // work_value puede ser '8H', 'C', '$500', '4|C:33', '0|AB:47573,53', etc.
                        const rawVal = att.work_value ?? att.hours ?? '';
                        const valStr = String(rawVal).trim();
                        if (valStr === '' || valStr === 'null') return '';

                        // Formato compuesto: "{horas}|C:{numero}" o "{horas}|AB:{importe}"
                        if (valStr.includes('|')) {
                            const [hrsPart, rest] = valStr.split('|');
                            const hrsNum = parseFloat(hrsPart);
                            if (!isNaN(hrsNum) && hrsNum > 0) totalHorasEmpleado += hrsNum;
                            // Acumular cosecha o importe en el total del empleado
                            if (rest?.startsWith('C:')) {
                                const kg = parseFloat(rest.slice(2).replace(',', '.'));
                                if (!isNaN(kg)) totalCosechaEmpleado += kg;
                            } else if (rest?.startsWith('AB:')) {
                                const imp = parseFloat(rest.slice(3).replace(',', '.'));
                                if (!isNaN(imp)) totalImporteEmpleado += imp;
                            }
                            return `${hrsNum > 0 ? hrsNum + 'H' : '0H'}|${rest}`;
                        }

                        // Valor standalone '$36400' → importe
                        if (valStr.startsWith('$')) {
                            const imp = parseFloat(valStr.slice(1).replace(',', '.'));
                            if (!isNaN(imp) && imp > 0) totalImporteEmpleado += imp;
                            return valStr;
                        }

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

            granTotalHoras += totalHorasEmpleado;

            // Celda TOTAL del empleado: arma un string compuesto con todo lo que trabajó
            const partesTotalEmp: string[] = [];
            if (totalHorasEmpleado > 0) partesTotalEmp.push(`${totalHorasEmpleado}H`);
            if (totalCosechaEmpleado > 0) partesTotalEmp.push(`C:${totalCosechaEmpleado}`);
            if (totalImporteEmpleado > 0) partesTotalEmp.push(`$${totalImporteEmpleado.toLocaleString('es')}`);
            const totalCellEmp = partesTotalEmp.length > 0 ? partesTotalEmp.join(' | ') : 0;

            // Notas de asistencias del empleado (una por día que tenga nota)
            const empNotasParts: string[] = [];
            empAtts.forEach(a => {
                const nota = a.notes;
                if (nota && String(nota).trim()) {
                    const day = a.date ? String(a.date).slice(8, 10) : '?';
                    empNotasParts.push(`${day}: ${String(nota).trim()}`);
                }
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
                totalCellEmp,
                notaOtrosSectores
            ]);
        });

        // 3. Empleados trasladados: asistencias del período cuyo employee_id ya no está en la lista actual
        const employeeIds = new Set(employees.map(e => String(e.id)));
        const empIdsDni = new Set(employees.map(e => e.dni).filter(Boolean));

        // Agrupar asistencias huérfanas por employee_id
        const orphanMap = new Map<string, { first_name: string; last_name: string; dni: string; atts: typeof attendances }>();
        attendances.forEach(a => {
            const empId = String(a.employee_id ?? '');
            if (!empId || employeeIds.has(empId)) return;
            if (a.dni && empIdsDni.has(a.dni)) return; // matched by DNI
            if (!orphanMap.has(empId)) {
                orphanMap.set(empId, {
                    first_name: a.first_name ?? '',
                    last_name: a.last_name ?? '',
                    dni: a.dni ?? 'Sin datos',
                    atts: [],
                });
            }
            orphanMap.get(empId)!.atts.push(a);
        });

        let orphanIndex = employees.length + 1;
        orphanMap.forEach(({ first_name, last_name, dni, atts }, empId) => {
            let totalHorasOrphan = 0;
            let totalCosechaOrphan = 0;
            let totalImporteOrphan = 0;
            const horasOrphan = dateStrings.map(dateStr => {
                const att = atts.find(a => a.date && a.date.startsWith(dateStr));
                if (!att) return '';
                const rawVal = att.work_value ?? att.hours ?? '';
                const valStr = String(rawVal).trim();
                if (valStr === '' || valStr === 'null') return '';
                if (valStr.includes('|')) {
                    const [hrsPart, rest] = valStr.split('|');
                    const hrsNum = parseFloat(hrsPart);
                    if (!isNaN(hrsNum) && hrsNum > 0) totalHorasOrphan += hrsNum;
                    if (rest?.startsWith('C:')) {
                        const kg = parseFloat(rest.slice(2).replace(',', '.'));
                        if (!isNaN(kg)) totalCosechaOrphan += kg;
                    } else if (rest?.startsWith('AB:')) {
                        const imp = parseFloat(rest.slice(3).replace(',', '.'));
                        if (!isNaN(imp)) totalImporteOrphan += imp;
                    }
                    return `${hrsNum > 0 ? hrsNum + 'H' : '0H'}|${rest}`;
                }
                if (valStr.startsWith('$')) {
                    const imp = parseFloat(valStr.slice(1).replace(',', '.'));
                    if (!isNaN(imp) && imp > 0) totalImporteOrphan += imp;
                    return valStr;
                }
                const numericVal = parseFloat(valStr);
                if (!isNaN(numericVal)) {
                    totalHorasOrphan += numericVal;
                    return `${numericVal}H`;
                }
                return valStr;
            });
            granTotalHoras += totalHorasOrphan;
            const partesOrphan: string[] = [];
            if (totalHorasOrphan > 0) partesOrphan.push(`${totalHorasOrphan}H`);
            if (totalCosechaOrphan > 0) partesOrphan.push(`C:${totalCosechaOrphan}`);
            if (totalImporteOrphan > 0) partesOrphan.push(`$${totalImporteOrphan.toLocaleString('es')}`);
            const totalCellOrphan = partesOrphan.length > 0 ? partesOrphan.join(' | ') : 0;
            const toSector = transferOutMap.get(empId)
                ?? atts.find(a => a.current_sector_name && a.current_sector_name !== params?.sectorName)?.current_sector_name
                ?? atts[0]?.current_sector_name;
            const notaOrphan = (toSector && toSector !== params?.sectorName)
                ? `Se fue a ${String(toSector).toUpperCase()}`
                : 'Se trasladó a otro sector';
            excelData.push([
                orphanIndex++,
                dni,
                `${last_name} ${first_name}`.trim(),
                ...horasOrphan,
                totalCellOrphan,
                notaOrphan,
            ]);
        });

        // 4. Construir e insertar la fila del Gran Total al final
        // El gran total va en la columna TOTAL (penúltima), no en OBSERVACIONES (última)
        const totalColIdx = filaCabeceras.length - 2; // 'TOTAL' está antes de 'OBSERVACIONES'
        const filaFinal = Array(filaCabeceras.length).fill('');
        filaFinal[2] = 'TOTAL';
        filaFinal[totalColIdx] = `${granTotalHoras}H`;
        excelData.push(filaFinal);

        const ws = XLSX.utils.aoa_to_sheet(excelData);

        // ── Setup Column Widths for better reading ───────────────────────
        const cols = [
            { wch: 5 },  // N (Indice)
            { wch: 12 }, // DNI
            { wch: 30 }, // Nombre completo
        ];
        // Add width for days
        for (let i = 0; i < daysArr.length; i++) cols.push({ wch: 6 });

        // Add width for TOTAL column
        cols.push({ wch: 22 }); // TOTAL (más ancho para "20H | C:371 | $47573")
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

import { BrowserWindow, dialog } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ExportParams {
    sectorName: string;
    encargado?: string | null;
    employees: Array<{
        id: string;
        first_name: string;
        last_name: string;
        dni?: string | null;
        is_active: boolean;
    }>;
    attendances?: Array<{    // real attendance rows from /api/attendances
        employee_id?: string;
        first_name?: string;
        last_name?: string;
        dni?: string | null;
        date?: string;
        hours?: number | null;
        status?: string | null;
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
        const pMonth = params?.periodMonth ?? (new Date().getMonth() + 1);
        const pYear = params?.periodYear ?? new Date().getFullYear();

        // ── Generate days array for columns ──────────────────────────────────
        // From 21st of previous month to 20th of current month
        const fromMonth = pMonth === 1 ? 12 : pMonth - 1;
        const fromYear = pMonth === 1 ? pYear - 1 : pYear;
        const prevMonthDate = new Date(fromYear, fromMonth - 1, 21);
        const currMonthDate = new Date(pYear, pMonth - 1, 20);

        const daysArr: string[] = [];
        const dateStrings: string[] = []; // YYYY-MM-DD to match attendances

        for (let d = new Date(prevMonthDate); d <= currMonthDate; d.setDate(d.getDate() + 1)) {
            daysArr.push(String(d.getDate()));
            dateStrings.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        }

        // ── Build filename: asistenciaSECTOR_DD_MM_YYYY.xlsx ──
        const now = new Date();
        const dd = String(now.getDate()).padStart(2, '0');
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const yyyy = String(now.getFullYear());
        const sectorSlug = (params?.sectorName ?? 'SECTOR').replace(/\s+/g, '_').toUpperCase();
        const fileName = `asistencia${sectorSlug}_${dd}_${mm}_${yyyy}.xlsx`;

        // ── Create workbook and matrix ────────────────────────────────────
        const wb = XLSX.utils.book_new();
        // 1. Inicializar la matriz con las filas iniciales
        const filaCabeceras = ['N', 'DNI', params?.sectorName ?? 'SECTOR', ...daysArr, 'TOTAL'];
        const excelData: (string | number | null)[][] = [
            ['ENCARGADO'],
            [params?.encargado || 'SERGIO GODOY'],
            [],
            filaCabeceras
        ];

        let granTotalHoras = 0;

        // ── Mapeo de Empleados (Filas 5 en adelante) ─────────────────────
        const attendances = params?.attendances ?? [];
        const employees = params?.employees ?? [];

        // 2. Iterar sobre los empleados y agregarlos a la matriz
        employees.forEach((emp, index) => {
            let totalHorasEmpleado = 0;
            const empAtts = attendances.filter(a => String(a.employee_id) === String(emp.id) || (emp.dni && a.dni === emp.dni));

            const horasDelEmpleado = dateStrings.map(dateStr => {
                const att = empAtts.find(a => a.date && a.date.startsWith(dateStr));
                if (att) {
                    if (att.status === 'Faltante') {
                        return 'AUSENTE';
                    } else {
                        const hrs = att.hours ?? '';
                        if (typeof hrs === 'number') totalHorasEmpleado += hrs;
                        if (typeof hrs === 'string' && !isNaN(Number(hrs)) && hrs !== '') totalHorasEmpleado += Number(hrs);
                        return hrs;
                    }
                } else {
                    return ''; // sin horas cargadas
                }
            });

            granTotalHoras += totalHorasEmpleado;

            // CRÍTICO: Agregar la fila del empleado a excelData
            excelData.push([
                index + 1,
                emp.dni || (emp as any).document_number || (emp as any).document || 'Sin datos',
                `${emp.last_name} ${emp.first_name}`.trim(),
                ...horasDelEmpleado,
                totalHorasEmpleado
            ]);
        });

        // 3. Construir e insertar la fila del Gran Total al final
        const filaFinal = Array(filaCabeceras.length).fill('');
        filaFinal[2] = 'TOTAL';
        filaFinal[filaFinal.length - 1] = granTotalHoras;
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
        cols.push({ wch: 10 });

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

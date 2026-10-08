/**
 * StaffAxis API Client
 * Equivalent to Ktor Client + ContentNegotiation in Compose Desktop,
 * adapted for Node.js / Electron using native fetch (Node 18+).
 *
 * Endpoint: GET https://staffaxis-api-prod.pgastonor.workers.dev/api/sectors
 */

import { todayInAppTz } from './datetime';
import fs from 'node:fs';
import nodePath from 'node:path';

// ─── DTOs (API Response Shape) ─────────────────────────────────────────────

export interface ApiSector {
    id: string;
    name: string;
    encargado?: string | null;   // real field from API (e.g. "SERGIO GODOY")
    employee_count?: number | null; // count de empleados activos — viene del JOIN en /api/sectors
    archivado?: boolean;
}

export interface SectorApiResponse {
    sectors: ApiSector[];
}

// ─── UI Model (matches what App.tsx expects) ───────────────────────────────

export interface UiSector {
    id: number;
    apiId: string;        // Original string ID from API (e.g. "sec-construccion")
    name: string;
    employees: number;
    state: 'sent' | 'missing';
    icon: string;
    encargado: string;
    trend: number;
    employeesList?: ApiEmployee[];
    /** Archivado: no se muestra en el panel (solo en "Ver archivados"). */
    archivado?: boolean;
    /**
     * Attendances de HOY para este sector. fetchSectors ya las baja para
     * decidir el estado sent/missing — se exponen acá para que App.tsx
     * pueda calcular stats globales sin volver a pedirlas (eliminaba ~20
     * requests redundantes en cada refresh).
     */
    attendancesToday?: ApiAttendance[];
}

// ─── Employee DTOs ──────────────────────────────────────────────────────────

export interface ApiEmployee {
    id: string;
    sector_id: string;
    first_name: string;
    last_name: string;
    external_code?: string | null;
    is_active: boolean;
    tiene_foto_frente: boolean;
    tiene_foto_dorso: boolean;
    // ignoreUnknownKeys equivalent: any extra fields from the DB are just ignored
    [key: string]: any;
}

export interface EmployeeApiResponse {
    employees: ApiEmployee[];
}

// ─── Attendance DTOs ─────────────────────────────────────────────────────────

export interface ApiAttendance {
    id: string;
    employee_id: string;
    sector_id?: string;
    record_sector_id?: string;
    record_sector_name?: string;
    date: string;          // ISO date string e.g. "2026-03-15"
    hours?: number | null;
    cajas?: number | null;
    cajones?: number | null;
    status?: string | null;
    first_name?: string;   // may be joined from employees table
    last_name?: string;
    dni?: string | null;
    // false = el empleado esta dado de baja. Igual aparece en el reporte si
    // trabajo dentro del periodo, porque esas horas se liquidan.
    is_active?: boolean | null;
    latitude?: number | null;
    longitude?: number | null;
    submitted_at?: string | null;
    // Tipos de carga nuevos — cada uno con su columna propia en el servidor.
    // 50/25 son booleanos (el dato ES el peso, no una cantidad).
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
    // Solo vienen cargados si un supervisor reviso la tarja de verdad — en las
    // auto-aprobadas quedan null, que es como se distingue una de la otra.
    aprobada_por_nombre?: string | null;
    aprobada_en?: string | null;
    motivo_rechazo?: string | null;
    [key: string]: any;    // ignoreUnknownKeys: extra columns are silently ignored
}

export interface AttendanceApiResponse {
    attendances: ApiAttendance[];
}

// ─── Mapper: ApiSector → UiSector ──────────────────────────────────────────
// Maps real name from API. All other fields are safe defaults until
// the API is extended to provide them.

const ICON_MAP: Record<string, string> = {
    dev: 'Cpu',
    ingeniería: 'Cpu',
    ingenieria: 'Cpu',
    operaciones: 'Truck',
    'recursos humanos': 'Users',
    rrhh: 'Users',
    finanzas: 'DollarSign',
    'i+d': 'FlaskConical',
    investigación: 'FlaskConical',
    soporte: 'Headphones',
    'customer support': 'Headphones',
};

function resolveIcon(name: string): string {
    const lower = name.toLowerCase();
    for (const [key, icon] of Object.entries(ICON_MAP)) {
        if (lower.includes(key)) return icon;
    }
    return 'Building2'; // fallback
}

export function toUiSector(api: ApiSector, index: number): UiSector {
    return {
        id: index + 1,
        apiId: api.id,
        name: api.name,
        employees: typeof api.employee_count === 'number' ? api.employee_count : 0,
        state: 'missing',
        icon: resolveIcon(api.name),
        encargado: api.encargado ?? 'Sin asignar',   // real value from API
        trend: 0,
        archivado: api.archivado === true,
    };
}

// ─── HTTP Client (equivalent to Ktor HttpClient with CIO engine) ───────────

const API_BASE = 'https://staffaxis-new-version-production.up.railway.app';

/**
 * Procesa `items` llamando `fn` con un máximo de `concurrency` en paralelo.
 * Evita disparar N×2 requests simultáneos (uno por sector) que saturan D1.
 */
async function withConcurrency<T, R>(
    items: T[],
    concurrency: number,
    fn: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let index = 0;
    async function worker() {
        while (index < items.length) {
            const i = index++;
            results[i] = await fn(items[i]);
        }
    }
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, worker);
    await Promise.all(workers);
    return results;
}

/**
 * Fetch /api/sectors with a 12-second timeout.
 * If the request fails (network error, 5xx, or timeout) it waits 2 s and
 * retries once — this covers Turso cold-start hangs and transient 503s.
 */
async function fetchSectorsOnce(attempt: number, adminToken = '', dia = ''): Promise<Response> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12_000);
    try {
        // Con los archivados: el panel los muestra aparte e Informes los necesita
        // para la historia. Los telefonos piden /api/sectors sin esto y no los ven.
        // Con tarjas_del (y el token) el server ya trae cuantas tarjas tiene cada
        // sector ese dia: un pedido en vez de uno por sector.
        const qs = `incluir_archivados=1${adminToken && dia ? `&tarjas_del=${dia}` : ''}`;
        const res = await fetch(`${API_BASE}/api/sectors?${qs}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
                ...(adminToken ? { 'X-Admin-Token': adminToken } : {}),
            },
            signal: ctrl.signal,
        });
        return res;
    } catch (err) {
        const isAbort = err instanceof Error && err.name === 'AbortError';
        throw new Error(isAbort ? `sectors fetch timed out (attempt ${attempt})` : String(err));
    } finally {
        clearTimeout(timer);
    }
}

export async function fetchSectors(adminToken = ''): Promise<UiSector[]> {
    try {
        console.log('--- INICIANDO PETICIÓN DE SECTORES ---');

        // "Hoy" según TZ Argentina, no según TZ del SO del cliente.
        // Esto evita que un encargado de noche (22:30 ART) pregunte por
        // "mañana UTC" y el server le responda con sectores vacíos.
        const today = todayInAppTz();

        let response: Response;
        try {
            response = await fetchSectorsOnce(1, adminToken, today);
        } catch (firstErr) {
            console.warn(`[fetchSectors] intento 1 fallido: ${firstErr}. Reintentando en 2 s…`);
            await new Promise(r => setTimeout(r, 2000));
            response = await fetchSectorsOnce(2, adminToken, today);
        }

        // Retry once more on 5xx (e.g. 503 Turso cold-start)
        if (!response.ok && response.status >= 500) {
            console.warn(`[fetchSectors] HTTP ${response.status} en intento 1. Reintentando en 2 s…`);
            await new Promise(r => setTimeout(r, 2000));
            response = await fetchSectorsOnce(2, adminToken, today);
        }

        console.log(`--- HTTP STATUS: ${response.status} ${response.statusText} ---`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const rawText = await response.text();
        let parsed: any;
        try { parsed = JSON.parse(rawText); }
        catch (jsonErr) { throw new Error(`JSON parse failed: ${jsonErr}. Raw: ${rawText.slice(0, 200)}`); }

        if (!parsed.sectors || !Array.isArray(parsed.sectors)) {
            throw new Error(`Invalid shape — "sectors" missing. Got: ${JSON.stringify(parsed).slice(0, 200)}`);
        }

        // Base UiSectors — employee_count viene directo del JOIN en /api/sectors
        const baseSectors: UiSector[] = (parsed.sectors as any[])
            .filter((s: any) => s && typeof s.name === 'string')
            .map((sector: any, index: number) => toUiSector(
                {
                    id: String(sector.id ?? index),
                    name: sector.name,
                    encargado: sector.encargado ?? null,
                    employee_count: typeof sector.employee_count === 'number' ? sector.employee_count : null,
                    archivado: sector.archivado === true,
                },
                index
            ));

        console.log(`Sectores base: ${baseSectors.length}`);

        // Camino rapido: el server ya mando cuantas tarjas de hoy tiene cada sector
        // (?tarjas_del). Es la misma cuenta que el /api/admin/report de abajo.
        const tarjasDia = new Map<string, number>();
        for (const s of parsed.sectors as any[]) {
            if (s && typeof s.tarjas_dia === 'number') tarjasDia.set(String(s.id), s.tarjas_dia);
        }
        if (baseSectors.length > 0 && tarjasDia.size === baseSectors.length) {
            console.log('--- SECTORES CON TARJAS DE HOY EN UN SOLO PEDIDO ---');
            return baseSectors.map((sector) => ({
                ...sector,
                state: (tarjasDia.get(sector.apiId) ?? 0) > 0 ? 'sent' : 'missing' as 'sent' | 'missing',
            }));
        }

        // ── Parallel enrichment: fetch employee count AND attendances for each sector ──────────
        // This fills in sector.employees with the real count from the API.
        // It also checks if there are attendances for TODAY to determine the state.

        // Enriquecimiento (si el server no mando tarjas_dia): solo fetch de asistencias de HOY para determinar estado sent/missing.
        // El employee_count ya viene embebido en la respuesta de /api/sectors (JOIN en DB).
        // Antes: 2 requests por sector (employees + attendances) → N×2 simultáneos → timeout en cascada.
        // Ahora: 1 request por sector (solo attendances) → N simultáneos con concurrencia controlada.
        const enriched = await withConcurrency(baseSectors, 5, async (sector) => {
                let hasAttendancesToday = false;

                try {
                    const ctrl = new AbortController();
                    const timeout = setTimeout(() => ctrl.abort(), 8000);
                    const attRes = await fetch(
                        `${API_BASE}/api/admin/report?sector_id=${encodeURIComponent(sector.apiId)}&start_date=${today}&end_date=${today}`,
                        {
                            headers: {
                                'Cache-Control': 'no-cache',
                                'Pragma': 'no-cache',
                                'X-Admin-Token': adminToken,
                            },
                            signal: ctrl.signal,
                        }
                    );
                    clearTimeout(timeout);

                    if (attRes.ok) {
                        const attData: any = await attRes.json();
                        if (Array.isArray(attData.rows)) {
                            hasAttendancesToday = attData.rows.some((a: any) => a.date && a.date.startsWith(today));
                        }
                    }

                    return {
                        ...sector,
                        state: hasAttendancesToday ? 'sent' : 'missing' as 'sent' | 'missing'
                    };
                } catch {
                    return sector;
                }
        });

        console.log(`--- SECTORES ENRIQUECIDOS: ${enriched.length} (con conteos de empleados) ---`);
        return enriched;

    } catch (error) {
        console.error('--- ERROR CRÍTICO EN SECTORES ---');
        console.error((error as Error).message);
        throw error;
    }
}

// ─── fetchEmployees ──────────────────────────────────────────────────────────
// Calls GET /api/employees?sector_id={sectorId}
// Returns empty array if endpoint not yet available (404) to avoid crashes.

export async function fetchEmployees(sectorId: string, adminToken = ''): Promise<ApiEmployee[]> {
    try {
        console.log(`--- CARGANDO EMPLEADOS PARA: ${sectorId} ---`);

        const response = await fetch(`${API_BASE}/api/admin/employees?sector_id=${encodeURIComponent(sectorId)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'X-Admin-Token': adminToken,
            },
        });

        if (response.status === 404) {
            console.log(`EMPLOYEES 404 para ${sectorId} — endpoint no activo`);
            return [];
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const rawText = await response.text();
        let parsed: any;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            throw new Error(`JSON parse error. Raw: ${rawText.slice(0, 200)}`);
        }

        // ignoreUnknownKeys: filter only what we need, ignore any extra DB columns
        const employees: ApiEmployee[] = (parsed.employees ?? [])
            .filter((e: any) => e && typeof e.first_name === 'string')
            .map((e: any): ApiEmployee => ({
                id: String(e.id ?? ''),
                sector_id: e.sector_id ?? sectorId,
                first_name: e.first_name,
                last_name: e.last_name ?? '',
                external_code: e.external_code ?? null,
                is_active: Boolean(e.is_active ?? true),
                dni: String(e.dni || e.document_number || e.document || ''),
                tiene_foto_frente: !!e.dni_foto_frente,
                tiene_foto_dorso: !!e.dni_foto_dorso,
            }));

        console.log('Empleados recibidos:', employees);
        console.log(`Cargando empleados del sector: ${sectorId}`);
        console.log(`Empleados cargados: ${employees.length}`);
        return employees;

    } catch (error) {
        console.error(`ERROR AL CARGAR EMPLEADOS DE ${sectorId}:`, (error as Error).message);
        throw error;
    }
}

// ─── fetchTransfers ───────────────────────────────────────────────────────────
// GET /api/admin/transfers?sector_id=X&start_date=Y&end_date=Z

export interface ApiTransfer {
    employee_id: string;
    from_sector_id: string | null;
    to_sector_id: string;
    from_sector_name: string | null;
    to_sector_name: string;
    first_name: string;
    last_name: string;
    dni: string | null;
    transferred_at: string;
}

export async function fetchTransfers(
    sectorId: string,
    startDate: string,
    endDate: string,
    adminToken = ''
): Promise<ApiTransfer[]> {
    try {
        const url = `${API_BASE}/api/admin/transfers?sector_id=${encodeURIComponent(sectorId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
        const res = await fetch(url, {
            headers: { 'X-Admin-Token': adminToken, 'Accept': 'application/json' }
        });
        if (!res.ok) return [];
        const data: any = await res.json();
        return Array.isArray(data.transfers) ? data.transfers : [];
    } catch {
        return [];
    }
}

// ─── fetchAttendances ─────────────────────────────────────────────────────────
// GET /api/attendances?sector_id={sectorId}&start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}

export async function fetchAttendances(
    sectorId: string,
    startDate: string,   // format: "YYYY-MM-DD"  (e.g. "2026-02-21")
    endDate: string,     // format: "YYYY-MM-DD"  (e.g. "2026-03-20")
    adminToken?: string  // optional admin token for authorization
): Promise<ApiAttendance[]> {
    try {
        const token = adminToken || '';
        const url = `${API_BASE}/api/admin/report?sector_id=${encodeURIComponent(sectorId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
        console.log(`[fetchAttendances] GET ${url}`);

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'X-Admin-Token': token,
        };

        // Un corte de red o un 5xx se reintenta una vez: si no, ese sector sale con
        // 0 tarjas en el Excel o en el PDF de Informes, sin ningun aviso.
        let response = await fetch(url, { method: 'GET', headers }).catch(() => null);
        if (!response || response.status >= 500) {
            console.warn(`[fetchAttendances] ${response ? `HTTP ${response.status}` : 'sin conexión'} para ${sectorId}, reintento en 1,5 s`);
            await new Promise(r => setTimeout(r, 1500));
            response = await fetch(url, { method: 'GET', headers });
        }

        if (!response.ok) {
            console.error(`[fetchAttendances] HTTP ${response.status} para ${sectorId}`);
            throw new Error(`No se pudieron traer las tarjas del sector (error ${response.status} del servidor)`);
        }

        const data: any = await response.json();
        // /api/admin/report devuelve {rows:[]} — mapeamos a forma ApiAttendance
        const attendances: ApiAttendance[] = Array.isArray(data.rows)
            ? data.rows.map((r: any) => {
                const raw = r.minutes_worked;
                const rawStr = raw != null ? String(raw) : '';
                const num = raw != null ? Number(raw) : NaN;
                // Old migrated data: stored as hours (8, 12, etc. < 60)
                // New submissions: stored as minutes (480, 720, etc. >= 60)
                // Non-numeric values (e.g. "C", "$36400"): pass through as-is
                // Compound format: "H 4|C:33", "H 0|AB:47573,53", "H 4|Cajas 32 Cajones 43"
                // Las horas ahora llevan el prefijo "H " (con espacio); datos viejos sin prefijo se siguen leyendo igual.
                const parseHorasSegment = (seg: string): number | null => {
                    const n = seg.startsWith('H ') ? parseFloat(seg.slice(2)) : parseFloat(seg);
                    return isNaN(n) ? null : n;
                };
                let hoursVal: string | null;
                let hoursNum: number | null;
                if (rawStr.includes('|')) {
                    // Formato compuesto — extraer la parte de horas del primer segmento
                    hoursVal = rawStr;
                    hoursNum = parseHorasSegment(rawStr.split('|')[0]);
                } else if (rawStr.startsWith('H ')) {
                    hoursVal = rawStr;
                    hoursNum = parseHorasSegment(rawStr);
                } else if (!isNaN(num) && num > 0) {
                    const h = num < 60 ? num : num / 60;
                    hoursVal = String(h);
                    hoursNum = h;
                } else {
                    hoursVal = raw ?? null;
                    hoursNum = null;
                }
                // Cajas y Cajones: segmento "Cajas 32 Cajones 43" (o solo uno de los dos)
                const cajasCajonesSeg = rawStr.split('|').find(p => p.startsWith('Cajas ') || p.startsWith('Cajones '));
                const cajasMatch = cajasCajonesSeg?.match(/Cajas ([0-9]+(?:[.,][0-9]+)?)/);
                const cajonesMatch = cajasCajonesSeg?.match(/Cajones ([0-9]+(?:[.,][0-9]+)?)/);
                const cajasNum = cajasMatch ? parseFloat(cajasMatch[1].replace(',', '.')) : null;
                const cajonesNum = cajonesMatch ? parseFloat(cajonesMatch[1].replace(',', '.')) : null;
                return {
                    // Todo lo que manda el servidor pasa tal cual. Antes esto era
                    // una lista a mano y cada columna nueva se perdia en silencio:
                    // el Excel mostraba las columnas vacias aunque el dato existiera.
                    // Lo que sigue abajo pisa solo lo que hay que calcular.
                    ...r,
                    id: r.submission_id,
                    employee_id: r.employee_id ?? '',
                    sector_id: sectorId,
                    current_sector_id: r.current_sector_id ?? null,
                    current_sector_name: r.current_sector_name ?? null,
                    date: r.date,
                    minutes_worked: raw,
                    work_value: hoursVal,
                    hours: hoursNum,
                    cajas: cajasNum,
                    cajones: cajonesNum,
                    first_name: r.first_name,
                    last_name: r.last_name,
                    dni: r.dni,
                    notes: r.notes,
                    // El status ('approved'/'pending'/'rejected') de submissions — se
                    // reusa este campo, que existia sin usar en esta interfaz.
                    status: r.status ?? null,
                    latitude: r.latitude ?? null,
                    longitude: r.longitude ?? null,
                    submitted_at: r.submitted_at ?? null,
                    is_active: r.is_active ?? null,
                    km_viajes: r.km_viajes ?? null,
                    has_fumigadas: r.has_fumigadas ?? null,
                    siembra_trilla: r.siembra_trilla ?? null,
                    bolseros: r.bolseros ?? null,
                    etiquetado: r.etiquetado ?? null,
                    carga_camion_kg50: r.carga_camion_kg50 ?? null,
                    carga_camion_kg25: r.carga_camion_kg25 ?? null,
                    carga_camion_otro: r.carga_camion_otro ?? null,
                    movimiento_estiba_kg50: r.movimiento_estiba_kg50 ?? null,
                    movimiento_estiba_kg25: r.movimiento_estiba_kg25 ?? null,
                    movimiento_estiba_otro: r.movimiento_estiba_otro ?? null,
                    aprobada_por_nombre: r.aprobada_por_nombre ?? null,
                    aprobada_en: r.aprobada_en ?? null,
                    motivo_rechazo: r.motivo_rechazo ?? null,
                };
              })
            : [];

        console.log(`[fetchAttendances] ${attendances.length} asistencias para ${sectorId} (${startDate} → ${endDate})`);
        return attendances;

    } catch (error) {
        // Antes devolvia [] y el Excel / PDF salia con el sector en cero sin
        // ningun aviso. Ahora el error llega a la pantalla, que avisa y no genera.
        console.error(`[fetchAttendances] Error:`, (error as Error).message);
        const msg = (error as Error).message;
        throw new Error(msg.startsWith('No se pudieron') ? msg : 'No se pudieron traer las tarjas del sector (¿sin conexión?)');
    }
}

// ─── Fotos de DNI ─────────────────────────────────────────────────────────────

export async function getFotoBase64(employeeId: string, lado: string, adminToken: string): Promise<string> {
    const res = await fetch(`${API_BASE}/api/employees/${employeeId}/foto/${lado}`, {
        headers: { 'x-admin-token': adminToken },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:image/jpeg;base64,${base64}`;
}

export async function uploadFotoFromFile(employeeId: string, lado: string, filePath: string, adminToken: string): Promise<void> {
    const fileBuffer = fs.readFileSync(filePath);
    const form = new FormData();
    form.append('foto', new Blob([fileBuffer], { type: 'image/jpeg' }), nodePath.basename(filePath));
    const res = await fetch(`${API_BASE}/api/employees/${employeeId}/foto/${lado}`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken },
        body: form,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

export async function deleteFotoApi(employeeId: string, lado: string, adminToken: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/employees/${employeeId}/foto/${lado}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': adminToken },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

// ─── Certificados medicos ─────────────────────────────────────────────────────

const TIPO_POR_EXTENSION: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
};

/**
 * Sube un certificado: el archivo (foto o PDF) y los dias que cubre. Devuelve el
 * error tal cual lo explica el server (ej. "Esos días ya tienen certificado").
 */
export async function subirCertificadoDesdeArchivo(
    employeeId: string,
    fechas: string[],
    observaciones: string,
    filePath: string,
    adminToken: string,
): Promise<{ ok: true } | { ok: false; error: string; fechas?: string[] }> {
    const tipo = TIPO_POR_EXTENSION[nodePath.extname(filePath).toLowerCase()];
    if (!tipo) return { ok: false, error: 'El certificado tiene que ser una foto (JPG o PNG) o un PDF' };
    // Mismo tope que el server: mejor avisar ya que esperar a que suban 16 MB para el rechazo.
    if (fs.statSync(filePath).size > 15 * 1024 * 1024) {
        return { ok: false, error: 'El archivo pesa más de 15 MB. Sacale una foto o escanealo con menos calidad.' };
    }
    const buffer = fs.readFileSync(filePath);
    const form = new FormData();
    form.append('archivo', new Blob([buffer], { type: tipo }), nodePath.basename(filePath));
    const qs = new URLSearchParams({ employee_id: employeeId, fechas: fechas.join(',') });
    if (observaciones.trim()) qs.set('observaciones', observaciones.trim());
    const res = await fetch(`${API_BASE}/api/admin/certificados?${qs}`, {
        method: 'POST',
        headers: { 'x-admin-token': adminToken },
        body: form,
    });
    if (res.ok) return { ok: true };
    const d: any = await res.json().catch(() => ({}));
    return { ok: false, error: d.error || `Error ${res.status}`, fechas: d.fechas };
}

/** Baja el archivo del certificado a la carpeta temporal y devuelve la ruta. */
export async function bajarCertificado(id: string, carpeta: string, adminToken: string): Promise<string> {
    const res = await fetch(`${API_BASE}/api/admin/certificados/${id}/archivo`, {
        headers: { 'x-admin-token': adminToken },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const tipo = res.headers.get('content-type') ?? '';
    const ext = tipo.includes('pdf') ? '.pdf' : tipo.includes('png') ? '.png' : '.jpg';
    const destino = nodePath.join(carpeta, `certificado_${id}${ext}`);
    fs.writeFileSync(destino, Buffer.from(await res.arrayBuffer()));
    return destino;
}

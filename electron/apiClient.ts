/**
 * StaffAxis API Client
 * Equivalent to Ktor Client + ContentNegotiation in Compose Desktop,
 * adapted for Node.js / Electron using native fetch (Node 18+).
 *
 * Endpoint: GET https://staffaxis-api-prod.pgastonor.workers.dev/api/sectors
 */

import { todayInAppTz } from './datetime';

// ─── DTOs (API Response Shape) ─────────────────────────────────────────────

export interface ApiSector {
    id: string;
    name: string;
    encargado?: string | null;   // real field from API (e.g. "SERGIO GODOY")
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
    status?: string | null;
    first_name?: string;   // may be joined from employees table
    last_name?: string;
    dni?: string | null;
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
        employees: 0,
        state: 'missing',
        icon: resolveIcon(api.name),
        encargado: api.encargado ?? 'Sin asignar',   // real value from API
        trend: 0,
    };
}

// ─── HTTP Client (equivalent to Ktor HttpClient with CIO engine) ───────────

const API_BASE = 'https://staffaxis-api-prod.pgastonor.workers.dev';

export async function fetchSectors(): Promise<UiSector[]> {
    try {
        console.log('--- INICIANDO PETICIÓN DE SECTORES ---');

        const response = await fetch(`${API_BASE}/api/sectors`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0',
            },
        });

        console.log(`--- HTTP STATUS: ${response.status} ${response.statusText} ---`);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const rawText = await response.text();
        let parsed: any;
        try { parsed = JSON.parse(rawText); }
        catch (jsonErr) { throw new Error(`JSON parse failed: ${jsonErr}. Raw: ${rawText.slice(0, 200)}`); }

        if (!parsed.sectors || !Array.isArray(parsed.sectors)) {
            throw new Error(`Invalid shape — "sectors" missing. Got: ${JSON.stringify(parsed).slice(0, 200)}`);
        }

        // Base UiSectors with employees = 0 initially
        const baseSectors: UiSector[] = (parsed.sectors as any[])
            .filter((s: any) => s && typeof s.name === 'string')
            .map((sector: any, index: number) => toUiSector(
                { id: String(sector.id ?? index), name: sector.name, encargado: sector.encargado ?? null },
                index
            ));

        console.log(`Sectores base: ${baseSectors.length}`);

        // ── Parallel enrichment: fetch employee count AND attendances for each sector ──────────
        // This fills in sector.employees with the real count from the API.
        // It also checks if there are attendances for TODAY to determine the state.

        // "Hoy" según TZ Argentina, no según TZ del SO del cliente.
        // Esto evita que un encargado de noche (22:30 ART) pregunte por
        // "mañana UTC" y el server le responda con sectores vacíos.
        const today = todayInAppTz();

        const enriched = await Promise.all(
            baseSectors.map(async (sector) => {
                let count = 0;
                let hasAttendancesToday = false;

                try {
                    const ctrl = new AbortController();
                    const timeout = setTimeout(() => ctrl.abort(), 8000); // 8s per sector
                    const [empRes, attRes] = await Promise.all([
                        fetch(
                            `${API_BASE}/api/employees?sector_id=${encodeURIComponent(sector.apiId)}`,
                            { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }, signal: ctrl.signal }
                        ),
                        fetch(
                            `${API_BASE}/api/attendances?sector_id=${encodeURIComponent(sector.apiId)}&start_date=${today}&end_date=${today}`,
                            { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }, signal: ctrl.signal }
                        )
                    ]);
                    clearTimeout(timeout);

                    let empList: ApiEmployee[] = [];
                    if (empRes.ok) {
                        const empData: any = await empRes.json();
                        if (Array.isArray(empData.employees)) {
                            count = empData.employees.length;
                            empList = empData.employees;
                        }
                    }

                    let attsToday: ApiAttendance[] = [];
                    if (attRes.ok) {
                        const attData: any = await attRes.json();
                        if (Array.isArray(attData.attendances)) {
                            // Filtramos solo las que matchean exactamente HOY
                            // (la API a veces devuelve registros adyacentes por timezone).
                            attsToday = attData.attendances.filter((a: any) => a.date && a.date.startsWith(today));
                            hasAttendancesToday = attsToday.length > 0;
                        }
                    }

                    return {
                        ...sector,
                        employees: count,
                        employeesList: empList,
                        attendancesToday: attsToday,
                        state: hasAttendancesToday ? 'sent' : 'missing' as 'sent' | 'missing'
                    };
                } catch {
                    return sector; // safe fallback if network error
                }
            })
        );

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

export async function fetchEmployees(sectorId: string): Promise<ApiEmployee[]> {
    try {
        console.log(`--- CARGANDO EMPLEADOS PARA: ${sectorId} ---`);

        const response = await fetch(`${API_BASE}/api/employees?sector_id=${encodeURIComponent(sectorId)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
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

// ─── fetchAttendances ─────────────────────────────────────────────────────────
// GET /api/attendances?sector_id={sectorId}&start_date={YYYY-MM-DD}&end_date={YYYY-MM-DD}

export async function fetchAttendances(
    sectorId: string,
    startDate: string,   // format: "YYYY-MM-DD"  (e.g. "2026-02-21")
    endDate: string,     // format: "YYYY-MM-DD"  (e.g. "2026-03-20")
    adminToken?: string  // optional admin token for authorization
): Promise<ApiAttendance[]> {
    try {
        const url = `${API_BASE}/api/attendances?sector_id=${encodeURIComponent(sectorId)}&start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
        console.log(`[fetchAttendances] GET ${url}`);

        const headers: Record<string, string> = {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
        };
        if (adminToken) {
            headers['Authorization'] = `Bearer ${adminToken}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            console.error(`[fetchAttendances] HTTP ${response.status} para ${sectorId}`);
            return [];
        }

        const data: any = await response.json();
        const attendances: ApiAttendance[] = Array.isArray(data.attendances) ? data.attendances : [];

        console.log(`[fetchAttendances] ${attendances.length} asistencias para ${sectorId} (${startDate} → ${endDate})`);
        return attendances;

    } catch (error) {
        console.error(`[fetchAttendances] Error:`, (error as Error).message);
        return [];   // safe fallback — never crash the export flow
    }
}

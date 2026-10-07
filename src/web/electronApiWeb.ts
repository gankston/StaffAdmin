/**
 * Version web de StaffAdmin: el mismo App.tsx, pero en el navegador.
 *
 * App.tsx habla con el lado de Electron solo por window.electronAPI (preload.ts).
 * Aca se arma ese mismo objeto con fetch y APIs del navegador, asi la interfaz
 * queda identica y cada cambio que se haga en App.tsx sale igual en las dos
 * versiones. La logica de datos (apiClient, exportExcel, reportPdf) es la misma
 * que usa Electron, importada tal cual.
 *
 * Lo unico que cambia de forma:
 *   - Elegir archivo: en vez de una ruta del disco se devuelve una clave que
 *     apunta al File elegido (con el nombre real al final, que es lo que muestra
 *     la pantalla del certificado).
 *   - PDF de Informes: se abre el dialogo de impresion del navegador con el mismo
 *     HTML que imprime Electron (mismo motor, mismo resultado) y se guarda como PDF.
 *   - Ver certificado: se abre en otra pestaña en vez de con el programa de Windows.
 *   - Ingreso con Google: por redireccion, con el cliente OAuth "Web" (googleWeb.ts).
 */
import type { ElectronAPI } from '../../electron/preload';
import { fetchSectors, fetchEmployees, fetchAttendances } from '../../electron/apiClient';
import { exportExcel } from '../../electron/exportExcel';
import { buildHTML, nombreArchivoInforme } from '../../electron/reportPdf';
import { GOOGLE_WEB_CLIENT_ID, irAGoogle } from './googleWeb';

const API_BASE = 'https://staffaxis-new-version-production.up.railway.app';

let adminToken = '';

// Electron guarda el token en memoria al loguearse; si se recarga la pestaña,
// App.tsx lo vuelve a pasar con setAdminToken, pero por las dudas se lee lo guardado.
function token(): string {
    if (adminToken) return adminToken;
    const t = localStorage.getItem('admin_token') || sessionStorage.getItem('admin_token') || '';
    return t === 'undefined' ? '' : t;
}

// ─── Archivos elegidos ────────────────────────────────────────────────────────

const archivos = new Map<string, File>();
let siguienteArchivo = 0;

function elegirArchivo(accept: string): Promise<string | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = accept;
        input.style.display = 'none';
        let listo = false;
        const terminar = (valor: string | null) => {
            if (listo) return;
            listo = true;
            input.remove();
            resolve(valor);
        };
        input.addEventListener('change', () => {
            const f = input.files?.[0];
            if (!f) return terminar(null);
            const clave = `web-archivo-${++siguienteArchivo}/${f.name}`;
            archivos.set(clave, f);
            terminar(clave);
        });
        input.addEventListener('cancel', () => terminar(null));
        document.body.appendChild(input);
        input.click();
    });
}

// ─── PDF de Informes ──────────────────────────────────────────────────────────

function imprimirHtml(html: string, titulo: string): void {
    const iframe = document.createElement('iframe');
    // Sin scripts, como la ventana de Electron (javascript: false): los nombres
    // van sin escapar en el HTML y no tienen que poder ejecutar nada.
    iframe.setAttribute('sandbox', 'allow-same-origin allow-modals');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument!;
    doc.open();
    // A4 vertical con fondos, como el printToPDF de Electron. El titulo es el
    // nombre que propone Chrome al guardar el PDF.
    doc.write(html.replace('</head>',
        `<title>${titulo}</title><style>@page{size:A4 portrait}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head>`));
    doc.close();
    const tituloAnterior = document.title;
    document.title = titulo;
    const limpiar = () => {
        document.title = tituloAnterior;
        setTimeout(() => iframe.remove(), 1000);
    };
    iframe.contentWindow!.addEventListener('afterprint', limpiar);
    setTimeout(() => {
        iframe.contentWindow!.focus();
        iframe.contentWindow!.print();
    }, 300);
}

// ─── El puente ────────────────────────────────────────────────────────────────

const api: ElectronAPI = {
    setAdminToken: async (t: string) => { adminToken = t; },

    getSectors: async () => {
        try {
            return await fetchSectors(token());
        } catch (error) {
            console.error('[web get-sectors]', error);
            return [];
        }
    },

    getEmployees: async (sectorId: string, tokenArg?: string) => {
        try {
            return await fetchEmployees(sectorId, tokenArg || token());
        } catch (error) {
            console.error(`[web get-employees] ${sectorId}`, error);
            return [];
        }
    },

    getAttendances: async (sectorId: string, startDate: string, endDate: string, tokenArg?: string) =>
        fetchAttendances(sectorId, startDate, endDate, tokenArg || token()),

    // En Electron es un mock en memoria que la pantalla ya no usa.
    toggleSectorState: async () => [],

    exportExcel: async (params: any) => exportExcel(null, params),

    generatePdfReport: async (params: any) => {
        try {
            imprimirHtml(buildHTML(params), nombreArchivoInforme(params).replace(/\.pdf$/, ''));
            // Sin base64: el PDF lo guarda el dialogo de impresion, App.tsx no tiene que bajar nada.
            return { success: true };
        } catch (err) {
            return { success: false, error: (err as Error).message };
        }
    },

    // La pagina se va a Google y vuelve logueada (ver googleWeb.ts): esta promesa
    // no se resuelve, asi el boton queda en "cargando" hasta que se va.
    googleLogin: () => {
        if (!GOOGLE_WEB_CLIENT_ID) {
            return Promise.resolve({ success: false, error: 'El ingreso con Google todavía no está configurado en la versión web' });
        }
        irAGoogle();
        return new Promise(() => {});
    },

    getFoto: async (employeeId: string, lado: string) => {
        const res = await fetch(`${API_BASE}/api/employees/${employeeId}/foto/${lado}`, {
            headers: { 'x-admin-token': token() },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        const base64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
            r.onerror = () => reject(r.error);
            r.readAsDataURL(blob);
        });
        return `data:image/jpeg;base64,${base64}`;
    },

    openFileDialog: () => elegirArchivo('.jpg,.jpeg,.png,image/jpeg,image/png'),

    uploadFoto: async (employeeId: string, lado: string, clave: string) => {
        try {
            const f = archivos.get(clave);
            if (!f) throw new Error('No se encontró el archivo elegido');
            const form = new FormData();
            form.append('foto', new Blob([f], { type: 'image/jpeg' }), f.name);
            const res = await fetch(`${API_BASE}/api/employees/${employeeId}/foto/${lado}`, {
                method: 'POST',
                headers: { 'x-admin-token': token() },
                body: form,
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            archivos.delete(clave);
            return { success: true };
        } catch (error) {
            console.error('[web upload-foto]', error);
            return { success: false, error: String(error) };
        }
    },

    deleteFoto: async (employeeId: string, lado: string) => {
        try {
            const res = await fetch(`${API_BASE}/api/employees/${employeeId}/foto/${lado}`, {
                method: 'DELETE',
                headers: { 'x-admin-token': token() },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return { success: true };
        } catch (error) {
            console.error('[web delete-foto]', error);
            return { success: false, error: String(error) };
        }
    },

    certElegirArchivo: () => elegirArchivo('.jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf'),

    // Mismos chequeos y mismos mensajes que subirCertificadoDesdeArchivo (apiClient.ts).
    certSubir: async (employeeId: string, fechas: string[], observaciones: string, clave: string) => {
        try {
            const f = archivos.get(clave);
            if (!f) return { ok: false, error: 'Volvé a elegir el archivo' };
            const ext = f.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? '';
            const tipo = ({ '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' } as Record<string, string>)[ext];
            if (!tipo) return { ok: false, error: 'El certificado tiene que ser una foto (JPG o PNG) o un PDF' };
            if (f.size > 15 * 1024 * 1024) {
                return { ok: false, error: 'El archivo pesa más de 15 MB. Sacale una foto o escanealo con menos calidad.' };
            }
            const form = new FormData();
            form.append('archivo', new Blob([f], { type: tipo }), f.name);
            const qs = new URLSearchParams({ employee_id: employeeId, fechas: fechas.join(',') });
            if (observaciones.trim()) qs.set('observaciones', observaciones.trim());
            const res = await fetch(`${API_BASE}/api/admin/certificados?${qs}`, {
                method: 'POST',
                headers: { 'x-admin-token': token() },
                body: form,
            });
            if (res.ok) {
                archivos.delete(clave);
                return { ok: true as const };
            }
            const d: any = await res.json().catch(() => ({}));
            return { ok: false, error: d.error || `Error ${res.status}`, fechas: d.fechas };
        } catch (error) {
            console.error('[web cert-subir]', error);
            return { ok: false, error: 'No se pudo subir el certificado (sin conexión?)' };
        }
    },

    certAbrir: async (id: string) => {
        // La pestaña se abre ya, con el click todavia "vivo": si se abre despues
        // del fetch, el navegador la bloquea como ventana emergente.
        const pestaña = window.open('', '_blank');
        try {
            const res = await fetch(`${API_BASE}/api/admin/certificados/${id}/archivo`, {
                headers: { 'x-admin-token': token() },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const url = URL.createObjectURL(await res.blob());
            if (pestaña) {
                pestaña.location.href = url;
            } else {
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificado_${id}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
            return { ok: true };
        } catch (error) {
            pestaña?.close();
            console.error('[web cert-abrir]', error);
            return { ok: false, error: 'No se pudo abrir el certificado' };
        }
    },
};

window.electronAPI = api;

import { contextBridge, ipcRenderer } from 'electron';

// El programa de escritorio es un visualizador: la pantalla la trae del servidor
// (/admin/, la misma que se ve en el navegador), asi cada cambio llega sin instalar
// nada. Aca solo se expone lo que una pagina no puede hacer sola; el resto lo hace
// src/web/electronApiWeb.ts adentro de la pagina.
contextBridge.exposeInMainWorld('staffadminShell', {
    // Google no deja iniciar sesion adentro de una ventana de Electron: el programa
    // abre el navegador, como siempre.
    googleLogin: () => ipcRenderer.invoke('google-login'),
    // PDF de Informes con printToPDF, igual que antes (devuelve base64).
    htmlAPdf: (html: string) => ipcRenderer.invoke('html-a-pdf', html),
    // Certificados: los abre el programa de Windows para fotos o PDF.
    abrirArchivo: (nombre: string, datos: ArrayBuffer) => ipcRenderer.invoke('abrir-archivo', nombre, datos),
});

export type StaffadminShell = {
    googleLogin: () => Promise<{ success: boolean; token?: string; user?: { email: string; name: string; picture?: string }; error?: string }>;
    htmlAPdf: (html: string) => Promise<string>;
    abrirArchivo: (nombre: string, datos: ArrayBuffer) => Promise<{ ok: boolean; error?: string }>;
};

// Lo que App.tsx usa como window.electronAPI (lo arma src/web/electronApiWeb.ts).
export type ElectronAPI = {
    getSectors: () => Promise<any[]>;
    getEmployees: (sectorId: string, adminToken?: string) => Promise<any[]>;
    getAttendances: (sectorId: string, startDate: string, endDate: string, adminToken?: string) => Promise<any[]>;
    toggleSectorState: (id: number) => Promise<any[]>;
    exportExcel: (params: any) => Promise<{ success: boolean; base64?: string; fileName?: string; error?: string }>;
    generatePdfReport: (params: any) => Promise<{ success: boolean; base64?: string; fileName?: string; error?: string }>;
    setAdminToken: (token: string) => Promise<void>;
    googleLogin: () => Promise<{ success: boolean; token?: string; user?: { email: string; name: string; picture?: string }; error?: string }>;
    getFoto: (employeeId: string, lado: string) => Promise<string | null>;
    uploadFoto: (employeeId: string, lado: string, filePath: string) => Promise<{ success: boolean; error?: string }>;
    deleteFoto: (employeeId: string, lado: string) => Promise<{ success: boolean; error?: string }>;
    openFileDialog: () => Promise<string | null>;
    certElegirArchivo: () => Promise<string | null>;
    certSubir: (employeeId: string, fechas: string[], observaciones: string, filePath: string) =>
        Promise<{ ok: true } | { ok: false; error: string; fechas?: string[] }>;
    certAbrir: (id: string) => Promise<{ ok: boolean; error?: string }>;
}

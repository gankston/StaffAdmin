import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getSectors: () => ipcRenderer.invoke('get-sectors'),
    getEmployees: (sectorId: string) => ipcRenderer.invoke('get-employees', sectorId),
    getAttendances: (sectorId: string, startDate: string, endDate: string, adminToken?: string) =>
        ipcRenderer.invoke('get-attendances', sectorId, startDate, endDate, adminToken),
    toggleSectorState: (id: number) => ipcRenderer.invoke('toggle-sector', id),
    exportExcel: (params: any) => ipcRenderer.invoke('export-excel', params)
});

export type ElectronAPI = {
    getSectors: () => Promise<any[]>;
    getEmployees: (sectorId: string) => Promise<any[]>;
    getAttendances: (sectorId: string, startDate: string, endDate: string, adminToken?: string) => Promise<any[]>;
    toggleSectorState: (id: number) => Promise<any[]>;
    exportExcel: (params: any) => Promise<{ success: boolean; base64?: string; fileName?: string; error?: string }>;
}

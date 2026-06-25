import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    getSectors: () => ipcRenderer.invoke('get-sectors'),
    getEmployees: (sectorId: string, adminToken?: string) => ipcRenderer.invoke('get-employees', sectorId, adminToken),
    getAttendances: (sectorId: string, startDate: string, endDate: string, adminToken?: string) =>
        ipcRenderer.invoke('get-attendances', sectorId, startDate, endDate, adminToken),
    toggleSectorState: (id: number) => ipcRenderer.invoke('toggle-sector', id),
    exportExcel: (params: any) => ipcRenderer.invoke('export-excel', params),
    generatePdfReport: (params: any) => ipcRenderer.invoke('generate-pdf-report', params),
    setAdminToken: (token: string) => ipcRenderer.invoke('set-admin-token', token),
    googleLogin: () => ipcRenderer.invoke('google-login'),
    getFoto: (employeeId: string, lado: string) => ipcRenderer.invoke('get-foto', employeeId, lado),
    uploadFoto: (employeeId: string, lado: string, filePath: string) => ipcRenderer.invoke('upload-foto', employeeId, lado, filePath),
    deleteFoto: (employeeId: string, lado: string) => ipcRenderer.invoke('delete-foto', employeeId, lado),
    openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
});

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
}

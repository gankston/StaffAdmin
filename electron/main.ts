import { app, BrowserWindow, ipcMain } from 'electron';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { toggleSectorState } from './database';
import { fetchSectors, fetchEmployees, fetchAttendances } from './apiClient';
import log from 'electron-log';

// ─── electron-log configuration ────────────────────────────────────────────
// Log file will be at:
//   Windows: C:\Users\<user>\AppData\Roaming\staffadmin\logs\main.log
log.transports.file.fileName = 'main.log';
log.transports.file.level = 'debug';
log.transports.console.level = 'debug';

// Redirect ALL console.log / console.error / console.warn to electron-log
// This means every existing log in apiClient.ts is captured automatically
Object.assign(console, log.functions);

log.info('=== StaffAdmin starting up ===');
log.info(`Log file: ${log.transports.file.getFile().path}`);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { exportExcel, ExportParams } from './exportExcel';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'), // Important for Vite output
            nodeIntegration: true,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden', // Give it a more native app feel
        titleBarOverlay: {
            color: 'rgba(30,30,46,0.92)',
            symbolColor: '#ffffff',
        }
    });

    // Adjust 5: open maximized (equivalent to WindowPlacement.Maximized)
    mainWindow.once('ready-to-show', () => {
        mainWindow?.maximize();
        mainWindow?.show();
    });

    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    ipcMain.handle('get-sectors', async () => {
        try {
            return await fetchSectors();
        } catch (error) {
            console.error('[IPC get-sectors] API failed, returning empty list:', error);
            return [];
        }
    });
    ipcMain.handle('get-employees', async (_event, sectorId: string) => {
        try {
            return await fetchEmployees(sectorId);
        } catch (error) {
            console.error(`[IPC get-employees] Failed for ${sectorId}:`, error);
            return [];
        }
    });
    ipcMain.handle('toggle-sector', (_event, id) => toggleSectorState(id));
    ipcMain.handle('get-attendances', async (_event, sectorId: string, startDate: string, endDate: string) => {
        try {
            return await fetchAttendances(sectorId, startDate, endDate);
        } catch (error) {
            console.error(`[IPC get-attendances] Failed for ${sectorId}:`, error);
            return [];
        }
    });
    ipcMain.handle('export-excel', async (_event, params: ExportParams) => await exportExcel(mainWindow, params));

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

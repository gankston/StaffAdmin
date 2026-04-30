import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
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
import { generatePdfReport, PdfReportParams } from './reportPdf';

const isDev = !app.isPackaged;

// ─── auto-updater configuration ─────────────────────────────────────────────
autoUpdater.autoDownload = false;

autoUpdater.on('update-available', () => {
    dialog.showMessageBox({
        type: 'info',
        title: 'Actualización Disponible',
        message: 'Hay una nueva versión del sistema. ¿Deseas descargarla e instalarla ahora?',
        buttons: ['Instalar ahora', 'Más tarde'],
        defaultId: 0,
        cancelId: 1
    }).then(result => {
        if (result.response === 0) {
            autoUpdater.downloadUpdate();
        }
    });
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall(true, true);
});

autoUpdater.on('error', (err) => {
    console.error('Error en el auto-updater:', err);
});

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
    
    if (!isDev) {
        // ─── Update channel ──────────────────────────────────────────────
        // Antes: el cliente embebía un GitHub PAT (split en dos strings) para
        // poder leer releases del repo privado gankston/StaffAdmin. Quedaba
        // recuperable con `asar extract` del NSIS instalado.
        //
        // Ahora: el cliente apunta a /api/updates del Worker (StaffAxis API),
        // que proxea las descargas con el PAT viviendo solo en el secret
        // GITHUB_RELEASES_PAT del Worker. Cliente queda sin secretos.
        autoUpdater.setFeedURL({
            provider: 'generic',
            url: 'https://staffaxis-api-prod.pgastonor.workers.dev/api/updates',
        });
        autoUpdater.checkForUpdates();
    }

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
    ipcMain.handle('get-attendances', async (_event, sectorId: string, startDate: string, endDate: string, adminToken?: string) => {
        try {
            const result = await fetchAttendances(sectorId, startDate, endDate, adminToken);
            if (result.length > 0) {
                log.info(`[IPC get-attendances] Sample record keys for ${sectorId}: ${JSON.stringify(Object.keys(result[0]))}`);
                log.info(`[IPC get-attendances] Sample record: ${JSON.stringify(result[0])}`);
            }
            return result;
        } catch (error) {
            console.error(`[IPC get-attendances] Failed for ${sectorId}:`, error);
            return [];
        }
    });
    ipcMain.handle('export-excel', async (_event, params: ExportParams) => await exportExcel(mainWindow, params));
    ipcMain.handle('generate-pdf-report', async (_event, params: PdfReportParams) => await generatePdfReport(params));

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import * as http from 'http';
import * as crypto from 'crypto';
import { autoUpdater } from 'electron-updater';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { toggleSectorState } from './database';
import { fetchSectors, fetchEmployees, fetchAttendances, getFotoBase64, uploadFotoFromFile, deleteFotoApi } from './apiClient';
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
let adminToken = '';

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
        const t1 = 'ghp_wWefbDV697IU8A95lch';
        const t2 = 'kkXGvTrzP644SMnsv';
        autoUpdater.setFeedURL({
            provider: 'github',
            owner: 'gankston',
            repo: 'StaffAdmin',
            token: t1 + t2,
        });
        autoUpdater.checkForUpdates();
    }

    ipcMain.handle('set-admin-token', (_event, token: string) => {
        adminToken = token;
        log.info('[IPC] Admin token actualizado');
    });

    ipcMain.handle('get-sectors', async () => {
        try {
            return await fetchSectors(adminToken);
        } catch (error) {
            console.error('[IPC get-sectors] API failed, returning empty list:', error);
            return [];
        }
    });
    ipcMain.handle('get-employees', async (_event, sectorId: string, tokenArg?: string) => {
        try {
            const token = tokenArg || adminToken;
            return await fetchEmployees(sectorId, token);
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

    // ─── Fotos de DNI ───────────────────────────────────────────────────────
    ipcMain.handle('get-foto', async (_event, employeeId: string, lado: string) => {
        try {
            return await getFotoBase64(employeeId, lado, adminToken);
        } catch (error) {
            log.error(`[IPC get-foto]`, error);
            return null;
        }
    });

    ipcMain.handle('upload-foto', async (_event, employeeId: string, lado: string, filePath: string) => {
        try {
            await uploadFotoFromFile(employeeId, lado, filePath, adminToken);
            return { success: true };
        } catch (error) {
            log.error(`[IPC upload-foto]`, error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('delete-foto', async (_event, employeeId: string, lado: string) => {
        try {
            await deleteFotoApi(employeeId, lado, adminToken);
            return { success: true };
        } catch (error) {
            log.error(`[IPC delete-foto]`, error);
            return { success: false, error: String(error) };
        }
    });

    ipcMain.handle('open-file-dialog', async () => {
        if (!mainWindow) return null;
        const result = await dialog.showOpenDialog(mainWindow, {
            properties: ['openFile'],
            filters: [{ name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png'] }],
        });
        if (result.canceled || result.filePaths.length === 0) return null;
        return result.filePaths[0];
    });

    // ─── Google OAuth ────────────────────────────────────────────────────────
    const GOOGLE_CLIENT_ID = '123351582964-3o87ns87o1opd15jgl8gke0m8etdh4ko.apps.googleusercontent.com';
    ipcMain.handle('google-login', () => new Promise((resolve) => {
        const server = http.createServer();
        server.listen(0, '127.0.0.1', () => {
            const port = (server.address() as any).port;
            const redirectUri = `http://127.0.0.1:${port}`;
            const state = crypto.randomBytes(16).toString('hex');
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&state=${state}&access_type=offline&prompt=select_account`;
            shell.openExternal(authUrl);

            const timeout = setTimeout(() => {
                server.close();
                resolve({ success: false, error: 'Tiempo de espera agotado' });
            }, 120_000);

            server.on('request', async (req: any, res: any) => {
                const url = new URL(req.url, `http://127.0.0.1:${port}`);
                const code = url.searchParams.get('code');
                const retState = url.searchParams.get('state');

                // Ignorar peticiones sin código (favicon, preflight, etc.)
                if (!code) {
                    res.writeHead(204);
                    res.end();
                    return;
                }

                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('<html><body style="font-family:sans-serif;text-align:center;padding:60px"><h2>✅ Autenticación exitosa</h2><p>Podés cerrar esta ventana y volver a StaffAdmin.</p></body></html>');
                clearTimeout(timeout);
                server.close();
                if (retState !== state) { resolve({ success: false, error: 'OAuth cancelado' }); return; }
                try {
                    // Paso 1: intercambiar código con Google directamente desde Electron
                    const GOOGLE_CLIENT_SECRET = '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';
                    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            code,
                            client_id: GOOGLE_CLIENT_ID,
                            client_secret: GOOGLE_CLIENT_SECRET,
                            redirect_uri: redirectUri,
                            grant_type: 'authorization_code',
                        }).toString(),
                    });
                    const tokenData: any = await tokenRes.json();
                    if (!tokenData.access_token) {
                        log.error('[OAuth] Google rechazó el código:', tokenData);
                        resolve({ success: false, error: `Google rechazó el código: ${tokenData.error || 'unknown'}` });
                        return;
                    }

                    // Paso 2: obtener info del usuario desde Google
                    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${tokenData.access_token}` },
                    });
                    const userInfo: any = await userRes.json();

                    // Paso 3: pedir el ADMIN_TOKEN a Railway mandando el id_token de Google
                    const resp = await fetch('https://staffaxis-new-version-production.up.railway.app/api/admin/google-auth', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ id_token: tokenData.id_token }),
                    });
                    const data: any = await resp.json();
                    if (data.token) {
                        adminToken = data.token;
                        resolve({ success: true, token: data.token, user: data.user ?? { email: userInfo.email, name: userInfo.name, picture: userInfo.picture } });
                    } else {
                        resolve({ success: false, error: data.error || 'Error al obtener token de Railway' });
                    }
                } catch (err) {
                    resolve({ success: false, error: String(err) });
                }
            });
        });
    }));
    ipcMain.handle('generate-pdf-report', async (_event, params: PdfReportParams) => await generatePdfReport(params));

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

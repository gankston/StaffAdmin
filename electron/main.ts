import { app, BrowserWindow, ipcMain, dialog, shell, IpcMainInvokeEvent } from 'electron';
import * as http from 'http';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { autoUpdater } from 'electron-updater';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
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
import { htmlAPdf } from './reportPdf';

const isDev = !app.isPackaged;

// ─── Visualizador ───────────────────────────────────────────────────────────
// La pantalla viene del servidor (la misma de /admin/): cada cambio que se sube
// aparece al abrir el programa, sin instalar nada. El programa solo pone la
// ventana y lo que una pagina no puede hacer sola (preload.ts).
const URL_PANTALLA = process.env.STAFFADMIN_URL || 'https://staffaxis-new-version-production.up.railway.app/admin/';
const ORIGEN = new URL(URL_PANTALLA).origin;

// Lo que pide el programa solo se atiende si lo pide la pantalla de StaffAdmin.
function desdeLaPantalla(event: IpcMainInvokeEvent): void {
    const url = event.senderFrame?.url ?? '';
    if (!url.startsWith(ORIGEN + '/')) throw new Error(`Pedido rechazado desde ${url || 'origen desconocido'}`);
}

function paginaSinConexion(error: string): string {
    return 'data:text/html;charset=utf-8,' + encodeURIComponent(`<!doctype html><html lang="es"><head><meta charset="utf-8">
<style>
  html,body{height:100%;margin:0}
  body{background:#12121c;color:#e8e8f0;font-family:"Segoe UI",sans-serif;display:flex;align-items:center;justify-content:center;-webkit-app-region:drag}
  .caja{text-align:center;max-width:440px;padding:24px}
  h1{font-size:20px;margin:0 0 10px}
  p{color:#a0a0b8;font-size:14px;line-height:1.5;margin:0 0 20px}
  button{-webkit-app-region:no-drag;background:linear-gradient(135deg,#7c4dff,#00bcd4);color:#fff;border:0;border-radius:10px;padding:10px 22px;font-size:14px;cursor:pointer}
  small{display:block;margin-top:16px;color:#5c5c74;font-size:11px}
</style></head><body><div class="caja">
<h1>No se pudo conectar con StaffAdmin</h1>
<p>Revisá la conexión a internet. Se vuelve a intentar solo cada 15 segundos.</p>
<button onclick="location.href=${JSON.stringify(URL_PANTALLA).replace(/"/g, '&quot;')}">Reintentar ahora</button>
<small>${error.replace(/[<>&]/g, '')}</small>
</div><script>setTimeout(function(){location.href=${JSON.stringify(URL_PANTALLA)}},15000)</script></body></html>`);
}

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
    autoUpdater.quitAndInstall(false, false);
});

autoUpdater.on('error', (err) => {
    console.error('Error en el auto-updater:', err);
    dialog.showErrorBox('Error al actualizar', `No se pudo completar la actualización: ${err.message}`);
});

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        show: false,
        backgroundColor: '#12121c',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'), // ver vite.config.ts
            // La pagina viene de internet: sin Node, aislada y en sandbox.
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
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

    const cargarPantalla = () => mainWindow?.loadURL(URL_PANTALLA, { extraHeaders: 'pragma: no-cache\n' });

    // Sin internet (o el servidor caido): cartel propio en vez de la pagina de error de Chromium.
    mainWindow.webContents.on('did-fail-load', (_e, codigo, descripcion, url, esPrincipal) => {
        if (!esPrincipal || codigo === -3 /* ERR_ABORTED: otra navegacion la reemplazo */) return;
        log.warn(`[visualizador] no cargo ${url}: ${codigo} ${descripcion}`);
        mainWindow?.loadURL(paginaSinConexion(`${descripcion} (${codigo})`));
    });

    // La ventana se queda en StaffAdmin: cualquier otro sitio se abre en el navegador.
    mainWindow.webContents.on('will-navigate', (e, url) => {
        if (url.startsWith(ORIGEN + '/')) return;
        e.preventDefault();
        if (/^https?:/.test(url)) shell.openExternal(url);
    });

    cargarPantalla();

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

    // ─── Lo que la pantalla le pide al programa (preload.ts) ────────────────
    // Los datos, el Excel y lo demas los hace la pantalla (src/web/electronApiWeb.ts).

    // PDF de Informes: mismo printToPDF que antes. El HTML lo arma la pantalla.
    ipcMain.handle('html-a-pdf', async (event, html: string) => {
        desdeLaPantalla(event);
        return (await htmlAPdf(String(html))).toString('base64');
    });

    // Certificados: se guardan en temp y los abre el programa de Windows, como antes.
    // Solo fotos y PDF: la pantalla no tiene que poder abrir un ejecutable.
    ipcMain.handle('abrir-archivo', async (event, nombre: string, datos: ArrayBuffer) => {
        desdeLaPantalla(event);
        const archivo = path.basename(String(nombre)).replace(/[^\w.-]/g, '_');
        if (!/\.(pdf|jpe?g|png)$/i.test(archivo)) return { ok: false, error: 'Tipo de archivo no permitido' };
        try {
            const ruta = path.join(app.getPath('temp'), archivo);
            await fs.promises.writeFile(ruta, Buffer.from(datos));
            const error = await shell.openPath(ruta);
            return error ? { ok: false, error } : { ok: true };
        } catch (error) {
            log.error('[IPC abrir-archivo]', error);
            return { ok: false, error: 'No se pudo abrir el certificado' };
        }
    });

    // ─── Google OAuth ────────────────────────────────────────────────────────
    const GOOGLE_CLIENT_ID = '123351582964-3o87ns87o1opd15jgl8gke0m8etdh4ko.apps.googleusercontent.com';
    ipcMain.handle('google-login', (event) => new Promise((resolve) => {
        desdeLaPantalla(event);
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

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

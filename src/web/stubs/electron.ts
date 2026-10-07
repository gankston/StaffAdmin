// En el navegador no hay Electron. exportExcel.ts y reportPdf.ts lo importan,
// pero la version web solo usa sus funciones que no lo tocan.
const noDisponible = () => { throw new Error('No disponible en la versión web'); };
export const BrowserWindow = noDisponible;
export const app = { getPath: noDisponible };
export const dialog = { showOpenDialog: noDisponible, showSaveDialog: noDisponible };
export const shell = { openPath: noDisponible };
export default { BrowserWindow, app, dialog, shell };

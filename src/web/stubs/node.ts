// fs y path de Node: apiClient.ts, exportExcel.ts y reportPdf.ts los importan,
// pero la version web solo usa sus funciones que no los tocan.
const noDisponible = () => { throw new Error('No disponible en la versión web'); };
export const readFileSync = noDisponible;
export const writeFileSync = noDisponible;
export const statSync = noDisponible;
export const unlinkSync = noDisponible;
export const basename = noDisponible;
export const extname = noDisponible;
export const join = noDisponible;
export default { readFileSync, writeFileSync, statSync, unlinkSync, basename, extname, join };

import type { ElectronAPI, StaffadminShell } from '../../electron/preload';

declare global {
    interface Window {
        electronAPI: ElectronAPI;
        // Solo adentro del programa de escritorio (electron/preload.ts).
        staffadminShell?: StaffadminShell;
        // Version que muestra Info en la pantalla web (la pone src/web/entry.ts).
        __staffadminVersion?: string;
    }
    // Version de package.json, la pone Vite (vite.config.ts / vite.web.config.ts).
    const __APP_VERSION__: string;
    const __PKG_VERSION__: string;
}

import type { ElectronAPI } from '../../electron/preload';

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
    // Version de package.json, la pone Vite (vite.config.ts / vite.web.config.ts).
    const __APP_VERSION__: string;
}

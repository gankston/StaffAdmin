# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm i          # install dependencies
npm run dev    # start dev server (Vite + Electron hot-reload)
npm run build  # vite build + electron-builder (produces NSIS installer)
```

There are no tests in this project.

## Architecture

**StaffAdmin** is an Electron desktop app (Windows) that acts as an admin dashboard for **StaffAxis**, a staff attendance management system. The frontend is React + TypeScript + Tailwind CSS v4. The backend is an external Cloudflare Workers API at `https://staffaxis-api-prod.pgastonor.workers.dev`.

### Process boundary

```
Renderer (React)  ←→  preload.ts (contextBridge)  ←→  main.ts (Node/Electron)
```

- `electron/preload.ts` exposes `window.electronAPI` via `contextBridge` — this is the only safe bridge between renderer and main process.
- `electron/main.ts` registers all `ipcMain.handle(...)` handlers and orchestrates the app lifecycle, auto-updater, and window setup.
- The renderer calls `window.electronAPI.*` for everything that requires Node (fetching from the external API, generating Excel files).

### Key files

| File | Role |
|---|---|
| `src/app/App.tsx` | Entire frontend — single large component file containing all UI, state, and API calls |
| `electron/main.ts` | Electron main process: window creation, IPC handlers, auto-updater |
| `electron/preload.ts` | IPC bridge — defines `ElectronAPI` type exposed to renderer |
| `electron/apiClient.ts` | HTTP client for StaffAxis API: `fetchSectors`, `fetchEmployees`, `fetchAttendances` |
| `electron/database.ts` | In-memory mock DB for sector state toggling (real data comes from API) |
| `electron/exportExcel.ts` | Excel generation logic using `xlsx` library |

### Data flow for sector loading

1. Renderer calls `window.electronAPI.getSectors()` via IPC
2. Main process calls `fetchSectors()` in `apiClient.ts`
3. `fetchSectors` hits `/api/sectors`, then enriches each sector in parallel with `/api/employees` (for count) and `/api/attendances?start_date=today&end_date=today` (to set `state: 'sent' | 'missing'`)
4. Returns `UiSector[]` to renderer

### Business period rule

The attendance period runs **21st of prior month → 20th of current month**. When the current day ≥ 21, the default period advances to the next month. This logic appears in both `App.tsx` (period picker state) and `exportExcel.ts` (column date generation). The fix for month-overflow on day 31 is intentional — `setDate(1)` before `setMonth(+1)` prevents e.g. March 31 → May 1.

### Authentication

Admin login POSTs to `/api/auth/login` and stores the JWT in `localStorage` (if "keep logged in") or `sessionStorage`. The token is passed as `Authorization: Bearer <token>` on all admin-only endpoints (create/delete employees, sectors, admin users, and attendance exports).

### Auto-updater

Uses `electron-updater` publishing to a private GitHub repo (`gankston/StaffAdmin`). `autoUpdater.autoDownload = false` — the user is prompted before downloading. Configured in `electron/main.ts`.

### Vite + Electron integration

Uses `vite-plugin-electron/simple`. The `@` alias resolves to `./src`. Electron entry points are `electron/main.ts` and `electron/preload.ts`, compiled alongside the renderer by Vite.

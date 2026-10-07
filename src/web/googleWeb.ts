/**
 * Ingreso con Google en la version web.
 *
 * Electron levanta un servidor local para recibir la respuesta de Google; en el
 * navegador eso no se puede, asi que se usa el cliente OAuth "Web": el boton
 * manda la pagina entera a Google y Google la devuelve a /admin/ con el
 * id_token en el #. Al volver, antes de arrancar la app, se cambia ese id_token
 * por el token de admin (el mismo POST /api/admin/google-auth que usa Electron)
 * y se guarda donde App.tsx lo busca, asi arranca ya logueada.
 *
 * Es redireccion y no ventana emergente a proposito: las emergentes las bloquea
 * el navegador, y las paginas de Google cortan el vinculo con la ventana que las
 * abrio (COOP), asi que no hay forma confiable de leer la respuesta.
 */

// ID del cliente OAuth tipo "Web" de StaffAdmin (Google Cloud). Solo es un
// identificador: no es secreto.
export const GOOGLE_WEB_CLIENT_ID = '123351582964-cd9lkie8tkjp7fc1flen122o8gqjn9vg.apps.googleusercontent.com';

const API_BASE = 'https://staffaxis-new-version-production.up.railway.app';
const CLAVE = 'staffadmin_google_login';

function redirectUri(): string {
    return `${location.origin}/admin/`;
}

/** Manda la pagina a Google. No vuelve: la pagina se va. */
export function irAGoogle(): void {
    const state = crypto.randomUUID();
    const nonce = crypto.randomUUID();
    sessionStorage.setItem(CLAVE, JSON.stringify({ state, nonce }));
    const qs = new URLSearchParams({
        client_id: GOOGLE_WEB_CLIENT_ID,
        redirect_uri: redirectUri(),
        response_type: 'id_token',
        scope: 'openid email profile',
        state,
        nonce,
        prompt: 'select_account',
    });
    location.assign(`https://accounts.google.com/o/oauth2/v2/auth?${qs}`);
}

function payloadDelJwt(jwt: string): any {
    const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
}

/** Aviso arriba de la pantalla de ingreso (la app todavia no arranco). */
function mostrarAviso(texto: string): void {
    const div = document.createElement('div');
    div.setAttribute('role', 'alert');
    div.textContent = texto;
    div.style.cssText = [
        'position:fixed', 'top:24px', 'left:50%', 'transform:translateX(-50%)', 'z-index:99999',
        'max-width:min(560px,calc(100vw - 32px))', 'padding:12px 18px', 'border-radius:12px',
        'background:rgba(30,30,46,0.97)', 'border:1px solid rgba(239,83,80,0.6)', 'color:#FFCDD2',
        'font:500 14px/1.4 system-ui,sans-serif', 'box-shadow:0 8px 30px rgba(0,0,0,0.5)', 'cursor:pointer',
    ].join(';');
    div.addEventListener('click', () => div.remove());
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 10_000);
}

/**
 * Si la pagina vuelve de Google, deja la sesion guardada (o muestra por que no
 * se pudo entrar). Se llama antes de arrancar la app.
 */
export async function volverDeGoogle(): Promise<void> {
    const hash = location.hash.slice(1);
    if (!/(^|&)(id_token|error)=/.test(hash)) return;

    const p = new URLSearchParams(hash);
    const noVerificado = 'No se pudo verificar el ingreso con Google. Probá de nuevo.';

    try {
        // El id_token no tiene que quedar en la barra de direcciones ni en el historial.
        history.replaceState(null, '', location.pathname + location.search);
        let guardado: { state: string; nonce: string } | null = null;
        try { guardado = JSON.parse(sessionStorage.getItem(CLAVE) || 'null'); } catch { /* queda null */ }
        sessionStorage.removeItem(CLAVE);

        // Solo vuelve de Google lo que este navegador mando: sin el state propio,
        // no se muestra nada que venga en la URL (alguien podria armar un link con
        // un mensaje cualquiera).
        if (!guardado || p.get('state') !== guardado.state) throw new Error(noVerificado);
        const error = p.get('error');
        if (error) {
            throw new Error(error === 'access_denied' ? 'Se canceló el ingreso con Google' : 'Google no dejó completar el ingreso. Probá de nuevo.');
        }
        const idToken = p.get('id_token');
        let nonce = '';
        try { nonce = payloadDelJwt(idToken ?? '').nonce; } catch { /* token mal formado */ }
        if (!idToken || nonce !== guardado.nonce) throw new Error(noVerificado);
        const res = await fetch(`${API_BASE}/api/admin/google-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken }),
            // Si el server no responde, la app igual arranca (a la pantalla de ingreso).
            signal: AbortSignal.timeout(15_000),
        });
        const data: any = await res.json().catch(() => ({}));
        if (!data.token) throw new Error(data.error || 'Error al autenticar con Google');
        // Igual que attemptGoogleLogin en App.tsx.
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
    } catch (err) {
        const texto = (err as Error).name === 'TimeoutError'
            ? 'El servidor tardó demasiado en responder. Probá de nuevo.'
            : (err as Error).message || 'Error al autenticar con Google';
        // La app arranca despues de esto: el aviso se agrega cuando ya hay body.
        setTimeout(() => mostrarAviso(texto), 0);
    }
}

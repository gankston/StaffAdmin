// Primero el puente (deja window.electronAPI listo); si la pagina vuelve de
// Google, se termina el ingreso; y recien ahi arranca la app de siempre.
import './electronApiWeb';
import { volverDeGoogle } from './googleWeb';

volverDeGoogle().finally(() => import('../main.tsx'));

// Volver con "Atras" desde la pantalla de Google trae la pagina congelada (bfcache)
// con el boton de Google en "cargando": se recarga para que quede usable.
window.addEventListener('pageshow', (e) => {
    if (e.persisted) location.reload();
});

// Primero el puente (deja window.electronAPI listo); si la pagina vuelve de
// Google, se termina el ingreso; y recien ahi arranca la app de siempre.
import './electronApiWeb';
import { volverDeGoogle } from './googleWeb';

volverDeGoogle().finally(() => import('../main.tsx'));

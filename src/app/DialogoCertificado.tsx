/**
 * Certificado medico de un empleado: primero se eligen los dias en un
 * calendario, despues se sube la foto o el PDF, y se confirma.
 *
 * En la base quedan los dias; en el Excel esos dias dicen CERTIFICADO MEDICO y
 * suman 8 h (lunes a viernes) o 4 h (sabado). La regla esta en
 * electron/certificadoMedico.ts, la misma que usa el Excel.
 */
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Eye, FileText, Stethoscope, Trash2, Upload } from "lucide-react";
import { GLOSARIO_CM, horasDeCertificado } from "../../electron/certificadoMedico";

const API = "https://staffaxis-new-version-production.up.railway.app";

export interface CertificadoMedico {
  id: string;
  employee_id: string;
  fechas: string[];
  tipo_archivo: string;
  nombre_original: string | null;
  observaciones: string | null;
  created_at: string;
}

const token = () => {
  const t = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
  return t === "undefined" ? "" : t;
};

/** Certificados de un sector en un periodo (vista previa y Excel), o de un empleado. */
export async function traerCertificados(q: { sector_id?: string; employee_id?: string; start_date?: string; end_date?: string }): Promise<CertificadoMedico[]> {
  const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => !!v) as [string, string][]);
  const res = await fetch(`${API}/api/admin/certificados?${qs}`, { headers: { "x-admin-token": token() } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).certificados ?? [];
}

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const iso = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const corta = (f: string) => `${f.slice(8, 10)}/${f.slice(5, 7)}`;

/** Todos los dias entre dos fechas (incluidas), en cualquier orden. */
function rango(a: string, b: string): string[] {
  const [ini, fin] = a <= b ? [a, b] : [b, a];
  const out: string[] = [];
  const d = new Date(`${ini}T12:00:00Z`);
  while (d.toISOString().slice(0, 10) <= fin) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

/** "3 días: 01/10 al 03/10" o "01/10, 03/10" */
function resumenFechas(fechas: string[]): string {
  const f = [...fechas].sort();
  if (!f.length) return "";
  const seguidas = f.every((x, i) => i === 0 || rango(f[i - 1], x).length === 2);
  if (seguidas && f.length > 2) return `${corta(f[0])} al ${corta(f[f.length - 1])}`;
  return f.map(corta).join(", ");
}

const btn = (color: string, bg: string): CSSProperties => ({
  display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 10, cursor: "pointer",
  border: `1px solid ${color}55`, background: bg, color, fontSize: 12, fontWeight: 700,
});

export function DialogoCertificado({
  empleado,
  horasCargadas,
  onCerrar,
  onCambio,
}: {
  empleado: { id: string; first_name: string; last_name: string };
  /** fecha -> horas ya tarjadas (del periodo de la vista previa), para avisar que se reemplazan */
  horasCargadas: Record<string, number>;
  onCerrar: () => void;
  /** Se guardo o se borro un certificado: recargar la vista previa. */
  onCambio: () => void;
}) {
  const hoy = new Date();
  const [mes, setMes] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() });
  const [paso, setPaso] = useState<"fechas" | "archivo">("fechas");
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [ancla, setAncla] = useState<string | null>(null);
  const [existentes, setExistentes] = useState<CertificadoMedico[]>([]);
  const [cargandoLista, setCargandoLista] = useState(true);
  const [errorLista, setErrorLista] = useState(false);
  const [archivo, setArchivo] = useState<string | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarLista = async () => {
    setCargandoLista(true);
    setErrorLista(false);
    try {
      setExistentes(await traerCertificados({ employee_id: empleado.id }));
    } catch {
      // No se dice "no tiene certificados": no se sabe. El server igual frena
      // un dia repetido con un 409.
      setErrorLista(true);
    } finally {
      setCargandoLista(false);
    }
  };
  useEffect(() => { cargarLista(); }, [empleado.id]);

  // Dias que ya tienen certificado: no se pueden volver a elegir.
  const ocupados = new Set(existentes.flatMap((c) => c.fechas));

  const tocar = (fecha: string, conShift: boolean) => {
    setError(null);
    setSeleccion((prev) => {
      const next = new Set(prev);
      if (conShift && ancla) {
        // Shift: marca todo el rango desde el ultimo dia tocado.
        rango(ancla, fecha).filter((f) => !ocupados.has(f)).forEach((f) => next.add(f));
      } else if (next.has(fecha)) {
        next.delete(fecha);
      } else {
        next.add(fecha);
      }
      return next;
    });
    setAncla(fecha);
  };

  const elegidas = [...seleccion].sort();
  const totalHoras = elegidas.reduce((a, f) => a + horasDeCertificado(f), 0);
  const reemplazos = elegidas.filter((f) => (horasCargadas[f] ?? 0) > 0);

  const elegirArchivo = async () => {
    const ruta = await window.electronAPI?.certElegirArchivo?.();
    if (ruta) { setArchivo(ruta); setError(null); }
  };

  const guardar = async () => {
    if (!archivo || !elegidas.length || guardando) return;
    setGuardando(true);
    setError(null);
    const r = await window.electronAPI?.certSubir?.(empleado.id, elegidas, observaciones, archivo);
    setGuardando(false);
    if (!r) { setError("No se pudo subir el certificado"); return; }
    if (!r.ok) {
      setError(r.fechas?.length ? `${r.error}: ${r.fechas.map(corta).join(", ")}` : r.error);
      if (r.fechas?.length) {
        // Esos dias ya tienen certificado: se sacan de la seleccion. Si no queda
        // ninguno, se vuelve al calendario para elegir de nuevo.
        const quedan = elegidas.filter((f) => !r.fechas!.includes(f));
        setSeleccion(new Set(quedan));
        if (!quedan.length) setPaso("fechas");
      }
      // Siempre se recarga la lista: el 409 de dos cargas a la vez llega sin fechas.
      cargarLista();
      return;
    }
    onCambio();
    onCerrar();
  };

  const borrar = async (c: CertificadoMedico) => {
    if (!confirm(`¿Borrar el certificado del ${resumenFechas(c.fechas)}? Esos días vuelven a mostrar lo que tenían cargado.`)) return;
    try {
      const res = await fetch(`${API}/api/admin/certificados/${c.id}`, { method: "DELETE", headers: { "x-admin-token": token() } });
      if (!res.ok) { alert("No se pudo borrar el certificado"); return; }
    } catch {
      alert("No se pudo borrar el certificado: revisá la conexión.");
      return;
    }
    await cargarLista();
    onCambio();
  };

  // ── Calendario (semana de lunes a domingo) ─────────────────────────────────
  const primerDia = new Date(mes.y, mes.m, 1);
  const diasDelMes = new Date(mes.y, mes.m + 1, 0).getDate();
  const huecos = (primerDia.getDay() + 6) % 7;
  const celdas: (string | null)[] = [...Array(huecos).fill(null), ...Array.from({ length: diasDelMes }, (_, i) => iso(mes.y, mes.m, i + 1))];
  const moverMes = (delta: number) => setMes(({ y, m }) => {
    const d = new Date(y, m + delta, 1);
    return { y: d.getFullYear(), m: d.getMonth() };
  });

  return createPortal(
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={(e) => e.stopPropagation()}>
      <div style={{ background: "#1a1225", border: "1px solid rgba(239,83,80,0.4)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 480, maxHeight: "92vh", overflowY: "auto" }}>
        {/* Encabezado */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ display: "flex", padding: 8, borderRadius: 10, background: "rgba(239,83,80,0.15)", color: "#EF5350" }}><Stethoscope size={18} /></span>
            <div>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Certificado médico</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{empleado.last_name} {empleado.first_name}</p>
            </div>
          </div>
          <button onClick={onCerrar} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: "6px 10px", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>

        {paso === "fechas" ? (
          <>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>
              <strong style={{ color: "white" }}>1. Elegí los días.</strong> Tocá cada día, o tocá el primero y después el último con <strong style={{ color: "white" }}>Shift</strong> para marcar el rango.
            </p>

            {/* Mes */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <button onClick={() => moverMes(-1)} style={{ ...btn("#fff", "rgba(255,255,255,0.06)"), padding: 6 }}><ChevronLeft size={16} /></button>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{MESES[mes.m]} {mes.y}</span>
              <button onClick={() => moverMes(1)} style={{ ...btn("#fff", "rgba(255,255,255,0.06)"), padding: 6 }}><ChevronRight size={16} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 700, paddingBottom: 2 }}>{d}</div>
              ))}
              {celdas.map((f, i) => {
                if (!f) return <div key={`h${i}`} />;
                const ocupado = ocupados.has(f);
                const elegido = seleccion.has(f);
                const horas = horasCargadas[f] ?? 0;
                return (
                  <button
                    key={f}
                    disabled={ocupado}
                    onClick={(e) => tocar(f, e.shiftKey)}
                    title={ocupado ? "Ya tiene certificado" : horas > 0 ? `Tiene ${horas} h cargadas` : ""}
                    style={{
                      height: 40, borderRadius: 8, cursor: ocupado ? "not-allowed" : "pointer",
                      border: elegido ? "1px solid #EF5350" : "1px solid rgba(255,255,255,0.08)",
                      background: elegido ? "rgba(239,83,80,0.75)" : ocupado ? "rgba(239,83,80,0.15)" : "rgba(255,255,255,0.04)",
                      color: ocupado ? "#EF9A9A" : "white", fontSize: 12, fontWeight: 700, lineHeight: 1.1,
                    }}
                  >
                    {Number(f.slice(8, 10))}
                    <div style={{ fontSize: 8, fontWeight: 600, opacity: 0.8 }}>{ocupado ? "CM" : horas > 0 ? `${horas} h` : ""}</div>
                  </button>
                );
              })}
            </div>

            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.04)", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              {elegidas.length
                ? <><strong style={{ color: "white" }}>{elegidas.length} {elegidas.length === 1 ? "día" : "días"}:</strong> {resumenFechas(elegidas)} — suman <strong style={{ color: "white" }}>{totalHoras} h</strong></>
                : "Todavía no elegiste ningún día."}
              <div style={{ fontSize: 10, marginTop: 4, color: "rgba(255,255,255,0.45)" }}>{GLOSARIO_CM}</div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 14 }}>
              <button onClick={onCerrar} style={btn("rgba(255,255,255,0.7)", "transparent")}>Cancelar</button>
              <button
                disabled={!elegidas.length}
                onClick={() => setPaso("archivo")}
                style={{ ...btn("#fff", elegidas.length ? "#C62828" : "rgba(255,255,255,0.08)"), opacity: elegidas.length ? 1 : 0.5, cursor: elegidas.length ? "pointer" : "not-allowed" }}
              >
                Siguiente: subir el certificado
              </button>
            </div>

            {/* Los que ya tiene */}
            <div style={{ marginTop: 20, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Certificados cargados</p>
              {cargandoLista ? (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Cargando…</p>
              ) : errorLista ? (
                <p style={{ fontSize: 12, color: "#FFB74D" }}>No se pudo cargar la lista de certificados. <button onClick={cargarLista} style={{ background: "none", border: "none", color: "#26C6DA", cursor: "pointer", fontSize: 12, padding: 0 }}>Reintentar</button></p>
              ) : existentes.length === 0 ? (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>No tiene certificados.</p>
              ) : existentes.map((c) => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <FileText size={14} color="#EF9A9A" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>{c.fechas.length} {c.fechas.length === 1 ? "día" : "días"}: {resumenFechas(c.fechas)}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.tipo_archivo === "application/pdf" ? "PDF" : "Foto"}{c.observaciones ? ` · ${c.observaciones}` : ""}
                    </div>
                  </div>
                  <button title="Ver el certificado" onClick={async () => {
                    const r = await window.electronAPI?.certAbrir?.(c.id);
                    if (r && !r.ok) alert(r.error || "No se pudo abrir el certificado");
                  }} style={{ ...btn("#26C6DA", "rgba(38,198,218,0.1)"), padding: 6 }}><Eye size={13} /></button>
                  <button title="Borrar el certificado" onClick={() => borrar(c)} style={{ ...btn("#FF5252", "rgba(255,82,82,0.08)"), padding: 6 }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>
              <strong style={{ color: "white" }}>2. Subí la foto o el PDF del certificado.</strong>
            </p>

            <button onClick={elegirArchivo} style={{ ...btn("#fff", "rgba(239,83,80,0.18)"), width: "100%", justifyContent: "center", padding: 12 }}>
              <Upload size={15} /> {archivo ? "Cambiar el archivo" : "Elegir foto o PDF"}
            </button>
            {archivo && (
              <p style={{ fontSize: 12, color: "#A5D6A7", marginTop: 8, wordBreak: "break-all" }}>✓ {archivo.split(/[\\/]/).pop()}</p>
            )}

            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.06em", margin: "14px 0 4px" }}>Observación (opcional)</p>
            <input
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Ej: reposo por lumbalgia"
              style={{ width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 12px", color: "white", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />

            {/* Resumen de lo que se va a guardar */}
            <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 12, background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.3)", fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>
              <div><strong style={{ color: "white" }}>{empleado.last_name} {empleado.first_name}</strong></div>
              <div>{elegidas.length} {elegidas.length === 1 ? "día" : "días"}: {resumenFechas(elegidas)}</div>
              <div>En el Excel: <strong style={{ color: "white" }}>CERTIFICADO MEDICO</strong>, suman <strong style={{ color: "white" }}>{totalHoras} h</strong> (8 h de lunes a viernes, 4 h el sábado)</div>
              {reemplazos.length > 0 && (
                <div style={{ color: "#FFB74D", marginTop: 6 }}>
                  ⚠ {reemplazos.map((f) => `El ${corta(f)} tiene ${horasCargadas[f]} h cargadas`).join(". ")}: se reemplazan por las horas del certificado. La tarja no se borra: si después borrás el certificado, vuelve.
                </div>
              )}
            </div>

            {error && <p style={{ fontSize: 12, color: "#FF5252", marginTop: 10 }}>{error}</p>}

            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginTop: 16 }}>
              <button onClick={() => { setPaso("fechas"); setError(null); }} style={btn("rgba(255,255,255,0.7)", "transparent")}>Volver a las fechas</button>
              <button
                disabled={!archivo || guardando || !elegidas.length}
                onClick={guardar}
                style={{ ...btn("#fff", archivo && elegidas.length ? "#C62828" : "rgba(255,255,255,0.08)"), opacity: archivo && elegidas.length && !guardando ? 1 : 0.5, cursor: archivo && elegidas.length && !guardando ? "pointer" : "not-allowed" }}
              >
                {guardando ? "Guardando…" : "Guardar certificado"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

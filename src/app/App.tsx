import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";


import {
  ChevronDown,
  CheckCircle2,
  AlertCircle,
  Users,
  Cpu,
  FlaskConical,
  Truck,
  Headphones,
  DollarSign,
  Building2,
  Bell,
  Settings,
  Search,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  X,
  AlertTriangle,
  BarChart2,
  RefreshCw,
  Trash2,
  UserCog,
  Download,
  Plus,
  LogOut,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  LayoutGrid,
  BarChart3,
  LeafyGreen,
  Wheat,
  Banana,
  Factory,
  Tractor,
  HardHat,
  FileText,
  Eye,
  ImageOff,
  Upload,
  ShieldCheck,
  MapPin,
  Ban,
  Smartphone,
  Crown,
  Users,
} from "lucide-react";


type CardState = "sent" | "missing";

interface Sector {
  id: number;
  apiId: string;   // real string ID from API (e.g. "sec-construccion")
  name: string;
  employees: number;
  state: CardState;
  icon: string;
  encargado: string;
  trend: number;
}

const getIcon = (iconName: string, size = 24) => {
  switch (iconName) {
    case 'Cpu': return <Cpu size={size} />;
    case 'Truck': return <Truck size={size} />;
    case 'Users': return <Users size={size} />;
    case 'DollarSign': return <DollarSign size={size} />;
    case 'FlaskConical': return <FlaskConical size={size} />;
    case 'Headphones': return <Headphones size={size} />;
    case 'LeafyGreen': return <LeafyGreen size={size} />;
    case 'Wheat': return <Wheat size={size} />;
    case 'Banana': return <Banana size={size} />;
    case 'Factory': return <Factory size={size} />;
    case 'Tractor': return <Tractor size={size} />;
    case 'HardHat': return <HardHat size={size} />;
    default: return <Building2 size={size} />;
  }
};

function SectorDropdown({ value, onChange, sectors }: { value: string; onChange: (v: string) => void; sectors: Sector[] }) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const handleToggle = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setOpen((v) => !v);
  };

  const options = ["Todos", ...sectors.map((s) => s.name)];

  const dropdown = open && dropPos ? (
    <div
      style={{
        position: "fixed",
        top: dropPos.top,
        left: dropPos.left,
        width: dropPos.width,
        zIndex: 99999,
        background: "#232336",
        border: "1.5px solid rgba(255,255,255,0.12)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.7)",
        borderRadius: 14,
        maxHeight: 280,
        overflowY: "auto",
      }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => { onChange(opt); setOpen(false); }}
          className="w-full flex items-center px-5 py-3.5 text-left text-white"
          style={{
            background: opt === value ? "rgba(156,39,176,0.18)" : "transparent",
            borderLeft: opt === value ? "3px solid #9C27B0" : "3px solid transparent",
            fontSize: 14, fontWeight: opt === value ? 600 : 400, cursor: "pointer",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <div ref={ref} className="relative w-full">
      <button
        ref={btnRef}
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-4 rounded-[16px] transition-colors"
        style={{
          background: "#2A2A3E",
          border: open ? "1.5px solid rgba(156,39,176,0.6)" : "1.5px solid rgba(255,255,255,0.1)",
          cursor: "pointer",
        }}
      >
        <span className="text-white font-semibold" style={{ fontSize: 15 }}>Sector: {value}</span>
        <ChevronDown size={18} color="rgba(255,255,255,0.5)" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </button>
      {createPortal(dropdown, document.body)}
    </div>
  );
}

function StatsCard({ filter, sectors, globalStats }: { filter: string, sectors: Sector[], globalStats: any }) {
  const isGlobal = filter === "Todos";
  const src = isGlobal ? sectors : sectors.filter((s) => s.name === filter);

  const totalEmpleados = src.reduce((a, c) => a + c.employees, 0);
  const numEncargados = new Set(src.map(s => s.encargado).filter(Boolean)).size;

  const ausentes = isGlobal ? globalStats.ausentes : "—";
  const activos = isGlobal ? Math.max(0, totalEmpleados - globalStats.ausentes) : totalEmpleados;
  const horasTotales = isGlobal ? globalStats.horasTotales : null;
  const cosechaTotales = isGlobal ? globalStats.cosechaTotales : null;
  const importeTotales = isGlobal ? globalStats.importeTotales : null;
  const cajasTotales = isGlobal ? globalStats.cajasTotales : null;
  const cajonesTotales = isGlobal ? globalStats.cajonesTotales : null;
  // Tipos de carga nuevos, mismo criterio que el resto: solo tienen sentido en la
  // vista global (por sector individual se puede agregar despues si hace falta).
  const kmViajesTotales = isGlobal ? globalStats.kmViajesTotales : null;
  const hasFumigadasTotales = isGlobal ? globalStats.hasFumigadasTotales : null;
  const siembraTrillaTotales = isGlobal ? globalStats.siembraTrillaTotales : null;
  const bolserosTotales = isGlobal ? globalStats.bolserosTotales : null;
  const etiquetadoTotales = isGlobal ? globalStats.etiquetadoTotales : null;
  const camionCargas = isGlobal ? globalStats.camionCargas : null;
  const estibaCargas = isGlobal ? globalStats.estibaCargas : null;

  const fmtH = (v: number | null) => v === null ? "—" : v === 0 ? "0H" : v < 1 ? "<1H" : `${Math.round(v)}H`;
  const fmtKg = (v: number | null) => v === null ? "—" : v === 0 ? "0" : v.toLocaleString("es", { maximumFractionDigits: 0 });
  const fmtPesos = (v: number | null) => v === null ? "—" : v === 0 ? "$0" : "$" + v.toLocaleString("es", { maximumFractionDigits: 0 });

  const stat = (label: string, value: string | number) => (
    <div>
      <p className="text-white/65 uppercase font-semibold tracking-wider mb-1" style={{ fontSize: 10 }}>{label}</p>
      <p className="text-white font-black" style={{ fontSize: 22, lineHeight: 1 }}>{value}</p>
    </div>
  );

  return (
    <div className="p-5 rounded-[16px]" style={{ background: "linear-gradient(135deg, #9C27B0 0%, #26C6DA 100%)", boxShadow: "0 12px 32px rgba(156,39,176,0.25)" }}>
      <h2 className="text-white mb-5" style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em" }}>Estadísticas de Hoy</h2>
      <div className="grid grid-cols-2 gap-y-5 gap-x-4">
        {stat("Registrados", totalEmpleados.toLocaleString("es"))}
        {stat("Encargados", numEncargados)}
        {stat("Activos", activos.toLocaleString("es"))}
        {stat("Ausentes", ausentes)}
        {stat("Horas", fmtH(horasTotales))}
        {stat("Cosecha", fmtKg(cosechaTotales))}
        {stat("Cajas", fmtKg(cajasTotales))}
        {stat("Cajones", fmtKg(cajonesTotales))}
        {stat("Importe", fmtPesos(importeTotales))}
        {stat("Km/Viajes", fmtKg(kmViajesTotales))}
        {stat("Has Fumigadas", fmtKg(hasFumigadasTotales))}
        {stat("Siembra/Trilla", fmtKg(siembraTrillaTotales))}
        {stat("Bolseros", fmtKg(bolserosTotales))}
        {stat("Etiquetado", fmtKg(etiquetadoTotales))}
        {stat("Cargas Camión", fmtKg(camionCargas))}
        {stat("Cargas Estiba", fmtKg(estibaCargas))}
        {stat("Sectores", src.length)}
      </div>
    </div>
  );
}

function SectorCard({ sector, onClick }: { sector: Sector; onClick: () => void }) {
  const sent = sector.state === "sent";
  const bg = sent ? "#4CAF50" : "#FF5252";
  const badgeText = sent ? "Enviado" : "Faltante";

  return (
    <div
      onClick={onClick}
      className="cursor-pointer select-none flex flex-col transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: bg,
        borderRadius: 16,
        padding: 24,
        minHeight: 240,
        boxShadow: `0 8px 24px ${sent ? 'rgba(76,175,80,0.2)' : 'rgba(255,82,82,0.2)'}`,
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center justify-center rounded-xl" style={{ width: 48, height: 48, background: "rgba(255,255,255,0.2)", color: "#fff" }}>
          {getIcon(sector.icon)}
        </div>
        <div className="px-3.5 py-1.5 rounded-full flex items-center gap-1.5" style={{ background: "rgba(255,255,255,0.2)" }}>
          {sent ? <CheckCircle2 size={14} color="#fff" /> : <AlertCircle size={14} color="#fff" />}
          <span className="text-white font-bold tracking-wide" style={{ fontSize: 12 }}>{badgeText}</span>
        </div>
      </div>
      <h3 className="text-white font-bold leading-tight mb-2" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>{sector.name}</h3>
      <div className="flex-1" />
      <p className="text-white/80 font-semibold uppercase tracking-wider mb-1" style={{ fontSize: 11 }}>Total Empleados</p>
      <div className="text-white font-black leading-none mb-6" style={{ fontSize: 44, letterSpacing: "-0.02em" }}>{sector.employees}</div>
      <div className="flex items-end justify-between border-t border-white/20 pt-4 mt-auto">
        <span className="text-white font-semibold" style={{ fontSize: 13, opacity: 0.9 }}>Encargado: {sector.encargado}</span>
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.2)" }}>
          {sector.trend >= 0 ? <TrendingUp size={14} color="#fff" /> : <TrendingDown size={14} color="#fff" />}
          <span className="text-white font-bold" style={{ fontSize: 13 }}>{sector.trend >= 0 ? "+" : ""}{sector.trend}%</span>
        </div>
      </div>
    </div>
  );
}

interface Employee {
  id: string;
  sector_id: string;
  first_name: string;
  last_name: string;
  dni?: string | null;          // field from API
  external_code?: string | null;
  is_active: boolean;
  tiene_foto_frente?: boolean;
  tiene_foto_dorso?: boolean;
}


function FloatingModal({ sector, onClose, onExport, isAdmin, onCreateEmployee, onDeleteEmployee, onDeleteSector, setShowConfirmDelete }: { sector: Sector; onClose: () => void; onExport: () => void; isAdmin: boolean; onCreateEmployee?: () => void; onDeleteEmployee?: (id: string) => Promise<boolean>; onDeleteSector?: (id: string) => Promise<boolean>; setShowConfirmDelete: (val: any) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [locatingTarja, setLocatingTarja] = useState(false);
  const [absentEmployeeIds, setAbsentEmployeeIds] = useState<Set<string>>(new Set());
  const [absenceLoading, setAbsenceLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const isMissing = sector.state === "missing";

  // ── Estado editar empleado (con gestión de fotos) ──────────────────────
  const [editDialogEmp, setEditDialogEmp] = useState<Employee | null>(null);
  const [editFirst, setEditFirst] = useState("");
  const [editLast, setEditLast] = useState("");
  const [editDni, setEditDni] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [fotoData, setFotoData] = useState<{ frente: string | null; dorso: string | null }>({ frente: null, dorso: null });
  const [fotoLoading, setFotoLoading] = useState<{ frente: boolean; dorso: boolean }>({ frente: false, dorso: false });
  const [fotoUploading, setFotoUploading] = useState<{ frente: boolean; dorso: boolean }>({ frente: false, dorso: false });

  // ── Estado ver foto ─────────────────────────────────────────────────────
  const [viewFotoEmp, setViewFotoEmp] = useState<Employee | null>(null);
  const [viewFotoData, setViewFotoData] = useState<{ frente: string | null; dorso: string | null }>({ frente: null, dorso: null });
  const [viewFotoLoading, setViewFotoLoading] = useState(false);

  const openEditDialog = async (emp: Employee) => {
    setEditDialogEmp(emp);
    setEditFirst(emp.first_name);
    setEditLast(emp.last_name || "");
    setEditDni(emp.dni || "");
    setFotoData({ frente: null, dorso: null });
    setFotoLoading({ frente: !!emp.tiene_foto_frente, dorso: !!emp.tiene_foto_dorso });
    const [frente, dorso] = await Promise.all([
      emp.tiene_foto_frente ? window.electronAPI?.getFoto?.(emp.id, 'frente').catch(() => null) : Promise.resolve(null),
      emp.tiene_foto_dorso ? window.electronAPI?.getFoto?.(emp.id, 'dorso').catch(() => null) : Promise.resolve(null),
    ]);
    setFotoData({ frente: frente ?? null, dorso: dorso ?? null });
    setFotoLoading({ frente: false, dorso: false });
  };

  const handleSaveEmployee = async () => {
    if (!editDialogEmp || editSaving) return;
    setEditSaving(true);
    try {
      const rawTok = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
      const tok = rawTok === "undefined" ? "" : rawTok;
      const res = await fetch(`https://staffaxis-new-version-production.up.railway.app/api/admin/employees/${editDialogEmp.id}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json', 'x-admin-token': tok },
        body: JSON.stringify({ first_name: editFirst.trim(), last_name: editLast.trim(), dni: editDni.trim() || null }),
      });
      if (res.ok) {
        setEmployees(prev => prev.map(e =>
          e.id === editDialogEmp.id ? { ...e, first_name: editFirst.trim(), last_name: editLast.trim(), dni: editDni.trim() || null } : e
        ));
        setEditDialogEmp(null);
      }
    } finally {
      setEditSaving(false);
    }
  };

  const handleSubirFoto = async (lado: 'frente' | 'dorso') => {
    if (!editDialogEmp) return;
    const filePath = await window.electronAPI?.openFileDialog?.();
    if (!filePath) return;
    setFotoUploading(prev => ({ ...prev, [lado]: true }));
    const res = await window.electronAPI?.uploadFoto?.(editDialogEmp.id, lado, filePath);
    if (res?.success) {
      setFotoLoading(prev => ({ ...prev, [lado]: true }));
      const base64 = await window.electronAPI?.getFoto?.(editDialogEmp.id, lado).catch(() => null);
      setFotoData(prev => ({ ...prev, [lado]: base64 ?? null }));
      setFotoLoading(prev => ({ ...prev, [lado]: false }));
      setEmployees(prev => prev.map(e =>
        e.id === editDialogEmp.id ? { ...e, [`tiene_foto_${lado}`]: true } : e
      ));
      setEditDialogEmp(prev => prev ? { ...prev, [`tiene_foto_${lado}`]: true } : prev);
    }
    setFotoUploading(prev => ({ ...prev, [lado]: false }));
  };

  const handleEliminarFoto = async (lado: 'frente' | 'dorso') => {
    if (!editDialogEmp) return;
    const res = await window.electronAPI?.deleteFoto?.(editDialogEmp.id, lado);
    if (res?.success) {
      setFotoData(prev => ({ ...prev, [lado]: null }));
      setEmployees(prev => prev.map(e =>
        e.id === editDialogEmp.id ? { ...e, [`tiene_foto_${lado}`]: false } : e
      ));
      setEditDialogEmp(prev => prev ? { ...prev, [`tiene_foto_${lado}`]: false } : prev);
    }
  };

  const openViewFoto = async (emp: Employee) => {
    if (!emp.tiene_foto_frente && !emp.tiene_foto_dorso) return;
    setViewFotoEmp(emp);
    setViewFotoData({ frente: null, dorso: null });
    setViewFotoLoading(true);
    const [frente, dorso] = await Promise.all([
      emp.tiene_foto_frente ? window.electronAPI?.getFoto?.(emp.id, 'frente').catch(() => null) : Promise.resolve(null),
      emp.tiene_foto_dorso ? window.electronAPI?.getFoto?.(emp.id, 'dorso').catch(() => null) : Promise.resolve(null),
    ]);
    setViewFotoData({ frente: frente ?? null, dorso: dorso ?? null });
    setViewFotoLoading(false);
  };

  // Fecha de hoy en formato YYYY-MM-DD
  const todayStr = new Date().toISOString().slice(0, 10);

  // ── Period state: default = current month/year (Threshold: 21st) ──────────
  const nowForPeriod = new Date();
  if (nowForPeriod.getDate() >= 21) {
    nowForPeriod.setDate(1); // Evitar desborde en meses cortos (ej: 31 de marzo -> 31 de abril desbordaría a mayo)
    nowForPeriod.setMonth(nowForPeriod.getMonth() + 1);
  }
  const [periodMonth, setPeriodMonth] = useState(nowForPeriod.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(nowForPeriod.getFullYear());

  // ── Rango de fechas del período 21→20 (compartido por preview y export) ────
  const computePeriodRange = (month: number, year: number) => {
    const fromMonth = month === 1 ? 12 : month - 1;
    const fromYear = month === 1 ? year - 1 : year;
    return {
      startDate: `${fromYear}-${String(fromMonth).padStart(2, '0')}-21`,
      endDate: `${year}-${String(month).padStart(2, '0')}-20`,
    };
  };

  // ── Vista Previa: asistencias del período en grilla día x empleado ─────────
  const [previewAttendances, setPreviewAttendances] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  // Día que se está mirando en el cartel de estado de aprobación (arranca en hoy)
  const [diaEstado, setDiaEstado] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  useEffect(() => {
    let cancelled = false;
    const loadPreview = async () => {
      setPreviewLoading(true);
      try {
        const { startDate, endDate } = computePeriodRange(periodMonth, periodYear);
        const adminToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
        if (window.electronAPI?.getAttendances) {
          const data = await window.electronAPI.getAttendances(sector.apiId, startDate, endDate, adminToken);
          if (!cancelled) setPreviewAttendances(data ?? []);
        }
      } catch (err) {
        console.error('[Preview] Error cargando asistencias:', err);
        if (!cancelled) setPreviewAttendances([]);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    };
    loadPreview();
    return () => { cancelled = true; };
  }, [sector.apiId, periodMonth, periodYear]);

  // Días del período, en orden — genera columnas de la grilla
  const previewDays = (() => {
    const { startDate, endDate } = computePeriodRange(periodMonth, periodYear);
    const days: string[] = [];
    const d = new Date(startDate + "T00:00:00");
    const endD = new Date(endDate + "T00:00:00");
    while (d <= endD) {
      days.push(d.toISOString().slice(0, 10));
      d.setDate(d.getDate() + 1);
    }
    return days;
  })();

  const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dayLabel = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
  };

  // employee_id -> date -> registro de asistencia
  const previewMap = (() => {
    const map: Record<string, Record<string, any>> = {};
    for (const a of previewAttendances) {
      if (!a.employee_id || !a.date) continue;
      const dateKey = String(a.date).slice(0, 10);
      if (!map[a.employee_id]) map[a.employee_id] = {};
      map[a.employee_id][dateKey] = a;
    }
    return map;
  })();

  // Resumen compacto de los tipos de carga nuevos (columnas propias) para la celda del día.
  const datosExtraCompacto = (rec: Record<string, any> | null | undefined): string => {
    if (!rec) return '';
    const partes: string[] = [];
    if (rec.km_viajes) partes.push(`Km${rec.km_viajes}`);
    if (rec.has_fumigadas) partes.push(`Ha${rec.has_fumigadas}`);
    if (rec.siembra_trilla) partes.push(`ST${rec.siembra_trilla}`);
    if (rec.bolseros) partes.push(`Bol${rec.bolseros}`);
    if (rec.etiquetado) partes.push(`Et${rec.etiquetado}`);
    if (rec.carga_camion_kg50 || rec.carga_camion_kg25 || rec.carga_camion_otro) partes.push('CC');
    if (rec.movimiento_estiba_kg50 || rec.movimiento_estiba_kg25 || rec.movimiento_estiba_otro) partes.push('ME');
    return partes.join(' ');
  };

  // Determina color + texto de una celda día según el valor registrado.
  // La cosecha es un número plano (cantidad de tarjas/unidades), no kg — se muestra "C {numero}".
  // Las horas llevan prefijo "H " desde la app; rec.hours ya viene parseado correctamente por apiClient.ts.
  const renderDayCell = (rec: any) => {
    if (!rec) return { bg: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.2)", text: "—" };
    const workValue: string = rec.work_value != null ? String(rec.work_value) : "";
    const extraSuffix = datosExtraCompacto(rec);
    // Estado de aprobación: en vez de un símbolo (que no se entendía), la celda
    // pendiente se pinta de naranja y la rechazada se tacha con ✕.
    const pendiente = rec.status === 'pending';
    const rechazada = rec.status === 'rejected';
    const bgRech = "rgba(239,83,80,0.75)";
    const estadoSuffix = rec.status === 'rejected' ? '✕'
      : (rec.status === 'approved' && rec.aprobada_por_nombre) ? '✓' : '';
    const bgPend = "rgba(255,152,0,0.55)";
    const conExtra = (t: string) => [t, extraSuffix, estadoSuffix].filter(Boolean).join(' ');
    // La rechazada manda sobre cualquier otro color: tiene que saltar a la vista.
    const fondo = (normal: string) => rechazada ? bgRech : pendiente ? bgPend : normal;
    if (workValue.includes('|')) {
      const partes: string[] = [];
      for (const seg of workValue.split('|').slice(1)) {
        if (seg.startsWith('C:')) {
          const num = parseFloat(seg.slice(2).replace(',', '.'));
          partes.push(`C ${!isNaN(num) ? num : ''}`.trim());
        } else if (seg.startsWith('AB:')) {
          const num = parseFloat(seg.slice(3).replace(',', '.'));
          partes.push(`$ ${!isNaN(num) ? num.toLocaleString('es') : ''}`.trim());
        } else if (seg.startsWith('Cajas ') || seg.startsWith('Cajones ')) {
          const cajasM = seg.match(/Cajas ([0-9]+(?:[.,][0-9]+)?)/);
          const cajonesM = seg.match(/Cajones ([0-9]+(?:[.,][0-9]+)?)/);
          if (cajasM) partes.push(`Cj ${cajasM[1]}`);
          if (cajonesM) partes.push(`Cn ${cajonesM[1]}`);
        }
      }
      return { bg: fondo("rgba(38,198,218,0.35)"), color: "#fff", text: conExtra(partes.length > 0 ? partes.join(' ') : '•') };
    }
    if (workValue === 'C') return { bg: fondo("rgba(38,198,218,0.35)"), color: "#fff", text: conExtra("C") };
    if (workValue.startsWith('$')) {
      const num = parseFloat(workValue.slice(1).replace(',', '.'));
      return { bg: fondo("rgba(38,198,218,0.35)"), color: "#fff", text: conExtra(`$ ${!isNaN(num) ? num.toLocaleString('es') : ''}`.trim()) };
    }
    const hours = rec.hours;
    if (hours === null || hours === undefined || hours === 0) {
      return { bg: fondo("rgba(239,83,80,0.55)"), color: "#fff", text: conExtra("0") };
    }
    if (hours >= 7) return { bg: fondo("rgba(76,175,80,0.55)"), color: "#fff", text: conExtra(String(Math.round(hours))) };
    return { bg: fondo("rgba(255,193,7,0.55)"), color: "#1E1E2E", text: conExtra(String(Math.round(hours * 10) / 10)) };
  };

  // ── Estado de aprobación de la tarja del día que se está mirando ──────────
  // Desde esta fecha en adelante existe el registro de quién aprobó cada tarja.
  // Para días anteriores no hay dato y no tiene sentido mostrar el cartel.
  const FECHA_CORTE_APROBACION = '2026-08-25';

  const estadoTarjaDia = (() => {
    // La vista previa solo trae el período elegido abajo; fuera de ese rango no hay
    // datos cargados y decir "sin tarja" sería mentira.
    const { startDate: iniPeriodo, endDate: finPeriodo } = computePeriodRange(periodMonth, periodYear);
    if (diaEstado < iniPeriodo || diaEstado > finPeriodo) {
      return { tipo: 'sin_dato' as const, texto: 'Fuera del período seleccionado abajo', color: '#78909C' };
    }
    if (diaEstado < FECHA_CORTE_APROBACION) {
      return { tipo: 'sin_dato' as const, texto: 'Sin datos de aprobación para este día', color: '#78909C' };
    }
    const delDia = previewAttendances.filter(a => a.date && String(a.date).startsWith(diaEstado));
    if (delDia.length === 0) {
      return { tipo: 'sin_tarja' as const, texto: 'Sin tarja cargada este día', color: '#78909C' };
    }
    const aprobadas = delDia.filter(a => a.status === 'approved' && a.aprobada_por_nombre);
    const rechazadas = delDia.filter(a => a.status === 'rejected');
    const pendientes = delDia.filter(a => a.status === 'pending');
    const quien = aprobadas[0]?.aprobada_por_nombre ?? rechazadas[0]?.aprobada_por_nombre ?? '';

    if (aprobadas.length === delDia.length) {
      return { tipo: 'aprobada' as const, texto: `Aprobada por ${quien}`, color: '#4CAF50' };
    }
    if (aprobadas.length === 0 && pendientes.length === 0 && rechazadas.length === 0) {
      // Todas auto-aprobadas: este sector no requiere aprobación de supervisor
      return { tipo: 'sin_dato' as const, texto: 'Este sector no requiere aprobación', color: '#78909C' };
    }
    if (aprobadas.length > 0) {
      return {
        tipo: 'parcial' as const,
        texto: `Parcialmente aprobada por ${quien} — ${aprobadas.length} de ${delDia.length}`,
        color: '#FFA726',
      };
    }
    return {
      tipo: 'no_aprobada' as const,
      texto: rechazadas.length > 0
        ? `Rechazada por ${quien || 'el supervisor'}`
        : `Sin aprobar — ${pendientes.length} pendiente${pendientes.length > 1 ? 's' : ''}`,
      color: '#EF5350',
    };
  })();

  const cambiarDia = (delta: number) => {
    const [y, m, d] = diaEstado.split('-').map(Number);
    const nueva = new Date(Date.UTC(y, m - 1, d + delta));
    setDiaEstado(nueva.toISOString().slice(0, 10));
  };

  // Total del período por empleado — cuenta horas + cosecha + cajas + cajones + importe, no solo horas.
  // Mismo criterio que exportExcel.ts para que el total coincida con el del Excel.
  const computeEmployeeTotal = (empMap: Record<string, any>) => {
    let horas = 0, kg = 0, importe = 0, cajas = 0, cajones = 0;
    // Tipos de carga nuevos: los numéricos se suman, camión/estiba se cuentan como días
    let km = 0, ha = 0, st = 0, bol = 0, et = 0, diasCC = 0, diasME = 0;
    const parseHorasSegment = (seg: string): number => {
      const s = seg.startsWith('H ') ? seg.slice(2) : seg;
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    };
    for (const rec of Object.values(empMap)) {
      const workValue: string = rec.work_value != null ? String(rec.work_value) : "";
      if (workValue.includes('|')) {
        const segs = workValue.split('|');
        horas += parseHorasSegment(segs[0]);
        for (const seg of segs.slice(1)) {
          if (seg.startsWith('C:')) {
            const v = parseFloat(seg.slice(2).replace(',', '.'));
            if (!isNaN(v)) kg += v;
          } else if (seg.startsWith('AB:')) {
            const v = parseFloat(seg.slice(3).replace(',', '.'));
            if (!isNaN(v)) importe += v;
          } else if (seg.startsWith('Cajas ') || seg.startsWith('Cajones ')) {
            const cajasM = seg.match(/Cajas ([0-9]+(?:[.,][0-9]+)?)/);
            const cajonesM = seg.match(/Cajones ([0-9]+(?:[.,][0-9]+)?)/);
            if (cajasM) { const v = parseFloat(cajasM[1].replace(',', '.')); if (!isNaN(v)) cajas += v; }
            if (cajonesM) { const v = parseFloat(cajonesM[1].replace(',', '.')); if (!isNaN(v)) cajones += v; }
          }
        }
      } else if (workValue.startsWith('$')) {
        const v = parseFloat(workValue.slice(1).replace(',', '.'));
        if (!isNaN(v)) importe += v;
      } else if (workValue.startsWith('H ')) {
        horas += parseHorasSegment(workValue);
      } else {
        const num = parseFloat(workValue);
        if (!isNaN(num)) horas += num;
      }
      // Tipos nuevos: vienen en columnas propias, no en el texto compuesto.
      km += Number(rec.km_viajes) || 0;
      ha += Number(rec.has_fumigadas) || 0;
      st += Number(rec.siembra_trilla) || 0;
      bol += Number(rec.bolseros) || 0;
      et += Number(rec.etiquetado) || 0;
      if (rec.carga_camion_kg50 || rec.carga_camion_kg25 || rec.carga_camion_otro) diasCC++;
      if (rec.movimiento_estiba_kg50 || rec.movimiento_estiba_kg25 || rec.movimiento_estiba_otro) diasME++;
    }
    const partes: string[] = [];
    if (horas > 0) partes.push(`${horas}H`);
    if (kg > 0) partes.push(`C:${kg}`);
    if (cajas > 0 || cajones > 0) {
      partes.push([cajas > 0 ? `Cajas ${cajas}` : '', cajones > 0 ? `Cajones ${cajones}` : ''].filter(Boolean).join(' '));
    }
    if (importe > 0) partes.push(`$${importe.toLocaleString('es')}`);
    if (km > 0) partes.push(`Km ${km}`);
    if (ha > 0) partes.push(`Ha ${ha}`);
    if (st > 0) partes.push(`S/T ${st}`);
    if (bol > 0) partes.push(`Bolseros ${bol}`);
    if (et > 0) partes.push(`Etiquetado ${et}`);
    if (diasCC > 0) partes.push(`Carga Camión ${diasCC}d`);
    if (diasME > 0) partes.push(`Mov. Estiba ${diasME}d`);
    return partes.length > 0 ? partes.join(' | ') : '—';
  };

  // ── Export handler: fetches real attendances then generates Excel ──────────
  // Período 21→20: e.g. Marzo 2026 = 2026-02-21 to 2026-03-20
  const handleExport = async () => {
    if (exporting || !window.electronAPI?.exportExcel) return;
    setExporting(true);
    try {
      // 1. Período 21→20
      const { startDate, endDate } = computePeriodRange(periodMonth, periodYear);

      const adminToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";

      // 2. Fetch asistencias del período
      let attendances: any[] = [];
      if (window.electronAPI?.getAttendances) {
        console.log(`[Export] Consultando asistencias: ${sector.apiId} ${startDate} → ${endDate}`);
        attendances = await window.electronAPI.getAttendances(sector.apiId, startDate, endDate, adminToken);
        console.log(`[Export] Asistencias recibidas: ${attendances.length}`);
      }

      // 3. Fetch ausencias del mismo período desde /api/absences
      let absences: any[] = [];
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (adminToken) headers['X-Admin-Token'] = adminToken;
        const absUrl = `https://staffaxis-new-version-production.up.railway.app/api/admin/absences?sector_id=${encodeURIComponent(sector.apiId)}&start_date=${startDate}&end_date=${endDate}`;
        const absRes = await fetch(absUrl, { headers });
        if (absRes.ok) {
          const absData = await absRes.json();
          absences = absData.absences ?? [];
          console.log(`[Export] Ausencias del período: ${absences.length}`);
        }
      } catch (absErr) {
        console.warn('[Export] No se pudieron cargar ausencias:', absErr);
      }

      // 3b. Fetch traslados del período
      let transfers: any[] = [];
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (adminToken) headers['X-Admin-Token'] = adminToken;
        const trUrl = `https://staffaxis-new-version-production.up.railway.app/api/admin/transfers?sector_id=${encodeURIComponent(sector.apiId)}&start_date=${startDate}&end_date=${endDate}`;
        const trRes = await fetch(trUrl, { headers });
        if (trRes.ok) {
          const trData = await trRes.json();
          transfers = trData.transfers ?? [];
          console.log(`[Export] Traslados del período: ${transfers.length}`);
        }
      } catch (trErr) {
        console.warn('[Export] No se pudieron cargar traslados:', trErr);
      }

      console.log(`[Export] Datos para excel: ${employees.length} empleados, ${attendances.length} asistencias, ${absences.length} ausencias, ${transfers.length} traslados`);

      // 4. Generar Excel con asistencias + ausencias + traslados
      const result = await window.electronAPI.exportExcel({
        sectorName: sector.name,
        sectorId: sector.apiId,
        encargado: sector.encargado,
        employees: employees,
        attendances: attendances,
        absences: absences,
        transfers: transfers,
        periodMonth,
        periodYear,
      });


      if (result.success && result.base64) {
        // Convert base64 to Blob
        const byteCharacters = atob(result.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const excelBlob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        // Trigger manual download in browser
        const url = window.URL.createObjectURL(excelBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', result.fileName || 'asistencia.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        onExport();
        console.log('[Export] Archivo descargado visualmente:', result.fileName);
      } else {
        if (result.error === 'Usuario canceló el guardado') {
          console.log('[Export] Cancelado por el usuario.');
        } else {
          console.error('[Export] Error:', result.error);
        }
      }
    } catch (err) {
      console.error('[Export] IPC error:', err);
    } finally {
      setExporting(false);
    }
  };

  // ── Ubicación: misma lógica que el pin de "Solicitudes de Autorización" —
  // abre Google Maps con la ubicación de la tarja más reciente del período que
  // haya llegado con coordenadas (la app las manda desde v3.4.2+, las viejas no).
  const handleShowLocation = async () => {
    if (locatingTarja || !window.electronAPI?.getAttendances) return;
    setLocatingTarja(true);
    try {
      const { startDate, endDate } = computePeriodRange(periodMonth, periodYear);
      const adminToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
      const attendances = await window.electronAPI.getAttendances(sector.apiId, startDate, endDate, adminToken);
      const conUbicacion = (attendances as any[])
        .filter(a => a.latitude != null && a.longitude != null)
        .sort((a, b) => new Date(b.submitted_at ?? b.date).getTime() - new Date(a.submitted_at ?? a.date).getTime());

      if (conUbicacion.length === 0) {
        alert("Ninguna tarja de este período trajo ubicación (o son de una versión de la app anterior al GPS).");
        return;
      }
      const ultima = conUbicacion[0];
      window.open(`https://www.google.com/maps?q=${ultima.latitude},${ultima.longitude}`, "_blank");
    } catch (err) {
      console.error('[Ubicacion] Error:', err);
      alert("Error de conexión al buscar la ubicación.");
    } finally {
      setLocatingTarja(false);
    }
  };

  // useEffect: carga empleados y ausencias del día
  useEffect(() => {
    setEmpLoading(true);
    setEmployees([]);
    setAbsentEmployeeIds(new Set());
    
    if (window.electronAPI?.getEmployees) {
      const rawTok = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
      const tok = rawTok === "undefined" ? "" : rawTok;
      window.electronAPI.getEmployees(sector.apiId, tok)
        .then((empData: any) => {
          console.log('Cargando datos del sector:', sector.apiId, 'empleados:', empData?.length);
          setEmployees(empData);
        })
        .catch((err: unknown) => console.error('[FloatingModal] fetch failed:', err))
        .finally(() => setEmpLoading(false));
    } else {
      setEmpLoading(false);
    }

    // Fetch ausencias del día para cruzar con empleados
    const fetchAbsences = async () => {
      setAbsenceLoading(true);
      try {
        const rawToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
        const token = rawToken === "undefined" ? "" : rawToken;
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["X-Admin-Token"] = token;

        const url = `https://staffaxis-new-version-production.up.railway.app/api/admin/absences?sector_id=${encodeURIComponent(sector.apiId)}&start_date=${todayStr}&end_date=${todayStr}`;
        const res = await fetch(url, { headers });
        if (res.ok) {
          const data = await res.json();
          const absences: any[] = data.absences ?? [];
          const ids = new Set<string>(absences.map((a: any) => a.employee_id as string));
          setAbsentEmployeeIds(ids);
          console.log(`[Ausencias] ${ids.size} ausente(s) en ${sector.apiId} para ${todayStr}`);
        }
      } catch (err) {
        console.error('[Ausencias] fetch error:', err);
      } finally {
        setAbsenceLoading(false);
      }
    };
    fetchAbsences();
  }, [sector.apiId, todayStr]);

  return (
    <>
    <div
      className="rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: "#2A2A3E",
        border: "1.5px solid rgba(255,255,255,0.1)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)",
        width: "min(1140px, 94vw)",
        maxHeight: "90vh",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ height: 4, background: "linear-gradient(90deg, #9C27B0, #26C6DA)", flexShrink: 0 }} />
      {/* overflow auto (no hidden): en pantallas bajas o con escalado de Windows al
          125/150% el contenido no entra en el 90vh y antes se recortaba sin manera de
          llegar a los botones de abajo. */}
      <div className="p-7 flex flex-col" style={{ minHeight: 0, overflow: "auto" }}>
        <div className="flex items-start justify-between mb-5" style={{ flexShrink: 0 }}>
          <div>
            <h3 className="text-white" style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.01em" }}>{sector.name}</h3>
            <div className="flex items-center gap-2 mt-2.5">
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: isMissing ? "#FF5252" : "#4CAF50" }} />
              <span style={{ fontSize: 12, color: isMissing ? "#FF5252" : "#4CAF50", fontWeight: 700 }}>
                {isMissing ? "Faltante" : "Enviado"}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginLeft: 6 }}>
                {sector.employees} empleados
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && onDeleteSector && (
              <button
                onClick={() => {
                  setShowConfirmDelete({
                    type: 'sector',
                    id: sector.apiId,
                    name: sector.name,
                    onConfirm: async () => {
                      if (onDeleteSector) {
                        const ok = await onDeleteSector(sector.apiId);
                        if (ok) onClose();
                      }
                    }
                  });
                }}
                className="flex items-center justify-center rounded-xl transition-all hover:bg-red-500/20 active:scale-95"
                style={{ width: 36, height: 36, background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.2)", cursor: "pointer" }}
                title="Eliminar Sector"
              >
                <Trash2 size={16} color="#FF5252" />
              </button>
            )}
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/10"
              style={{ width: 34, height: 34, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", flexShrink: 0 }}
            >
              <X size={15} color="rgba(255,255,255,0.6)" />
            </button>
          </div>
        </div>

        {/* Estado de aprobación de la tarja del día, con navegación día a día */}
        <div
          className="rounded-xl px-3 py-2 mb-2 flex items-center gap-3"
          style={{
            flexShrink: 0,
            background: `${estadoTarjaDia.color}22`,
            border: `1px solid ${estadoTarjaDia.color}66`,
          }}
        >
          <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
            <button
              onClick={() => cambiarDia(-1)}
              title="Día anterior"
              className="rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ width: 26, height: 26, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "#fff", fontSize: 14 }}
            >‹</button>
            <input
              type="date"
              value={diaEstado}
              onChange={e => e.target.value && setDiaEstado(e.target.value)}
              className="rounded-lg px-2"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", fontSize: 11, height: 26, colorScheme: "dark", cursor: "pointer" }}
            />
            <button
              onClick={() => cambiarDia(1)}
              title="Día siguiente"
              className="rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
              style={{ width: 26, height: 26, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", color: "#fff", fontSize: 14 }}
            >›</button>
          </div>
          <div className="rounded-full" style={{ width: 9, height: 9, background: estadoTarjaDia.color, flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: estadoTarjaDia.color, letterSpacing: "0.01em" }}>
            {estadoTarjaDia.texto}
          </span>
        </div>

        {/* Stats counters — en una linea: el alto que sobra va a la tabla */}
        <div className="grid grid-cols-3 gap-2 mb-3" style={{ flexShrink: 0 }}>
          {[
            { l: "Registrados", v: empLoading ? "—" : employees.length.toLocaleString() },
            { l: "Activos", v: empLoading ? "—" : employees.filter((e: Employee) => e.is_active).length.toLocaleString() },
            { l: "Asistencias", v: previewLoading ? "—" : previewAttendances.length.toLocaleString() },
          ].map((s) => (
            <div key={s.l} className="rounded-xl px-3 py-2 flex items-baseline gap-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-white" style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.02em" }}>{s.v}</span>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.09em", textTransform: "uppercase" }}>{s.l}</span>
            </div>
          ))}
        </div>

        {/* Vista Previa — grilla de asistencias día x empleado */}
        <div className="flex flex-col" style={{ flex: 1, minHeight: 0 }}>
          <div className="flex items-center justify-between mb-3" style={{ flexShrink: 0 }}>
            <p className="text-white/40 font-semibold uppercase tracking-wider" style={{ fontSize: 10 }}>Empleados del Sector</p>
            {absenceLoading && (
              <div className="flex items-center gap-1.5">
                <div className="rounded-full" style={{ width: 10, height: 10, border: "1.5px solid rgba(255,82,82,0.2)", borderTop: "1.5px solid #FF5252", animation: "spin 0.8s linear infinite" }} />
                <span style={{ fontSize: 9, color: "rgba(255,82,82,0.6)", fontWeight: 600, letterSpacing: "0.05em" }}>VERIFICANDO AUSENCIAS</span>
              </div>
            )}
            {!absenceLoading && absentEmployeeIds.size > 0 && (
              <span style={{ fontSize: 9, fontWeight: 700, color: "#FF5252", letterSpacing: "0.04em", background: "rgba(255,82,82,0.1)", padding: "2px 8px", borderRadius: 999, border: "1px solid rgba(255,82,82,0.3)" }}>
                {absentEmployeeIds.size} AUSENTE{absentEmployeeIds.size > 1 ? "S" : ""}
              </span>
            )}
          </div>

          {/* Buscador + alta de empleado en la misma fila */}
          <div className="mb-2 flex items-stretch gap-2" style={{ flexShrink: 0 }}>
            <div className="px-3 py-1.5 rounded-xl flex items-center gap-2 flex-1" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Search size={12} color="rgba(255,255,255,0.4)" />
              <input
                placeholder="Buscar empleado..."
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                className="bg-transparent outline-none w-full text-white placeholder-white/30"
                style={{ fontSize: 12 }}
              />
            </div>
            {isAdmin && (
              <button
                onClick={onCreateEmployee}
                title="Agregar empleado a este sector"
                className="flex items-center gap-1.5 px-3 rounded-xl transition-all hover:bg-white/10 flex-shrink-0"
                style={{ background: "rgba(156,39,176,0.15)", border: "1px dashed rgba(156,39,176,0.4)", cursor: "pointer", color: "#C86FE8", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap" }}
              >
                + Agregar empleado
              </button>
            )}
          </div>

          {empLoading ? (
            <div className="flex items-center gap-3 py-3">
              <div className="rounded-full flex-shrink-0" style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #9C27B0", animation: "spin 0.8s linear infinite" }} />
              <span className="text-white/30" style={{ fontSize: 12 }}>Cargando empleados…</span>
            </div>
          ) : employees.length === 0 ? (
            <div className="rounded-xl px-4 py-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-white/25" style={{ fontSize: 12 }}>Sin empleados en este sector</p>
            </div>
          ) : (
            <div
              className="sa-table-scroll rounded-xl"
              // minHeight: sin un piso, "flex: 1" con "minHeight: 0" deja que la tabla se
              // achique hasta cero cuando falta alto — se veia el encabezado y ninguna fila.
              style={{ flex: 1, minHeight: 220, overflow: "auto", border: "1px solid rgba(255,255,255,0.08)", background: "#26263A" }}
            >
              <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "max-content", minWidth: "100%" }}>
                <thead>
                  <tr>
                    <th style={{ position: "sticky", left: 0, top: 0, zIndex: 3, width: 32, height: 32, background: "#1F1F30", borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.size > 0 && employees.filter(e => e.is_active).every(e => selectedRows.has(e.id))}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedRows(new Set(employees.filter(emp => emp.is_active).map(emp => emp.id)));
                          else setSelectedRows(new Set());
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    </th>
                    <th style={{ position: "sticky", left: 32, top: 0, zIndex: 3, width: 170, height: 32, background: "#1F1F30", borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "0 10px", textAlign: "left" }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.06em" }}>EMPLEADO</span>
                    </th>
                    <th style={{ position: "sticky", left: 202, top: 0, zIndex: 3, width: 110, height: 32, background: "#1F1F30", borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "0 10px", textAlign: "left" }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.06em" }}>DNI</span>
                    </th>
                    <th style={{ position: "sticky", left: 312, top: 0, zIndex: 3, width: 118, height: 32, background: "#1F1F30", borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "0 10px", textAlign: "left" }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.06em" }}>ESTADO</span>
                    </th>
                    <th style={{ position: "sticky", left: 430, top: 0, zIndex: 3, width: 140, height: 32, background: "#1F1F30", borderBottom: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.15)", padding: "0 10px", textAlign: "left" }}>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.06em" }}>TOTAL</span>
                    </th>
                    {previewDays.map((day) => (
                      <th key={day} style={{ position: "sticky", top: 0, zIndex: 2, width: 52, height: 32, background: "#1F1F30", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: "0 2px", textAlign: "center" }}>
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>{dayLabel(day)}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {employees
                    .filter(emp => emp.is_active && `${emp.first_name || ''} ${emp.last_name || ''} ${emp.dni || ''}`.toLowerCase().includes(localSearch.toLowerCase()))
                    // Orden por apellido, igual que en el Excel exportado
                    .slice()
                    .sort((a, b) => {
                      const key = (e: Employee) => `${e.last_name || ''} ${e.first_name || ''}`.trim().toLowerCase();
                      return key(a).localeCompare(key(b), 'es');
                    })
                    .map((emp, idx) => {
                      const isAbsent = absentEmployeeIds.has(emp.id);
                      const rowBg = idx % 2 === 0 ? "#26263A" : "#2B2B40";
                      const empMap = previewMap[emp.id] || {};
                      const isSelected = selectedRows.has(emp.id);
                      return (
                        <tr key={emp.id}>
                          <td style={{ position: "sticky", left: 0, zIndex: 1, width: 32, background: rowBg, borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                setSelectedRows(prev => {
                                  const next = new Set(prev);
                                  if (e.target.checked) next.add(emp.id); else next.delete(emp.id);
                                  return next;
                                });
                              }}
                              style={{ cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ position: "sticky", left: 32, zIndex: 1, width: 170, background: rowBg, borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 10px" }}>
                            <div className="flex items-center gap-2">
                              <div
                                className="flex items-center justify-center rounded-full flex-shrink-0"
                                style={{ width: 24, height: 24, background: isAbsent ? "rgba(255,82,82,0.2)" : "rgba(156,39,176,0.18)", color: isAbsent ? "#FF5252" : "#C86FE8", fontSize: 10, fontWeight: 700 }}
                              >
                                {(emp.last_name || emp.first_name || '?').charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, color: isAbsent ? "#ffaaaa" : "white", whiteSpace: "nowrap" }}>
                                {`${emp.last_name || ''} ${emp.first_name || ''}`.trim()}
                              </span>
                            </div>
                          </td>
                          <td style={{ position: "sticky", left: 202, zIndex: 1, width: 110, background: rowBg, borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 10px" }}>
                            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{emp.dni ? `DNI: ${emp.dni}` : "Sin DNI"}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                              <div style={{
                                width: 5, height: 5, borderRadius: "50%",
                                background: emp.tiene_foto_frente && emp.tiene_foto_dorso ? '#4CAF50' : emp.tiene_foto_frente || emp.tiene_foto_dorso ? '#FF9800' : '#EF5350',
                                flexShrink: 0
                              }} />
                              <span style={{ fontSize: 8, color: emp.tiene_foto_frente && emp.tiene_foto_dorso ? '#4CAF50' : emp.tiene_foto_frente || emp.tiene_foto_dorso ? '#FF9800' : '#EF5350', fontWeight: 600 }}>
                                {emp.tiene_foto_frente && emp.tiene_foto_dorso ? 'DNI completo' : emp.tiene_foto_frente || emp.tiene_foto_dorso ? 'DNI parcial' : 'Sin foto DNI'}
                              </span>
                            </div>
                          </td>
                          <td style={{ position: "sticky", left: 312, zIndex: 1, width: 118, background: rowBg, borderRight: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 8px" }}>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isAbsent ? (
                                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,82,82,0.25)", color: "#FF5252" }}>Ausente</span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-full" style={{ fontSize: 9, fontWeight: 600, background: "rgba(76,175,80,0.15)", color: "#4CAF50" }}>Activo</span>
                              )}
                              {(emp.tiene_foto_frente || emp.tiene_foto_dorso) && (
                                <button
                                  onClick={() => openViewFoto(emp)}
                                  title="Ver fotos DNI"
                                  className="p-1 rounded-lg transition-colors"
                                  style={{ cursor: "pointer", color: "#26C6DA", background: "rgba(38,198,218,0.1)", border: "1px solid rgba(38,198,218,0.25)" }}
                                >
                                  <Eye size={11} />
                                </button>
                              )}
                              {isAdmin && (
                                <button
                                  onClick={() => openEditDialog(emp)}
                                  title="Editar empleado"
                                  className="p-1 rounded-lg transition-colors"
                                  style={{ cursor: "pointer", color: "#C86FE8", background: "rgba(156,39,176,0.12)", border: "1px solid rgba(156,39,176,0.25)" }}
                                >
                                  <UserCog size={11} />
                                </button>
                              )}
                              {isAdmin && onDeleteEmployee && (
                                <button
                                  onClick={() => {
                                    setShowConfirmDelete({
                                      type: 'employee',
                                      id: emp.id,
                                      name: `${emp.first_name} ${emp.last_name}`,
                                      onConfirm: async () => {
                                        if (onDeleteEmployee) {
                                          const ok = await onDeleteEmployee(emp.id);
                                          if (ok) setEmployees(prev => prev.filter(e => e.id !== emp.id));
                                        }
                                      }
                                    });
                                  }}
                                  className="p-1 rounded-lg hover:bg-red-500/20 transition-colors"
                                  style={{ cursor: "pointer", color: "#FF5252" }}
                                >
                                  <Trash2 size={11} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td style={{ position: "sticky", left: 430, zIndex: 1, width: 140, background: rowBg, borderRight: "1px solid rgba(255,255,255,0.15)", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "8px 10px" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "white", whiteSpace: "nowrap" }}>
                              {previewLoading ? "—" : computeEmployeeTotal(empMap)}
                            </span>
                          </td>
                          {previewDays.map((day) => {
                            const cell = renderDayCell(empMap[day]);
                            return (
                              <td key={day} style={{ width: 52, background: rowBg, borderBottom: "1px solid rgba(255,255,255,0.05)", padding: 3, textAlign: "center" }}>
                                <div style={{ background: cell.bg, color: cell.color, borderRadius: 6, padding: "4px 0", fontSize: 10, fontWeight: 700 }}>
                                  {previewLoading ? "" : cell.text}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 12, marginTop: 12, flexShrink: 0 }} />

        <div className="flex flex-col gap-2.5 relative" style={{ flexShrink: 0 }}>

          {/* Tooltip implementation */}
          {isMissing && showTooltip && (
            <div
              className="absolute z-50 flex items-start gap-2.5 px-4 py-3 rounded-2xl"
              style={{
                top: -55,
                left: 0,
                right: 0,
                background: "#2A2A3E",
                border: "1.5px solid rgba(255,82,82,0.45)",
                boxShadow: "0 6px 24px rgba(255,82,82,0.12), 0 2px 10px rgba(0,0,0,0.4)",
              }}
            >
              <AlertTriangle size={14} color="#FF5252" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>
                No se puede exportar debido a <span style={{ color: "#FF5252", fontWeight: 700 }}>tarjeta faltante</span>
              </p>
              <div style={{ position: "absolute", bottom: -8, left: 32, width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "8px solid rgba(255,82,82,0.45)" }} />
            </div>
          )}

          {/* Periodo de exportacion (21 -> 20) */}
          <div className="flex items-center gap-2">
            <span className="text-white/40 font-semibold uppercase tracking-wider flex-shrink-0" style={{ fontSize: 10 }}>Período</span>
            <select
              value={periodMonth}
              onChange={(e) => setPeriodMonth(Number(e.target.value))}
              className="flex-1 rounded-xl px-3 py-1.5 text-white font-semibold appearance-none"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, cursor: "pointer", outline: "none" }}
            >
              {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
                .map((m, i, arr) => {
                  const prevMonth = arr[i === 0 ? 11 : i - 1];
                  return (
                    <option key={m} value={i + 1} style={{ background: "#2A2A3E" }}>
                      21 {prevMonth.substring(0,3)} - 20 {m.substring(0,3)} ({m})
                    </option>
                  );
                })}
            </select>
            <select
              value={periodYear}
              onChange={(e) => setPeriodYear(Number(e.target.value))}
              className="rounded-xl px-3 py-1.5 text-white font-semibold appearance-none flex-shrink-0"
              style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 12, cursor: "pointer", outline: "none", width: 84 }}
            >
              {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y} style={{ background: "#2A2A3E" }}>{y}</option>)}
            </select>
            <span className="flex-shrink-0" style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
              21/{String(periodMonth === 1 ? 12 : periodMonth - 1).padStart(2, '0')} → 20/{String(periodMonth).padStart(2, '0')}
            </span>
          </div>

          {/* Acciones lado a lado: exportar es la principal, por eso mas ancha */}
          <div className="flex gap-2">
            <button
              onClick={handleShowLocation}
              disabled={locatingTarja}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${!locatingTarja ? 'hover:opacity-90 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'}`}
              style={{ flex: 1, background: "rgba(38,198,218,0.15)", border: "1px solid rgba(38,198,218,0.4)", cursor: locatingTarja ? "not-allowed" : "pointer" }}
            >
              {locatingTarja
                ? <div className="rounded-full" style={{ width: 14, height: 14, border: "2px solid rgba(38,198,218,0.3)", borderTop: "2px solid #26C6DA", animation: "spin 0.8s linear infinite" }} />
                : <MapPin size={15} color="#26C6DA" />}
              <span style={{ color: "#26C6DA", fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap" }}>
                {locatingTarja ? "Buscando..." : "Mostrar ubicación"}
              </span>
            </button>

            <div
              onMouseEnter={() => isMissing && setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              style={{ flex: 1.7 }}
            >
              <button
                onClick={handleExport}
                // Eliminamos booleanos de disabled para probar el modal con click siempre
                disabled={exporting || empLoading}
                className={`flex items-center justify-center gap-2.5 w-full py-2.5 rounded-xl transition-all ${!exporting ? 'hover:opacity-90 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'}`}
                style={{ background: "linear-gradient(135deg, #4CAF50, #2E7D32)", border: "none", cursor: exporting ? "not-allowed" : "pointer", boxShadow: "0 4px 16px rgba(76,175,80,0.28)" }}
              >
                {exporting
                  ? <><div className="rounded-full" style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #fff", animation: "spin 0.8s linear infinite" }} /><span className="text-white" style={{ fontSize: 13, fontWeight: 700 }}>Exportando...</span></>
                  : <><FileSpreadsheet size={16} color="#fff" /><span className="text-white" style={{ fontSize: 13, fontWeight: 700 }}>Exportar en Excel</span></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* ── Dialog editar empleado (con fotos) ─────────────────────────────── */}
    {editDialogEmp && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ background: '#1a1225', border: '1px solid rgba(156,39,176,0.35)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Editar Empleado</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{editDialogEmp.first_name} {editDialogEmp.last_name}</p>
            </div>
            <button onClick={() => setEditDialogEmp(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>

          {/* Campos del empleado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Nombre</p>
              <input
                value={editFirst}
                onChange={e => setEditFirst(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 12px', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Apellido</p>
              <input
                value={editLast}
                onChange={e => setEditLast(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 12px', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>DNI</p>
              <input
                value={editDni}
                onChange={e => setEditDni(e.target.value)}
                style={{ width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '9px 12px', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Divisor */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '0 0 16px' }} />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Fotos del DNI</p>

          {/* Frente y Dorso */}
          {(['frente', 'dorso'] as const).map((lado) => {
            const tieneKey = lado === 'frente' ? 'tiene_foto_frente' : 'tiene_foto_dorso';
            const tiene = editDialogEmp[tieneKey];
            const imgSrc = fotoData[lado];
            const isLoading = fotoLoading[lado];
            const isUploading = fotoUploading[lado];
            return (
              <div key={lado} style={{ marginBottom: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14, border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {lado === 'frente' ? 'Frente' : 'Dorso'} del DNI
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: tiene ? '#4CAF50' : '#EF5350' }} />
                    <span style={{ fontSize: 9, color: tiene ? '#4CAF50' : '#EF5350', fontWeight: 600 }}>{tiene ? 'Con foto' : 'Sin foto'}</span>
                  </div>
                </div>
                {isLoading ? (
                  <div style={{ width: '100%', height: 100, background: 'rgba(255,255,255,0.04)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 20, height: 20, border: '2px solid rgba(200,111,232,0.3)', borderTop: '2px solid #C86FE8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  </div>
                ) : imgSrc ? (
                  <img src={imgSrc} alt={`DNI ${lado}`} style={{ width: '100%', height: 'auto', maxHeight: 140, objectFit: 'contain', borderRadius: 8, background: '#000', display: 'block', marginBottom: 10 }} />
                ) : (
                  <div style={{ width: '100%', height: 70, background: 'rgba(255,255,255,0.02)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: '1px dashed rgba(255,255,255,0.1)', marginBottom: 10 }}>
                    <ImageOff size={18} color="rgba(255,255,255,0.15)" />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Sin foto</span>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => handleSubirFoto(lado)}
                    disabled={isUploading}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(200,111,232,0.35)', background: 'rgba(156,39,176,0.15)', color: '#C86FE8', fontSize: 10, fontWeight: 700, cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1 }}
                  >
                    {isUploading ? <div style={{ width: 10, height: 10, border: '2px solid rgba(200,111,232,0.3)', borderTop: '2px solid #C86FE8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <Upload size={10} />}
                    {tiene ? 'Cambiar' : 'Subir foto'}
                  </button>
                  {tiene && (
                    <button
                      onClick={() => handleEliminarFoto(lado)}
                      disabled={isUploading}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 10px', borderRadius: 8, border: '1px solid rgba(255,82,82,0.3)', background: 'rgba(255,82,82,0.1)', color: '#FF5252', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                    >
                      <Trash2 size={10} />
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Botones guardar/cancelar */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => setEditDialogEmp(null)}
              style={{ flex: 1, padding: '10px 0', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveEmployee}
              disabled={editSaving}
              style={{ flex: 2, padding: '10px 0', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #9C27B0, #26C6DA)', color: 'white', fontSize: 13, fontWeight: 700, cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.7 : 1 }}
            >
              {editSaving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Dialog ver fotos (solo lectura) ─────────────────────────────────── */}
    {viewFotoEmp && (
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setViewFotoEmp(null); }}
      >
        <div style={{ background: '#1a1225', border: '1px solid rgba(38,198,218,0.3)', borderRadius: 20, padding: 24, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Fotos del DNI</p>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{viewFotoEmp.first_name} {viewFotoEmp.last_name}</p>
            </div>
            <button onClick={() => setViewFotoEmp(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '6px 10px', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 14 }}>✕</button>
          </div>
          {viewFotoLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160 }}>
              <div style={{ width: 28, height: 28, border: '2px solid rgba(38,198,218,0.3)', borderTop: '2px solid #26C6DA', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(['frente', 'dorso'] as const).map(lado => {
                const src = viewFotoData[lado];
                if (!src) return null;
                return (
                  <div key={lado}>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{lado === 'frente' ? 'Frente' : 'Dorso'} del DNI</p>
                    <img src={src} alt={`DNI ${lado}`} style={{ width: '100%', borderRadius: 12, objectFit: 'contain', background: '#000', display: 'block' }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    )}
    </>
  );
}

// ─── Panel de Informes ────────────────────────────────────────────────────────

const REPORT_CATEGORIES = [
  {
    id: 'hortalizas',
    name: 'Hortalizas',
    color: '#4CAF50',
    gradient: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
    shadow: 'rgba(76,175,80,0.25)',
    icon: 'LeafyGreen' as const,
    sectors: ['ZANJA', 'CAÑADAS', 'CARLETTO', 'PESCADO', 'INVERNADERO EMB', 'PICHANAL TUMA', 'RAIGON'],
  },
  {
    id: 'granos',
    name: 'Granos',
    color: '#FF9800',
    gradient: 'linear-gradient(135deg, #FF9800 0%, #E65100 100%)',
    shadow: 'rgba(255,152,0,0.25)',
    icon: 'Wheat' as const,
    sectors: ['RUTA 5', 'MOSCONI', 'CUCHUY', 'LAS VARAS'],
  },
  {
    id: 'banana',
    name: 'Banana',
    color: '#F9A825',
    gradient: 'linear-gradient(135deg, #F9A825 0%, #F57F17 100%)',
    shadow: 'rgba(249,168,37,0.25)',
    icon: 'Banana' as const,
    sectors: ['SOLAZUTY', 'SOLAZUTY EMP', 'AGUADO', 'AGUADO EMP', 'COLONIA', 'COLONIA EMP', 'SAN AGUSTIN'],
  },
  {
    id: 'industrial',
    name: 'Industrial',
    color: '#26C6DA',
    gradient: 'linear-gradient(135deg, #26C6DA 0%, #00838F 100%)',
    shadow: 'rgba(38,198,218,0.25)',
    icon: 'Factory' as const,
    sectors: ['EMPAQUE', 'FABRICA CONSERVAS', 'FABRICA DE VIANDAS', 'PLANTA DE PROCESO', 'PLANTA SILO'],
  },
  {
    id: 'ganaderia',
    name: 'Ganadería',
    color: '#9C27B0',
    gradient: 'linear-gradient(135deg, #9C27B0 0%, #4A148C 100%)',
    shadow: 'rgba(156,39,176,0.25)',
    icon: 'Tractor' as const,
    sectors: ['FEED LOT'],
  },
  {
    id: 'servicios',
    name: 'Servicios',
    color: '#5C6BC0',
    gradient: 'linear-gradient(135deg, #5C6BC0 0%, #283593 100%)',
    shadow: 'rgba(92,107,192,0.25)',
    icon: 'HardHat' as const,
    sectors: ['CONSTRUCCION', 'DRONSA', 'FUMIGACION', 'IMPLESA', 'PICADO', 'TALLER', 'TYLSA', 'VIALSA'],
  },
];

type ReportCategory = typeof REPORT_CATEGORIES[number];

function ReportCategoryCard({ category, onClick }: { category: ReportCategory; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer select-none flex flex-col transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: category.gradient,
        borderRadius: 16,
        padding: 24,
        minHeight: 180,
        boxShadow: `0 8px 24px ${category.shadow}`,
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: "rgba(255,255,255,0.2)", color: "#fff" }}>
          {getIcon(category.icon)}
        </div>
        <div className="px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }}>
          <span className="text-white font-bold" style={{ fontSize: 12 }}>{category.sectors.length} sectores</span>
        </div>
      </div>
      <div className="flex-1" />
      <h3 className="text-white font-bold leading-tight mb-3" style={{ fontSize: 22, letterSpacing: "-0.01em" }}>{category.name}</h3>
      <div className="flex items-center justify-between border-t border-white/20 pt-3">
        <span className="text-white/75 font-semibold" style={{ fontSize: 12 }}>Ver sectores</span>
        <ChevronRight size={16} color="rgba(255,255,255,0.75)" />
      </div>
    </div>
  );
}

function ReportSectorCard({ name, color, gradient, employeeCount, onClick }: {
  name: string; color: string; gradient: string; employeeCount?: number; onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer select-none flex flex-col transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{
        background: "#2A2A3E",
        borderRadius: 14,
        padding: "18px 20px",
        border: `1.5px solid ${color}40`,
        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: gradient }} />
      <div className="flex items-center justify-between mt-1">
        <p className="text-white font-bold" style={{ fontSize: 14, letterSpacing: "0.01em" }}>{name}</p>
        {employeeCount !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 600, color, background: `${color}20`, borderRadius: 20, padding: "2px 8px" }}>
            {employeeCount}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1 mt-3">
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Ver empleados</span>
        <ChevronRight size={12} color="rgba(255,255,255,0.35)" />
      </div>
    </div>
  );
}

// ─── Panel de Solicitudes de Autorización ──────────────────────────────────

const ACCESOS_API_BASE = "https://staffaxis-new-version-production.up.railway.app";

interface AccessRequest {
  id: string;
  full_name: string;
  sector_name: string | null;
  phone_model: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  authorized_by: string | null;
  created_at: string;
  // Una fila puede ser un pedido de encargado (tipo=empleado, sector_name) o de
  // supervisor (tipo=supervisor, sectores_supervisor con toda su lista de sectores).
  tipo: 'empleado' | 'supervisor';
  sectores_supervisor: string[];
}

interface AccessDevice {
  id: string;
  device_id: string;
  encargado_name: string;
  sector_name: string | null;
  phone_model: string | null;
  is_master: boolean;
  approved: boolean;
  revoked: boolean;
  created_at: string;
}

function accesosHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const rawToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
  const token = rawToken === "undefined" ? "" : rawToken;
  if (token) headers["X-Admin-Token"] = token;
  return headers;
}

function accesosAdminEmail(): string {
  try {
    const raw = localStorage.getItem("admin_user");
    if (raw && raw !== "undefined") {
      const u = JSON.parse(raw);
      if (u?.email) return u.email;
      if (u?.username) return u.username;
    }
  } catch { /* noop */ }
  return "admin";
}

function formatFechaHora(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function PanelAccesos({ onPendingCountChange }: { onPendingCountChange: (n: number) => void }) {
  const [tab, setTab] = useState<'pendientes' | 'dispositivos'>('pendientes');
  const [pendientes, setPendientes] = useState<AccessRequest[]>([]);
  const [dispositivos, setDispositivos] = useState<AccessDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const cargar = async () => {
    setLoading(true);
    try {
      const [reqRes, devRes] = await Promise.all([
        fetch(`${ACCESOS_API_BASE}/api/admin/access-requests?status=pending`, { headers: accesosHeaders() }),
        fetch(`${ACCESOS_API_BASE}/api/admin/devices`, { headers: accesosHeaders() }),
      ]);
      const reqData = reqRes.ok ? await reqRes.json() : { requests: [] };
      const devData = devRes.ok ? await devRes.json() : { devices: [] };
      const reqs: AccessRequest[] = reqData.requests ?? [];
      setPendientes(reqs);
      setDispositivos(devData.devices ?? []);
      onPendingCountChange(reqs.length);
    } catch (e) {
      console.error("[Accesos] error al cargar:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const autorizar = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`${ACCESOS_API_BASE}/api/admin/access-requests/${id}/authorize`, {
        method: "POST", headers: accesosHeaders(),
        body: JSON.stringify({ admin_email: accesosAdminEmail() }),
      });
      await cargar();
    } catch (e) {
      console.error("[Accesos] error al autorizar:", e);
    } finally {
      setBusyId(null);
    }
  };

  const rechazar = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`${ACCESOS_API_BASE}/api/admin/access-requests/${id}/reject`, {
        method: "POST", headers: accesosHeaders(),
        body: JSON.stringify({ admin_email: accesosAdminEmail() }),
      });
      await cargar();
    } catch (e) {
      console.error("[Accesos] error al rechazar:", e);
    } finally {
      setBusyId(null);
    }
  };

  const toggleRevocado = async (device: AccessDevice) => {
    setBusyId(device.id);
    try {
      await fetch(`${ACCESOS_API_BASE}/api/admin/devices/${device.id}/${device.revoked ? 'unrevoke' : 'revoke'}`, {
        method: "POST", headers: accesosHeaders(), body: "{}",
      });
      await cargar();
    } catch (e) {
      console.error("[Accesos] error al revocar/restaurar:", e);
    } finally {
      setBusyId(null);
    }
  };

  const abrirMapa = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
  };

  return (
    <div>
      {/* Sub-tabs internas del panel */}
      <div className="flex items-center gap-1 p-1 rounded-xl mb-5" style={{ background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.08)", width: "fit-content" }}>
        <button
          onClick={() => setTab('pendientes')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          style={{
            background: tab === 'pendientes' ? "rgba(76,175,80,0.15)" : "transparent",
            border: tab === 'pendientes' ? "1px solid rgba(76,175,80,0.4)" : "1px solid transparent",
            cursor: "pointer",
          }}
        >
          <ShieldCheck size={13} color={tab === 'pendientes' ? "#81C784" : "rgba(255,255,255,0.4)"} />
          <span style={{ fontSize: 12, fontWeight: 600, color: tab === 'pendientes' ? "#81C784" : "rgba(255,255,255,0.4)" }}>
            Pendientes {pendientes.length > 0 ? `(${pendientes.length})` : ''}
          </span>
        </button>
        <button
          onClick={() => setTab('dispositivos')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
          style={{
            background: tab === 'dispositivos' ? "rgba(38,198,218,0.15)" : "transparent",
            border: tab === 'dispositivos' ? "1px solid rgba(38,198,218,0.4)" : "1px solid transparent",
            cursor: "pointer",
          }}
        >
          <Smartphone size={13} color={tab === 'dispositivos' ? "#80DEEA" : "rgba(255,255,255,0.4)"} />
          <span style={{ fontSize: 12, fontWeight: 600, color: tab === 'dispositivos' ? "#80DEEA" : "rgba(255,255,255,0.4)" }}>Dispositivos</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-8 justify-center">
          <div className="rounded-full" style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.1)", borderTop: "2px solid #4CAF50", animation: "spin 0.8s linear infinite" }} />
          <span className="text-white/40" style={{ fontSize: 13 }}>Cargando…</span>
        </div>
      ) : tab === 'pendientes' ? (
        pendientes.length === 0 ? (
          <div className="rounded-xl px-6 py-10 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <ShieldCheck size={28} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 10px" }} />
            <p className="text-white/30" style={{ fontSize: 13 }}>No hay solicitudes pendientes</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pendientes.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl p-5 flex items-center justify-between"
                style={{ background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{ width: 40, height: 40, background: r.tipo === 'supervisor' ? "rgba(156,39,176,0.18)" : "rgba(76,175,80,0.15)" }}
                  >
                    {r.tipo === 'supervisor'
                      ? <Users size={18} color="#C86FE8" />
                      : <ShieldCheck size={18} color="#81C784" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-bold" style={{ fontSize: 15 }}>{r.full_name}</p>
                      {r.tipo === 'supervisor' && (
                        <span
                          style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", color: "#C86FE8", background: "rgba(156,39,176,0.15)", border: "1px solid rgba(156,39,176,0.35)", borderRadius: 999, padding: "2px 8px" }}
                        >
                          SUPERVISOR
                        </span>
                      )}
                    </div>
                    <p className="text-white/50" style={{ fontSize: 12, marginTop: 2 }}>
                      {r.tipo === 'supervisor'
                        ? <>Sectores: <span className="text-white/80 font-semibold">{r.sectores_supervisor.join(', ') || '(sin sectores asignados)'}</span></>
                        : <>Sector: <span className="text-white/80 font-semibold">{r.sector_name}</span></>}
                      {r.phone_model ? <> · {r.phone_model}</> : null}
                    </p>
                    <p className="text-white/30" style={{ fontSize: 11, marginTop: 2 }}>{formatFechaHora(r.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {r.latitude != null && r.longitude != null && (
                    <button
                      onClick={() => abrirMapa(r.latitude!, r.longitude!)}
                      title="Ver ubicación en Google Maps"
                      className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/10"
                      style={{ width: 38, height: 38, background: "rgba(38,198,218,0.1)", border: "1px solid rgba(38,198,218,0.25)", cursor: "pointer" }}
                    >
                      <MapPin size={16} color="#26C6DA" />
                    </button>
                  )}
                  <button
                    onClick={() => rechazar(r.id)}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-colors hover:bg-red-500/10"
                    style={{ background: "rgba(255,82,82,0.08)", border: "1px solid rgba(255,82,82,0.25)", cursor: busyId === r.id ? "not-allowed" : "pointer", opacity: busyId === r.id ? 0.5 : 1 }}
                  >
                    <X size={14} color="#FF5252" />
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#FF5252" }}>Rechazar</span>
                  </button>
                  <button
                    onClick={() => autorizar(r.id)}
                    disabled={busyId === r.id}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
                    style={{ background: "linear-gradient(135deg, #4CAF50, #2E7D32)", border: "none", cursor: busyId === r.id ? "not-allowed" : "pointer", opacity: busyId === r.id ? 0.5 : 1 }}
                  >
                    <ShieldCheck size={14} color="#fff" />
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Autorizar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : dispositivos.length === 0 ? (
        <div className="rounded-xl px-6 py-10 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <Smartphone size={28} color="rgba(255,255,255,0.2)" style={{ margin: "0 auto 10px" }} />
          <p className="text-white/30" style={{ fontSize: 13 }}>No hay dispositivos registrados todavía</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {dispositivos.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl p-5 flex items-center justify-between"
              style={{
                background: "#2A2A3E",
                border: d.revoked ? "1px solid rgba(255,82,82,0.35)" : "1px solid rgba(255,255,255,0.08)",
                opacity: d.revoked ? 0.75 : 1,
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 40, height: 40, background: d.is_master ? "rgba(255,193,7,0.15)" : "rgba(156,39,176,0.15)" }}>
                  {d.is_master ? <Crown size={18} color="#FFC107" /> : <Smartphone size={18} color="#C86FE8" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold" style={{ fontSize: 15 }}>{d.encargado_name}</p>
                    {d.is_master && (
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,193,7,0.15)", color: "#FFC107" }}>MAESTRO</span>
                    )}
                    {d.revoked && (
                      <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,82,82,0.15)", color: "#FF5252" }}>REVOCADO</span>
                    )}
                  </div>
                  <p className="text-white/50" style={{ fontSize: 12, marginTop: 2 }}>
                    Sector: <span className="text-white/80 font-semibold">{d.sector_name ?? '—'}</span>
                    {d.phone_model ? <> · {d.phone_model}</> : null}
                  </p>
                  <p className="text-white/30" style={{ fontSize: 11, marginTop: 2 }}>Desde {formatFechaHora(d.created_at)}</p>
                </div>
              </div>
              {!d.is_master && (
                <button
                  onClick={() => toggleRevocado(d)}
                  disabled={busyId === d.id}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl transition-colors"
                  style={{
                    background: d.revoked ? "rgba(76,175,80,0.1)" : "rgba(255,82,82,0.08)",
                    border: d.revoked ? "1px solid rgba(76,175,80,0.3)" : "1px solid rgba(255,82,82,0.25)",
                    cursor: busyId === d.id ? "not-allowed" : "pointer",
                    opacity: busyId === d.id ? 0.5 : 1,
                  }}
                >
                  <Ban size={14} color={d.revoked ? "#81C784" : "#FF5252"} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: d.revoked ? "#81C784" : "#FF5252" }}>
                    {d.revoked ? 'Restaurar acceso' : 'Revocar acceso'}
                  </span>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type InformesView =
  | { step: 'categories' }
  | { step: 'sectors'; category: ReportCategory }
  | { step: 'employees'; category: ReportCategory; sectorName: string; apiSector: Sector | null };

function PanelInformes({ apiSectors }: { apiSectors: Sector[] }) {
  const [view, setView] = useState<InformesView>({ step: 'categories' });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState("");

  // Current period (same 21→20 rule as FloatingModal) — default, user can change
  const nowForPeriod = new Date();
  if (nowForPeriod.getDate() >= 21) {
    nowForPeriod.setDate(1);
    nowForPeriod.setMonth(nowForPeriod.getMonth() + 1);
  }
  const [periodMonth, setPeriodMonth] = useState(nowForPeriod.getMonth() + 1);
  const [periodYear, setPeriodYear] = useState(nowForPeriod.getFullYear());

  const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const periodFromMonth = periodMonth === 1 ? 12 : periodMonth - 1;
  const periodFromYear = periodMonth === 1 ? periodYear - 1 : periodYear;

  const handleGeneratePdf = async (category: typeof REPORT_CATEGORIES[number]) => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const fromMonth = periodMonth === 1 ? 12 : periodMonth - 1;
      const fromYear = periodMonth === 1 ? periodYear - 1 : periodYear;
      const startDate = `${fromYear}-${String(fromMonth).padStart(2, '0')}-21`;
      const endDate = `${periodYear}-${String(periodMonth).padStart(2, '0')}-20`;
      const rawToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
      const adminToken = rawToken === "undefined" ? "" : rawToken;

      // Fetch attendances for all sectors in the category in parallel
      // API filters by employee's ASSIGNED sector (e.sector_id). Returns ALL hours of those
      // employees even when they marked at a different sector that day.
      const allRows: { employeeName: string; dni: string; sectorName: string; recordSectorName: string; hours: number | string; date: string }[] = [];
      let totalHours = 0;

      await Promise.all(category.sectors.map(async (sectorName) => {
        const norm = (s: string) => s.toUpperCase().trim();
        const apiSector = apiSectors.find(s => norm(s.name) === norm(sectorName));
        if (!apiSector) return;

        const attendances = await window.electronAPI.getAttendances(apiSector.apiId, startDate, endDate, adminToken);

        for (const att of attendances as any[]) {
          if (att.status === 'Faltante') continue;
          // work_value is the real hours field in Turso (direct hours, not minutes)
          const raw = att.work_value ?? att.minutes_worked ?? att.hours ?? '';
          const str = String(raw).trim();
          if (!str || str === 'null') continue;

          let valForPdf: number | string = str;
          // Las horas llevan prefijo "H " desde la app — se saca antes de parsear
          const numericVal = parseFloat(str.startsWith('H ') ? str.slice(2) : str);
          if (!isNaN(numericVal)) {
            if (numericVal <= 0) continue;
            valForPdf = numericVal;
            totalHours += numericVal;
          }

          const name = `${att.first_name || ''} ${att.last_name || ''}`.trim() || 'Sin nombre';
          const dni = att.dni && att.dni !== 'null' ? att.dni : 'SIN DATOS';
          // assigned_sector_name = último sector asignado (donde el empleado cobra)
          // record_sector_name   = donde se marcaron las horas ese día específico
          const assignedSector = att.assigned_sector_name || sectorName;
          const recordSector = att.record_sector_name || assignedSector;

          allRows.push({ employeeName: name, dni, sectorName: assignedSector, recordSectorName: recordSector, hours: valForPdf, date: att.date || '' });
        }
      }));

      // Sort by employee name, then date (most recent first per employee)
      allRows.sort((a, b) => {
        const n = a.employeeName.localeCompare(b.employeeName, 'es');
        if (n !== 0) return n;
        return b.date.localeCompare(a.date);
      });
      totalHours = Math.round(totalHours * 10) / 10;

      const result = await window.electronAPI.generatePdfReport({ categoryName: category.name, periodMonth, periodYear, rows: allRows, totalHours });

      if (result.success && result.base64) {
        const bytes = new Uint8Array(atob(result.base64).split('').map(c => c.charCodeAt(0)));
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = result.fileName || 'informe.pdf';
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(url);
      } else {
        console.error('[PDF]', result.error);
      }
    } catch (err) {
      console.error('[PDF] error:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const matchSector = (name: string): Sector | null => {
    const norm = (s: string) => s.toUpperCase().trim();
    return apiSectors.find(s => norm(s.name) === norm(name)) ?? null;
  };

  useEffect(() => {
    if (view.step !== 'employees' || !view.apiSector) {
      setEmployees([]);
      return;
    }
    setEmpLoading(true);
    setEmployees([]);
    const rawTok2 = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
    const tok2 = rawTok2 === "undefined" ? "" : rawTok2;
    window.electronAPI?.getEmployees(view.apiSector.apiId, tok2)
      .then((data: any[]) => setEmployees(data))
      .catch((e: unknown) => console.error('[Informes] fetch employees:', e))
      .finally(() => setEmpLoading(false));
  }, [view]);

  const BackBtn = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/10"
      style={{ width: 34, height: 34, background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", flexShrink: 0 }}
    >
      <ChevronLeft size={16} color="rgba(255,255,255,0.7)" />
    </button>
  );

  if (view.step === 'employees') {
    const { category, sectorName, apiSector } = view;
    return (
      <div className="flex flex-col gap-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3">
          <BackBtn onClick={() => { setView({ step: 'sectors', category }); setLocalSearch(""); }} />
          <div className="flex items-center gap-2" style={{ fontSize: 13 }}>
            <span
              className="cursor-pointer transition-colors hover:text-white/70"
              style={{ color: "rgba(255,255,255,0.4)" }}
              onClick={() => setView({ step: 'categories' })}
            >{category.name}</span>
            <ChevronRight size={13} color="rgba(255,255,255,0.25)" />
            <span className="text-white font-bold" style={{ fontSize: 15 }}>{sectorName}</span>
          </div>
        </div>

        <div className="px-4 py-2 rounded-xl flex items-center gap-2" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", width: 300 }}>
          <Search size={14} color="rgba(255,255,255,0.4)" />
          <input 
            placeholder="Buscar empleado..." 
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="bg-transparent outline-none w-full text-white placeholder-white/40"
            style={{ fontSize: 13 }}
          />
        </div>

        {empLoading && (
          <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
            <div className="rounded-full" style={{ width: 36, height: 36, border: "3px solid rgba(255,255,255,0.1)", borderTop: `3px solid ${category.color}`, animation: "spin 0.8s linear infinite" }} />
          </div>
        )}

        {!empLoading && !apiSector && (
          <div className="flex flex-col items-center justify-center gap-2" style={{ minHeight: 200 }}>
            <AlertTriangle size={22} color="rgba(255,255,255,0.2)" />
            <p className="text-white/40" style={{ fontSize: 14 }}>Sector no encontrado en la API</p>
          </div>
        )}

        {!empLoading && apiSector && employees.length === 0 && (
          <div className="flex items-center justify-center" style={{ minHeight: 200 }}>
            <p className="text-white/40" style={{ fontSize: 14 }}>Sin empleados registrados</p>
          </div>
        )}

        {!empLoading && employees.length > 0 && (
          <div className="flex flex-col gap-0 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
            {/* Table header */}
            <div className="grid px-5 py-3" style={{ gridTemplateColumns: "2fr 1fr 1fr", background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <span className="text-white/40 uppercase tracking-wider font-semibold" style={{ fontSize: 10 }}>Empleado</span>
              <span className="text-white/40 uppercase tracking-wider font-semibold" style={{ fontSize: 10 }}>DNI</span>
              <span className="text-white/40 uppercase tracking-wider font-semibold" style={{ fontSize: 10 }}>Código</span>
            </div>
            {/* Rows */}
            {employees.filter(emp => `${emp.first_name || ''} ${emp.last_name || ''} ${emp.dni || ''}`.toLowerCase().includes(localSearch.toLowerCase())).map((emp, i) => (
              <div
                key={emp.id}
                className="grid items-center px-5 py-3 transition-colors hover:bg-white/5"
                style={{ gridTemplateColumns: "2fr 1fr 1fr", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)", borderBottom: i < employees.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center rounded-full flex-shrink-0" style={{ width: 28, height: 28, background: `${category.color}20`, border: `1px solid ${category.color}35` }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: category.color }}>
                      {emp.first_name?.[0]}{emp.last_name?.[0]}
                    </span>
                  </div>
                  <span className="text-white font-semibold" style={{ fontSize: 13 }}>{emp.first_name} {emp.last_name}</span>
                </div>
                <span className="text-white/55" style={{ fontSize: 13 }}>{emp.dni || '—'}</span>
                <span className="text-white/35" style={{ fontSize: 13 }}>{emp.external_code || '—'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view.step === 'sectors') {
    const { category } = view;
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <BackBtn onClick={() => setView({ step: 'categories' })} />
            <div>
              <p className="text-white font-bold" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>{category.name}</p>
              <p className="text-white/40" style={{ fontSize: 12 }}>{category.sectors.length} sectores</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Período</span>
              <select
                value={periodMonth}
                onChange={(e) => setPeriodMonth(Number(e.target.value))}
                disabled={pdfLoading}
                className="bg-transparent text-white outline-none cursor-pointer"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                {MONTHS_ES.map((m, i, arr) => {
                  const prevMonth = arr[i === 0 ? 11 : i - 1];
                  return (
                    <option key={i} value={i + 1} style={{ background: "#1e1e2e" }}>
                      21 {prevMonth.substring(0,3)} - 20 {m.substring(0,3)} ({m})
                    </option>
                  );
                })}
              </select>
              <select
                value={periodYear}
                onChange={(e) => setPeriodYear(Number(e.target.value))}
                disabled={pdfLoading}
                className="bg-transparent text-white outline-none cursor-pointer"
                style={{ fontSize: 12, fontWeight: 600 }}
              >
                {[periodYear - 1, periodYear, periodYear + 1].map((y) => (
                  <option key={y} value={y} style={{ background: "#1e1e2e" }}>{y}</option>
                ))}
              </select>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                21/{String(periodFromMonth).padStart(2,'0')}/{periodFromYear} → 20/{String(periodMonth).padStart(2,'0')}/{periodYear}
              </span>
            </div>
            <button
              onClick={() => handleGeneratePdf(category)}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.97]"
              style={{
                background: pdfLoading ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg, #9C27B0, #26C6DA)",
                border: pdfLoading ? "1px solid rgba(255,255,255,0.1)" : "none",
                cursor: pdfLoading ? "not-allowed" : "pointer",
                boxShadow: pdfLoading ? "none" : "0 4px 16px rgba(156,39,176,0.3)",
              }}
            >
              {pdfLoading
                ? <div className="rounded-full" style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid rgba(255,255,255,0.7)", animation: "spin 0.8s linear infinite" }} />
                : <FileText size={14} color="#fff" />
              }
              <span style={{ fontSize: 12, fontWeight: 700, color: pdfLoading ? "rgba(255,255,255,0.4)" : "#fff" }}>
                {pdfLoading ? 'Generando…' : 'Generar Informe PDF'}
              </span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {category.sectors.map((sectorName) => {
            const apiSector = matchSector(sectorName);
            return (
              <ReportSectorCard
                key={sectorName}
                name={sectorName}
                color={category.color}
                gradient={category.gradient}
                employeeCount={apiSector?.employees}
                onClick={() => setView({ step: 'employees', category, sectorName, apiSector })}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {REPORT_CATEGORIES.map((cat) => (
        <ReportCategoryCard key={cat.id} category={cat} onClick={() => setView({ step: 'sectors', category: cat })} />
      ))}
    </div>
  );
}

export default function App() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [filter, setFilter] = useState("Todos");
  const [activePanel, setActivePanel] = useState<'sectores' | 'informes' | 'accesos'>('sectores');
  const [pendingAccessCount, setPendingAccessCount] = useState(0);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  // LaunchedEffect equivalent
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // visible error feedback
  
  const [searchQuery, setSearchQuery] = useState("");
  const [globalStats, setGlobalStats] = useState({
    ausentes: 0, horasTotales: 0, cosechaTotales: 0, importeTotales: 0, cajasTotales: 0, cajonesTotales: 0,
    // Tipos de carga nuevos — cada uno con columna propia en el servidor, se leen
    // directo de ahi (no hay que reparsear texto como con horas/cosecha/etc).
    kmViajesTotales: 0, hasFumigadasTotales: 0, siembraTrillaTotales: 0, bolserosTotales: 0, etiquetadoTotales: 0,
    camionCargas: 0, estibaCargas: 0,
  });

  // Global Employee Search — llama al endpoint /api/admin/employees/search
  const [employeeSearchResults, setEmployeeSearchResults] = useState<{ emp: Employee; sector: Sector }[]>([]);

  useEffect(() => {
    if (searchQuery.length < 2) { setEmployeeSearchResults([]); return; }
    const rawToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
    const token = rawToken === "undefined" ? "" : rawToken;
    let cancelled = false;
    fetch(
      `https://staffaxis-new-version-production.up.railway.app/api/admin/employees/search?q=${encodeURIComponent(searchQuery)}`,
      { headers: token ? { "X-Admin-Token": token } : {} }
    )
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        const results: { emp: Employee; sector: Sector }[] = (data.employees ?? []).flatMap((e: any) => {
          const sector = sectors.find(s => s.apiId === e.sector_id);
          if (!sector) return [];
          return [{ emp: e as Employee, sector }];
        }).slice(0, 15);
        setEmployeeSearchResults(results);
      })
      .catch(() => { if (!cancelled) setEmployeeSearchResults([]); });
    return () => { cancelled = true; };
  }, [searchQuery, sectors]);

  // States for Authentication (Login / Logout)
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  // Adjust: unread notifications badge — disappears permanently on first open
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  // New States for Creation Modals
  const [showCreateAdminModal, setShowCreateAdminModal] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState("");
  const [newAdminPass, setNewAdminPass] = useState("");

  const [showCreateSectorModal, setShowCreateSectorModal] = useState(false);
  const [newSectorName, setNewSectorName] = useState("");
  const [newSectorEncargado, setNewSectorEncargado] = useState("");

  const [showCreateEmployeeModal, setShowCreateEmployeeModal] = useState<Sector | null>(null);
  const [newEmployeeFirst, setNewEmployeeFirst] = useState("");
  const [newEmployeeLast, setNewEmployeeLast] = useState("");
  const [newEmployeeDNI, setNewEmployeeDNI] = useState("");

  const [creationLoading, setCreationLoading] = useState(false);
  const [creationError, setCreationError] = useState("");

  const [showAdminManagement, setShowAdminManagement] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [editAdminUser, setEditAdminUser] = useState("");
  const [editAdminPass, setEditAdminPass] = useState("");

  const [showConfirmDelete, setShowConfirmDelete] = useState<{ type: 'employee' | 'sector' | 'admin', id: string, name: string, sectorId?: string, onConfirm?: () => Promise<void> } | null>(null);

  const getAdminUsername = () => {
    try {
      const u = localStorage.getItem("admin_user") || sessionStorage.getItem("admin_user");
      if (u) return JSON.parse(u).username;
    } catch { }
    return null;
  };
  const isAdmin = isLoggedIn;

  useEffect(() => {
    // Fetch real notifications from the backend API
    fetch('https://staffaxis-new-version-production.up.railway.app/api/notifications')
      .then(res => res.json())
      .then(data => {
        if (data.notifications && data.notifications.length > 0) {
          setNotifications(data.notifications);
          setHasUnreadNotifications(true);
        }
      })
      .catch(err => console.error('Error fetching notifications:', err));
  }, []);

  // Reference for Notifications Dropdown "click outside to close"
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNotifClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener("mousedown", handleNotifClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleNotifClickOutside);
  }, [showNotifications]);

  // Reference for Settings Dropdown "click outside to close"
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    if (showSettingsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSettingsMenu]);

  // Session management logic
  const handleLogout = (expired = false) => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    setIsLoggedIn(false);
    setShowSettingsMenu(false);
    setUsername('');
    setPassword('');
    setLoginError(false);
    setLoginErrorMsg("");
    setIsLoggingIn(false);

    if (expired) {
      setLoginErrorMsg("Tu sesión ha expirado por seguridad");
      setLoginError(true);
    }
  };

  useEffect(() => {
    const rawToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    const token = rawToken === "undefined" ? "" : rawToken;
    if (token && !isLoggedIn) {
      // Validate stored token against API before auto-login
      fetch("https://staffaxis-new-version-production.up.railway.app/api/admin/sectors", {
        headers: { 'X-Admin-Token': token }
      }).then(res => {
        if (res.ok) {
          window.electronAPI?.setAdminToken?.(token);
          setIsLoggedIn(true);
        } else {
          // Stale/invalid token — force re-login
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          sessionStorage.removeItem("admin_token");
          sessionStorage.removeItem("admin_user");
        }
      }).catch(() => {
        // Network error — allow login with stored token (offline tolerance)
        window.electronAPI?.setAdminToken?.(token);
        setIsLoggedIn(true);
      });
    } else if (!token && isLoggedIn) {
      handleLogout();
    }
  }, [isLoggedIn]);

  // Exrtracted Login Logic
  const attemptLogin = async () => {
    if (!username || !password) return;
    setIsLoggingIn(true);
    setLoginError(false);
    setLoginErrorMsg("");

    try {
      const response = await fetch("https://staffaxis-new-version-production.up.railway.app/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      console.log("Respuesta de API Login:", data);

      if (response.ok && data.success) {
        const storage = keepLoggedIn ? localStorage : sessionStorage;
        storage.setItem("admin_token", data.token);
        storage.setItem("admin_user", JSON.stringify(data.user));
        window.electronAPI?.setAdminToken?.(data.token);
        setIsLoggedIn(true);
      } else {
        setLoginError(true);
        setLoginErrorMsg("Contraseña incorrecta");
      }
    } catch (err) {
      console.error("Error al intentar iniciar sesión:", err);
      setLoginError(true);
      setLoginErrorMsg("Error de conexión");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const attemptGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(false);
    setLoginErrorMsg("");
    try {
      const result: any = await window.electronAPI?.googleLogin?.();
      if (result?.success && result.token) {
        localStorage.setItem("admin_token", result.token);
        localStorage.setItem("admin_user", JSON.stringify(result.user));
        window.electronAPI?.setAdminToken?.(result.token);
        setIsLoggedIn(true);
      } else {
        setLoginError(true);
        setLoginErrorMsg(result?.error || "Error al autenticar con Google");
      }
    } catch (err) {
      setLoginError(true);
      setLoginErrorMsg("Error de conexión");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLoginKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      attemptLogin();
    }
  };

  const getHeaders = () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const rawToken = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token") || "";
    const token = rawToken === "undefined" ? "" : rawToken;
    if (token) {
      headers["X-Admin-Token"] = token;
    }
    return headers;
  };

  // Move loadSectors up to avoid temporal dead zone
  const loadSectors = (showLoading = true) => {
    if (window.electronAPI) {
      if (showLoading) setIsLoading(true);
      setErrorMessage(null); // clear previous errors before each fetch
      window.electronAPI.getSectors()
        .then((data: Sector[]) => {
          setSectors(data);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          console.error('[App] Failed to load sectors from API:', msg);
          setErrorMessage(msg);  
          setSectors([]);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  };

  const fetchGlobalStats = async () => {
    try {
      const headers = getHeaders();
      const localNow = new Date();
      const todayStr = `${localNow.getFullYear()}-${String(localNow.getMonth() + 1).padStart(2, '0')}-${String(localNow.getDate()).padStart(2, '0')}`;
      
      console.log("[Stats] Fetching for date:", todayStr);

      // Ausentes de hoy: buscar en primer sector disponible como proxy global
      let ausentesCount = 0;
      if (sectors && sectors.length > 0) {
        try {
          const resAbs = await fetch(
            `https://staffaxis-new-version-production.up.railway.app/api/admin/absences?sector_id=${encodeURIComponent(sectors[0].apiId)}&start_date=${todayStr}&end_date=${todayStr}`,
            { headers }
          );
          if (resAbs.ok) {
            const d = await resAbs.json();
            ausentesCount = d.absences ? d.absences.length : 0;
          }
        } catch (e) { console.error("[Stats] Error ausentes:", e); }
      }
      console.log("[Stats] Ausentes found:", ausentesCount);

      let totalH = 0;
      let totalCosecha = 0;
      let totalImporte = 0;
      let totalCajas = 0;
      let totalCajones = 0;
      let totalKm = 0, totalFum = 0, totalSiembra = 0, totalBols = 0, totalEtiq = 0, totalCamion = 0, totalEstiba = 0;
      if (sectors && sectors.length > 0) {
          const parseHorasSegment = (seg: string): number => {
              const s = seg.startsWith('H ') ? seg.slice(2) : seg;
              const n = parseFloat(s);
              return isNaN(n) ? 0 : n;
          };
          const results = await Promise.all(sectors.map(async (sec) => {
              let sH = 0, sC = 0, sI = 0, sCj = 0, sCn = 0;
              let sKm = 0, sFum = 0, sSiembra = 0, sBols = 0, sEtiq = 0, sCamion = 0, sEstiba = 0;
              const url = `https://staffaxis-new-version-production.up.railway.app/api/admin/report?sector_id=${encodeURIComponent(sec.apiId)}&start_date=${todayStr}&end_date=${todayStr}`;
              try {
                  const res = await fetch(url, { headers });
                  if (res.ok) {
                      const data = await res.json();
                      if (data.rows && Array.isArray(data.rows)) {
                          for (const att of data.rows) {
                              // Tipos nuevos: vienen ya tipados en columnas propias del reporte.
                              sKm += Number(att.km_viajes) || 0;
                              sFum += Number(att.has_fumigadas) || 0;
                              sSiembra += Number(att.siembra_trilla) || 0;
                              sBols += Number(att.bolseros) || 0;
                              sEtiq += Number(att.etiquetado) || 0;
                              if (att.carga_camion_kg50 || att.carga_camion_kg25 || att.carga_camion_otro) sCamion++;
                              if (att.movimiento_estiba_kg50 || att.movimiento_estiba_kg25 || att.movimiento_estiba_otro) sEstiba++;
                              // La API ya filtra por start_date/end_date, no hace falta revalidar la fecha
                              const val = String(att.minutes_worked ?? "").trim();
                              if (!val || val === "null") continue;
                              // Formato compuesto: "H 4|C:33", "H 0|AB:47573,53", "H 4|Cajas 32 Cajones 43"
                              if (val.includes('|')) {
                                  const segs = val.split('|');
                                  const hrs = parseHorasSegment(segs[0]);
                                  if (hrs > 0) sH += hrs;
                                  for (const seg of segs.slice(1)) {
                                      if (seg.startsWith('C:')) {
                                          const kg = parseFloat(seg.slice(2).replace(',', '.'));
                                          if (!isNaN(kg)) sC += kg;
                                      } else if (seg.startsWith('AB:')) {
                                          const imp = parseFloat(seg.slice(3).replace(',', '.'));
                                          if (!isNaN(imp)) sI += imp;
                                      } else if (seg.startsWith('Cajas ') || seg.startsWith('Cajones ')) {
                                          const cajasM = seg.match(/Cajas ([0-9]+(?:[.,][0-9]+)?)/);
                                          const cajonesM = seg.match(/Cajones ([0-9]+(?:[.,][0-9]+)?)/);
                                          if (cajasM) { const v = parseFloat(cajasM[1].replace(',', '.')); if (!isNaN(v)) sCj += v; }
                                          if (cajonesM) { const v = parseFloat(cajonesM[1].replace(',', '.')); if (!isNaN(v)) sCn += v; }
                                      }
                                  }
                              } else if (val === 'C') {
                                  // cosecha sin cantidad
                                  sC += 1;
                              } else if (val.startsWith('$')) {
                                  const imp = parseFloat(val.slice(1).replace(',', '.'));
                                  if (!isNaN(imp)) sI += imp;
                              } else if (val.startsWith('H ')) {
                                  sH += parseHorasSegment(val);
                              } else {
                                  const num = parseFloat(val);
                                  if (!isNaN(num) && num > 0) {
                                      // < 60 → ya está en horas (legacy); >= 60 → minutos
                                      sH += num < 60 ? num : num / 60;
                                  }
                              }
                          }
                      }
                  }
              } catch(err) {
                  console.error("[Stats] Error for sector", sec.name, err);
              }
              return { sH, sC, sI, sCj, sCn, sKm, sFum, sSiembra, sBols, sEtiq, sCamion, sEstiba };
          }));
          for (const r of results) {
              totalH += r.sH; totalCosecha += r.sC; totalImporte += r.sI; totalCajas += r.sCj; totalCajones += r.sCn;
              totalKm += r.sKm; totalFum += r.sFum; totalSiembra += r.sSiembra; totalBols += r.sBols; totalEtiq += r.sEtiq;
              totalCamion += r.sCamion; totalEstiba += r.sEstiba;
          }
      }

      console.log("[Stats] Horas:", totalH, "Cosecha:", totalCosecha, "Importe:", totalImporte, "Cajas:", totalCajas, "Cajones:", totalCajones);
      setGlobalStats({
        ausentes: ausentesCount, horasTotales: totalH, cosechaTotales: totalCosecha, importeTotales: totalImporte, cajasTotales: totalCajas, cajonesTotales: totalCajones,
        kmViajesTotales: totalKm, hasFumigadasTotales: totalFum, siembraTrillaTotales: totalSiembra, bolserosTotales: totalBols, etiquetadoTotales: totalEtiq,
        camionCargas: totalCamion, estibaCargas: totalEstiba,
      });
    } catch (e) {
      console.error("[Stats] Critical error:", e);
    }
  };

  useEffect(() => { 
    loadSectors(); 
  }, []);

  useEffect(() => {
    if (sectors && sectors.length > 0) {
       fetchGlobalStats();
    }
  }, [sectors]);

  // Contador de solicitudes de autorización pendientes — se actualiza solo,
  // así el número en la pestaña avisa aunque no estés parado ahí.
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchPendingCount = async () => {
      try {
        const res = await fetch(
          "https://staffaxis-new-version-production.up.railway.app/api/admin/access-requests?status=pending",
          { headers: getHeaders() }
        );
        if (res.ok) {
          const data = await res.json();
          setPendingAccessCount(Array.isArray(data.requests) ? data.requests.length : 0);
        }
      } catch (e) {
        console.error("[Accesos] error al chequear pendientes:", e);
      }
    };
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleCreateAdmin = async () => {
    if (!newAdminUser || !newAdminPass) return setCreationError("Completá todos los campos");
    setCreationLoading(true); setCreationError("");
    
    const headers = getHeaders();
    console.log("Enviando headers para Crear Admin:", headers);

    try {
      const res = await fetch("https://staffaxis-new-version-production.up.railway.app/api/admin-users", {
        method: "POST", headers,
        body: JSON.stringify({ username: newAdminUser, password: newAdminPass })
      });
      if (res.ok) {
        setShowCreateAdminModal(false); setNewAdminUser(""); setNewAdminPass("");
      } else {
        const d = await res.json(); setCreationError(d.error || "Error al crear empleado");
      }
    } catch (e) { setCreationError("Error de conexión"); }
    setCreationLoading(false);
  };

  const handleCreateSector = async () => {
    if (!newSectorName || !newSectorEncargado) return setCreationError("Completá todos los campos");
    setCreationLoading(true); setCreationError("");

    const headers = getHeaders();
    console.log("Enviando headers para Crear Sector:", headers);

    try {
      const res = await fetch("https://staffaxis-new-version-production.up.railway.app/api/admin/sectors", {
        method: "POST", headers,
        body: JSON.stringify({ name: newSectorName, encargado: newSectorEncargado })
      });
      if (res.ok) {
        setShowCreateSectorModal(false); setNewSectorName(""); setNewSectorEncargado(""); loadSectors(true);
      } else {
        const d = await res.json(); setCreationError(d.error || "Error al crear sector");
      }
    } catch (e) { setCreationError("Error de conexión"); }
    setCreationLoading(false);
  };

  const handleCreateEmployee = async () => {
    if (!newEmployeeFirst || !newEmployeeLast || !newEmployeeDNI) return setCreationError("Completá todos los campos obligatorios");
    setCreationLoading(true); setCreationError("");

    const headers = getHeaders();
    console.log("Enviando headers para Crear Empleado:", headers);

    try {
      const res = await fetch("https://staffaxis-new-version-production.up.railway.app/api/admin/employees", {
        method: "POST", headers,
        body: JSON.stringify({ first_name: newEmployeeFirst, last_name: newEmployeeLast, dni: newEmployeeDNI, sector_id: showCreateEmployeeModal?.apiId })
      });
      if (res.ok) {
        setShowCreateEmployeeModal(null); setNewEmployeeFirst(""); setNewEmployeeLast(""); setNewEmployeeDNI("");
      } else {
        const d = await res.json(); setCreationError(d.error || "Error al crear empleado");
      }
    } catch (e) { setCreationError("Error de conexión"); }
    setCreationLoading(false);
  };

  const handleDeleteEmployee = async (id: string) => {
    const headers = getHeaders();
    try {
      const res = await fetch(`https://staffaxis-new-version-production.up.railway.app/api/admin/employees/${id}`, {
        method: "PUT", headers,
        body: JSON.stringify({ is_active: false })
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Error al eliminar empleado");
        return false;
      }
      return true;
    } catch (e) { 
      alert("Error de conexión"); 
      return false;
    }
  };

  const handleDeleteSector = async (id: string) => {
    const headers = getHeaders();
    try {
      const res = await fetch(`https://staffaxis-new-version-production.up.railway.app/api/admin/sectors/${id}`, {
        method: "DELETE", headers
      });
      if (res.ok) {
        loadSectors(true);
        return true;
      } else {
        const d = await res.json();
        alert(d.error || "Error al eliminar sector");
        return false;
      }
    } catch (e) { 
      alert("Error de conexión"); 
      return false;
    }
  };

  const handleFetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const res = await fetch("https://staffaxis-new-version-production.up.railway.app/api/admin-users", {
        headers: getHeaders()
      });
      if (res.ok) {
        const d = await res.json();
        setAdminUsers(d.users || []);
      }
    } catch (e) { console.error(e); }
    setLoadingAdmins(false);
  };

  const handleUpdateAdmin = async () => {
    if (!editingAdmin || !editAdminUser) return;
    setLoadingAdmins(true);
    try {
      const res = await fetch(`https://staffaxis-new-version-production.up.railway.app/api/admin-users/${editingAdmin.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ username: editAdminUser, password: editAdminPass })
      });
      if (res.ok) {
        setEditingAdmin(null); setEditAdminUser(""); setEditAdminPass("");
        handleFetchAdmins();
      } else {
        const d = await res.json(); alert(d.error || "Error al actualizar");
      }
    } catch (e) { alert("Error de conexión"); }
    setLoadingAdmins(false);
  };

  const handleDeleteAdmin = async (id: string) => {
    // Handled by custom confirm modal
    setLoadingAdmins(true);
    try {
      const res = await fetch(`https://staffaxis-new-version-production.up.railway.app/api/admin-users/${id}`, {
        method: "DELETE",
        headers: getHeaders()
      });
      if (res.ok) {
        handleFetchAdmins();
        setLoadingAdmins(false);
        return true;
      } else {
        const d = await res.json(); alert(d.error || "Error al eliminar");
      }
    } catch (e) { alert("Error de conexión"); }
    setLoadingAdmins(false);
    return false;
  };

  useEffect(() => {
    if (showAdminManagement) handleFetchAdmins();
  }, [showAdminManagement]);

  // Auto-close toast launched effect
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  const handleExportSuccess = () => {
    // Step 3 logic: close modals and show toast
    setSelectedSector(null);
    setShowExportModal(false);
    setShowSuccessToast(true);
  };

  const hasMissing = sectors.some((s) => s.state === "missing");

  return (
    <div className="relative h-screen w-full overflow-hidden" style={{ background: "#1E1E2E", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Scroll funcional pero sin barra visible */}
      <style dangerouslySetInnerHTML={{ __html: `
        .sa-scroll { scrollbar-width: none; -ms-overflow-style: none; }
        .sa-scroll::-webkit-scrollbar { width: 0; height: 0; display: none; }
        .sa-table-scroll { scrollbar-width: thin; scrollbar-color: rgba(156,39,176,0.4) transparent; }
        .sa-table-scroll::-webkit-scrollbar { width: 9px; height: 9px; }
        .sa-table-scroll::-webkit-scrollbar-track { background: transparent; }
        .sa-table-scroll::-webkit-scrollbar-thumb { background: rgba(156,39,176,0.4); border-radius: 8px; border: 2px solid transparent; background-clip: padding-box; }
        .sa-table-scroll::-webkit-scrollbar-thumb:hover { background: rgba(156,39,176,0.65); background-clip: padding-box; }
        .sa-table-scroll::-webkit-scrollbar-corner { background: transparent; }
      ` }} />

      {/* Absolute Box logic wrapper */}
      <div
        className="h-screen w-full flex flex-col transition-all duration-300"
        style={{
          filter: !isLoggedIn ? "blur(16px)" : "none",
          pointerEvents: !isLoggedIn ? "none" : "auto"
        }}
      >
        {/* HEADER — fijo, nunca scrollea */}
        <header className="flex items-center justify-between px-10 py-5 z-30" style={{ flexShrink: 0, background: "#1E1E2E", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-xl overflow-hidden" style={{ width: 42, height: 42, background: "rgba(255,255,255,0.05)" }}>
              <img src="./logo_staffaxis.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <p className="text-white font-extrabold" style={{ fontSize: 18, letterSpacing: "-0.01em" }}>StaffAdmin</p>
              <p className="text-white/40" style={{ fontSize: 12 }}>Panel de Control</p>
            </div>
          </div>
          <div className="relative">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl relative z-20" style={{ background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.1)", width: 340 }}>
              <Search size={16} color="rgba(255,255,255,0.4)" />
              <input 
                placeholder="Buscar sector o empleado…" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none w-full text-white placeholder-white/40" style={{ fontSize: 14 }} 
              />
            </div>
            {/* Global Employee Search Results */}
            {searchQuery.length >= 2 && employeeSearchResults.length > 0 && (
              <div className="absolute top-[110%] left-0 w-full max-h-[300px] overflow-y-auto rounded-xl bg-[#2A2A3E] border border-white/10 shadow-2xl z-50 flex flex-col hide-scrollbar py-2">
                <p className="text-white/40 uppercase tracking-widest px-4 py-2 mb-1" style={{ fontSize: 10, fontWeight: 700 }}>Empleados encontrados</p>
                {employeeSearchResults.map(({emp, sector}, idx) => (
                  <button 
                    key={`${emp.id}-${idx}`}
                    onClick={() => {
                        setSearchQuery('');
                        setSelectedSector(sector);
                    }}
                    className="flex flex-col text-left px-4 py-2 hover:bg-white/5 transition-colors"
                  >
                    <span className="text-white font-semibold" style={{ fontSize: 13 }}>{emp.first_name} {emp.last_name}</span>
                    <span className="text-[#c86fe8]" style={{ fontSize: 11, fontWeight: 600 }}>Sector: {sector.name} {emp.dni ? `• DNI: ${emp.dni}` : ''}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-4" style={{ paddingRight: 120 }}>
            {/* Adjust 3: Notifications Dropdown */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => { setShowNotifications(!showNotifications); setHasUnreadNotifications(false); }}
                className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/10 relative"
                style={{ width: 42, height: 42, background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
              >
                <Bell size={18} color="rgba(255,255,255,0.7)" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center rounded-full" style={{ width: 10, height: 10, background: "#FF5252", border: "2px solid #1E1E2E" }} />
                )}
              </button>
              {showNotifications && (
                <div
                  className="absolute right-0 mt-2 rounded-xl overflow-hidden z-50 py-2"
                  style={{ background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", minWidth: 280, maxHeight: 400, overflowY: "auto" }}
                >
                  <p className="px-5 py-2 text-white/40 uppercase tracking-wider" style={{ fontSize: 11, fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 8, marginBottom: 4 }}>Notificaciones</p>

                  {notifications.length > 0 ? (
                    notifications.map((notif: any) => (
                      <div key={notif.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0">
                        <div className="flex items-center justify-center rounded-full flex-shrink-0 mt-0.5" style={{ width: 28, height: 28, background: "rgba(76,175,80,0.15)" }}>
                          <CheckCircle2 size={14} color="#4CAF50" />
                        </div>
                        <div>
                          <p className="text-white" style={{ fontSize: 13, fontWeight: 600 }}>Cierre de Tarja</p>
                          <p className="text-white/60 leading-tight mt-0.5" style={{ fontSize: 12 }}>{notif.message}</p>
                          <p className="text-white/30 mt-1" style={{ fontSize: 10 }}>
                            {new Date(notif.date * 1000).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-5 py-8 text-center">
                      <p className="text-white/40" style={{ fontSize: 13 }}>No hay notificaciones nuevas</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="flex items-center justify-center rounded-xl transition-colors hover:bg-white/10"
                style={{ width: 42, height: 42, background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
              >
                <Settings size={18} color="rgba(255,255,255,0.7)" />
              </button>
              {showSettingsMenu && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-xl overflow-hidden z-50 py-1"
                  style={{ background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)" }}
                >
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => { setShowSettingsMenu(false); setShowCreateSectorModal(true); setCreationError(""); }}
                        className="w-full text-left px-5 py-3 text-white transition-colors hover:bg-white/10"
                        style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none" }}
                      >
                        Crear Nuevo Sector
                      </button>
                      <button
                        onClick={() => { setShowSettingsMenu(false); setShowAdminManagement(true); }}
                        className="w-full text-left px-5 py-3 text-white transition-colors hover:bg-white/10 flex items-center gap-2"
                        style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none" }}
                      >
                        <UserCog size={14} /> Gestionar Usuarios
                      </button>
                      <button
                        onClick={() => { setShowSettingsMenu(false); alert("StaffAdmin - Panel de Control\nVersión: 1.0.9"); }}
                        className="w-full text-left px-5 py-3 text-white transition-colors hover:bg-white/10 flex items-center gap-2"
                        style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none" }}
                      >
                        <div className="flex items-center justify-center rounded-[4px] border border-current opacity-70" style={{width: 14, height: 14, fontSize: 10, fontWeight: "bold"}}>i</div>
                        Info
                      </button>
                      <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "4px 0" }} />
                    </>
                  )}
                  <button
                    onClick={() => handleLogout()}
                    className="w-full text-left px-5 py-3.5 text-white transition-colors hover:bg-white/10"
                    style={{ fontSize: 13, fontWeight: 600, cursor: "pointer", background: "transparent", border: "none" }}
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
            {/* Adjust 2: Static profile photo (Salvita avatar) */}
            <div className="flex items-center gap-3 cursor-pointer ml-2">
              <div className="rounded-full overflow-hidden" style={{ width: 42, height: 42, flexShrink: 0 }}>
                <img src="./user_avatar_real.jpg" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            </div>
          </div>
        </header>

        {/* DASHBOARD ROW (2-Column Layout) — min-h-0 permite que los hijos scrolleen */}
        <div className="flex-1 flex px-10 pt-8 gap-8 mx-auto w-full" style={{ maxWidth: 1600, minHeight: 0 }}>

          {/* LEFT COLUMN (SIDEBAR) — fija, con scroll propio si no entra */}
          <div className="sa-scroll flex flex-col gap-6 pb-8" style={{ width: 320, flexShrink: 0, overflowY: "auto", minHeight: 0 }}>
            <SectorDropdown value={filter} onChange={setFilter} sectors={sectors} />
            <StatsCard filter={filter} sectors={sectors} globalStats={globalStats} />
            <div className="flex flex-col gap-3 mt-1 px-2">
              <div className="flex items-center gap-3">
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#4CAF50', boxShadow: '0 0 8px rgba(76,175,80,0.4)' }} />
                <span className="text-white/80" style={{ fontSize: 13, lineHeight: 1.4 }}><strong className="text-white">Enviado:</strong> Datos actualizados y recibidos a tiempo.</span>
              </div>
              <div className="flex items-center gap-3">
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#FF5252', boxShadow: '0 0 8px rgba(255,82,82,0.4)' }} />
                <span className="text-white/80" style={{ fontSize: 13, lineHeight: 1.4 }}><strong className="text-white">Faltante:</strong> Faltan registros por enviar.</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — API data with loading state + manual refresh */}
          <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
            {/* Header row: Panel tabs + contextual actions — fija */}
            <div className="flex items-center justify-between" style={{ flexShrink: 0 }}>
              {/* Tab navigation */}
              <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.08)" }}>
                <button
                  onClick={() => setActivePanel('sectores')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{
                    background: activePanel === 'sectores' ? "rgba(156,39,176,0.2)" : "transparent",
                    border: activePanel === 'sectores' ? "1px solid rgba(156,39,176,0.4)" : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <LayoutGrid size={13} color={activePanel === 'sectores' ? "#CE93D8" : "rgba(255,255,255,0.4)"} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: activePanel === 'sectores' ? "#CE93D8" : "rgba(255,255,255,0.4)" }}>Panel de Sectores</span>
                </button>
                <button
                  onClick={() => setActivePanel('informes')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                  style={{
                    background: activePanel === 'informes' ? "rgba(38,198,218,0.15)" : "transparent",
                    border: activePanel === 'informes' ? "1px solid rgba(38,198,218,0.4)" : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <BarChart3 size={13} color={activePanel === 'informes' ? "#80DEEA" : "rgba(255,255,255,0.4)"} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: activePanel === 'informes' ? "#80DEEA" : "rgba(255,255,255,0.4)" }}>Panel de Informes</span>
                </button>
                <button
                  onClick={() => setActivePanel('accesos')}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all relative"
                  style={{
                    background: activePanel === 'accesos' ? "rgba(76,175,80,0.15)" : "transparent",
                    border: activePanel === 'accesos' ? "1px solid rgba(76,175,80,0.4)" : "1px solid transparent",
                    cursor: "pointer",
                  }}
                >
                  <ShieldCheck size={13} color={activePanel === 'accesos' ? "#81C784" : "rgba(255,255,255,0.4)"} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: activePanel === 'accesos' ? "#81C784" : "rgba(255,255,255,0.4)" }}>Solicitudes de Autorización</span>
                  {pendingAccessCount > 0 && (
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, color: "#fff",
                        background: "#FF5252", borderRadius: 999,
                        minWidth: 16, height: 16, padding: "0 4px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      {pendingAccessCount}
                    </span>
                  )}
                </button>
              </div>
              {/* Refresh — only visible on Sectores panel */}
              {activePanel === 'sectores' && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => loadSectors(true)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all hover:bg-white/10 active:scale-95"
                    style={{ background: "#2A2A3E", border: "1px solid rgba(255,255,255,0.1)", cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.5 : 1 }}
                    title="Actualizar desde la API"
                  >
                    <RefreshCw size={14} color="rgba(255,255,255,0.7)" style={{ animation: isLoading ? "spin 0.8s linear infinite" : "none" }} />
                    <span className="text-white/70" style={{ fontSize: 12, fontWeight: 600 }}>Actualizar</span>
                  </button>
                </div>
              )}
            </div>
            {/* ÚNICA zona con scroll de todo el dashboard */}
            <div className="sa-scroll flex-1 overflow-y-auto pt-6 pb-8" style={{ minHeight: 0 }}>
            {activePanel === 'informes' ? (
              <PanelInformes apiSectors={sectors} />
            ) : activePanel === 'accesos' ? (
              <PanelAccesos onPendingCountChange={setPendingAccessCount} />
            ) : isLoading ? (
              /* CircularProgressIndicator equivalent */
              <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ minHeight: 320 }}>
                <div
                  className="rounded-full"
                  style={{
                    width: 48, height: 48,
                    border: "4px solid rgba(255,255,255,0.1)",
                    borderTop: "4px solid #9C27B0",
                    animation: "spin 0.8s linear infinite"
                  }}
                />
                <p className="text-white/40" style={{ fontSize: 14 }}>Cargando sectores…</p>
                <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { to { transform: rotate(360deg); } }` }} />
              </div>
            ) : sectors.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6" style={{ minHeight: 320 }}>
                <div className="flex items-center justify-center rounded-full" style={{ width: 48, height: 48, background: "rgba(255,82,82,0.15)" }}>
                  <AlertTriangle size={22} color="#FF5252" />
                </div>
                <p className="text-center" style={{ color: "#FF5252", fontSize: 15, fontWeight: 700 }}>
                  {errorMessage ? "Error al cargar sectores" : "Sin sectores disponibles"}
                </p>
                {errorMessage && (
                  <p className="text-center rounded-xl px-4 py-3 font-mono break-all"
                    style={{ color: "rgba(255,82,82,0.85)", fontSize: 11, background: "rgba(255,82,82,0.07)", border: "1px solid rgba(255,82,82,0.2)", maxWidth: 560 }}>
                    {errorMessage}
                  </p>
                )}
                <button
                  onClick={() => loadSectors(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "rgba(255,82,82,0.15)", border: "1px solid rgba(255,82,82,0.3)", cursor: "pointer" }}
                >
                  <RefreshCw size={13} color="#FF5252" />
                  <span style={{ color: "#FF5252", fontSize: 12, fontWeight: 600 }}>Reintentar</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                {sectors.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.encargado && s.encargado.toLowerCase().includes(searchQuery.toLowerCase()))).map((s) => (
                  <SectorCard key={s.id} sector={s} onClick={() => setSelectedSector(s)} />
                ))}
              </div>
            )}
            </div>
          </div>

        </div>
      </div>

      {/* OVERRIDING LAYERS (Z-Index > 10) */}

      {/* Step 1 & 2: Floating Modal & Tooltip Overlay */}
      {
        selectedSector !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => { if (!(window as any).__filePickerOpen) setSelectedSector(null); }}
          >
            <FloatingModal
              sector={selectedSector!}
              onClose={() => setSelectedSector(null)}
              onExport={handleExportSuccess}
              isAdmin={isAdmin}
              onCreateEmployee={() => {
                setSelectedSector(null);
                setShowCreateEmployeeModal(selectedSector!);
              }}
              onDeleteEmployee={handleDeleteEmployee}
              onDeleteSector={handleDeleteSector}
              setShowConfirmDelete={setShowConfirmDelete}
            />
          </div>
        )
      }

      {/* Tarea: Modal de Exportación Global conectado mediante showExportModal */}
      {
        showExportModal && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setShowExportModal(false)}
          >
            {/* Reutilizamos el modal para simular el Global Modal con data mock */}
            <FloatingModal
              sector={{ id: 99999, apiId: "global", name: "Todos los Sectores", icon: "Building2", employees: sectors.reduce((acc, s) => acc + s.employees, 0), state: "sent", encargado: "N/A", trend: 0 }}
              onClose={() => setShowExportModal(false)}
              onExport={handleExportSuccess}
              isAdmin={isAdmin}
              setShowConfirmDelete={setShowConfirmDelete}
            />
          </div>
        )
      }

      {/* Step 3: Success Toast Overlay — Figma spec */}
      {
        showSuccessToast && (
          <div
            className="absolute z-50 transition-all"
            style={{ bottom: 28, right: 28 }}
          >
            <div
              className="flex items-stretch rounded-2xl overflow-hidden relative"
              style={{
                background: "#2A2A3E",
                border: "1px solid rgba(76,175,80,0.3)",
                boxShadow: "0 12px 40px rgba(0,0,0,0.55), 0 4px 16px rgba(76,175,80,0.15)",
                minWidth: 340,
              }}
            >
              {/* Left accent bar */}
              <div style={{ width: 4, background: "#4CAF50", flexShrink: 0 }} />
              {/* Content */}
              <div className="flex items-center gap-3.5 px-4 py-4 flex-1">
                <div className="flex items-center justify-center rounded-full flex-shrink-0"
                  style={{ width: 36, height: 36, background: "rgba(76,175,80,0.15)" }}>
                  <CheckCircle2 size={20} color="#4CAF50" />
                </div>
                <div className="flex-1">
                  <p className="text-white" style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Exportación Correcta</p>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>El archivo Excel se generó exitosamente.</p>
                </div>
                <button onClick={() => setShowSuccessToast(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, lineHeight: 0, flexShrink: 0 }}>
                  <X size={14} color="rgba(255,255,255,0.35)" />
                </button>
              </div>
              {/* Bottom progress bar */}
              <div className="absolute bottom-0 left-0 right-0" style={{ height: 2 }}>
                <div className="h-full" style={{ background: "#4CAF50", animation: "progress 3s linear forwards" }} />
              </div>
            </div>
            <style dangerouslySetInnerHTML={{ __html: `@keyframes progress { from { width: 100%; } to { width: 0%; } }` }} />
          </div>
        )
      }

      {/* Login Modal Overlay */}
      {
        !isLoggedIn && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }}>
            <div className="rounded-3xl p-8 flex flex-col items-center relative" style={{ background: "#2A2A3E", width: 400, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.65)" }}>
              {/* Logo / ícono */}
              <div className="flex items-center justify-center rounded-2xl mb-5" style={{ width: 64, height: 64, background: "linear-gradient(135deg, #9C27B0, #26C6DA)", boxShadow: "0 8px 24px rgba(156,39,176,0.4)" }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="9" cy="7" r="4" stroke="#fff" strokeWidth="2"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h2 className="text-white mb-2 text-center" style={{ fontSize: 22, fontWeight: 800 }}>StaffAdmin</h2>
              <p className="text-center mb-8" style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>Iniciá sesión con tu cuenta de Google para continuar</p>

              {loginError && (
                <p className="mb-5 text-center px-4 py-3 rounded-xl w-full" style={{ color: "#FF5252", fontSize: 13, fontWeight: 600, background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.2)" }}>
                  {loginErrorMsg || "Error al autenticar con Google"}
                </p>
              )}

              <button
                onClick={attemptGoogleLogin}
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                style={{
                  background: isLoggingIn ? "rgba(255,255,255,0.08)" : "#fff",
                  border: "none",
                  cursor: isLoggingIn ? "not-allowed" : "pointer",
                  boxShadow: isLoggingIn ? "none" : "0 4px 16px rgba(0,0,0,0.3)",
                  color: isLoggingIn ? "rgba(255,255,255,0.4)" : "#3c4043",
                  fontSize: 15,
                  fontWeight: 600,
                  opacity: isLoggingIn ? 0.7 : 1,
                }}
              >
                {isLoggingIn ? (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3"/>
                      <path d="M12 2a10 10 0 0 1 10 10" stroke="rgba(255,255,255,0.7)" strokeWidth="3" strokeLinecap="round"/>
                    </svg>
                    <span style={{ color: "rgba(255,255,255,0.6)" }}>Autenticando...</span>
                  </>
                ) : (
                  <>
                    {/* Google G logo */}
                    <svg width="20" height="20" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      <path fill="none" d="M0 0h48v48H0z"/>
                    </svg>
                    Iniciar sesión con Google
                  </>
                )}
              </button>

              <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
            </div>
          </div>
        )
      }

      {/* Creation Modals (Admin privileges only) */}
      {showCreateAdminModal && isAdmin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-3xl p-8 flex flex-col relative" style={{ background: "#2A2A3E", width: 400, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.65)" }}>
            <button onClick={() => setShowCreateAdminModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer" style={{ background: "transparent", border: "none" }}>
              <X size={16} color="rgba(255,255,255,0.6)" />
            </button>
            <h2 className="text-white mb-6" style={{ fontSize: 20, fontWeight: 800 }}>Crear Usuario Admin</h2>
            <input autoFocus type="text" placeholder="Usuario" value={newAdminUser} onChange={(e) => setNewAdminUser(e.target.value)} className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14 }} />
            <input type="password" placeholder="Contraseña" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14 }} />
            {creationError && <p className="mb-4" style={{ color: "#FF5252", fontSize: 13, fontWeight: 600 }}>{creationError}</p>}
            <button onClick={handleCreateAdmin} disabled={creationLoading} className="w-full py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] mt-2 text-white font-bold" style={{ background: creationLoading ? "#666" : "linear-gradient(135deg, #4CAF50, #2E7D32)", border: "none", cursor: creationLoading ? "not-allowed" : "pointer" }}>
              {creationLoading ? "Creando..." : "Crear Usuario"}
            </button>
          </div>
        </div>
      )}

      {showCreateSectorModal && isAdmin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-3xl p-8 flex flex-col relative" style={{ background: "#2A2A3E", width: 400, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.65)" }}>
            <button onClick={() => setShowCreateSectorModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer" style={{ background: "transparent", border: "none" }}>
              <X size={16} color="rgba(255,255,255,0.6)" />
            </button>
            <h2 className="text-white mb-6" style={{ fontSize: 20, fontWeight: 800 }}>Crear Nuevo Sector</h2>
            <input autoFocus type="text" placeholder="Nombre del Sector" value={newSectorName} onChange={(e) => setNewSectorName(e.target.value)} className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14 }} />
            <input type="text" placeholder="Encargado" value={newSectorEncargado} onChange={(e) => setNewSectorEncargado(e.target.value)} className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14 }} />
            {creationError && <p className="mb-4" style={{ color: "#FF5252", fontSize: 13, fontWeight: 600 }}>{creationError}</p>}
            <button onClick={handleCreateSector} disabled={creationLoading} className="w-full py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] mt-2 text-white font-bold" style={{ background: creationLoading ? "#666" : "linear-gradient(135deg, #4CAF50, #2E7D32)", border: "none", cursor: creationLoading ? "not-allowed" : "pointer" }}>
              {creationLoading ? "Creando..." : "Crear Sector"}
            </button>
          </div>
        </div>
      )}

      {showCreateEmployeeModal && isAdmin && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="rounded-3xl p-8 flex flex-col relative" style={{ background: "#2A2A3E", width: 400, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.65)" }}>
            <button onClick={() => setShowCreateEmployeeModal(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer" style={{ background: "transparent", border: "none" }}>
              <X size={16} color="rgba(255,255,255,0.6)" />
            </button>
            <h2 className="text-white mb-2" style={{ fontSize: 20, fontWeight: 800 }}>Agregar Empleado</h2>
            <p className="text-white/50 mb-6" style={{ fontSize: 13 }}>Sector: {showCreateEmployeeModal.name}</p>
            <input autoFocus type="text" placeholder="Nombre" value={newEmployeeFirst} onChange={(e) => setNewEmployeeFirst(e.target.value)} className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14 }} />
            <input type="text" placeholder="Apellido" value={newEmployeeLast} onChange={(e) => setNewEmployeeLast(e.target.value)} className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14 }} />
            <input type="text" placeholder="DNI" value={newEmployeeDNI} onChange={(e) => setNewEmployeeDNI(e.target.value)} className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 14 }} />
            {creationError && <p className="mb-4" style={{ color: "#FF5252", fontSize: 13, fontWeight: 600 }}>{creationError}</p>}
            <button onClick={handleCreateEmployee} disabled={creationLoading} className="w-full py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] mt-2 text-white font-bold" style={{ background: creationLoading ? "#666" : "linear-gradient(135deg, #4CAF50, #2E7D32)", border: "none", cursor: creationLoading ? "not-allowed" : "pointer" }}>
              {creationLoading ? "Creando..." : "Crear Empleado"}
            </button>
          </div>
        </div>
      )}

      {/* Admin Management Modal */}
      {showAdminManagement && (
        <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-[450px] rounded-3xl overflow-hidden flex flex-col" style={{ background: "#2A2A3E", border: "1.5px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.65)" }}>
            <div style={{ height: 4, background: "linear-gradient(90deg, #9C27B0, #26C6DA)" }} />
            <div className="p-7">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-black text-2xl tracking-tight">Gestionar Usuarios</h3>
                <button onClick={() => setShowAdminManagement(false)} className="p-2 rounded-xl hover:bg-white/10" style={{ cursor: "pointer", background: "transparent", border: "none" }}><X size={20} color="white" /></button>
              </div>

              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto mb-6 pr-2">
                {loadingAdmins ? (
                  <div className="py-10 text-center"><div className="inline-block rounded-full w-8 h-8 border-2 border-white/10 border-t-purple-500 animate-spin" /></div>
                ) : adminUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div>
                      <p className="text-white font-bold">{u.username}</p>
                      <p className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">ID: {u.id.substring(0, 8)}...</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setEditingAdmin(u); setEditAdminUser(u.username); setEditAdminPass(""); }}
                        className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white"
                        style={{ cursor: "pointer", background: "transparent", border: "none" }}
                      >
                        <Settings size={16} />
                      </button>
                      {u.username !== 'admin' && (
                        <button 
                          onClick={() => {
                            setShowConfirmDelete({ 
                              type: 'admin', 
                              id: u.id, 
                              name: u.username,
                              onConfirm: async () => {
                                await handleDeleteAdmin(u.id);
                              }
                            });
                          }}
                          className="p-2 rounded-lg hover:bg-red-500/20 text-red-400"
                          style={{ cursor: "pointer", background: "transparent", border: "none" }}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { setShowAdminManagement(false); setShowCreateAdminModal(true); }}
                className="w-full py-4 rounded-2xl bg-purple-600/10 border border-dashed border-purple-500/40 text-purple-400 font-bold hover:bg-purple-600/20 transition-all mb-4"
                style={{ cursor: "pointer" }}
              >
                + Crear Nuevo Administrador
              </button>
            </div>
          </div>

          {/* Edit Admin Sub-Modal */}
          {editingAdmin && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center backdrop-blur-md" style={{ background: "rgba(0,0,0,0.4)" }}>
              <div className="w-[380px] rounded-3xl p-7 flex flex-col gap-5" style={{ background: "#32324A", border: "1.5px solid rgba(255,255,255,0.15)", boxShadow: "0 20px 50px rgba(0,0,0,0.5)" }}>
                <h4 className="text-white font-bold text-xl">Editar Usuario</h4>
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-white/40 text-[10px] uppercase font-bold mb-1.5 block">Nombre de Usuario</label>
                    <input value={editAdminUser} onChange={e => setEditAdminUser(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50" />
                  </div>
                  <div>
                    <label className="text-white/40 text-[10px] uppercase font-bold mb-1.5 block">Nueva Contraseña (dejar vacío para no cambiar)</label>
                    <input type="password" value={editAdminPass} onChange={e => setEditAdminPass(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-purple-500/50" />
                  </div>
                </div>
                <div className="flex gap-3 mt-2">
                  <button onClick={() => setEditingAdmin(null)} className="flex-1 py-3 text-white/50 font-bold hover:text-white" style={{ cursor: "pointer", background: "transparent", border: "none" }}>Cancelar</button>
                  <button onClick={handleUpdateAdmin} className="flex-1 py-3 bg-purple-600 rounded-xl text-white font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/20" style={{ cursor: "pointer", border: "none" }}>Guardar Cambios</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmDelete && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="rounded-3xl p-8 flex flex-col relative" style={{ background: "#2A2A3E", width: 400, border: "1.5px solid rgba(255,82,82,0.3)", boxShadow: "0 32px 80px rgba(0,0,0,0.8)" }}>
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 mb-6 mx-auto">
              <Trash2 size={28} color="#FF5252" />
            </div>
            <h2 className="text-white mb-2 text-center" style={{ fontSize: 20, fontWeight: 800 }}>Finalizar Eliminación</h2>
            <p className="text-white/60 mb-8 text-center" style={{ fontSize: 14, lineHeight: 1.5 }}>
              ¿Estás seguro que deseas eliminar <strong>{showConfirmDelete.name}</strong>?<br/>
              {showConfirmDelete.type === 'sector' && <span className="text-red-400/80 text-[11px] font-bold mt-2 inline-block">ESTA ACCIÓN ELIMINARÁ TAMBIÉN TODOS SUS EMPLEADOS.</span>}
              {showConfirmDelete.type !== 'sector' && "Esta acción no se puede deshacer."}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmDelete(null)}
                className="flex-1 py-3.5 rounded-xl text-white/50 font-bold hover:bg-white/5 transition-all"
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer" }}
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  if (showConfirmDelete.onConfirm) {
                    await showConfirmDelete.onConfirm();
                  }
                  setShowConfirmDelete(null);
                }}
                className="flex-1 py-3.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all shadow-lg shadow-red-900/20"
                style={{ border: "none", cursor: "pointer" }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div >
  );
}
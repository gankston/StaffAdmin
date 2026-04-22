import { useState, useRef, useEffect, useMemo } from "react";


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
  FileText
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
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  // Dynamic options: "Todos" + real sector names from API (Tarea 2 + 4: sin placeholders)
  const options = ["Todos", ...sectors.map((s) => s.name)];

  return (
    <div ref={ref} className="relative w-full">
      <button
        onClick={() => setOpen((v) => !v)}
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

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-2 rounded-[16px] overflow-hidden" style={{ background: "#232336", border: "1.5px solid rgba(255,255,255,0.1)", boxShadow: "0 10px 40px rgba(0,0,0,0.5)", maxHeight: 260, overflowY: "auto" }}>
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className="w-full flex items-center px-5 py-3.5 text-left transition-colors hover:bg-white/5 text-white"
              style={{
                background: opt === value ? "rgba(156,39,176,0.15)" : "transparent",
                borderLeft: opt === value ? "3px solid #9C27B0" : "3px solid transparent",
                fontSize: 14, fontWeight: opt === value ? 600 : 400, cursor: "pointer",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsCard({ filter, sectors, globalStats }: { filter: string, sectors: Sector[], globalStats: any }) {
  const isGlobal = filter === "Todos";
  const src = isGlobal ? sectors : sectors.filter((s) => s.name === filter);
  
  const totalEmpleados = src.reduce((a, c) => a + c.employees, 0);
  const numEncargados = new Set(src.map(s => s.encargado).filter(Boolean)).size;
  
  // Si no estamos en "Todos", usamos lo que sabemos (empleados). Las horas/ausentes globales no aplicarían directamente.
  const ausentes = isGlobal ? globalStats.ausentes : "N/A";
  const activos = isGlobal ? Math.max(0, totalEmpleados - globalStats.ausentes) : totalEmpleados;
  const totales = totalEmpleados + numEncargados;
  const horasTotales = isGlobal ? globalStats.horasTotales : "N/A";

  return (
    <div className="p-6 rounded-[16px]" style={{ background: "linear-gradient(135deg, #9C27B0 0%, #26C6DA 100%)", boxShadow: "0 12px 32px rgba(156,39,176,0.25)" }}>
      <h2 className="text-white mb-6" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>Estadísticas del Período</h2>
      <div className="grid grid-cols-2 gap-y-6 gap-x-4">
        <div><p className="text-white/70 uppercase font-semibold tracking-wider mb-1" style={{ fontSize: 11 }}>Total Registrados</p><p className="text-white font-black" style={{ fontSize: 26, lineHeight: 1 }}>{totalEmpleados.toLocaleString("es")}</p></div>
        <div><p className="text-white/70 uppercase font-semibold tracking-wider mb-1" style={{ fontSize: 11 }}>Encargados</p><p className="text-white font-black" style={{ fontSize: 26, lineHeight: 1 }}>{numEncargados}</p></div>
        <div><p className="text-white/70 uppercase font-semibold tracking-wider mb-1" style={{ fontSize: 11 }}>Activos</p><p className="text-white font-black" style={{ fontSize: 26, lineHeight: 1 }}>{activos}</p></div>
        <div><p className="text-white/70 uppercase font-semibold tracking-wider mb-1" style={{ fontSize: 11 }}>Ausentes</p><p className="text-white font-black" style={{ fontSize: 26, lineHeight: 1 }}>{ausentes}</p></div>
        <div><p className="text-white/70 uppercase font-semibold tracking-wider mb-1" style={{ fontSize: 11 }}>Totales</p><p className="text-white font-black" style={{ fontSize: 26, lineHeight: 1 }}>{totales.toLocaleString("es")}</p></div>
        <div><p className="text-white/70 uppercase font-semibold tracking-wider mb-1" style={{ fontSize: 11 }}>Horas Totales</p><p className="text-white font-black" style={{ fontSize: 26, lineHeight: 1 }}>{horasTotales !== "N/A" ? parseFloat(Number(horasTotales).toPrecision(4)).toLocaleString("es") : "N/A"}</p></div>
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
}


function FloatingModal({ sector, onClose, onExport, isAdmin, onCreateEmployee, onDeleteEmployee, onDeleteSector, setShowConfirmDelete }: { sector: Sector; onClose: () => void; onExport: () => void; isAdmin: boolean; onCreateEmployee?: () => void; onDeleteEmployee?: (id: string) => Promise<boolean>; onDeleteSector?: (id: string) => Promise<boolean>; setShowConfirmDelete: (val: any) => void }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [absentEmployeeIds, setAbsentEmployeeIds] = useState<Set<string>>(new Set());
  const [absenceLoading, setAbsenceLoading] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const isMissing = sector.state === "missing";

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

  // ── Export handler: fetches real attendances then generates Excel ──────────
  // Período 21→20: e.g. Marzo 2026 = 2026-02-21 to 2026-03-20
  const handleExport = async () => {
    if (exporting || !window.electronAPI?.exportExcel) return;
    setExporting(true);
    try {
      // 1. Período 21→20
      const fromMonth = periodMonth === 1 ? 12 : periodMonth - 1;
      const fromYear = periodMonth === 1 ? periodYear - 1 : periodYear;
      const startDate = `${fromYear}-${String(fromMonth).padStart(2, '0')}-21`;
      const endDate = `${periodYear}-${String(periodMonth).padStart(2, '0')}-20`;

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
        if (adminToken) headers['Authorization'] = `Bearer ${adminToken}`;
        const absUrl = `https://staffaxis-api-prod.pgastonor.workers.dev/api/absences?sector_id=${encodeURIComponent(sector.apiId)}&start_date=${startDate}&end_date=${endDate}`;
        const absRes = await fetch(absUrl, { headers });
        if (absRes.ok) {
          const absData = await absRes.json();
          absences = absData.absences ?? [];
          console.log(`[Export] Ausencias del período: ${absences.length}`);
        }
      } catch (absErr) {
        console.warn('[Export] No se pudieron cargar ausencias:', absErr);
      }

      console.log(`[Export] Datos para excel: ${employees.length} empleados, ${attendances.length} asistencias, ${absences.length} ausencias`);

      // 4. Generar Excel con asistencias + ausencias
      const result = await window.electronAPI.exportExcel({
        sectorName: sector.name,
        encargado: sector.encargado,
        employees: employees,
        attendances: attendances,
        absences: absences,          // ← nuevo: ausencias del período
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

  // useEffect: carga empleados y ausencias del día
  useEffect(() => {
    setEmpLoading(true);
    setEmployees([]);
    setAbsentEmployeeIds(new Set());
    
    if (window.electronAPI?.getEmployees) {
      window.electronAPI.getEmployees(sector.apiId)
        .then((empData: any) => {
          console.log('Cargando datos del sector:', sector.apiId);
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
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const url = `https://staffaxis-api-prod.pgastonor.workers.dev/api/absences?sector_id=${encodeURIComponent(sector.apiId)}&start_date=${todayStr}&end_date=${todayStr}`;
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
    <div
      className="rounded-3xl overflow-hidden flex flex-col"
      style={{
        background: "#2A2A3E",
        border: "1.5px solid rgba(255,255,255,0.1)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)",
        width: 340,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ height: 4, background: "linear-gradient(90deg, #9C27B0, #26C6DA)" }} />
      <div className="p-7">
        <div className="flex items-start justify-between mb-5">
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

        {/* Stats counters — driven by real employee data once API endpoint is live */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {[
            {
              l: "Registros",
              v: empLoading ? "—" : employees.length.toLocaleString(),
              sub: "total"
            },
            {
              l: "Activos",
              v: empLoading ? "—" : employees.filter((e: Employee) => e.is_active).length.toLocaleString(),
              sub: "en nómina"
            },
            {
              l: "Horas",
              v: "—",   // from /api/attendances — endpoint pending
              sub: "asistencia"
            },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl px-3.5 py-3" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "0.09em", textTransform: "uppercase", marginBottom: 4 }}>{s.l}</p>
              <p className="text-white" style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em" }}>{s.v}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Employee List — fetched via useEffect on sector.apiId */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
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
          
          <div className="mb-3 px-3 py-1.5 rounded-xl flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <Search size={12} color="rgba(255,255,255,0.4)" />
            <input 
              placeholder="Buscar empleado..." 
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="bg-transparent outline-none w-full text-white placeholder-white/30"
              style={{ fontSize: 12 }}
            />
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
            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
              {employees.filter(emp => `${emp.first_name || ''} ${emp.last_name || ''} ${emp.dni || ''}`.toLowerCase().includes(localSearch.toLowerCase())).map((emp) => {
                const isAbsent = absentEmployeeIds.has(emp.id);
                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-colors"
                    style={{
                      background: isAbsent ? "rgba(255,82,82,0.12)" : "rgba(255,255,255,0.04)",
                      border: isAbsent ? "1px solid rgba(255,82,82,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex items-center justify-center rounded-full flex-shrink-0"
                        style={{
                          width: 28, height: 28,
                          background: isAbsent ? "rgba(255,82,82,0.2)" : "rgba(156,39,176,0.18)",
                          color: isAbsent ? "#FF5252" : "#C86FE8",
                          fontSize: 11, fontWeight: 700
                        }}
                      >
                        {emp.first_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 600, color: isAbsent ? "#ffaaaa" : "white" }}>
                          {emp.first_name} {emp.last_name}
                        </p>
                        {emp.dni && <p style={{ fontSize: 10, color: isAbsent ? "rgba(255,150,150,0.5)" : "rgba(255,255,255,0.35)" }}>DNI: {emp.dni}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAbsent && (
                        <span
                          className="px-2 py-0.5 rounded-full flex items-center gap-1"
                          style={{ fontSize: 10, fontWeight: 700, background: "rgba(255,82,82,0.25)", color: "#FF5252", border: "1px solid rgba(255,82,82,0.4)", letterSpacing: "0.04em" }}
                        >
                          <AlertCircle size={9} />
                          AUSENTE
                        </span>
                      )}
                      {!isAbsent && (
                        emp.is_active ? (
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 600, background: "rgba(76,175,80,0.15)", color: "#4CAF50" }}>
                            Activo
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full" style={{ fontSize: 10, fontWeight: 600, background: "rgba(255,82,82,0.15)", color: "#FF5252" }}>
                            Inactivo
                          </span>
                        )
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
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors"
                          style={{ cursor: "pointer", color: "#FF5252" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />

        {isAdmin && (
          <button
            onClick={onCreateEmployee}
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl transition-all hover:bg-white/10 mb-5"
            style={{ background: "rgba(156,39,176,0.15)", border: "1px dashed rgba(156,39,176,0.4)", cursor: "pointer", color: "#C86FE8", fontSize: 13, fontWeight: 700 }}
          >
            + Agregar Empleado a este Sector
          </button>
        )}

        <div className="flex flex-col gap-3 relative">

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

          {/* Period selector ─── Tarea 1: Período 21→20 */}
          <div className="mb-4">
            <p className="text-white/40 font-semibold uppercase tracking-wider mb-2" style={{ fontSize: 10 }}>Período de exportación</p>
            <div className="flex gap-2">
              <select
                value={periodMonth}
                onChange={(e) => setPeriodMonth(Number(e.target.value))}
                className="flex-1 rounded-xl px-3 py-2 text-white font-semibold appearance-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 13, cursor: "pointer", outline: "none" }}
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
                className="rounded-xl px-3 py-2 text-white font-semibold appearance-none"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 13, cursor: "pointer", outline: "none", width: 90 }}
              >
                {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y} style={{ background: "#2A2A3E" }}>{y}</option>)}
              </select>
            </div>
            <div className="mt-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)" }}>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, textAlign: "center" }}>
                Estás por exportar las horas del <strong className="text-white font-bold tracking-wide">21/{String(periodMonth === 1 ? 12 : periodMonth - 1).padStart(2, '0')}/{periodMonth === 1 ? periodYear - 1 : periodYear}</strong> al <strong className="text-white font-bold tracking-wide">20/{String(periodMonth).padStart(2, '0')}/{periodYear}</strong>.
              </p>
            </div>
          </div>

          <div
            onMouseEnter={() => isMissing && setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            className="w-full"
          >
            <button
              onClick={handleExport}
              // Eliminamos booleanos de disabled para probar el modal con click siempre
              disabled={exporting || empLoading}
              className={`flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl transition-all ${!exporting ? 'hover:opacity-90 active:scale-[0.98]' : 'opacity-50 cursor-not-allowed'}`}
              style={{ background: "linear-gradient(135deg, #4CAF50, #2E7D32)", border: "none", cursor: exporting ? "not-allowed" : "pointer", boxShadow: "0 6px 22px rgba(76,175,80,0.3)" }}
            >
              {exporting
                ? <><div className="rounded-full" style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.2)", borderTop: "2px solid #fff", animation: "spin 0.8s linear infinite" }} /><span className="text-white" style={{ fontSize: 13, fontWeight: 700 }}>Exportando...</span></>
                : <><FileSpreadsheet size={16} color="#fff" /><span className="text-white" style={{ fontSize: 13, fontWeight: 700 }}>Exportar en Excel</span></>}
            </button>
          </div>
        </div>
      </div>
    </div>
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
          const numericVal = parseFloat(str);
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
    window.electronAPI?.getEmployees(view.apiSector.apiId)
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
  const [activePanel, setActivePanel] = useState<'sectores' | 'informes'>('sectores');
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isLoading, setIsLoading] = useState(true);  // LaunchedEffect equivalent
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // visible error feedback
  
  const [searchQuery, setSearchQuery] = useState("");
  const [globalStats, setGlobalStats] = useState({ ausentes: 0, horasTotales: 0 });

  // Global Employee Search derived state
  const employeeSearchResults = useMemo(() => {
    if (searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return sectors.flatMap(s => (s.employeesList || [])
      .filter(e => `${e.first_name || ''} ${e.last_name || ''} ${e.dni || ''}`.toLowerCase().includes(q))
      .map(e => ({ emp: e, sector: s }))
    ).slice(0, 15);
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
  const isAdmin = getAdminUsername() === 'admin';

  useEffect(() => {
    // Fetch real notifications from the backend API
    fetch('https://staffaxis-api-prod.pgastonor.workers.dev/api/notifications')
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
    // Only verify if a token exists to auto-login on startup. No expiration intervals.
    const token = localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");
    if (token && !isLoggedIn) {
      setIsLoggedIn(true);
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
      const response = await fetch("https://staffaxis-api-prod.pgastonor.workers.dev/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await response.json();
      console.log("Respuesta de API Login:", data);

      if (response.ok && data.success) {
        const storage = keepLoggedIn ? localStorage : sessionStorage;
        storage.setItem("admin_token", data.token);
        storage.setItem("admin_user", JSON.stringify(data.user));
        setIsLoggedIn(true);
      } else {
        setLoginError(true);
        setLoginErrorMsg("Usuario o contraseña incorrectos");
      }
    } catch (err) {
      console.error("Error al intentar iniciar sesión:", err);
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
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      const userStr = localStorage.getItem("admin_user") || sessionStorage.getItem("admin_user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          if (userObj?.username) headers["X-User-Role"] = userObj.username;
        } catch (e) {}
      }
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

      const resAbs = await fetch(`https://staffaxis-api-prod.pgastonor.workers.dev/api/absences?start_date=${todayStr}&end_date=${todayStr}`, { headers });
      let ausentesCount = 0;
      if (resAbs.ok) {
         const d = await resAbs.json();
         ausentesCount = d.absences ? d.absences.length : 0;
         console.log("[Stats] Ausentes found:", ausentesCount);
      }

      let totalH = 0;
      if (sectors && sectors.length > 0) {
          const hoursArray = await Promise.all(sectors.map(async (sec) => {
              let sectorH = 0;
              const url = `https://staffaxis-api-prod.pgastonor.workers.dev/api/attendances?sector_id=${encodeURIComponent(sec.apiId)}&start_date=${todayStr}&end_date=${todayStr}`;
              try {
                  const res = await fetch(url, { headers });
                  if (res.ok) {
                      const data = await res.json();
                      if (data.attendances && Array.isArray(data.attendances)) {
                          for (const att of data.attendances) {
                               if (att.date === todayStr) {
                                   const val = String(att.work_value || att.minutes_worked || "");
                                   if (val && !val.startsWith("$") && val.toUpperCase() !== "C" && val !== "null") {
                                       const num = Number(val);
                                       if (!isNaN(num) && num > 0) sectorH += (num / 60);
                                   }
                               }
                          }
                      }
                  }
              } catch(err) {
                  console.error("[Stats] Error for sector", sec.name, err);
              }
              return sectorH;
          }));
          totalH = hoursArray.reduce((acc, curr) => acc + curr, 0);
      }

      console.log("[Stats] Total Horas calculated:", totalH);
      setGlobalStats({ ausentes: ausentesCount, horasTotales: totalH });
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
  const handleCreateAdmin = async () => {
    if (!newAdminUser || !newAdminPass) return setCreationError("Completá todos los campos");
    setCreationLoading(true); setCreationError("");
    
    const headers = getHeaders();
    console.log("Enviando headers para Crear Admin:", headers);

    try {
      const res = await fetch("https://staffaxis-api-prod.pgastonor.workers.dev/api/admin-users", {
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
      const res = await fetch("https://staffaxis-api-prod.pgastonor.workers.dev/api/sectors", {
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
      const res = await fetch("https://staffaxis-api-prod.pgastonor.workers.dev/api/employees", {
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
      const res = await fetch(`https://staffaxis-api-prod.pgastonor.workers.dev/api/employees/${id}`, {
        method: "DELETE", headers
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
      const res = await fetch(`https://staffaxis-api-prod.pgastonor.workers.dev/api/sectors/${id}`, {
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
      const res = await fetch("https://staffaxis-api-prod.pgastonor.workers.dev/api/admin-users", {
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
      const res = await fetch(`https://staffaxis-api-prod.pgastonor.workers.dev/api/admin-users/${editingAdmin.id}`, {
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
      const res = await fetch(`https://staffaxis-api-prod.pgastonor.workers.dev/api/admin-users/${id}`, {
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
    <div className="relative min-h-screen w-full" style={{ background: "#1E1E2E", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Absolute Box logic wrapper */}
      <div
        className="min-h-screen w-full flex flex-col transition-all duration-300"
        style={{
          filter: !isLoggedIn ? "blur(16px)" : "none",
          pointerEvents: !isLoggedIn ? "none" : "auto"
        }}
      >
        {/* HEADER */}
        <header className="flex items-center justify-between px-10 py-5 sticky top-0 z-10" style={{ background: "rgba(30,30,46,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
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

        {/* DASHBOARD ROW (2-Column Layout) */}
        <div className="flex-1 flex px-10 py-8 gap-8 mx-auto w-full" style={{ maxWidth: 1600 }}>

          {/* LEFT COLUMN (SIDEBAR) */}
          <div className="flex flex-col gap-6" style={{ width: 320, flexShrink: 0 }}>
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
          <div className="flex-1 flex flex-col">
            {/* Header row: Panel tabs + contextual actions */}
            <div className="flex items-center justify-between mb-6">
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
            {activePanel === 'informes' ? (
              <PanelInformes apiSectors={sectors} />
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

      {/* OVERRIDING LAYERS (Z-Index > 10) */}

      {/* Step 1 & 2: Floating Modal & Tooltip Overlay */}
      {
        selectedSector !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setSelectedSector(null)}
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
            <div className="rounded-3xl p-8 flex flex-col relative" style={{ background: "#2A2A3E", width: 400, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 32px 80px rgba(0,0,0,0.65)" }}>
              <h2 className="text-white mb-6 text-center" style={{ fontSize: 24, fontWeight: 800 }}>Iniciar Sesión</h2>

              <input
                type="text"
                placeholder="Usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={handleLoginKeyDown}
                className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 15 }}
              />

              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleLoginKeyDown}
                className="w-full px-4 py-3 rounded-xl text-white mb-4 outline-none"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 15 }}
              />

              <div className="flex items-center gap-3 mb-6">
                <input
                  type="checkbox"
                  checked={keepLoggedIn}
                  onChange={(e) => setKeepLoggedIn(e.target.checked)}
                  style={{ width: 16, height: 16, cursor: "pointer", accentColor: "#9C27B0" }}
                />
                <span className="text-white/70" style={{ fontSize: 14 }}>Mantener sesión iniciada</span>
              </div>

              {loginError && (
                <p className="mb-4 text-center" style={{ color: "#FF5252", fontSize: 13, fontWeight: 600 }}>{loginErrorMsg || "Usuario o contraseña incorrectos"}</p>
              )}

              <button
                onClick={attemptLogin}
                disabled={isLoggingIn}
                className="w-full py-3.5 rounded-xl transition-all hover:opacity-90 active:scale-[0.98] mt-2"
                style={{ background: isLoggingIn ? "#666" : "linear-gradient(135deg, #9C27B0, #26C6DA)", border: "none", cursor: isLoggingIn ? "not-allowed" : "pointer", boxShadow: isLoggingIn ? "none" : "0 6px 22px rgba(156,39,176,0.35)", color: "#fff", fontSize: 15, fontWeight: 700 }}
              >
                {isLoggingIn ? "Cargando..." : "Ingresar"}
              </button>
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
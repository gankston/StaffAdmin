import { BrowserWindow } from 'electron';

export interface ReportRow {
  employeeName: string;
  dni: string;
  sectorName: string;        // sector de la categoría (de donde se extrajo)
  recordSectorName: string;  // record_sector_name — donde se marcaron las horas
  hours: number;             // work_value (en horas)
  date: string;              // YYYY-MM-DD
}

export interface PdfReportParams {
  categoryName: string;
  periodMonth: number;
  periodYear: number;
  rows: ReportRow[];
  totalHours?: number;
}

const MONTH_NAMES_ES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function fmtDate(iso: string): string {
  // "2026-04-20" → "20/04/2026"
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function buildHTML(params: PdfReportParams): string {
  const { categoryName, periodMonth, periodYear, rows, totalHours } = params;
  const fromMonth = periodMonth === 1 ? 12 : periodMonth - 1;
  const fromYear = periodMonth === 1 ? periodYear - 1 : periodYear;
  const periodStr = `21 de ${MONTH_NAMES_ES[fromMonth]} ${fromYear} al 20 de ${MONTH_NAMES_ES[periodMonth]} ${periodYear}`;
  const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const totalRow = totalHours != null
    ? `<tr class="total-row"><td colspan="5"><strong>TOTAL HORAS</strong></td><td class="num">${totalHours}</td></tr>`
    : '';

  const tableRows = rows.length === 0
    ? `<tr><td colspan="6" class="empty">Sin registros para este período</td></tr>${totalRow}`
    : rows.map(r => `
        <tr>
          <td class="name">${r.employeeName}</td>
          <td class="dni">${r.dni}</td>
          <td>${r.sectorName}</td>
          <td class="loc">${r.recordSectorName}</td>
          <td class="num">${r.hours}</td>
          <td class="date">${fmtDate(r.date)}</td>
        </tr>`).join('') + totalRow;

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 10px;
    color: #111;
    padding: 32px 40px;
    background: white;
  }
  .header { margin-bottom: 20px; padding-bottom: 14px; border-bottom: 3px solid #1a1a2e; }
  h1 { font-size: 18px; font-weight: 900; color: #1a1a2e; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
  .meta { display: flex; gap: 28px; }
  .meta span { font-size: 9px; color: #666; }
  .meta strong { color: #333; }
  .badge {
    display: inline-block;
    background: #f0f0f8;
    border: 1px solid #d8d8ee;
    border-radius: 4px;
    padding: 3px 10px;
    font-size: 9px;
    font-weight: 600;
    color: #444;
    margin-bottom: 10px;
  }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #1a1a2e; }
  thead th {
    padding: 8px 10px;
    text-align: left;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: white;
  }
  thead th.num, thead th.date { text-align: right; }
  tbody tr { border-bottom: 1px solid #e4e4f0; }
  tbody tr:nth-child(even) { background: #f7f7fc; }
  tbody td { padding: 7px 10px; vertical-align: middle; }
  td.name { font-weight: 700; }
  td.dni { font-family: 'Courier New', monospace; color: #555; font-size: 9px; }
  td.loc { color: #2563eb; font-weight: 600; }
  td.num { text-align: right; font-weight: 700; color: #1a1a2e; }
  td.date { text-align: right; color: #555; font-size: 9px; }
  td.empty { text-align: center; color: #999; padding: 28px; font-style: italic; }
  tr.total-row td { background: #1a1a2e; color: white; font-weight: 900; padding: 9px 10px; font-size: 10px; }
  tr.total-row td.num { text-align: right; color: #7dd3fc; font-size: 13px; }
  .footer {
    margin-top: 18px;
    padding-top: 8px;
    border-top: 1px solid #ddd;
    font-size: 8px;
    color: #aaa;
    display: flex;
    justify-content: space-between;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>Informe ${categoryName}</h1>
    <div class="meta">
      <span><strong>Período:</strong> ${periodStr}</span>
      <span><strong>Generado:</strong> ${today}</span>
    </div>
  </div>
  <div class="badge">${rows.length} registro${rows.length !== 1 ? 's' : ''}</div>
  <table>
    <thead>
      <tr>
        <th>Nombre y Apellido</th>
        <th>DNI</th>
        <th>Sector</th>
        <th>Donde se marcó</th>
        <th class="num">Horas</th>
        <th class="date">Fecha</th>
      </tr>
    </thead>
    <tbody>${tableRows}</tbody>
  </table>
  <div class="footer">
    <span>StaffAdmin — Informe ${categoryName}</span>
    <span>${periodStr}</span>
  </div>
</body>
</html>`;
}

export async function generatePdfReport(
  params: PdfReportParams
): Promise<{ success: boolean; base64?: string; fileName?: string; error?: string }> {
  let win: BrowserWindow | null = null;
  try {
    win = new BrowserWindow({ show: false, webPreferences: { javascript: false } });
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(buildHTML(params)));

    const buf = await win.webContents.printToPDF({
      printBackground: true,
      landscape: false,
      pageSize: 'A4',
    });

    const fromMonth = params.periodMonth === 1 ? 12 : params.periodMonth - 1;
    const fromYear = params.periodMonth === 1 ? params.periodYear - 1 : params.periodYear;
    const fileName = `Informe_${params.categoryName.replace(/\s+/g, '_')}_${fromYear}-${String(fromMonth).padStart(2, '0')}_${params.periodYear}-${String(params.periodMonth).padStart(2, '0')}.pdf`;

    return { success: true, base64: buf.toString('base64'), fileName };
  } catch (err) {
    console.error('[generatePdfReport]', (err as Error).message);
    return { success: false, error: (err as Error).message };
  } finally {
    win?.close();
  }
}

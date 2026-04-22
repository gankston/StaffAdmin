import { BrowserWindow } from 'electron';

export interface ReportRow {
  employeeName: string;
  dni: string;
  sectorName: string;
  value: string;
}

export interface PdfReportParams {
  categoryName: string;
  periodMonth: number;
  periodYear: number;
  rows: ReportRow[];
}

const MONTH_NAMES_ES = [
  '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function buildHTML(params: PdfReportParams): string {
  const { categoryName, periodMonth, periodYear, rows } = params;
  const fromMonth = periodMonth === 1 ? 12 : periodMonth - 1;
  const fromYear = periodMonth === 1 ? periodYear - 1 : periodYear;
  const periodStr = `21 de ${MONTH_NAMES_ES[fromMonth]} ${fromYear} al 20 de ${MONTH_NAMES_ES[periodMonth]} ${periodYear}`;
  const today = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const tableRows = rows.length === 0
    ? `<tr><td colspan="4" class="empty">Sin registros para este período</td></tr>`
    : rows.map(r => `
        <tr>
          <td class="name">${r.employeeName}</td>
          <td class="dni">${r.dni}</td>
          <td>${r.sectorName}</td>
          <td class="value">${r.value}</td>
        </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 11px;
    color: #111;
    padding: 40px 48px;
    background: white;
  }
  .header { margin-bottom: 24px; padding-bottom: 16px; border-bottom: 3px solid #1a1a2e; }
  h1 { font-size: 20px; font-weight: 900; color: #1a1a2e; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
  .meta { display: flex; gap: 28px; }
  .meta span { font-size: 10px; color: #666; }
  .meta strong { color: #333; }
  .badge {
    display: inline-block;
    background: #f0f0f8;
    border: 1px solid #d8d8ee;
    border-radius: 4px;
    padding: 3px 10px;
    font-size: 10px;
    font-weight: 600;
    color: #444;
    margin-bottom: 12px;
  }
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #1a1a2e; }
  thead th {
    padding: 10px 14px;
    text-align: left;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: white;
  }
  thead th:last-child { text-align: right; }
  tbody tr { border-bottom: 1px solid #e4e4f0; }
  tbody tr:nth-child(even) { background: #f7f7fc; }
  tbody td { padding: 9px 14px; vertical-align: middle; }
  td.name { font-weight: 700; }
  td.dni { font-family: 'Courier New', monospace; color: #555; font-size: 10px; }
  td.value { text-align: right; font-weight: 700; color: #1a1a2e; }
  td.empty { text-align: center; color: #999; padding: 32px; font-style: italic; }
  .footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #ddd;
    font-size: 9px;
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
        <th>Empleado</th>
        <th>DNI</th>
        <th>Sector</th>
        <th>Registro</th>
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

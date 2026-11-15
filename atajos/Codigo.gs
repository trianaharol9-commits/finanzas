/**
 * Buzón de Finanzas — Google Apps Script
 *
 * Recibe gastos desde Atajos de iPhone (botón de Acción, Apple Pay) y los guarda
 * en esta hoja de cálculo. La app Finanzas los recoge al abrirse.
 *
 * Pega este código en: tu Google Sheet → Extensiones → Apps Script.
 * Cambia la CLAVE por una propia (letras y números, sin espacios).
 */
const CLAVE = 'PON_TU_CLAVE';
const HOJA = 'Buzón';
const ZONA = 'America/Bogota';
const COLUMNAS = ['id', 'recibido', 'fecha', 'monto', 'comercio', 'tarjeta', 'categoria', 'cuenta', 'nota', 'origen', 'estado'];

function doGet() {
  return ContentService.createTextOutput('Buzón de Finanzas activo ✓');
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.k !== CLAVE) return json_({ ok: false, error: 'clave' });
  let d = {};
  try { d = JSON.parse((e.postData && e.postData.contents) || '{}'); } catch (err) { d = {}; }
  d = Object.assign({}, p, d);

  const accion = d.accion || 'agregar';
  if (accion === 'ping') return json_({ ok: true });
  if (accion === 'pendientes') return json_({ ok: true, items: pendientes_() });
  if (accion === 'confirmar') { confirmar_(d.ids || []); return json_({ ok: true }); }
  return json_(agregar_(d));
}

function agregar_(d) {
  const monto = parseMonto_(d.monto);
  if (!monto) return { ok: false, error: 'monto' };
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const ahora = new Date();
    hoja_().appendRow([id, ahora, Utilities.formatDate(ahora, ZONA, 'yyyy-MM-dd'), monto,
      txt_(d.comercio), txt_(d.tarjeta), txt_(d.categoria), txt_(d.cuenta), txt_(d.nota), txt_(d.origen) || 'atajo', 'pendiente']);
    return { ok: true, id: id };
  } finally { lock.releaseLock(); }
}

function pendientes_() {
  const filas = hoja_().getDataRange().getValues();
  const items = [];
  for (let i = 1; i < filas.length; i++) {
    const f = filas[i];
    if (f[10] !== 'pendiente') continue;
    items.push({
      id: String(f[0]),
      fecha: f[2] instanceof Date ? Utilities.formatDate(f[2], ZONA, 'yyyy-MM-dd') : String(f[2]),
      monto: Number(f[3]) || 0,
      comercio: String(f[4]), tarjeta: String(f[5]), categoria: String(f[6]),
      cuenta: String(f[7]), nota: String(f[8]), origen: String(f[9]),
    });
  }
  return items;
}

function confirmar_(ids) {
  if (!ids.length) return;
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sh = hoja_(), filas = sh.getDataRange().getValues();
    for (let i = 1; i < filas.length; i++) {
      if (ids.indexOf(String(filas[i][0])) >= 0) sh.getRange(i + 1, 11).setValue('importado');
    }
  } finally { lock.releaseLock(); }
}

function hoja_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(HOJA);
  if (!sh) {
    sh = ss.insertSheet(HOJA);
    sh.appendRow(COLUMNAS);
    sh.setFrozenRows(1);
    sh.getRange('A:A').setNumberFormat('@');
  }
  return sh;
}

// Acepta 25000, "25.000", "$25.000,00", "COP 25,000.00"…
function parseMonto_(v) {
  if (typeof v === 'number') return Math.round(v);
  let s = String(v || '').replace(/[^\d.,]/g, '');
  const dec = s.match(/[.,]\d{1,2}$/);
  if (dec) s = s.slice(0, -dec[0].length);
  return Math.round(Number(s.replace(/[.,]/g, '')) || 0);
}

function txt_(v) { return v == null ? '' : String(v).trim(); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// Ejecuta esta función una vez desde el editor para crear la hoja y dar permisos.
function configurar() { hoja_(); }

'use strict';
/* =========================================================
   Finanzas — app personal de finanzas (PWA, datos locales)
   ========================================================= */

/* ---------- Utilidades ---------- */
const KEY = 'finanzas.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const pad = n => String(n).padStart(2, '0');
const toISO = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d || 1); };
const today = () => toISO(new Date());
const curMonth = () => today().slice(0, 7);
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const monthName = m => cap(MESES[+m.slice(5, 7) - 1]);
const monthLabel = m => monthName(m) + (+m.slice(0, 4) !== new Date().getFullYear() ? ' ' + m.slice(0, 4) : '');
const shiftMonth = (m, k) => { const d = parseISO(m + '-01'); d.setMonth(d.getMonth() + k); return toISO(d).slice(0, 7); };
const daysInMonth = m => new Date(+m.slice(0, 4), +m.slice(5, 7), 0).getDate();
const group3 = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const money = (n, sign = false) => { n = Math.round(n || 0); return (n < 0 ? '−' : sign && n > 0 ? '+' : '') + '$' + group3(Math.abs(n)); };
const plain = n => n ? group3(Math.round(Math.abs(n))) : '';
const parseMoney = s => parseInt(String(s).replace(/\D/g, ''), 10) || 0;
const pct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;

const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9v11h4.5v-6h4v6h4.5V9"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2" fill="currentColor"/><circle cx="4.5" cy="12" r="1.2" fill="currentColor"/><circle cx="4.5" cy="18" r="1.2" fill="currentColor"/></svg>',
  pie: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M11 4a8 8 0 1 0 9 9h-9z"/><path d="M14 2.8A8 8 0 0 1 21.2 10H14z"/></svg>',
  card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="2.8" y="5.5" width="18.4" height="13" rx="2.6"/><path d="M2.8 10h18.4M6.5 15h3.5"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  del: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><path d="M21 5H9.5L3 12l6.5 7H21z"/><path d="m11.5 9 6 6m0-6-6 6"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
};

/* ---------- Datos por defecto ---------- */
const ACCOUNT_TYPES = {
  debito: { label: 'Cuenta de ahorros / débito', section: 'Cuentas' },
  efectivo: { label: 'Efectivo', section: 'Cuentas' },
  ahorro: { label: 'Ahorro con rendimiento', section: 'Ahorro' },
  inversion: { label: 'Inversión', section: 'Inversiones' },
  credito: { label: 'Tarjeta de crédito', section: 'Tarjetas de crédito' },
};
const PALETTE = ['#F5B700', '#48484A', '#820AD1', '#00B386', '#34C759', '#007AFF', '#FF9500', '#FF2D55', '#5856D6', '#30B0C7'];
const DEFAULT_ACCOUNTS = [
  { id: 'bancolombia', name: 'Bancolombia', type: 'debito', initial: 0, color: '#F5B700' },
  { id: 'tc', name: 'Tarjeta de crédito', type: 'credito', initial: 0, color: '#48484A' },
  { id: 'nu', name: 'Nu · Cajita', type: 'ahorro', initial: 0, color: '#820AD1' },
  { id: 'lulo', name: 'Lulo Bank', type: 'ahorro', initial: 0, color: '#00B386' },
  { id: 'xtb', name: 'XTB', type: 'inversion', initial: 0, color: '#007AFF' },
  { id: 'efectivo', name: 'Efectivo', type: 'efectivo', initial: 0, color: '#34C759' },
];
const C = (id, name, emoji, kind, group) => ({ id, name, emoji, kind, group });
const DEFAULT_CATS = [
  C('arriendo', 'Arriendo', '🏠', 'gasto', 'fijo'),
  C('servicios', 'Servicios', '💡', 'gasto', 'fijo'),
  C('celular', 'Celular e internet', '📱', 'gasto', 'fijo'),
  C('suscripciones', 'Suscripciones', '📺', 'gasto', 'fijo'),
  C('salud', 'Salud y seguros', '🩺', 'gasto', 'fijo'),
  C('educacion', 'Educación', '🎓', 'gasto', 'fijo'),
  C('mercado', 'Mercado', '🛒', 'gasto', 'variable'),
  C('transporte', 'Transporte', '🚌', 'gasto', 'variable'),
  C('hogar', 'Hogar', '🧺', 'gasto', 'variable'),
  C('cuidado', 'Cuidado personal', '🧴', 'gasto', 'variable'),
  C('farmacia', 'Farmacia', '💊', 'gasto', 'variable'),
  C('otros', 'Otros', '📦', 'gasto', 'variable'),
  C('restaurantes', 'Restaurantes', '🍽️', 'gasto', 'ocio'),
  C('salidas', 'Salidas', '🍻', 'gasto', 'ocio'),
  C('compras', 'Compras', '🛍️', 'gasto', 'ocio'),
  C('viajes', 'Viajes', '✈️', 'gasto', 'ocio'),
  C('entretenimiento', 'Entretenimiento', '🎬', 'gasto', 'ocio'),
  C('nomina', 'Nómina', '💼', 'ingreso', null),
  C('rendimientos', 'Rendimientos', '📈', 'ingreso', null),
  C('extra', 'Ingreso extra', '💰', 'ingreso', null),
];
const GROUPS = {
  fijo: { label: 'Gastos fijos', color: 'var(--blue)' },
  variable: { label: 'Variables', color: 'var(--orange)' },
  ocio: { label: 'Ocio', color: 'var(--purple)' },
  ahorro: { label: 'Ahorro', color: 'var(--green)' },
  inversion: { label: 'Inversión', color: 'var(--teal)' },
};

/* ---------- Estado y persistencia ---------- */
const S = { data: null, tab: 'inicio', month: curMonth(), filter: 'todos', q: '' };

function seed() {
  return {
    version: 1, onboarded: false, lastAccount: 'bancolombia',
    accounts: DEFAULT_ACCOUNTS.map(a => ({ ...a })),
    categories: DEFAULT_CATS.map(c => ({ ...c })),
    txs: [], plans: {},
  };
}
function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) { console.error(e); }
  return seed();
}
function normalize(d) {
  const base = seed();
  return { ...base, ...d, accounts: d.accounts || base.accounts, categories: d.categories || base.categories, txs: d.txs || [], plans: d.plans || {} };
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S.data)); }
  catch (e) { toast('No se pudo guardar'); }
}
let saveTimer;
const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(save, 300); };

/* ---------- Consultas ---------- */
const acc = id => S.data.accounts.find(a => a.id === id);
const cat = id => S.data.categories.find(c => c.id === id);
const plan = m => S.data.plans[m];
function ensurePlan(m) {
  if (!S.data.plans[m]) S.data.plans[m] = { income: 0, fixed: [], variable: 0, ocio: 0, ahorro: 0, inversion: 0 };
  return S.data.plans[m];
}
const fixedTotal = p => p.fixed.reduce((s, f) => s + (f.amount || 0), 0);

function balance(a) {
  let b = a.initial || 0;
  for (const t of S.data.txs) {
    if (t.type === 'transfer') {
      if (t.accountId === a.id) b -= t.amount;
      if (t.toAccountId === a.id) b += t.amount;
    } else if (t.accountId === a.id) {
      b += t.type === 'gasto' ? -t.amount : t.amount; // ingreso y ajuste suman (el ajuste puede ser negativo)
    }
  }
  return b;
}
const sortTx = (a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0);
const monthTxs = m => S.data.txs.filter(t => t.date.slice(0, 7) === m).sort(sortTx);

function stats(m) {
  const r = { ingresos: 0, gastos: 0, fijo: 0, variable: 0, ocio: 0, ahorro: 0, inversion: 0 };
  for (const t of monthTxs(m)) {
    if (t.type === 'ingreso') r.ingresos += t.amount;
    else if (t.type === 'gasto') {
      r.gastos += t.amount;
      r[cat(t.categoryId)?.group || 'variable'] += t.amount;
    } else if (t.type === 'transfer') {
      const ft = acc(t.accountId)?.type, tt = acc(t.toAccountId)?.type;
      for (const k of ['ahorro', 'inversion']) {
        if (tt === k && ft !== k) r[k] += t.amount;
        if (ft === k && tt !== k) r[k] -= t.amount;
      }
    }
  }
  return r;
}
function planParts(p) {
  const parts = { fijo: fixedTotal(p), variable: p.variable, ocio: p.ocio, ahorro: p.ahorro, inversion: p.inversion };
  const assigned = Object.values(parts).reduce((a, b) => a + b, 0);
  return { parts, assigned, free: p.income - assigned };
}
const isPaid = f => S.data.txs.some(t => t.planItemId === f.id);
function usage() {
  const since = toISO(new Date(Date.now() - 90 * 864e5)), u = {};
  for (const t of S.data.txs) if (t.categoryId && t.date >= since) u[t.categoryId] = (u[t.categoryId] || 0) + 1;
  return u;
}
function catsFor(kind) {
  // Las más usadas primero; si empatan, las del día a día (variables, ocio) antes que las fijas.
  const u = usage(), rank = { variable: 0, ocio: 1, fijo: 2 };
  return S.data.categories.map((c, i) => ({ c, i })).filter(x => x.c.kind === kind)
    .sort((a, b) => (u[b.c.id] || 0) - (u[a.c.id] || 0) || (rank[a.c.group] ?? 0) - (rank[b.c.group] ?? 0) || a.i - b.i).map(x => x.c);
}
function dayLabel(iso) {
  if (iso === today()) return 'Hoy';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (iso === toISO(y)) return 'Ayer';
  return parseISO(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', '');
}

/* ---------- Componentes ---------- */
const monthNav = () => `<div class="month-nav"><button data-act="prev-month" aria-label="Mes anterior">${ICON.chevL}</button><span>${monthLabel(S.month)}</span><button data-act="next-month" aria-label="Mes siguiente">${ICON.chevR}</button></div>`;
const header = (title, right = '') => `<header class="large"><h1>${title}</h1>${right}</header>`;
const bar = (val, max, color) => `<div class="bar"><i style="width:${Math.min(100, max > 0 ? val / max * 100 : 0)}%;background:${color}"></i></div>`;
const accIcon = a => `<span class="ic letter" style="background:${a?.color || '#8E8E93'}">${esc((a?.name || '?').charAt(0).toUpperCase())}</span>`;

function txRow(t) {
  const a = acc(t.accountId);
  let icon, title, sub, amt, cls = '';
  if (t.type === 'transfer') {
    icon = '<span class="ic g-otro">⇄</span>';
    title = t.note || 'Transferencia';
    sub = `${a?.name || '—'} → ${acc(t.toAccountId)?.name || '—'}`;
    amt = money(t.amount); cls = 'muted';
  } else if (t.type === 'ajuste') {
    icon = '<span class="ic g-otro">⚖️</span>';
    title = 'Ajuste de saldo'; sub = a?.name || '—';
    amt = money(t.amount, true); cls = 'muted';
  } else {
    const c = cat(t.categoryId);
    icon = `<span class="ic g-${c?.group || 'ingreso'}">${c?.emoji || '•'}</span>`;
    title = t.note || c?.name || 'Sin categoría';
    sub = (t.note && t.note !== c?.name ? (c?.name || '') + ' · ' : '') + (a?.name || '—');
    amt = t.type === 'gasto' ? money(-t.amount) : money(t.amount, true);
    cls = t.type === 'ingreso' ? 'pos' : '';
  }
  return `<button class="row" data-act="edit-tx" data-id="${t.id}">${icon}<span class="row-main"><span class="row-title">${esc(title)}</span><span class="row-sub">${esc(sub)}</span></span><span class="amt ${cls}">${amt}</span></button>`;
}

/* ---------- Vistas ---------- */
function viewInicio() {
  const m = S.month, p = plan(m), r = stats(m);
  const isCur = m === curMonth();
  let hero;
  if (p && (p.variable || p.ocio)) {
    const budget = p.variable + p.ocio, spent = r.variable + r.ocio, left = budget - spent;
    const daysLeft = isCur ? daysInMonth(m) - new Date().getDate() + 1 : 0;
    const color = left < 0 ? 'var(--red)' : spent / budget > .85 ? 'var(--orange)' : 'var(--green)';
    hero = `<div class="card hero">
      <div class="hero-label">Te queda para el día a día</div>
      <div class="hero-amount ${left < 0 ? 'neg' : ''}">${money(left)}</div>
      <div class="hero-sub">${daysLeft ? `≈ ${money(Math.max(left, 0) / daysLeft)} por día · ${daysLeft} ${daysLeft === 1 ? 'día' : 'días'}` : 'Variables + ocio del mes'}</div>
      ${bar(spent, budget, color)}
      <div class="hero-foot"><span>Gastado ${money(spent)}</span><span>de ${money(budget)}</span></div>
    </div>`;
  } else {
    hero = `<div class="card hero empty">
      <div class="hero-label">Sin plan para ${monthName(m).toLowerCase()}</div>
      <p>Define cuánto ganas, tus gastos fijos y cuánto quieres para variables, ocio, ahorro e inversión.</p>
      <button class="btn-primary" data-act="tab" data-tab="plan">Armar mi plan</button>
    </div>`;
  }
  const tiles = `<div class="tiles">
    <div class="tile"><div class="k"><span class="dot" style="background:var(--green)"></span>Ingresos</div><div class="v">${money(r.ingresos)}</div></div>
    <div class="tile"><div class="k"><span class="dot" style="background:var(--red)"></span>Gastos</div><div class="v">${money(r.gastos)}</div></div>
  </div>`;

  let progress = '';
  if (p) {
    const pp = planParts(p).parts;
    const rows = ['fijo', 'variable', 'ocio', 'ahorro', 'inversion'].filter(k => pp[k] || r[k]).map(k => {
      const goal = k === 'ahorro' || k === 'inversion';
      const ratio = pp[k] ? r[k] / pp[k] : (r[k] ? 2 : 0);
      const color = goal ? GROUPS[k].color : ratio > 1 ? 'var(--red)' : ratio > .85 && k !== 'fijo' ? 'var(--orange)' : GROUPS[k].color;
      return `<div class="prog"><div class="prog-top"><span class="name"><span class="dot" style="background:${GROUPS[k].color}"></span>${GROUPS[k].label}</span><span class="val">${money(r[k])} de ${money(pp[k])}</span></div>${bar(r[k], pp[k], color)}</div>`;
    }).join('');
    if (rows) progress = `<h3 class="sec">Plan vs. real <button class="link" data-act="tab" data-tab="plan">Ver plan</button></h3><div class="group">${rows}</div>`;
  }

  const recent = monthTxs(m).slice(0, 5);
  const recentHTML = recent.length
    ? `<h3 class="sec">Últimos movimientos <button class="link" data-act="tab" data-tab="movimientos">Ver todos</button></h3><div class="group">${recent.map(txRow).join('')}</div>`
    : `<div class="empty-state"><div class="big">🪙</div>Aún no hay movimientos este mes.<br>Toca <b>+</b> para registrar el primero.</div>`;

  return header('Inicio', monthNav()) + hero + tiles + progress + recentHTML;
}

function viewMovimientos() {
  const r = stats(S.month);
  const f = [['todos', 'Todos'], ['gasto', 'Gastos'], ['ingreso', 'Ingresos'], ['transfer', 'Transf.']];
  return header('Movimientos', monthNav()) + `
    <label class="search">${ICON.search}<input id="tx-search" type="search" placeholder="Buscar" value="${esc(S.q)}" autocomplete="off"></label>
    <div class="seg" style="margin-top:10px" id="tx-filter">${f.map(([k, l]) => `<button class="${S.filter === k ? 'on' : ''}" data-act="filter" data-v="${k}">${l}</button>`).join('')}</div>
    <div class="month-total"><span>Ingresos <b class="pos">${money(r.ingresos)}</b></span><span>Gastos <b>${money(r.gastos)}</b></span></div>
    <div id="txlist">${txListHTML()}</div>`;
}
function txListHTML() {
  const q = S.q.trim().toLowerCase();
  const list = monthTxs(S.month).filter(t => {
    if (S.filter !== 'todos' && t.type !== S.filter) return false;
    if (!q) return true;
    const hay = [t.note, cat(t.categoryId)?.name, acc(t.accountId)?.name, acc(t.toAccountId)?.name, String(t.amount)].join(' ').toLowerCase();
    return hay.includes(q);
  });
  if (!list.length) return `<div class="empty-state"><div class="big">🔍</div>${q || S.filter !== 'todos' ? 'No hay resultados.' : 'No hay movimientos en ' + monthName(S.month).toLowerCase() + '.'}</div>`;
  const days = {};
  for (const t of list) (days[t.date] ||= []).push(t);
  return Object.entries(days).map(([d, ts]) => {
    const spent = ts.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0);
    return `<div class="day-head"><span>${dayLabel(d)}</span><span>${spent ? money(-spent) : ''}</span></div><div class="group">${ts.map(txRow).join('')}</div>`;
  }).join('');
}

function viewPlan() {
  const m = S.month, p = plan(m), r = stats(m);
  const head = header('Plan', monthNav());
  if (!p) {
    const prev = plan(shiftMonth(m, -1));
    return head + `<div class="card hero empty">
      <div class="hero-label">Plan de ${monthName(m).toLowerCase()}</div>
      <p>Igual que tu hoja de cada mes: cuánto ganas, tus gastos fijos, y cómo repartes el resto entre variables, ocio, ahorro e inversión.</p>
      ${prev ? `<button class="btn-primary" data-act="plan-copy">Copiar plan de ${monthName(shiftMonth(m, -1)).toLowerCase()}</button>` : ''}
      <button class="${prev ? 'btn-secondary' : 'btn-primary'}" data-act="plan-new">Crear plan desde cero</button>
    </div>`;
  }
  const ft = fixedTotal(p);
  const fixedRows = p.fixed.map(f => {
    const paid = isPaid(f), c = cat(f.categoryId);
    return `<div class="row"><button class="row-main" style="text-align:left;flex-direction:row;align-items:center;gap:12px" data-act="plan-edit-fixed" data-id="${f.id}">
        <span class="ic g-fijo">${c?.emoji || '📌'}</span>
        <span class="row-main"><span class="row-title">${esc(f.name)}</span><span class="row-sub">${money(f.amount)} · ${esc(acc(f.accountId)?.name || '')}</span></span>
      </button>
      ${paid ? '<span class="pill done">Pagado ✓</span>' : `<button class="pill pay" data-act="plan-pay" data-id="${f.id}">Pagar</button>`}
    </div>`;
  }).join('');
  const distRow = (k, hint) => `<label class="row">
      <span class="ic" style="background:color-mix(in srgb, ${GROUPS[k].color} 16%, transparent)"><span class="dot" style="background:${GROUPS[k].color};width:12px;height:12px"></span></span>
      <span class="row-main"><span class="row-title">${GROUPS[k].label}</span><span class="row-sub">${hint}: ${money(r[k])}${p[k] ? ` · ${pct(r[k], p[k])}%` : ''}</span></span>
      <span class="money-wrap">$<input class="money-in" data-plan="${k}" inputmode="numeric" value="${plain(p[k])}" placeholder="0"></span>
    </label>`;
  return head + `
    <div class="card" id="plan-summary">${planSummary(p)}</div>
    <h3 class="sec">Ingresos</h3>
    <div class="group"><label class="row">
      <span class="ic g-ingreso">💼</span>
      <span class="row-main"><span class="row-title">Ingreso del mes</span><span class="row-sub">Recibido: ${money(r.ingresos)}</span></span>
      <span class="money-wrap">$<input class="money-in" data-plan="income" inputmode="numeric" value="${plain(p.income)}" placeholder="0"></span>
    </label></div>
    <h3 class="sec"><span>Gastos fijos</span><span>${money(ft)}</span></h3>
    <div class="group">${fixedRows}<button class="row add plain" data-act="plan-add-fixed">+ Agregar gasto fijo</button></div>
    <p class="foot-note">Toca <b>Pagar</b> cuando pagues un fijo y quedará registrado como gasto.</p>
    <h3 class="sec">Distribución</h3>
    <div class="group">${distRow('variable', 'Gastado')}${distRow('ocio', 'Gastado')}${distRow('ahorro', 'Ahorrado')}${distRow('inversion', 'Invertido')}</div>
    <p class="foot-note">Variables y ocio son tu presupuesto del día a día. El ahorro y la inversión se cuentan cuando transfieres dinero a una cuenta de ahorro (Nu, Lulo) o de inversión (XTB).</p>
    <button class="danger-btn" data-act="plan-delete">Eliminar plan de ${monthName(m).toLowerCase()}</button>`;
}
function planSummary(p) {
  const { parts, free } = planParts(p);
  const base = Math.max(p.income, Object.values(parts).reduce((a, b) => a + b, 0)) || 1;
  const segs = Object.entries(parts).filter(([, v]) => v > 0).map(([k, v]) => `<i style="width:${v / base * 100}%;background:${GROUPS[k].color}"></i>`).join('');
  const freeCls = free < 0 ? 'neg' : free > 0 ? 'warn' : 'pos';
  const freeLabel = free < 0 ? 'Te pasaste por' : free > 0 ? 'Sin asignar' : 'Todo asignado ✓';
  return `<div class="hero-label">Ingreso del mes</div>
    <div class="hero-amount">${money(p.income)}</div>
    <div class="stack">${segs}</div>
    <div class="legend">
      ${Object.entries(parts).map(([k, v]) => `<div><span class="dot" style="background:${GROUPS[k].color}"></span>${GROUPS[k].label}<span class="lv muted">${pct(v, p.income)}%</span><span class="lv" style="margin-left:12px;min-width:96px;text-align:right">${money(v)}</span></div>`).join('')}
      <div class="total"><span>${freeLabel}</span><span class="lv ${freeCls}">${free === 0 ? '' : money(Math.abs(free))}</span></div>
    </div>`;
}

function viewCuentas() {
  const bals = S.data.accounts.map(a => ({ a, b: balance(a) }));
  const assets = bals.filter(x => x.b > 0).reduce((s, x) => s + x.b, 0);
  const debts = bals.filter(x => x.b < 0).reduce((s, x) => s - x.b, 0);
  const sections = {};
  for (const x of bals) (sections[ACCOUNT_TYPES[x.a.type]?.section || 'Cuentas'] ||= []).push(x);
  const order = ['Cuentas', 'Ahorro', 'Inversiones', 'Tarjetas de crédito'];
  const secHTML = order.filter(s => sections[s]).map(s => {
    const total = sections[s].reduce((t, x) => t + x.b, 0);
    return `<h3 class="sec"><span>${s}</span><span>${s === 'Tarjetas de crédito' ? (total < 0 ? 'Deuda ' + money(-total) : money(total)) : money(total)}</span></h3>
    <div class="group">${sections[s].map(({ a, b }) => `<button class="row" data-act="edit-acc" data-id="${a.id}">${accIcon(a)}
      <span class="row-main"><span class="row-title">${esc(a.name)}</span><span class="row-sub">${ACCOUNT_TYPES[a.type]?.label || ''}</span></span>
      <span class="amt ${b < 0 ? 'neg' : ''}">${a.type === 'credito' ? (b < 0 ? money(-b) : b > 0 ? 'A favor ' + money(b) : '$0') : money(b)}</span>${ICON.chev}</button>`).join('')}</div>`;
  }).join('');
  return header('Cuentas') + `
    <div class="card"><div class="hero-label">Patrimonio neto</div><div class="hero-amount ${assets - debts < 0 ? 'neg' : ''}">${money(assets - debts)}</div>
      <div class="hero-foot" style="justify-content:flex-start;gap:18px;margin-top:2px"><span>Tienes <b class="pos">${money(assets)}</b></span><span>Debes <b class="${debts ? 'neg' : ''}">${money(debts)}</b></span></div></div>
    ${secHTML}
    <div class="group" style="margin-top:12px"><button class="row add plain" data-act="add-acc">+ Agregar cuenta</button></div>
    <h3 class="sec">Ajustes</h3>
    <div class="group">
      <button class="row plain" data-act="cats"><span class="row-main"><span class="row-title">Categorías</span></span>${ICON.chev}</button>
      <button class="row plain" data-act="export"><span class="row-main"><span class="row-title">Exportar copia de seguridad</span><span class="row-sub">Guárdala en iCloud Drive o Archivos</span></span>${ICON.chev}</button>
      <button class="row plain" data-act="import"><span class="row-main"><span class="row-title">Restaurar copia de seguridad</span></span>${ICON.chev}</button>
    </div>
    <p class="foot-note">Tus datos se guardan solo en este iPhone, nada sale a internet. Exporta una copia de vez en cuando por si cambias o pierdes el teléfono.</p>
    <div class="group" style="margin-top:26px"><button class="row plain" data-act="reset" style="color:var(--red);justify-content:center">Borrar todos los datos</button></div>`;
}

const VIEWS = { inicio: viewInicio, movimientos: viewMovimientos, plan: viewPlan, cuentas: viewCuentas };
function render() {
  $('#main').innerHTML = VIEWS[S.tab]();
  $$('.tab[data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
}

/* ---------- Hojas modales ---------- */
let sheetLocked = false;
function openSheet(html, { locked = false } = {}) {
  sheetLocked = locked;
  const root = $('#sheet-root');
  root.innerHTML = `<div class="backdrop" data-act="backdrop"></div><div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  root.classList.add('open');
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('show')));
}
function setSheet(html) {
  const sh = $('#sheet-root .sheet'); if (!sh) return openSheet(html);
  const body = sh.querySelector('.sheet-body'), top = body ? body.scrollTop : 0;
  sh.innerHTML = html;
  const nb = sh.querySelector('.sheet-body'); if (nb) nb.scrollTop = top;
}
function closeSheet() {
  const root = $('#sheet-root');
  root.classList.remove('show');
  setTimeout(() => { if (!root.classList.contains('show')) { root.classList.remove('open'); root.innerHTML = ''; } }, 320);
}
const sheetHead = (title, left = 'Cancelar', right = 'Guardar', rightAct = '') =>
  `<header class="sheet-head"><button class="link" data-act="close-sheet" style="justify-self:start">${left}</button><h2>${title}</h2>${right ? `<button class="link strong" data-act="${rightAct}">${right}</button>` : '<span></span>'}</header>`;

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- Registro rápido ---------- */
let Q = null;
const TYPE_LABEL = { gasto: 'Gasto', ingreso: 'Ingreso', transfer: 'Transferencia' };
function openQuick(o = {}) {
  const t = o.id && S.data.txs.find(x => x.id === o.id);
  if (t && t.type === 'ajuste') return openAjuste(t);
  const first = S.data.accounts.find(a => a.type !== 'credito' && a.type !== 'inversion') || S.data.accounts[0];
  Q = t ? { ...t, amount: String(t.amount), note: t.note || '' } : {
    type: o.type || 'gasto', amount: String(o.amount || 0), categoryId: o.categoryId || null,
    accountId: o.accountId || (acc(S.data.lastAccount) ? S.data.lastAccount : first?.id), toAccountId: null,
    date: o.date || today(), note: o.note || '', planItemId: o.planItemId || null,
  };
  openSheet(quickHTML());
}
function accChips(act, sel) {
  return `<div class="chips">${S.data.accounts.map(a => `<button class="chip ${sel === a.id ? 'on' : ''}" data-act="${act}" data-id="${a.id}"><span class="dot" style="background:${a.color}"></span>${esc(a.name)}</button>`).join('')}</div>`;
}
function quickHTML() {
  const y = new Date(); y.setDate(y.getDate() - 1);
  const yISO = toISO(y), other = Q.date !== today() && Q.date !== yISO;
  const amt = +Q.amount;
  return sheetHead(`${Q.id ? 'Editar' : 'Nuevo'} ${TYPE_LABEL[Q.type].toLowerCase()}`, 'Cancelar', 'Guardar', 'q-save') + `
    <div class="sheet-top">
      <div class="seg">${Object.keys(TYPE_LABEL).map(k => `<button class="${Q.type === k ? 'on' : ''}" data-act="q-type" data-v="${k}">${TYPE_LABEL[k]}</button>`).join('')}</div>
      <div class="q-amount ${Q.type} ${amt ? '' : 'zero'}" id="q-amount">${money(amt)}</div>
    </div>
    <div class="sheet-body">
      ${Q.type === 'transfer'
        ? `<div class="field-label" style="margin-top:4px">Desde</div>${accChips('q-acc', Q.accountId)}<div class="field-label">Hacia</div>${accChips('q-to', Q.toAccountId)}`
        : `<div class="cat-grid">${catsFor(Q.type).map(c => `<button class="cat ${Q.categoryId === c.id ? 'on' : ''}" data-act="q-cat" data-id="${c.id}"><span class="cat-ic g-${c.group || 'ingreso'}">${c.emoji}</span><span class="cat-name">${esc(c.name)}</span></button>`).join('')}</div>
           <div class="field-label">Cuenta</div>${accChips('q-acc', Q.accountId)}`}
      <div class="field-label">Fecha</div>
      <div class="chips">
        <button class="chip ${Q.date === today() ? 'on' : ''}" data-act="q-date" data-v="${today()}">Hoy</button>
        <button class="chip ${Q.date === yISO ? 'on' : ''}" data-act="q-date" data-v="${yISO}">Ayer</button>
        <label class="chip ${other ? 'on' : ''}">${other ? dayLabel(Q.date) : 'Otra fecha'}<input type="date" id="q-date" value="${Q.date}"></label>
      </div>
      <input class="note" id="q-note" type="text" placeholder="Nota (opcional)" value="${esc(Q.note)}" maxlength="60" enterkeyhint="done" autocomplete="off">
      ${Q.id ? '<button class="danger-btn" data-act="q-delete">Eliminar movimiento</button>' : ''}
    </div>
    <div class="keypad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'del'].map(k =>
      `<button class="${k === 'del' || k === '000' ? 'fn' : ''}" data-act="q-key" data-k="${k}" aria-label="${k === 'del' ? 'Borrar' : k}">${k === 'del' ? ICON.del : k}</button>`).join('')}</div>`;
}
function updateAmount() {
  const el = $('#q-amount'); if (!el) return;
  const amt = +Q.amount; el.textContent = money(amt); el.classList.toggle('zero', !amt);
}
function saveQuick() {
  const amount = +Q.amount;
  if (!amount) return toast('Escribe un valor');
  if (Q.type !== 'transfer' && !Q.categoryId) return toast('Elige una categoría');
  if (Q.type === 'transfer') {
    if (!Q.toAccountId) return toast('Elige la cuenta destino');
    if (Q.toAccountId === Q.accountId) return toast('Elige dos cuentas distintas');
  }
  if (!acc(Q.accountId)) return toast('Elige una cuenta');
  const tx = { id: Q.id || uid(), type: Q.type, amount, accountId: Q.accountId, date: Q.date, note: (Q.note || '').trim(), createdAt: Q.createdAt || Date.now() };
  if (Q.type === 'transfer') tx.toAccountId = Q.toAccountId; else tx.categoryId = Q.categoryId;
  if (Q.planItemId && Q.type === 'gasto') tx.planItemId = Q.planItemId;
  const i = S.data.txs.findIndex(x => x.id === tx.id);
  if (i >= 0) S.data.txs[i] = tx; else S.data.txs.push(tx);
  S.data.lastAccount = Q.accountId;
  save(); closeSheet(); render();
  toast(i >= 0 ? 'Cambios guardados' : `${TYPE_LABEL[Q.type]} guardado ✓`);
}
function openAjuste(t) {
  openSheet(sheetHead('Ajuste de saldo', 'Cerrar', '') + `<div class="sheet-body">
    <div class="card"><div class="hero-label">${esc(acc(t.accountId)?.name || '')} · ${dayLabel(t.date)}</div><div class="hero-amount">${money(t.amount, true)}</div>
    <div class="hero-sub" style="margin:0">Se creó al ajustar el saldo de la cuenta. No cuenta como ingreso ni gasto.</div></div>
    <button class="danger-btn" data-act="tx-delete" data-id="${t.id}">Eliminar ajuste</button></div>`);
}

/* ---------- Gasto fijo (plan) ---------- */
let F = null;
function openFixed(id) {
  const p = ensurePlan(S.month), f = id && p.fixed.find(x => x.id === id);
  F = f ? { ...f } : { id: null, name: '', amount: 0, categoryId: 'arriendo', accountId: S.data.accounts.find(a => a.type === 'debito')?.id || S.data.accounts[0]?.id };
  const gastoCats = S.data.categories.filter(c => c.kind === 'gasto');
  openSheet(sheetHead(F.id ? 'Gasto fijo' : 'Nuevo gasto fijo', 'Cancelar', 'Guardar', 'fixed-save') + `<div class="sheet-body">
    <div class="group">
      <label class="form-row"><span>Nombre</span><input type="text" id="f-name" value="${esc(F.name)}" placeholder="Ej: Arriendo" maxlength="40"></label>
      <label class="form-row"><span>Valor</span><span class="money-wrap">$<input class="money-in" id="f-amount" inputmode="numeric" value="${plain(F.amount)}" placeholder="0"></span></label>
      <label class="form-row"><span>Categoría</span><select id="f-cat">${gastoCats.map(c => `<option value="${c.id}" ${c.id === F.categoryId ? 'selected' : ''}>${c.emoji} ${esc(c.name)}</option>`).join('')}</select></label>
      <label class="form-row"><span>Se paga desde</span><select id="f-acc">${S.data.accounts.map(a => `<option value="${a.id}" ${a.id === F.accountId ? 'selected' : ''}>${esc(a.name)}</option>`).join('')}</select></label>
    </div>
    ${F.id ? '<button class="danger-btn" data-act="fixed-delete">Eliminar gasto fijo</button>' : ''}
  </div>`);
  if (!F.id) setTimeout(() => $('#f-name')?.focus(), 350);
}

/* ---------- Cuentas ---------- */
let A = null;
function openAccount(id) {
  const a = id && acc(id);
  A = a ? { ...a } : { id: null, name: '', type: 'debito', initial: 0, color: PALETTE[5] };
  renderAccountSheet(false);
}
function renderAccountSheet(replace = true) {
  const isCredit = A.type === 'credito', b = A.id ? balance(acc(A.id)) : 0;
  const html = sheetHead(A.id ? 'Cuenta' : 'Nueva cuenta', 'Cancelar', 'Guardar', 'acc-save') + `<div class="sheet-body">
    <div class="group">
      <label class="form-row"><span>Nombre</span><input type="text" id="a-name" value="${esc(A.name)}" placeholder="Ej: Davivienda" maxlength="30"></label>
      <label class="form-row"><span>Tipo</span><select id="a-type">${Object.entries(ACCOUNT_TYPES).map(([k, v]) => `<option value="${k}" ${k === A.type ? 'selected' : ''}>${v.label}</option>`).join('')}</select></label>
      <label class="form-row"><span id="a-init-label">${isCredit ? 'Deuda inicial' : 'Saldo inicial'}</span><span class="money-wrap">$<input class="money-in" id="a-initial" inputmode="numeric" value="${plain(A.initial)}" placeholder="0"></span></label>
    </div>
    <h3 class="sec">Color</h3>
    <div class="group"><div class="swatches">${PALETTE.map(c => `<button class="swatch ${c === A.color ? 'on' : ''}" style="background:${c}" data-act="acc-color" data-v="${c}" aria-label="Color"></button>`).join('')}</div></div>
    ${A.id ? `
      <h3 class="sec">${isCredit ? 'Deuda actual' : 'Saldo actual'}: ${money(isCredit ? -b : b)}</h3>
      <div class="group"><label class="form-row"><span>${isCredit ? 'Deuda real hoy' : 'Saldo real hoy'}</span><span class="money-wrap">$<input class="money-in" id="a-real" inputmode="numeric" placeholder="${plain(Math.abs(b)) || '0'}"></span></label>
      <button class="row add plain" data-act="acc-adjust" style="justify-content:center">Ajustar saldo</button></div>
      <p class="foot-note">Si el saldo de la app no coincide con el del banco (por ejemplo por rendimientos de la cajita o cambios en tus acciones), escribe el valor real y toca Ajustar.</p>
      <button class="danger-btn" data-act="acc-delete">Eliminar cuenta</button>` : ''}
  </div>`;
  replace ? setSheet(html) : openSheet(html);
}
function readAccountForm() {
  A.name = $('#a-name').value.trim();
  A.type = $('#a-type').value;
  const v = parseMoney($('#a-initial').value);
  A.initial = A.type === 'credito' ? -v : v;
}

/* ---------- Categorías ---------- */
let K = null;
function openCats(replace = false) {
  const sections = [['fijo', 'Gastos fijos'], ['variable', 'Gastos variables'], ['ocio', 'Ocio'], [null, 'Ingresos']];
  const html = sheetHead('Categorías', 'Listo', '') + `<div class="sheet-body">${sections.map(([g, l]) => {
    const cs = S.data.categories.filter(c => g ? c.kind === 'gasto' && c.group === g : c.kind === 'ingreso');
    return `<h3 class="sec">${l}</h3><div class="group">${cs.map(c => `<button class="row" data-act="edit-cat" data-id="${c.id}"><span class="ic g-${c.group || 'ingreso'}">${c.emoji}</span><span class="row-main"><span class="row-title">${esc(c.name)}</span></span>${ICON.chev}</button>`).join('')}</div>`;
  }).join('')}
  <div class="group" style="margin-top:20px"><button class="row add plain" data-act="edit-cat">+ Nueva categoría</button></div></div>`;
  replace ? setSheet(html) : openSheet(html);
}
function openCat(id) {
  const c = id && cat(id);
  K = c ? { ...c } : { id: null, name: '', emoji: '🏷️', kind: 'gasto', group: 'variable' };
  renderCatSheet();
}
function renderCatSheet() {
  const kv = K.kind === 'ingreso' ? 'ingreso' : K.group;
  const opts = [['fijo', 'Fijo'], ['variable', 'Variable'], ['ocio', 'Ocio'], ['ingreso', 'Ingreso']];
  setSheet(`<header class="sheet-head"><button class="link" data-act="cats-back" style="justify-self:start">‹ Atrás</button><h2>${K.id ? 'Categoría' : 'Nueva categoría'}</h2><button class="link strong" data-act="cat-save">Guardar</button></header>
  <div class="sheet-body">
    <div class="group">
      <label class="form-row"><span>Emoji</span><input type="text" id="k-emoji" value="${esc(K.emoji)}" maxlength="4" style="font-size:24px"></label>
      <label class="form-row"><span>Nombre</span><input type="text" id="k-name" value="${esc(K.name)}" placeholder="Ej: Mascotas" maxlength="24"></label>
    </div>
    <h3 class="sec">Tipo</h3>
    <div class="seg">${opts.map(([k, l]) => `<button class="${kv === k ? 'on' : ''}" data-act="cat-kind" data-v="${k}">${l}</button>`).join('')}</div>
    ${K.id ? '<button class="danger-btn" data-act="cat-delete">Eliminar categoría</button>' : ''}
  </div>`);
}

/* ---------- Bienvenida ---------- */
function openOnboarding() {
  openSheet(`<div class="sheet-body" style="padding-top:20px">
    <div class="intro"><div style="font-size:44px">👋</div><h3>Bienvenido</h3>Escribe cuánto tienes hoy en cada cuenta. Puedes cambiar los nombres, agregar o eliminar cuentas después.</div>
    <div class="group">${S.data.accounts.map(a => `<label class="form-row">${accIcon(a)}<span class="row-main"><span class="row-title">${esc(a.name)}</span><span class="row-sub">${a.type === 'credito' ? 'Deuda actual' : 'Saldo actual'}</span></span><span class="money-wrap">$<input class="money-in" data-onb="${a.id}" inputmode="numeric" placeholder="0"></span></label>`).join('')}</div>
    <h3 class="sec">¿Cuánto recibes al mes?</h3>
    <div class="group"><label class="form-row"><span class="ic g-ingreso">💼</span><span class="row-main"><span class="row-title">Nómina y otros ingresos</span></span><span class="money-wrap">$<input class="money-in" id="onb-income" inputmode="numeric" placeholder="0"></span></label></div>
    <button class="btn-primary" style="margin-top:24px" data-act="onb-start">Empezar</button>
  </div>`, { locked: true });
}

/* ---------- Copias de seguridad ---------- */
async function exportData() {
  const json = JSON.stringify(S.data, null, 2), name = `finanzas-${today()}.json`;
  const file = new File([json], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Copia de Finanzas' }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const d = JSON.parse(reader.result);
      if (!Array.isArray(d.accounts) || !Array.isArray(d.txs)) throw new Error('formato');
      if (!confirm(`Esta copia tiene ${d.txs.length} movimientos y ${d.accounts.length} cuentas. ¿Reemplazar los datos actuales?`)) return;
      S.data = normalize(d); S.data.onboarded = true; save(); render(); toast('Copia restaurada ✓');
    } catch { alert('El archivo no es una copia válida de Finanzas.'); }
  };
  reader.readAsText(file);
}

/* ---------- Acciones ---------- */
const ACTIONS = {
  tab: el => { S.tab = el.dataset.tab; render(); window.scrollTo(0, 0); },
  'prev-month': () => { S.month = shiftMonth(S.month, -1); render(); },
  'next-month': () => { S.month = shiftMonth(S.month, 1); render(); },
  add: () => openQuick(),
  backdrop: () => { if (!sheetLocked) closeSheet(); },
  'close-sheet': () => closeSheet(),

  // Registro rápido
  'edit-tx': el => openQuick({ id: el.dataset.id }),
  'q-type': el => {
    Q.type = el.dataset.v;
    if (Q.type !== 'transfer' && cat(Q.categoryId)?.kind !== Q.type) Q.categoryId = null;
    if (Q.type !== 'gasto' && acc(Q.accountId)?.type === 'credito') Q.accountId = S.data.accounts.find(a => a.type === 'debito')?.id || Q.accountId;
    if (Q.type === 'transfer' && !Q.toAccountId) Q.toAccountId = S.data.accounts.find(a => a.id !== Q.accountId && a.type === 'ahorro')?.id || null;
    setSheet(quickHTML());
  },
  'q-key': el => {
    const k = el.dataset.k;
    if (k === 'del') Q.amount = Q.amount.length > 1 ? Q.amount.slice(0, -1) : '0';
    else if (Q.amount === '0') Q.amount = k === '000' ? '0' : k;
    else if (Q.amount.length + k.length <= 12) Q.amount += k;
    updateAmount();
  },
  'q-cat': el => { Q.categoryId = el.dataset.id; $$('.cat').forEach(b => b.classList.toggle('on', b === el)); },
  'q-acc': el => { Q.accountId = el.dataset.id; $$('.chip', el.parentElement).forEach(b => b.classList.toggle('on', b === el)); },
  'q-to': el => { Q.toAccountId = el.dataset.id; $$('.chip', el.parentElement).forEach(b => b.classList.toggle('on', b === el)); },
  'q-date': el => { Q.date = el.dataset.v; setSheet(quickHTML()); },
  'q-save': () => saveQuick(),
  'q-delete': () => ACTIONS['tx-delete']({ dataset: { id: Q.id } }),
  'tx-delete': el => {
    if (!confirm('¿Eliminar este movimiento?')) return;
    S.data.txs = S.data.txs.filter(t => t.id !== el.dataset.id);
    save(); closeSheet(); render(); toast('Eliminado');
  },
  filter: el => {
    S.filter = el.dataset.v;
    $$('#tx-filter button').forEach(b => b.classList.toggle('on', b === el));
    $('#txlist').innerHTML = txListHTML();
  },

  // Plan
  'plan-new': () => { ensurePlan(S.month); save(); render(); },
  'plan-copy': () => {
    const prev = plan(shiftMonth(S.month, -1));
    S.data.plans[S.month] = { ...prev, fixed: prev.fixed.map(f => ({ ...f, id: uid() })) };
    save(); render(); toast('Plan copiado ✓');
  },
  'plan-delete': () => {
    if (!confirm(`¿Eliminar el plan de ${monthName(S.month).toLowerCase()}? Tus movimientos no se borran.`)) return;
    delete S.data.plans[S.month]; save(); render();
  },
  'plan-add-fixed': () => openFixed(null),
  'plan-edit-fixed': el => openFixed(el.dataset.id),
  'plan-pay': el => {
    const f = plan(S.month).fixed.find(x => x.id === el.dataset.id);
    openQuick({ type: 'gasto', amount: f.amount, categoryId: f.categoryId, accountId: f.accountId, note: f.name, planItemId: f.id,
      date: S.month === curMonth() ? today() : S.month + '-01' });
  },
  'fixed-save': () => {
    F.name = $('#f-name').value.trim(); F.amount = parseMoney($('#f-amount').value);
    F.categoryId = $('#f-cat').value; F.accountId = $('#f-acc').value;
    if (!F.name) return toast('Escribe un nombre');
    const p = ensurePlan(S.month);
    if (F.id) p.fixed = p.fixed.map(x => x.id === F.id ? F : x); else p.fixed.push({ ...F, id: uid() });
    save(); closeSheet(); render();
  },
  'fixed-delete': () => {
    const p = plan(S.month); p.fixed = p.fixed.filter(x => x.id !== F.id);
    save(); closeSheet(); render();
  },

  // Cuentas
  'edit-acc': el => openAccount(el.dataset.id),
  'add-acc': () => openAccount(null),
  'acc-color': el => { A.color = el.dataset.v; $$('.swatch').forEach(b => b.classList.toggle('on', b === el)); },
  'acc-save': () => {
    readAccountForm();
    if (!A.name) return toast('Escribe un nombre');
    if (A.id) S.data.accounts = S.data.accounts.map(a => a.id === A.id ? { ...A } : a);
    else S.data.accounts.push({ ...A, id: uid() });
    save(); closeSheet(); render();
  },
  'acc-adjust': () => {
    const raw = $('#a-real').value; if (!raw) return toast('Escribe el valor real');
    const a = acc(A.id), v = parseMoney(raw), target = a.type === 'credito' ? -v : v, diff = target - balance(a);
    if (!diff) return toast('El saldo ya coincide');
    S.data.txs.push({ id: uid(), type: 'ajuste', amount: diff, accountId: a.id, date: today(), note: '', createdAt: Date.now() });
    save(); render(); renderAccountSheet(); toast('Saldo ajustado ✓');
  },
  'acc-delete': () => {
    if (S.data.txs.some(t => t.accountId === A.id || t.toAccountId === A.id))
      return alert('Esta cuenta tiene movimientos. Elimínalos primero o cámbiale el nombre.');
    if (!confirm(`¿Eliminar la cuenta ${A.name}?`)) return;
    S.data.accounts = S.data.accounts.filter(a => a.id !== A.id);
    save(); closeSheet(); render();
  },

  // Categorías
  cats: () => openCats(),
  'cats-back': () => openCats(true),
  'edit-cat': el => openCat(el.dataset.id),
  'cat-kind': el => {
    K.emoji = $('#k-emoji').value; K.name = $('#k-name').value;
    const v = el.dataset.v;
    if (v === 'ingreso') { K.kind = 'ingreso'; K.group = null; } else { K.kind = 'gasto'; K.group = v; }
    renderCatSheet();
  },
  'cat-save': () => {
    K.emoji = $('#k-emoji').value.trim() || '🏷️'; K.name = $('#k-name').value.trim();
    if (!K.name) return toast('Escribe un nombre');
    if (K.id) S.data.categories = S.data.categories.map(c => c.id === K.id ? { ...K } : c);
    else S.data.categories.push({ ...K, id: uid() });
    save(); render(); openCats(true);
  },
  'cat-delete': () => {
    if (S.data.txs.some(t => t.categoryId === K.id)) return alert('Esta categoría tiene movimientos, no se puede eliminar.');
    S.data.categories = S.data.categories.filter(c => c.id !== K.id);
    save(); render(); openCats(true);
  },

  // Datos
  export: () => exportData(),
  import: () => $('#import-file').click(),
  reset: () => {
    if (!confirm('¿Borrar TODOS tus datos? Esto no se puede deshacer.')) return;
    if (!confirm('¿Seguro? Te recomendamos exportar una copia antes.')) return;
    S.data = seed(); save(); S.tab = 'inicio'; render(); openOnboarding();
  },
  'onb-start': () => {
    $$('[data-onb]').forEach(i => {
      const a = acc(i.dataset.onb), v = parseMoney(i.value);
      a.initial = a.type === 'credito' ? -v : v;
    });
    const income = parseMoney($('#onb-income').value);
    if (income) ensurePlan(curMonth()).income = income;
    S.data.onboarded = true; save();
    closeSheet(); S.tab = income ? 'plan' : 'inicio'; render();
    if (income) toast('Ahora arma tu plan del mes');
  },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const fn = ACTIONS[el.dataset.act];
  if (fn) { e.preventDefault(); fn(el, e); }
});

document.addEventListener('input', e => {
  const t = e.target;
  if (t.classList.contains('money-in')) {
    const v = parseMoney(t.value); t.value = plain(v);
    if (t.dataset.plan) {
      const p = ensurePlan(S.month); p[t.dataset.plan] = v; saveSoon();
      const s = $('#plan-summary'); if (s) s.innerHTML = planSummary(p);
    }
  }
  if (t.id === 'q-note') Q.note = t.value;
  if (t.id === 'tx-search') { S.q = t.value; $('#txlist').innerHTML = txListHTML(); }
});

document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'q-date' && t.value) { Q.date = t.value; setSheet(quickHTML()); }
  if (t.id === 'a-type') { readAccountForm(); $('#a-init-label').textContent = A.type === 'credito' ? 'Deuda inicial' : 'Saldo inicial'; }
  if (t.id === 'import-file' && t.files[0]) { importData(t.files[0]); t.value = ''; }
  if (t.dataset.plan && S.tab === 'plan') { save(); }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.target.matches('input[type=text], .money-in')) e.target.blur();
});

/* ---------- Inicio ---------- */
document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = ICON[el.dataset.icon]; });
S.data = load();
render();
if (!S.data.onboarded) openOnboarding();
navigator.storage?.persist?.();
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

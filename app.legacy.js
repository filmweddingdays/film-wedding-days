/* Film Wedding Days — Schedule Calendar (HTML/CSS/JS) */

const STORAGE_KEY = "fwds-orders-v2";
const STORAGE_KEY_LEGACY = "fwds-orders-v1";
const HISTORY_KEY = "fwds-history-v1";
const MAX_HISTORY_ENTRIES = 50;

const CREW_SLOTS = [
  { field: "photographers", roleKey: "traditionalPhotographer", label: "Traditional Photographer" },
  { field: "videographers", roleKey: "traditionalVideographer", label: "Traditional Videographer" },
  { field: "candidPhotographers", roleKey: "candidPhotographer", label: "Candid Photographer" },
  { field: "candidVideographers", roleKey: "candidVideographer", label: "Candid Videographer" },
  { field: "receivingVideographers", roleKey: "receivingVideographer", label: "Receiving Videographer" },
];

const EXPENSE_FIELDS = [
  { key: "photographerSalary", label: "Photographer salary", hint: "Linked to traditional & candid photographers" },
  { key: "albumExpense", label: "Album expense", hint: "Printing, design, album delivery" },
  { key: "travelExpense", label: "Travel expense", hint: "Fuel, stay, transport for crew" },
  { key: "cameraRent", label: "Camera rent", hint: "Bodies, lenses, gear rental" },
  { key: "officeRent", label: "Office rent", hint: "Studio / office share for this job" },
  { key: "other", label: "Other expenses", hint: "Misc costs not listed above" },
];

const SEED_ORDERS = [
  {
    id: "seed-1",
    customerName: "Priya & Arun",
    startDate: "2026-06-12",
    endDate: "2026-06-14",
    scheduleTimes: [
      { date: "2026-06-12", startTime: "06:00", endTime: "12:00", label: "Mehendi" },
      { date: "2026-06-13", startTime: "16:00", endTime: "23:00", label: "Sangeet" },
      { date: "2026-06-14", startTime: "08:00", endTime: "22:00", label: "Wedding" },
    ],
    photographers: ["Ragu", "Karthik"],
    videographers: ["Suresh", "Vijay"],
    candidPhotographers: ["Divya"],
    candidVideographers: ["Prakash"],
    receivingVideographers: ["Vijay"],
    drone: "Ragu (DJI Inspire)",
    ledWallSize: "20×10 ft",
    albumCount: 2,
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Ragu", name: "Ragu", role: "Traditional Photographer", payout: 28000 },
      { crewKey: "traditionalPhotographer::Karthik", name: "Karthik", role: "Traditional Photographer", payout: 22000 },
      { crewKey: "traditionalVideographer::Suresh", name: "Suresh", role: "Traditional Videographer", payout: 24000 },
      { crewKey: "receivingVideographer::Vijay", name: "Vijay", role: "Receiving Videographer", payout: 18000 },
      { crewKey: "other", name: "Murugan", role: "Helper", payout: 8000 },
    ],
    expenseBreakdown: {
      photographerSalary: 72000,
      albumExpense: 45000,
      travelExpense: 28000,
      cameraRent: 22000,
      officeRent: 8000,
      other: 0,
    },
    budget: 450000,
    notes: "Outdoor venue — backup indoor plan confirmed",
  },
  {
    id: "seed-2",
    customerName: "Meera & David",
    startDate: "2026-07-18",
    endDate: "2026-07-18",
    scheduleTimes: [
      { date: "2026-07-18", startTime: "09:00", endTime: "21:00", label: "Church + Reception" },
    ],
    photographers: ["Anitha"],
    videographers: ["Ragu", "Prakash"],
    candidPhotographers: ["Karthik"],
    candidVideographers: [],
    receivingVideographers: ["Prakash"],
    drone: "Not included",
    ledWallSize: "12×8 ft",
    albumCount: 1,
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Anitha", name: "Anitha", role: "Traditional Photographer", payout: 20000 },
      { crewKey: "traditionalVideographer::Ragu", name: "Ragu", role: "Traditional Videographer", payout: 18000 },
      { crewKey: "other", name: "Kumar", role: "Helper", payout: 6000 },
    ],
    expenseBreakdown: {
      photographerSalary: 38000,
      albumExpense: 22000,
      travelExpense: 15000,
      cameraRent: 12000,
      officeRent: 4000,
      other: 0,
    },
    budget: 280000,
  },
  {
    id: "seed-3",
    customerName: "Lakshmi & Sanjay",
    startDate: "2026-05-28",
    endDate: "2026-05-29",
    scheduleTimes: [
      { date: "2026-05-28", startTime: "18:00", endTime: "23:30", label: "Engagement" },
      { date: "2026-05-29", startTime: "07:00", endTime: "14:00", label: "Temple ceremony" },
    ],
    photographers: ["Ragu", "Divya"],
    videographers: ["Suresh"],
    candidPhotographers: [],
    candidVideographers: ["Vijay"],
    receivingVideographers: [],
    drone: "Suresh (Mini 3 Pro)",
    ledWallSize: "—",
    albumCount: 1,
    crewPayouts: [
      { crewKey: "traditionalPhotographer::Ragu", name: "Ragu", role: "Traditional Photographer", payout: 22000 },
      { crewKey: "traditionalVideographer::Suresh", name: "Suresh", role: "Traditional Videographer", payout: 20000 },
      { crewKey: "other", name: "Ravi", role: "Album binding", payout: 15000 },
    ],
    expenseBreakdown: {
      photographerSalary: 55000,
      albumExpense: 35000,
      travelExpense: 18000,
      cameraRent: 15000,
      officeRent: 6000,
      other: 4000,
    },
    budget: 320000,
  },
];

const MONTH_TAB_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

let orders = [];
let dashboardScope = "month";
let dashboardExportScope = "month";
let dashboardPickYear = new Date().getFullYear();
let dashboardPickMonth = new Date().getMonth();
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calDay = new Date().getDate();
let calView = "month";
let editingOrderId = null;

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/* ——— Storage ——— */
function loadOrders() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) raw = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function defaultExpenseBreakdown() {
  return {
    photographerSalary: 0,
    albumExpense: 0,
    travelExpense: 0,
    cameraRent: 0,
    officeRent: 0,
    other: 0,
  };
}

function normalizeOrder(o) {
  const expenseBreakdown = { ...defaultExpenseBreakdown(), ...(o.expenseBreakdown || {}) };
  if (typeof o.expenses === "number" && !o.expenseBreakdown) {
    expenseBreakdown.other = (expenseBreakdown.other || 0) + o.expenses;
  }
  return {
    id: o.id,
    customerName: o.customerName || "",
    startDate: o.startDate || "",
    endDate: o.endDate || "",
    scheduleTimes: Array.isArray(o.scheduleTimes) ? o.scheduleTimes : [],
    photographers: o.photographers || [],
    videographers: o.videographers || [],
    candidPhotographers: o.candidPhotographers || [],
    candidVideographers: o.candidVideographers || [],
    receivingVideographers: o.receivingVideographers || [],
    drone: o.drone ?? "",
    ledWallSize: o.ledWallSize ?? "",
    albumCount: Number(o.albumCount) || 0,
    crewPayouts: (() => {
      const raw = Array.isArray(o.crewPayouts)
        ? o.crewPayouts
        : Array.isArray(o.labourPayouts)
          ? o.labourPayouts
          : [];
      const roster = getCrewRoster({
        photographers: o.photographers || [],
        videographers: o.videographers || [],
        candidPhotographers: o.candidPhotographers || [],
        candidVideographers: o.candidVideographers || [],
        receivingVideographers: o.receivingVideographers || [],
      });
      return raw.map((p) => normalizeCrewPayout(p, roster));
    })(),
    expenseBreakdown,
    budget: Number(o.budget) || 0,
    notes: o.notes,
  };
}

function getCrewPayoutTotal(order) {
  return (order.crewPayouts || []).reduce((s, l) => s + (Number(l.payout) || 0), 0);
}

function getExpenseBreakdownTotal(order) {
  const b = order.expenseBreakdown || defaultExpenseBreakdown();
  return Object.values(b).reduce((s, v) => s + (Number(v) || 0), 0);
}

function getTotalExpenses(order) {
  return getExpenseBreakdownTotal(order) + getCrewPayoutTotal(order);
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function persistHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

function formatHistoryTime(iso) {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function recordHistory(action, label) {
  const entry = {
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    action,
    label,
    orderCount: orders.length,
    snapshot: JSON.parse(JSON.stringify(orders)),
  };
  const list = loadHistory();
  list.unshift(entry);
  while (list.length > MAX_HISTORY_ENTRIES) list.pop();
  persistHistory(list);
  return entry;
}

function saveOrders(options = {}) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  if (!options.skipHistory && options.history) {
    recordHistory(options.history.action, options.history.label);
  }
}

function createId() {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function initData() {
  const stored = loadOrders();
  const raw = stored ?? SEED_ORDERS.map((o) => ({ ...o }));
  orders = raw.map(normalizeOrder);
  saveOrders({ skipHistory: true });
}

/* ——— Stats helpers ——— */
function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(d, opts = {}) {
  return d.toLocaleDateString("en-IN", opts);
}

function getEventDays(order) {
  const start = parseDate(order.startDate);
  const end = parseDate(order.endDate);
  return Math.round((end - start) / 86400000) + 1;
}

function getProfit(order) {
  return order.budget - getTotalExpenses(order);
}

function formatCurrency(n) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatDateRange(order) {
  const start = parseDate(order.startDate);
  const end = parseDate(order.endDate);
  if (order.startDate === order.endDate) {
    return formatDate(start, { day: "numeric", month: "short", year: "numeric" });
  }
  return `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

function makeCrewKey(roleKey, name) {
  return `${roleKey}::${name}`;
}

function parseCrewKey(crewKey) {
  if (!crewKey || crewKey === "other") return null;
  const i = crewKey.indexOf("::");
  if (i < 0) return null;
  const roleKey = crewKey.slice(0, i);
  const slot = CREW_SLOTS.find((s) => s.roleKey === roleKey);
  return {
    roleKey,
    roleLabel: slot?.label || roleKey,
    name: crewKey.slice(i + 2),
  };
}

function getCrewRoster(crewData) {
  const roster = [];
  CREW_SLOTS.forEach(({ field, roleKey, label }) => {
    (crewData[field] || []).forEach((name) => {
      if (!name.trim()) return;
      roster.push({
        crewKey: makeCrewKey(roleKey, name.trim()),
        roleKey,
        roleLabel: label,
        name: name.trim(),
      });
    });
  });
  return roster;
}

function getCrewRosterFromForm(form) {
  if (!form) return [];
  return getCrewRoster({
    photographers: parseNames(form.photographers?.value || ""),
    videographers: parseNames(form.videographers?.value || ""),
    candidPhotographers: parseNames(form.candidPhotographers?.value || ""),
    candidVideographers: parseNames(form.candidVideographers?.value || ""),
    receivingVideographers: parseNames(form.receivingVideographers?.value || ""),
  });
}

function normalizeCrewPayout(p, roster) {
  const payout = Number(p.payout) || 0;
  if (p.crewKey && p.crewKey !== "other") {
    const parsed = parseCrewKey(p.crewKey);
    if (parsed) {
      return {
        crewKey: p.crewKey,
        role: parsed.roleLabel,
        name: parsed.name,
        payout,
      };
    }
  }
  if (p.crewKey === "other" || !p.crewKey) {
    return {
      crewKey: "other",
      role: p.role || "Other",
      name: p.name || "",
      payout,
    };
  }
  const match = roster.find((r) => r.name === p.name);
  if (match) {
    return { crewKey: match.crewKey, role: match.roleLabel, name: match.name, payout };
  }
  return {
    crewKey: "other",
    role: p.role || "Other",
    name: p.name || "Unnamed",
    payout,
  };
}

function crewSummary(order) {
  const parts = [];
  if (order.photographers?.length) parts.push(`Trad. 📷 ${order.photographers.join(", ")}`);
  if (order.videographers?.length) parts.push(`Trad. 🎬 ${order.videographers.join(", ")}`);
  if (order.candidPhotographers?.length) parts.push(`Candid 📷 ${order.candidPhotographers.join(", ")}`);
  if (order.candidVideographers?.length) parts.push(`Candid 🎬 ${order.candidVideographers.join(", ")}`);
  if (order.receivingVideographers?.length) parts.push(`Receiving 🎬 ${order.receivingVideographers.join(", ")}`);
  return parts.join(" · ") || "No crew assigned";
}

function renderChips(names, className = "chip") {
  if (!names?.length) return "<span class='meta'>None assigned</span>";
  return names.map((n) => `<span class="${className}">${escapeHtml(n)}</span>`).join("");
}

function renderExpenseDetailHtml(order) {
  const b = order.expenseBreakdown || defaultExpenseBreakdown();
  const crew = order.crewPayouts || [];
  const breakdownTotal = getExpenseBreakdownTotal(order);
  const crewTotal = getCrewPayoutTotal(order);
  const grand = getTotalExpenses(order);

  const rows = EXPENSE_FIELDS.map((f) => {
    const val = b[f.key] || 0;
    return `<tr>
      <td>${escapeHtml(f.label)}</td>
      <td class="meta" style="font-size:0.7rem">${escapeHtml(f.hint)}</td>
      <td style="text-align:right;font-weight:500">${formatCurrency(val)}</td>
    </tr>`;
  }).join("");

  const crewRows =
    crew.length === 0
      ? `<tr><td colspan="3" class="meta">No crew payouts recorded</td></tr>`
      : crew
          .map((l) => {
            const linked =
              l.crewKey && l.crewKey !== "other"
                ? `<span class="chip" style="font-size:0.7rem">Linked</span>`
                : `<span class="meta">Other</span>`;
            return `<tr>
        <td>${escapeHtml(l.name)} ${linked}</td>
        <td class="meta">${escapeHtml(l.role || "Crew")}</td>
        <td style="text-align:right;font-weight:500">${formatCurrency(l.payout)}</td>
      </tr>`;
          })
          .join("");

  return `
    <table class="expense-table">
      <thead><tr><th>Category</th><th>Notes</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody>${rows}
        <tr class="total-row"><td colspan="2">Operating expenses subtotal</td><td style="text-align:right">${formatCurrency(breakdownTotal)}</td></tr>
      </tbody>
    </table>
    <h4 style="font-size:0.75rem;text-transform:uppercase;color:var(--warm);margin:1rem 0 0.5rem">Crew payouts</h4>
    <table class="expense-table">
      <thead><tr><th>Name</th><th>Role</th><th style="text-align:right">Payout</th></tr></thead>
      <tbody>${crewRows}
        <tr class="total-row"><td colspan="2">Crew payouts subtotal</td><td style="text-align:right">${formatCurrency(crewTotal)}</td></tr>
      </tbody>
    </table>
    <div class="expense-total-bar" style="margin-top:0.75rem">
      <span>Total expenses (operating + crew payouts)</span>
      <strong>${formatCurrency(grand)}</strong>
    </div>`;
}

function orderOverlapsDay(order, date) {
  const d = date.toISOString().slice(0, 10);
  return d >= order.startDate && d <= order.endDate;
}

function getOrdersThisMonth() {
  const now = new Date();
  return getOrdersForMonth(now.getFullYear(), now.getMonth());
}

function getOrdersForMonth(year, month) {
  return orders.filter((o) => {
    const s = parseDate(o.startDate);
    return s.getFullYear() === year && s.getMonth() === month;
  });
}

function getOrdersThisYear() {
  const y = new Date().getFullYear();
  return orders.filter((o) => parseDate(o.startDate).getFullYear() === y);
}

function getOrdersForScope(scope) {
  if (scope === "all") return [...orders];
  if (scope === "year") return getOrdersThisYear();
  return getOrdersForMonth(dashboardPickYear, dashboardPickMonth);
}

function getDashboardScopeLabel(scope) {
  if (scope === "month") {
    return new Date(dashboardPickYear, dashboardPickMonth, 1).toLocaleDateString(
      "en-IN",
      { month: "long", year: "numeric" }
    );
  }
  if (scope === "year") return String(new Date().getFullYear());
  return "All time";
}

function getChartTitle(scope) {
  if (scope === "month") {
    return `Last 12 months · selected ${getDashboardScopeLabel("month")}`;
  }
  if (scope === "year") return `Events per month — ${new Date().getFullYear()}`;
  return "Events per year (all time)";
}

function getSelectedMonthKey() {
  return `${dashboardPickYear}-${String(dashboardPickMonth + 1).padStart(2, "0")}`;
}

function getTotals(list) {
  return list.reduce(
    (acc, o) => ({
      budget: acc.budget + o.budget,
      expenses: acc.expenses + getTotalExpenses(o),
    }),
    { budget: 0, expenses: 0 }
  );
}

function getEventsPerMonth(monthsBack = 12) {
  const now = new Date();
  return getEventsPerMonthEndingAt(now.getFullYear(), now.getMonth(), monthsBack);
}

function getEventsPerMonthEndingAt(year, month, monthsBack = 12) {
  const stats = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    stats.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      count: getOrdersForMonth(y, m).length,
    });
  }
  return stats;
}

function getEventsPerMonthInYear(year) {
  const stats = [];
  for (let m = 0; m < 12; m++) {
    const d = new Date(year, m, 1);
    stats.push({
      key: `${year}-${String(m + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short" }),
      count: getOrdersForMonth(year, m).length,
    });
  }
  return stats;
}

function getEventsPerYear() {
  const counts = new Map();
  orders.forEach((o) => {
    const y = parseDate(o.startDate).getFullYear();
    counts.set(y, (counts.get(y) || 0) + 1);
  });
  if (counts.size === 0) {
    return [{ key: "none", label: "—", count: 0 }];
  }
  const years = [...counts.keys()].sort((a, b) => a - b);
  const stats = [];
  for (let y = years[0]; y <= years[years.length - 1]; y++) {
    stats.push({ key: String(y), label: String(y), count: counts.get(y) || 0 });
  }
  return stats;
}

function getChartStatsForScope(scope) {
  if (scope === "all") return getEventsPerYear();
  if (scope === "year") return getEventsPerMonthInYear(new Date().getFullYear());
  return getEventsPerMonthEndingAt(dashboardPickYear, dashboardPickMonth, 12);
}

function getMonthWiseStats(monthsBack = 12) {
  const now = new Date();
  const stats = [];
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    const periodOrders = getOrdersForMonth(y, m);
    const totals = getTotals(periodOrders);
    stats.push({
      key: `${y}-${String(m + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
      count: periodOrders.length,
      budget: totals.budget,
      expenses: totals.expenses,
      profit: totals.budget - totals.expenses,
    });
  }
  return stats;
}

function getYearWiseStats() {
  if (orders.length === 0) return [];
  const years = [
    ...new Set(orders.map((o) => parseDate(o.startDate).getFullYear())),
  ].sort((a, b) => a - b);
  return years.map((year) => {
    const periodOrders = orders.filter(
      (o) => parseDate(o.startDate).getFullYear() === year
    );
    const totals = getTotals(periodOrders);
    return {
      key: String(year),
      label: String(year),
      count: periodOrders.length,
      budget: totals.budget,
      expenses: totals.expenses,
      profit: totals.budget - totals.expenses,
    };
  });
}

function getAllTimeStats() {
  if (orders.length === 0) return [];
  const totals = getTotals(orders);
  return [
    {
      key: "all",
      label: "All time",
      count: orders.length,
      budget: totals.budget,
      expenses: totals.expenses,
      profit: totals.budget - totals.expenses,
    },
  ];
}

function getExportStats(kind) {
  if (kind === "month") return getMonthWiseStats();
  if (kind === "year") return getYearWiseStats();
  return getAllTimeStats();
}

function exportReportTitle(kind) {
  if (kind === "month") return "Film Wedding Days — Month-wise report";
  if (kind === "year") return "Film Wedding Days — Year-wise report";
  return "Film Wedding Days — All-time report";
}

function exportReportSubtitle(kind) {
  const stamp = new Date().toLocaleString("en-IN");
  if (kind === "month") return `Last 12 months by event start date · Generated ${stamp}`;
  if (kind === "year") return `All years by event start date · Generated ${stamp}`;
  return `Complete booking history · Generated ${stamp}`;
}

function exportSummarySheetName(kind) {
  if (kind === "month") return "Month summary";
  if (kind === "year") return "Year summary";
  return "All time summary";
}

function summaryExportTotals(stats) {
  return stats.reduce(
    (acc, s) => ({
      count: acc.count + s.count,
      budget: acc.budget + s.budget,
      expenses: acc.expenses + s.expenses,
    }),
    { count: 0, budget: 0, expenses: 0 }
  );
}

function exportFilename(kind, ext) {
  const date = new Date().toISOString().slice(0, 10);
  const slug = kind === "all" ? "all-time" : `${kind}-wise`;
  return `fwds-dashboard-${slug}-${date}.${ext}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function orderExportRows() {
  return orders.map((o) => [
    o.customerName,
    formatDateRange(o),
    getEventDays(o),
    (o.photographers || []).join(", "),
    (o.videographers || []).join(", "),
    o.budget,
    getTotalExpenses(o),
    getProfit(o),
  ]);
}

function getJsPDFClass() {
  if (window.jspdf && typeof window.jspdf.jsPDF === "function") {
    return window.jspdf.jsPDF;
  }
  if (typeof window.jsPDF === "function") return window.jsPDF;
  return null;
}

function createPdfDoc() {
  const JsPDF = getJsPDFClass();
  if (!JsPDF) {
    throw new Error(
      "PDF library missing. Ensure vendor/jspdf.umd.min.js is loaded before app.js."
    );
  }
  return new JsPDF();
}

function pdfAutoTable(doc, options) {
  if (typeof doc.autoTable === "function") {
    doc.autoTable(options);
    return;
  }
  if (typeof window.autoTable === "function") {
    window.autoTable(doc, options);
    return;
  }
  throw new Error(
    "PDF table plugin missing. Ensure vendor/jspdf.plugin.autotable.min.js loads after jspdf."
  );
}

function lastAutoTableY(doc, fallback = 44) {
  return doc.lastAutoTable && doc.lastAutoTable.finalY
    ? doc.lastAutoTable.finalY
    : fallback;
}

function exportDashboardPdf(kind) {
  let doc;
  try {
    doc = createPdfDoc();
  } catch (err) {
    alert(err.message);
    return;
  }

  const stats = getExportStats(kind);
  const totals = summaryExportTotals(stats);
  const title = exportReportTitle(kind);
  const subtitle = exportReportSubtitle(kind);

  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`${subtitle} · Generated ${new Date().toLocaleString("en-IN")}`, 14, 26);
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(
    `Total: ${totals.count} events · Budget ${formatCurrency(totals.budget)} · Expenses ${formatCurrency(totals.expenses)} · Profit ${formatCurrency(totals.budget - totals.expenses)}`,
    14,
    36
  );

  try {
    pdfAutoTable(doc, {
      startY: 44,
      head: [["Period", "Events", "Budget", "Expenses", "Profit"]],
      body: stats.map((s) => [
        s.label,
        s.count,
        formatCurrency(s.budget),
        formatCurrency(s.expenses),
        formatCurrency(s.profit),
      ]),
      foot: [
        [
          "Total",
          totals.count,
          formatCurrency(totals.budget),
          formatCurrency(totals.expenses),
          formatCurrency(totals.budget - totals.expenses),
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [184, 149, 106] },
      footStyles: {
        fillColor: [245, 240, 235],
        textColor: [40, 40, 40],
        fontStyle: "bold",
      },
    });
  } catch (err) {
    alert(err.message);
    return;
  }

  const summaryEndY = lastAutoTableY(doc, 44);
  doc.setFontSize(12);
  doc.text("Order details", 14, summaryEndY + 14);

  try {
    pdfAutoTable(doc, {
      startY: summaryEndY + 18,
      head: [
        [
          "Customer",
          "Dates",
          "Days",
          "Photographers",
          "Videographers",
          "Budget",
          "Expenses",
          "Profit",
        ],
      ],
      body: orderExportRows().map((row) =>
        row.map((cell, i) =>
          i >= 5 && typeof cell === "number" ? formatCurrency(cell) : cell
        )
      ),
      theme: "striped",
      headStyles: { fillColor: [184, 149, 106] },
      styles: { fontSize: 8 },
    });
  } catch (err) {
    alert(err.message);
    return;
  }

  doc.save(exportFilename(kind, "pdf"));
}

function exportDashboardExcel(kind) {
  if (!window.XLSX) {
    alert(
      "Excel library missing. Ensure vendor/xlsx.full.min.js is loaded before app.js."
    );
    return;
  }
  const stats = getExportStats(kind);
  const totals = summaryExportTotals(stats);
  const title = exportReportTitle(kind);
  const subtitle = exportReportSubtitle(kind);
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    [title],
    [subtitle],
    [],
    ["Period", "Events", "Budget", "Expenses", "Profit"],
    ...stats.map((s) => [s.label, s.count, s.budget, s.expenses, s.profit]),
    [
      "Total",
      totals.count,
      totals.budget,
      totals.expenses,
      totals.budget - totals.expenses,
    ],
  ]);
  XLSX.utils.book_append_sheet(
    wb,
    summarySheet,
    exportSummarySheetName(kind)
  );

  const detailSheet = XLSX.utils.aoa_to_sheet([
    [
      "Customer",
      "Dates",
      "Days",
      "Photographers",
      "Videographers",
      "Budget",
      "Expenses",
      "Profit",
    ],
    ...orderExportRows(),
  ]);
  XLSX.utils.book_append_sheet(wb, detailSheet, "Orders");

  const crewSheet = XLSX.utils.aoa_to_sheet([
    ["Customer", "Dates", "Crew"],
    ...orders.map((o) => [o.customerName, formatDateRange(o), crewSummary(o)]),
  ]);
  XLSX.utils.book_append_sheet(wb, crewSheet, "Crew");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    exportFilename(kind, "xlsx")
  );
}

function renderMonthPickerHtml() {
  const tabs = MONTH_TAB_LABELS.map(
    (label, i) =>
      `<button type="button" class="month-tab ${i === dashboardPickMonth ? "active" : ""}" data-pick-month="${i}">${label}</button>`
  ).join("");

  return `
    <div class="month-picker card" id="dashboard-month-picker">
      <div class="month-picker-header">
        <span class="month-picker-title">Select month</span>
        <div class="year-stepper">
          <button type="button" class="btn-secondary btn-sm" id="dash-year-prev" aria-label="Previous year">‹</button>
          <span class="year-stepper-label" id="dash-year-label">${dashboardPickYear}</span>
          <button type="button" class="btn-secondary btn-sm" id="dash-year-next" aria-label="Next year">›</button>
        </div>
      </div>
      <div class="month-tabs" role="tablist">${tabs}</div>
    </div>`;
}

function getUpcoming(limit = 5) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return [...orders]
    .filter((o) => parseDate(o.endDate) >= today)
    .sort((a, b) => parseDate(a.startDate) - parseDate(b.startDate))
    .slice(0, limit);
}

function parseNames(str) {
  return str
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ——— Routing ——— */
function getRoute() {
  const hash = location.hash.slice(1) || "/";
  if (hash.startsWith("/calendar")) return "calendar";
  if (hash.startsWith("/orders")) return "orders";
  return "dashboard";
}

function setActiveNav(route) {
  $$(".main-nav a").forEach((a) => {
    a.classList.toggle("active", a.dataset.route === route);
  });
}

function render() {
  const route = getRoute();
  setActiveNav(route);
  const main = $("#app-main");
  if (route === "dashboard") main.innerHTML = renderDashboard();
  else if (route === "calendar") main.innerHTML = renderCalendar();
  else main.innerHTML = renderOrders();
  bindPageEvents(route);
}

/* ——— Dashboard ——— */
function renderDashboard() {
  const scope = dashboardScope;
  const scopedOrders = getOrdersForScope(scope);
  const totals = getTotals(scopedOrders);
  const profit = totals.budget - totals.expenses;
  const upcoming = getUpcoming();
  const stats = getChartStatsForScope(scope);
  const scopeLabel = getDashboardScopeLabel(scope);
  const maxCount = Math.max(...stats.map((s) => s.count), 1);
  const monthOrders = getOrdersThisMonth();
  const yearOrders = getOrdersThisYear();
  const selectedMonthKey = getSelectedMonthKey();

  const bars = stats
    .map(
      (s) => `
    <div class="chart-col ${s.key === selectedMonthKey && scope === "month" ? "chart-col-selected" : ""}">
      <span class="count">${s.count}</span>
      <div class="bar" style="height:${Math.max((s.count / maxCount) * 100, s.count ? 8 : 2)}%"></div>
      <span class="label">${s.label}</span>
    </div>`
    )
    .join("");

  const upcomingHtml =
    upcoming.length === 0
      ? `<p class="empty-state">No upcoming events. <a href="#/orders" class="link-gold">Add a booking</a></p>`
      : `<ul class="upcoming-list">${upcoming
          .map(
            (o) => `
        <li>
          <div>
            <div class="name">${escapeHtml(o.customerName)}</div>
            <div class="meta">${formatDateRange(o)} · ${getEventDays(o)} days</div>
            <div class="crew">${escapeHtml(crewSummary(o))}</div>
          </div>
          <div class="meta" style="text-align:right">
            <div>${formatDate(parseDate(o.startDate), { weekday: "short", day: "numeric", month: "short" })}</div>
            <strong>${formatCurrency(o.budget)}</strong>
          </div>
        </li>`
          )
          .join("")}</ul>`;

  return `
    <div class="page-header">
      <div>
        <h1>Dashboard</h1>
        <p>Overview of bookings, events, and finances</p>
      </div>
      <div class="scope-toggle">
        <button type="button" data-scope="month" class="${scope === "month" ? "active" : ""}">Month wise</button>
        <button type="button" data-scope="year" class="${scope === "year" ? "active" : ""}">This year</button>
        <button type="button" data-scope="all" class="${scope === "all" ? "active" : ""}">All time</button>
      </div>
    </div>
    ${scope === "month" ? renderMonthPickerHtml() : ""}
    <p class="dashboard-scope-banner card" style="padding:0.75rem 1rem;margin-bottom:1.5rem;font-size:0.9rem">
      Showing <strong>${escapeHtml(scopeLabel)}</strong> — ${scopedOrders.length} event${scopedOrders.length !== 1 ? "s" : ""} by start date
    </p>
    <div class="kpi-grid">
      <div class="card kpi-card">
        <div class="kpi-label">Events (${scope === "month" ? "selected month" : scope === "year" ? "this year" : "all time"})</div>
        <div class="kpi-value">${scopedOrders.length}</div>
        <div class="kpi-sub">${orders.length} total · ${monthOrders.length} this month · ${yearOrders.length} this year</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label">Budget</div>
        <div class="kpi-value">${formatCurrency(totals.budget)}</div>
        <div class="kpi-sub">${scopeLabel}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label">Expenses</div>
        <div class="kpi-value">${formatCurrency(totals.expenses)}</div>
        <div class="kpi-sub">${scopeLabel}</div>
      </div>
      <div class="card kpi-card">
        <div class="kpi-label">Profit</div>
        <div class="kpi-value ${profit >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(profit)}</div>
        <div class="kpi-sub">Budget − expenses · ${scopeLabel}</div>
      </div>
    </div>
    <div class="card chart-card">
      <h3>${getChartTitle(scope)}</h3>
      <div class="chart-bars">${bars}</div>
    </div>
    <div class="card section-card">
      <div class="section-card-header">
        <h2>Upcoming events</h2>
        <a href="#/orders" class="link-gold">Manage orders →</a>
      </div>
      ${upcomingHtml}
    </div>
    <div class="card section-card dashboard-export">
      <div class="section-card-header">
        <div>
          <h2>Export reports</h2>
          <p class="meta">Choose a range, then download as PDF or Excel</p>
        </div>
      </div>
      <div class="dashboard-export-body">
        <div class="export-scope-scroll" role="tablist" aria-label="Export range">
          <div class="export-scope-tabs">
            <button type="button" role="tab" class="export-scope-tab ${dashboardExportScope === "month" ? "active" : ""}" data-export-scope="month" aria-selected="${dashboardExportScope === "month"}">Month wise</button>
            <button type="button" role="tab" class="export-scope-tab ${dashboardExportScope === "year" ? "active" : ""}" data-export-scope="year" aria-selected="${dashboardExportScope === "year"}">Year wise</button>
            <button type="button" role="tab" class="export-scope-tab ${dashboardExportScope === "all" ? "active" : ""}" data-export-scope="all" aria-selected="${dashboardExportScope === "all"}">All time</button>
          </div>
        </div>
        <div class="dashboard-export-actions">
          <button type="button" class="btn-secondary" data-export="pdf">Export PDF</button>
          <button type="button" class="btn-secondary" data-export="excel">Export Excel</button>
        </div>
      </div>
    </div>`;
}

/* ——— Calendar ——— */
function renderCalendar() {
  const monthName = new Date(calYear, calMonth).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  let body = "";
  if (calView === "month") body = renderMonthGrid();
  else if (calView === "week") body = renderWeekView();
  else body = renderDayView();

  return `
    <div class="page-header">
      <div>
        <h1>Schedule calendar</h1>
        <p>Click an event to see crew, times, and finances</p>
      </div>
      <p class="meta"><strong>${orders.length}</strong> total bookings</p>
    </div>
    <div class="card calendar-card">
      <div class="cal-toolbar">
        <div class="cal-nav">
          <button type="button" id="cal-prev">‹</button>
          <h2>${monthName}</h2>
          <button type="button" id="cal-next">›</button>
          <button type="button" id="cal-today" class="btn-secondary btn-sm">Today</button>
        </div>
        <div class="cal-view-btns">
          <button type="button" data-cal-view="month" class="${calView === "month" ? "active" : ""}">Month</button>
          <button type="button" data-cal-view="week" class="${calView === "week" ? "active" : ""}">Week</button>
          <button type="button" data-cal-view="day" class="${calView === "day" ? "active" : ""}">Day</button>
        </div>
      </div>
      ${body}
    </div>`;
}

function renderMonthGrid() {
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const first = new Date(calYear, calMonth, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let html = weekdays.map((w) => `<div class="cal-weekday">${w}</div>`).join("");

  const prevMonthDays = new Date(calYear, calMonth, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const date = new Date(calYear, calMonth - 1, day);
    html += renderDayCell(date, true);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    html += renderDayCell(date, false, today);
  }

  const totalCells = startPad + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(calYear, calMonth + 1, d);
    html += renderDayCell(date, true);
  }

  return `<div class="cal-grid">${html}</div>`;
}

function renderDayCell(date, otherMonth, todayRef) {
  const isToday =
    todayRef &&
    date.getFullYear() === todayRef.getFullYear() &&
    date.getMonth() === todayRef.getMonth() &&
    date.getDate() === todayRef.getDate();

  const dayOrders = orders.filter((o) => orderOverlapsDay(o, date));
  const events = dayOrders
    .map((o) => {
      const days = getEventDays(o);
      const label = `${o.customerName} · ${days}d`;
      return `<button type="button" class="cal-event" data-order-id="${o.id}">${escapeHtml(label)}</button>`;
    })
    .join("");

  return `
    <div class="cal-day ${otherMonth ? "other-month" : ""} ${isToday ? "today" : ""}">
      <div class="cal-day-num">${date.getDate()}</div>
      ${events}
    </div>`;
}

function renderWeekView() {
  const start = new Date(calYear, calMonth, 1);
  while (start.getDay() !== 0) start.setDate(start.getDate() - 1);

  let row = '<div class="cal-week-row">';
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const dayOrders = orders.filter((o) => orderOverlapsDay(o, date));
    const events = dayOrders
      .map(
        (o) =>
          `<button type="button" class="cal-event" data-order-id="${o.id}">${escapeHtml(o.customerName)}</button>`
      )
      .join("");
    row += `
      <div class="cal-week-cell">
        <strong>${formatDate(date, { weekday: "short", day: "numeric", month: "short" })}</strong>
        <div style="margin-top:0.5rem">${events || '<span class="meta">—</span>'}</div>
      </div>`;
  }
  row += "</div>";
  return `<div class="cal-week-grid">${row}</div>`;
}

function renderDayView() {
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const day = Math.min(calDay, daysInMonth);
  const date = new Date(calYear, calMonth, day);
  const dayOrders = orders.filter((o) => orderOverlapsDay(o, date));
  if (!dayOrders.length) {
    return `<div class="cal-day-view"><h3>${formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3><p class="empty-state">No events this day</p></div>`;
  }
  const list = dayOrders
    .map(
      (o) => `
    <button type="button" class="cal-event" style="display:inline-block;width:auto;margin:0.25rem 0" data-order-id="${o.id}">
      ${escapeHtml(o.customerName)} · ${getEventDays(o)}d — ${formatCurrency(o.budget)}
    </button>`
    )
    .join("<br>");
  return `<div class="cal-day-view"><h3>${formatDate(date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h3>${list}</div>`;
}

/* ——— Orders ——— */
function renderOrders() {
  const search = window._orderSearch || "";
  const sortBy = window._orderSort || "date";
  let list = [...orders];
  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter((o) => o.customerName.toLowerCase().includes(q));
  }
  list.sort((a, b) => {
    if (sortBy === "customer") return a.customerName.localeCompare(b.customerName);
    if (sortBy === "budget") return b.budget - a.budget;
    return a.startDate.localeCompare(b.startDate);
  });

  const rows =
    list.length === 0
      ? ""
      : list
          .map((o) => {
            const profit = getProfit(o);
            const crew = [...(o.photographers || []), ...(o.videographers || [])].join(", ") || "—";
            const services = [
              o.albumCount ? `${o.albumCount} album${o.albumCount !== 1 ? "s" : ""}` : null,
              o.ledWallSize && o.ledWallSize !== "—" ? `LED ${o.ledWallSize}` : null,
              o.drone && o.drone !== "Not included" ? "Drone" : null,
            ]
              .filter(Boolean)
              .join(" · ") || "—";
            return `
        <tr>
          <td><strong>${escapeHtml(o.customerName)}</strong></td>
          <td>${formatDateRange(o)}</td>
          <td>${getEventDays(o)}</td>
          <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;font-size:0.8rem">${escapeHtml(services)}</td>
          <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis">${escapeHtml(crew)}</td>
          <td>${formatCurrency(o.budget)}</td>
          <td>${formatCurrency(getTotalExpenses(o))}</td>
          <td class="${profit >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(profit)}</td>
          <td>
            <div class="table-actions">
              <button type="button" class="btn-view" data-view-id="${o.id}">View</button>
              <button type="button" class="btn-edit" data-edit-id="${o.id}">Edit</button>
              <button type="button" class="btn-delete" data-delete-id="${o.id}">Delete</button>
            </div>
          </td>
        </tr>`;
          })
          .join("");

  const tableBody =
    list.length === 0
      ? `<div class="empty-state card" style="border-style:dashed">No orders yet.<br><button type="button" class="text-link" id="btn-add-first">Add your first wedding order</button></div>`
      : `<div class="table-wrap"><table style="min-width:960px">
        <thead><tr>
          <th>Customer</th><th>Dates</th><th>Days</th><th>Services</th><th>Crew</th>
          <th>Budget</th><th>Total expenses</th><th>Profit</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;

  return `
    <div class="page-header">
      <div>
        <h1>Orders</h1>
        <p>Bookings, crew, services, crew payouts &amp; expense breakdown</p>
      </div>
      <button type="button" class="btn-primary" id="btn-new-order">+ New order</button>
    </div>
    <div class="toolbar">
      <input type="search" id="order-search" placeholder="Search customer…" value="${escapeHtml(search)}" />
      <select id="order-sort">
        <option value="date" ${sortBy === "date" ? "selected" : ""}>Sort by date</option>
        <option value="customer" ${sortBy === "customer" ? "selected" : ""}>Sort by customer</option>
        <option value="budget" ${sortBy === "budget" ? "selected" : ""}>Sort by budget</option>
      </select>
    </div>
    ${tableBody}`;
}

/* ——— Detail panel ——— */
function showOrderDetail(id) {
  const order = orders.find((o) => o.id === id);
  if (!order) return;

  const days = getEventDays(order);
  const profit = getProfit(order);

  const slots =
    order.scheduleTimes.length === 0
      ? "<p class='meta'>No detailed times added</p>"
      : order.scheduleTimes
          .map((s) => {
            const d = parseDate(s.date);
            const label = s.label ? ` — ${escapeHtml(s.label)}` : "";
            return `<div class="slot-item">
            <strong>${formatDate(d, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}${label}</strong><br>
            ${s.startTime} – ${s.endTime}
          </div>`;
          })
          .join("");

  $("#detail-panel").innerHTML = `
    <div class="detail-header" style="display:flex;justify-content:space-between;align-items:flex-start">
      <div>
        <div class="eyebrow">Booking</div>
        <h2 id="detail-title">${escapeHtml(order.customerName)}</h2>
        <p class="meta">${formatDateRange(order)} · ${days} day${days !== 1 ? "s" : ""}</p>
      </div>
      <button type="button" class="btn-icon" id="detail-close">✕</button>
    </div>
    <div class="detail-body">
      <div class="detail-section"><h3>Schedule times</h3>${slots}</div>
      <div class="detail-section">
        <h3>Services &amp; production</h3>
        <dl class="booking-services">
          <div><dt>Albums</dt><dd>${order.albumCount || 0}</dd></div>
          <div><dt>LED wall size</dt><dd>${escapeHtml(order.ledWallSize || "—")}</dd></div>
          <div><dt>Drone</dt><dd>${escapeHtml(order.drone || "—")}</dd></div>
        </dl>
      </div>
      <div class="detail-section">
        <h3>Crew</h3>
        <p class="meta" style="margin-bottom:0.25rem">Traditional Photographers</p>
        <div class="chips" style="margin-bottom:0.75rem">${renderChips(order.photographers)}</div>
        <p class="meta" style="margin-bottom:0.25rem">Traditional Videographer</p>
        <div class="chips" style="margin-bottom:0.75rem">${renderChips(order.videographers, "chip video")}</div>
        <p class="meta" style="margin-bottom:0.25rem">Candid photographers</p>
        <div class="chips" style="margin-bottom:0.75rem">${renderChips(order.candidPhotographers)}</div>
        <p class="meta" style="margin-bottom:0.25rem">Candid videographers</p>
        <div class="chips" style="margin-bottom:0.75rem">${renderChips(order.candidVideographers, "chip video")}</div>
        <p class="meta" style="margin-bottom:0.25rem">Receiving Videographer</p>
        <div class="chips">${renderChips(order.receivingVideographers, "chip video")}</div>
      </div>
      <div class="detail-section">
        <h3>Expense breakdown</h3>
        <p class="meta" style="margin-bottom:0.5rem">Operating costs linked to salary, albums, travel, gear &amp; office</p>
        ${renderExpenseDetailHtml(order)}
      </div>
      <div class="detail-section">
        <h3>Summary</h3>
        <dl class="finance-grid">
          <div class="finance-box"><dt>Budget</dt><dd>${formatCurrency(order.budget)}</dd></div>
          <div class="finance-box"><dt>Total expenses</dt><dd>${formatCurrency(getTotalExpenses(order))}</dd></div>
          <div class="finance-box wide"><dt>Profit</dt><dd class="${profit >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(profit)}</dd></div>
        </dl>
      </div>
      ${order.notes ? `<div class="detail-section"><h3>Notes</h3><p>${escapeHtml(order.notes)}</p></div>` : ""}
      <button type="button" class="btn-primary" style="width:100%" id="detail-edit" data-id="${order.id}">Edit order</button>
    </div>`;

  const overlay = $("#detail-overlay");
  overlay.hidden = false;
  $("#detail-close").onclick = closeDetail;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeDetail();
  };
  $("#detail-edit").onclick = () => {
    closeDetail();
    openOrderForm(order.id);
  };
}

function closeDetail() {
  $("#detail-overlay").hidden = true;
}

/* ——— Order form ——— */
function openOrderForm(orderId = null) {
  editingOrderId = orderId;
  const order = orderId ? orders.find((o) => o.id === orderId) : null;
  $("#form-title").textContent = order ? "Edit order" : "New order";
  $("#order-form").innerHTML = buildFormHtml(order);
  $("#form-overlay").hidden = false;

  $("#form-close").onclick = closeForm;
  $("#form-overlay").onclick = (e) => {
    if (e.target === $("#form-overlay")) closeForm();
  };

  $("#order-form").onsubmit = (e) => {
    e.preventDefault();
    submitOrderForm();
  };

  $("#btn-add-slot").onclick = addSlotRow;
  $("#btn-add-crew")?.addEventListener("click", addCrewRow);
  $("#btn-sync-crew-payouts")?.addEventListener("click", autoAddMissingCrewPayouts);
  bindCrewFieldListeners();
  bindAllCrewPayoutRows();
  syncCrewPayoutSelects();
  $("#order-form").addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-remove-slot")) {
      const rows = $$(".slot-block", $("#order-form"));
      if (rows.length > 1) e.target.closest(".slot-block").remove();
      updateFormExpenseTotals();
    }
    if (e.target.classList.contains("btn-remove-crew")) {
      const rows = $$(".crew-row", $("#order-form"));
      if (rows.length > 1) e.target.closest(".crew-row").remove();
      updateFormExpenseTotals();
    }
  });
  $("#order-form").addEventListener("input", (e) => {
    if (
      e.target.matches('[name^="exp_"]') ||
      e.target.matches('[name="crewPayout"]')
    ) {
      updateFormExpenseTotals();
    }
  });
  updateFormExpenseTotals();
}

function closeForm() {
  $("#form-overlay").hidden = true;
  editingOrderId = null;
}

function buildFormHtml(order) {
  const o = order ? normalizeOrder(order) : null;
  const slots = o?.scheduleTimes?.length
    ? o.scheduleTimes
    : [{ date: "", startTime: "09:00", endTime: "18:00", label: "" }];
  const roster = o ? getCrewRoster(o) : [];
  const crewPayouts = o?.crewPayouts?.length
    ? o.crewPayouts
    : [{ crewKey: "", name: "", role: "", payout: 0 }];
  const exp = o?.expenseBreakdown || defaultExpenseBreakdown();

  const expenseFields = EXPENSE_FIELDS.map(
    (f) => `
    <div class="form-group">
      <label>${escapeHtml(f.label)}</label>
      <input type="number" name="exp_${f.key}" min="0" step="1" value="${exp[f.key] || 0}" title="${escapeAttr(f.hint)}" />
      <span class="meta" style="font-size:0.65rem">${escapeHtml(f.hint)}</span>
    </div>`
  ).join("");

  return `
    <div class="form-section">
      <h3 class="form-section-title">Customer &amp; dates</h3>
      <div class="form-group">
        <label>Customer name</label>
        <input name="customerName" required value="${o ? escapeAttr(o.customerName) : ""}" placeholder="Priya & Arun" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Start date</label>
          <input type="date" name="startDate" required value="${o?.startDate || ""}" id="form-start" />
        </div>
        <div class="form-group">
          <label>End date</label>
          <input type="date" name="endDate" required value="${o?.endDate || ""}" id="form-end" />
        </div>
      </div>
      <div class="form-group">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <label>Schedule times (per day)</label>
          <button type="button" class="text-link" id="btn-add-slot">+ Add slot</button>
        </div>
        <div id="slots-container">${slots.map((s) => slotRowHtml(s)).join("")}</div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Crew</h3>
      <div class="form-row">
        <div class="form-group">
          <label>Traditional Photographers</label>
          <input class="crew-roster-input" name="photographers" value="${o ? escapeAttr((o.photographers || []).join(", ")) : ""}" placeholder="Ragu, Karthik" />
        </div>
        <div class="form-group">
          <label>Traditional Videographer</label>
          <input class="crew-roster-input" name="videographers" value="${o ? escapeAttr((o.videographers || []).join(", ")) : ""}" placeholder="Suresh, Vijay" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Candid photographers</label>
          <input class="crew-roster-input" name="candidPhotographers" value="${o ? escapeAttr((o.candidPhotographers || []).join(", ")) : ""}" placeholder="Names, comma-separated" />
        </div>
        <div class="form-group">
          <label>Candid videographers</label>
          <input class="crew-roster-input" name="candidVideographers" value="${o ? escapeAttr((o.candidVideographers || []).join(", ")) : ""}" placeholder="Names, comma-separated" />
        </div>
      </div>
      <div class="form-group">
        <label>Receiving Videographer</label>
        <input class="crew-roster-input" name="receivingVideographers" value="${o ? escapeAttr((o.receivingVideographers || []).join(", ")) : ""}" placeholder="Names, comma-separated" />
      </div>
      <div class="form-group">
        <label>Drone</label>
        <input name="drone" value="${o ? escapeAttr(o.drone) : ""}" placeholder="Operator & model, or Not included" />
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Crew payouts</h3>
      <p class="form-section-desc">Select a crew member from above, or choose Other for helpers and drivers</p>
      <div id="crew-container">${crewPayouts.map((p) => crewRowHtml(p, roster)).join("")}</div>
      <button type="button" class="text-link" id="btn-add-crew">+ Add crew payout</button>
      <button type="button" class="text-link" id="btn-sync-crew-payouts" style="margin-left:0.75rem">Auto-add missing crew</button>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Services &amp; production</h3>
      <div class="form-row">
        <div class="form-group">
          <label>LED wall unit size</label>
          <input name="ledWallSize" value="${o ? escapeAttr(o.ledWallSize) : ""}" placeholder="e.g. 20×10 ft, or —" />
        </div>
        <div class="form-group">
          <label>No. of albums</label>
          <input type="number" name="albumCount" min="0" value="${o?.albumCount ?? 0}" />
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Expense breakdown</h3>
      <p class="form-section-desc">Operating expenses — totals roll up to booking cost (separate from crew payouts above)</p>
      <div class="expense-grid">${expenseFields}</div>
      <div class="expense-total-bar" id="form-expense-summary">
        <span>Operating: <strong id="sum-operating">₹0</strong></span>
        <span>Crew payouts: <strong id="sum-crew">₹0</strong></span>
        <span>Total expenses: <strong id="sum-grand">₹0</strong></span>
      </div>
    </div>

    <div class="form-section">
      <h3 class="form-section-title">Budget</h3>
      <div class="form-group">
        <label>Total booking budget (₹)</label>
        <input type="number" name="budget" min="0" value="${o?.budget ?? 0}" />
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes" rows="3" placeholder="Venue, special requests…">${o?.notes ? escapeHtml(o.notes) : ""}</textarea>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" class="btn-primary">${o ? "Save changes" : "Add order"}</button>
      <button type="button" class="btn-secondary" id="form-cancel">Cancel</button>
    </div>`;
}

function crewLinkSelectHtml(roster, selectedKey) {
  const opts = roster
    .map(
      (r) =>
        `<option value="${escapeAttr(r.crewKey)}" ${selectedKey === r.crewKey ? "selected" : ""}>${escapeHtml(r.roleLabel)} — ${escapeHtml(r.name)}</option>`
    )
    .join("");
  return `
    <option value="">Select crew member…</option>
    ${opts}
    <option value="other" ${selectedKey === "other" ? "selected" : ""}>Other (helper, driver…)</option>`;
}

function crewRowHtml(l, roster = []) {
  const key = l.crewKey || "";
  const isOther = key === "other" || (!key && (l.name || l.role));
  const selectedKey = key || (isOther ? "other" : "");
  const showOther = selectedKey === "other";

  return `
    <div class="crew-row" data-crew-row>
      <div class="form-group crew-link-wrap" style="margin:0;grid-column:1/-2">
        <label>Crew member</label>
        <select name="crewLink" class="crew-link-select">${crewLinkSelectHtml(roster, selectedKey)}</select>
      </div>
      <div class="form-group crew-payout-wrap" style="margin:0">
        <label>Payout (₹)</label>
        <input type="number" name="crewPayout" min="0" value="${l.payout ?? 0}" />
      </div>
      <button type="button" class="btn-icon btn-remove-crew" title="Remove">✕</button>
      <div class="crew-other-fields form-row" style="grid-column:1/-1;${showOther ? "" : "display:none"}" data-other-fields>
        <div class="form-group" style="margin:0">
          <label>Name</label>
          <input type="text" name="crewName" value="${escapeAttr(showOther ? l.name || "" : "")}" placeholder="Murugan" />
        </div>
        <div class="form-group" style="margin:0">
          <label>Role</label>
          <input type="text" name="crewRole" value="${escapeAttr(showOther ? l.role || "" : "")}" placeholder="Helper, Driver…" />
        </div>
      </div>
    </div>`;
}

function addCrewRow() {
  const form = $("#order-form");
  const roster = getCrewRosterFromForm(form);
  $("#crew-container").insertAdjacentHTML("beforeend", crewRowHtml({}, roster));
  const rows = $$(".crew-row", $("#crew-container"));
  bindCrewPayoutRow(rows[rows.length - 1]);
  updateFormExpenseTotals();
}

function bindCrewPayoutRow(row) {
  if (!row) return;
  const sel = row.querySelector(".crew-link-select");
  if (!sel) return;
  sel.addEventListener("change", () => onCrewLinkChange(sel));
}

function onCrewLinkChange(sel) {
  const row = sel.closest(".crew-row");
  const other = row.querySelector("[data-other-fields]");
  if (sel.value === "other") {
    other.style.display = "";
    return;
  }
  other.style.display = "none";
  const roster = getCrewRosterFromForm($("#order-form"));
  const match = roster.find((r) => r.crewKey === sel.value);
  if (match) {
    row.querySelector('[name="crewName"]').value = match.name;
    row.querySelector('[name="crewRole"]').value = match.roleLabel;
  }
}

function syncCrewPayoutSelects() {
  const form = $("#order-form");
  if (!form) return;
  const roster = getCrewRosterFromForm(form);
  $$(".crew-row", form).forEach((row) => {
    const sel = row.querySelector(".crew-link-select");
    if (!sel) return;
    const current = sel.value;
    sel.innerHTML = crewLinkSelectHtml(roster, current);
    if (current && ![...sel.options].some((o) => o.value === current)) {
      sel.value = current.startsWith("traditional") || current.includes("::") ? "" : current;
    }
    onCrewLinkChange(sel);
  });
}

function autoAddMissingCrewPayouts() {
  const form = $("#order-form");
  const roster = getCrewRosterFromForm(form);
  const existing = new Set(
    $$(".crew-link-select", form)
      .map((s) => s.value)
      .filter((v) => v && v !== "other")
  );
  roster.forEach((r) => {
    if (existing.has(r.crewKey)) return;
    $("#crew-container").insertAdjacentHTML(
      "beforeend",
      crewRowHtml({ crewKey: r.crewKey, name: r.name, role: r.roleLabel, payout: 0 }, roster)
    );
    const rows = $$(".crew-row", $("#crew-container"));
    bindCrewPayoutRow(rows[rows.length - 1]);
  });
  syncCrewPayoutSelects();
  updateFormExpenseTotals();
}

function bindCrewFieldListeners() {
  const form = $("#order-form");
  if (!form) return;
  $$(".crew-roster-input", form).forEach((input) => {
    input.addEventListener("input", syncCrewPayoutSelects);
  });
}

function bindAllCrewPayoutRows() {
  $$(".crew-row", $("#order-form")).forEach(bindCrewPayoutRow);
}

function updateFormExpenseTotals() {
  const form = $("#order-form");
  if (!form) return;
  let operating = 0;
  EXPENSE_FIELDS.forEach((f) => {
    const el = form[`exp_${f.key}`];
    if (el) operating += Number(el.value) || 0;
  });
  let crew = 0;
  $$(".crew-row", form).forEach((row) => {
    const p = row.querySelector('[name="crewPayout"]');
    if (p) crew += Number(p.value) || 0;
  });
  const set = (id, val) => {
    const el = $(id);
    if (el) el.textContent = formatCurrency(val);
  };
  set("#sum-operating", operating);
  set("#sum-crew", crew);
  set("#sum-grand", operating + crew);
}

function slotRowHtml(s) {
  return `
    <div class="slot-block">
      <div class="form-row">
        <input type="date" name="slotDate" value="${s.date || ""}" />
        <input type="text" name="slotLabel" placeholder="Label (e.g. Wedding)" value="${escapeAttr(s.label || "")}" />
      </div>
      <div class="form-row">
        <input type="time" name="slotStart" value="${s.startTime || "09:00"}" />
        <div style="display:flex;gap:0.5rem">
          <input type="time" name="slotEnd" value="${s.endTime || "18:00"}" style="flex:1" />
          <button type="button" class="btn-icon btn-remove-slot">✕</button>
        </div>
      </div>
    </div>`;
}

function addSlotRow() {
  $("#slots-container").insertAdjacentHTML("beforeend", slotRowHtml({}));
}

function submitOrderForm() {
  const form = $("#order-form");
  const customerName = form.customerName.value.trim();
  const startDate = form.startDate.value;
  let endDate = form.endDate.value || startDate;
  if (endDate < startDate) endDate = startDate;

  const slotBlocks = $$(".slot-block", form);
  const scheduleTimes = [];
  slotBlocks.forEach((block) => {
    const date = block.querySelector('[name="slotDate"]').value;
    if (!date) return;
    scheduleTimes.push({
      date,
      startTime: block.querySelector('[name="slotStart"]').value,
      endTime: block.querySelector('[name="slotEnd"]').value,
      label: block.querySelector('[name="slotLabel"]').value.trim() || undefined,
    });
  });

  const expenseBreakdown = {};
  EXPENSE_FIELDS.forEach((f) => {
    const el = form[`exp_${f.key}`];
    expenseBreakdown[f.key] = el ? Number(el.value) || 0 : 0;
  });

  const crewData = {
    photographers: parseNames(form.photographers.value),
    videographers: parseNames(form.videographers.value),
    candidPhotographers: parseNames(form.candidPhotographers.value),
    candidVideographers: parseNames(form.candidVideographers.value),
    receivingVideographers: parseNames(form.receivingVideographers.value),
  };
  const roster = getCrewRoster(crewData);

  const crewPayouts = [];
  $$(".crew-row", form).forEach((row) => {
    const crewKey = row.querySelector('[name="crewLink"]')?.value || "";
    const payout = Number(row.querySelector('[name="crewPayout"]')?.value) || 0;
    const name = row.querySelector('[name="crewName"]')?.value.trim() || "";
    const role = row.querySelector('[name="crewRole"]')?.value.trim() || "";
    if (!crewKey && !name && !payout) return;
    crewPayouts.push(
      normalizeCrewPayout({ crewKey: crewKey || "other", name, role, payout }, roster)
    );
  });

  const payload = normalizeOrder({
    customerName,
    startDate,
    endDate,
    scheduleTimes,
    ...crewData,
    drone: form.drone.value.trim(),
    ledWallSize: form.ledWallSize.value.trim(),
    albumCount: Number(form.albumCount.value) || 0,
    crewPayouts,
    expenseBreakdown,
    budget: Number(form.budget.value) || 0,
    notes: form.notes.value.trim() || undefined,
  });

  if (editingOrderId) {
    const idx = orders.findIndex((o) => o.id === editingOrderId);
    if (idx >= 0) orders[idx] = { ...payload, id: editingOrderId };
  } else {
    orders.push({ ...payload, id: createId() });
  }

  saveOrders({
    history: {
      action: editingOrderId ? "edit" : "add",
      label: editingOrderId
        ? `Updated booking: ${customerName}`
        : `Added booking: ${customerName}`,
    },
  });
  closeForm();
  render();
}

/* ——— Events ——— */
function bindPageEvents(route) {
  if (route === "dashboard") {
    $$("[data-scope]").forEach((btn) => {
      btn.onclick = () => {
        dashboardScope = btn.dataset.scope;
        if (dashboardScope === "month") {
          const now = new Date();
          dashboardPickYear = now.getFullYear();
          dashboardPickMonth = now.getMonth();
        }
        render();
      };
    });

    $$(".month-tab").forEach((btn) => {
      btn.onclick = () => {
        dashboardPickMonth = Number(btn.dataset.pickMonth);
        render();
      };
    });

    $("#dash-year-prev")?.addEventListener("click", () => {
      dashboardPickYear--;
      render();
    });
    $("#dash-year-next")?.addEventListener("click", () => {
      dashboardPickYear++;
      render();
    });

    $$("[data-export-scope]").forEach((btn) => {
      btn.onclick = () => {
        dashboardExportScope = btn.dataset.exportScope;
        render();
      };
    });

    $$("[data-export]").forEach((btn) => {
      btn.onclick = () => {
        const format = btn.dataset.export;
        if (format === "pdf") exportDashboardPdf(dashboardExportScope);
        else exportDashboardExcel(dashboardExportScope);
      };
    });
  }

  if (route === "calendar") {
    $("#cal-prev")?.addEventListener("click", () => {
      calMonth--;
      if (calMonth < 0) {
        calMonth = 11;
        calYear--;
      }
      render();
    });
    $("#cal-next")?.addEventListener("click", () => {
      calMonth++;
      if (calMonth > 11) {
        calMonth = 0;
        calYear++;
      }
      render();
    });
    $("#cal-today")?.addEventListener("click", () => {
      const n = new Date();
      calYear = n.getFullYear();
      calMonth = n.getMonth();
      calDay = n.getDate();
      render();
    });
    $$("[data-cal-view]").forEach((btn) => {
      btn.onclick = () => {
        calView = btn.dataset.calView;
        render();
      };
    });
    $$(".cal-event").forEach((btn) => {
      btn.onclick = () => showOrderDetail(btn.dataset.orderId);
    });
  }

  if (route === "orders") {
    $("#btn-new-order")?.addEventListener("click", () => openOrderForm());
    $("#btn-add-first")?.addEventListener("click", () => openOrderForm());
    $("#order-search")?.addEventListener("input", (e) => {
      window._orderSearch = e.target.value;
      render();
    });
    $("#order-sort")?.addEventListener("change", (e) => {
      window._orderSort = e.target.value;
      render();
    });
    $$("[data-view-id]").forEach((btn) => {
      btn.onclick = () => showOrderDetail(btn.dataset.viewId);
    });
    $$("[data-edit-id]").forEach((btn) => {
      btn.onclick = () => openOrderForm(btn.dataset.editId);
    });
    $$("[data-delete-id]").forEach((btn) => {
      btn.onclick = () => {
        const o = orders.find((x) => x.id === btn.dataset.deleteId);
        if (o && confirm(`Delete order for ${o.customerName}?`)) {
          orders = orders.filter((x) => x.id !== btn.dataset.deleteId);
          saveOrders({
            history: { action: "delete", label: `Deleted booking: ${o.customerName}` },
          });
          render();
        }
      };
    });
  }

  const startInput = $("#form-start");
  if (startInput) {
    startInput.addEventListener("change", () => {
      const end = $("#form-end");
      if (end && (!end.value || end.value < startInput.value)) end.value = startInput.value;
    });
  }
  const cancelBtn = $("#form-cancel");
  if (cancelBtn) cancelBtn.addEventListener("click", closeForm);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, "&#39;");
}

function showFooterMessage(msg) {
  const el = $("#footer-message");
  el.textContent = msg;
  el.hidden = false;
  setTimeout(() => {
    el.hidden = true;
  }, 3000);
}

/* ——— Save history UI ——— */
function openHistoryPanel() {
  const list = loadHistory();
  const body = $("#history-body");
  if (!list.length) {
    body.innerHTML =
      '<p class="empty-state">No saved changes yet. Edits to bookings will appear here.</p>';
  } else {
    body.innerHTML = `<ul class="history-list">${list
      .map((h) => {
        const actionLabel =
          {
            add: "Added",
            edit: "Updated",
            delete: "Deleted",
            import: "Imported",
            restore: "Restored",
            samples: "Samples",
          }[h.action] || "Changed";
        return `<li class="history-item">
          <div class="history-item-main">
            <span class="history-action">${escapeHtml(actionLabel)}</span>
            <strong>${escapeHtml(h.label)}</strong>
            <span class="meta">${formatHistoryTime(h.at)} · ${h.orderCount} order${h.orderCount !== 1 ? "s" : ""}</span>
          </div>
          <button type="button" class="btn-secondary btn-sm btn-restore-history" data-history-id="${escapeAttr(h.id)}">Restore</button>
        </li>`;
      })
      .join("")}</ul>`;
    $$(".btn-restore-history", body).forEach((btn) => {
      btn.onclick = () => restoreFromHistory(btn.dataset.historyId);
    });
  }
  const overlay = $("#history-overlay");
  overlay.hidden = false;
  $("#history-close").onclick = closeHistoryPanel;
  overlay.onclick = (e) => {
    if (e.target === overlay) closeHistoryPanel();
  };
}

function closeHistoryPanel() {
  $("#history-overlay").hidden = true;
}

function restoreFromHistory(historyId) {
  const entry = loadHistory().find((h) => h.id === historyId);
  if (!entry?.snapshot) return;
  if (
    !confirm(
      `Restore data from ${formatHistoryTime(entry.at)}?\n\n"${entry.label}"\n\nCurrent data will be saved to history first.`
    )
  ) {
    return;
  }
  recordHistory("restore", `Before restore: ${entry.label}`);
  orders = entry.snapshot.map(normalizeOrder);
  saveOrders({
    history: { action: "restore", label: `Restored: ${entry.label}` },
  });
  showFooterMessage("Restored from history");
  closeHistoryPanel();
  render();
}

/* ——— Footer backup ——— */
function setupFooter() {
  $("#btn-export").onclick = () => {
    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fwds-orders-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  $("#btn-import").onclick = () => $("#import-file").click();

  $("#import-file").onchange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error();
        orders = data.map(normalizeOrder);
        saveOrders({
          history: {
            action: "import",
            label: `Imported ${orders.length} bookings from file`,
          },
        });
        showFooterMessage("Import successful");
        render();
      } catch {
        showFooterMessage("Import failed — check JSON format");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  $("#btn-history").onclick = () => openHistoryPanel();
}

/* ——— Init ——— */
initData();
setupFooter();
window.addEventListener("hashchange", render);
render();

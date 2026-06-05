/* ============================================================
   KPI DETAIL DIALOGS
   Opens when clicking any KPI card on the dashboard.
   Respects the current dashboard scope (Month / Year / All time).
   ============================================================ */

let kpiDetailScope = "month"; // mirrors dashboardScope when opened
let kpiDetailYear  = new Date().getFullYear();
let kpiDetailMonth = new Date().getMonth();
let kpiDetailMetric = "";

/* ── helpers ─────────────────────────────────────────────── */
function _ucfirst(str) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ");
}

function _paidAmount(order) {
  return (order.payments?.advancePaid    || 0)
       + (order.payments?.secondPayment  || 0)
       + (order.payments?.finalPayment   || 0);
}

function _pendingAmount(order) {
  return (order.payments?.totalPackage || 0) - _paidAmount(order);
}

function _crewPayout(order) {
  return (order.crewPayouts || []).reduce((s, p) => s + (p.payout || 0), 0);
}

function _scopeLabel(scope, year, month) {
  if (scope === "all")   return "All time";
  if (scope === "year")  return String(year);
  return new Date(year, month, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function _getFilteredOrders(scope, year, month) {
  if (scope === "all")  return [...orders];
  if (scope === "year") return orders.filter(o => parseDate(o.startDate).getFullYear() === year);
  return orders.filter(o => {
    const d = parseDate(o.startDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/* ── metric definitions ──────────────────────────────────── */
function _getMetric(metricType, scope, year, month) {
  const base = _getFilteredOrders(scope, year, month);

  const defs = {
    "total-bookings": {
      title: "Total Bookings",
      desc:  "All bookings in the selected period",
      data:  base,
      cols:  ["Customer", "Event Type", "Date", "Status", "Package", "Received", "Pending"],
    },
    "this-month-events": {
      title: "This Month Events",
      desc:  "Events with a start date in the selected month",
      data:  base,
      cols:  ["Customer", "Event Type", "Date", "Status", "Package"],
    },
    "upcoming-events": {
      title: "Upcoming Events",
      desc:  "Events that haven't happened yet",
      data:  base.filter(o => parseDate(o.startDate) >= new Date()),
      cols:  ["Customer", "Event Type", "Date", "Days Away", "Status", "Package"],
    },
    "shoot-completed": {
      title: "Shoot Completed",
      desc:  "Bookings where the shoot is done",
      data:  base.filter(o => isShootCompleted(o)),
      cols:  ["Customer", "Event Type", "Date", "Status", "Progress", "Package"],
    },
    "editing-pending": {
      title: "Editing Pending",
      desc:  "Jobs still in editing / album stage",
      data:  base.filter(o => getEditingPendingOrders().find(x => x.id === o.id)),
      cols:  ["Customer", "Event Type", "Date", "Status", "Progress", "Package"],
    },
    "album-pending": {
      title: "Album Pending",
      desc:  "Jobs where album design/delivery is pending",
      data:  base.filter(o => getAlbumPendingOrders().find(x => x.id === o.id)),
      cols:  ["Customer", "Event Type", "Date", "Status", "Progress"],
    },
    "total-revenue": {
      title:   "Total Revenue",
      desc:    "Total package value across all bookings",
      data:    base,
      cols:    ["Customer", "Event Type", "Date", "Package", "Received", "Pending"],
      summary: true,
    },
    "total-expense": {
      title:   "Total Expense",
      desc:    "Crew payouts + operational expenses",
      data:    base,
      cols:    ["Customer", "Event Type", "Date", "Expense", "Crew Paid"],
      summary: true,
    },
    "net-profit": {
      title:   "Net Profit",
      desc:    "Revenue minus expenses",
      data:    base,
      cols:    ["Customer", "Event Type", "Date", "Package", "Expense", "Profit"],
      summary: true,
    },
    "pending-balance": {
      title: "Pending Balance",
      desc:  "Outstanding amounts not yet collected",
      data:  base.filter(o => _pendingAmount(o) > 0),
      cols:  ["Customer", "Event Type", "Date", "Package", "Received", "Pending"],
    },
  };

  return defs[metricType] || null;
}

/* ── cell value resolver ─────────────────────────────────── */
function _cellValue(col, order) {
  const startDate = parseDate(order.startDate);
  const paid      = _paidAmount(order);
  const pending   = _pendingAmount(order);
  const expense   = getTotalExpenses(order);
  const profit    = (order.payments?.totalPackage || 0) - expense;
  const daysAway  = Math.ceil((startDate - new Date()) / 86400000);

  const map = {
    "Customer":   order.customerName || "—",
    "Event Type": order.eventType || "—",
    "Date":       formatDate(startDate, { month: "short", day: "numeric", year: "numeric" }),
    "Status":     _ucfirst(order.status),
    "Package":    formatCurrency(order.payments?.totalPackage || 0),
    "Received":   formatCurrency(paid),
    "Pending":    formatCurrency(pending),
    "Expense":    formatCurrency(expense),
    "Crew Paid":  formatCurrency(_crewPayout(order)),
    "Profit":     formatCurrency(profit),
    "Progress":   `${getDeliverableProgress(order)}%`,
    "Days Away":  daysAway > 0 ? `${daysAway}d` : "Past",
  };
  return map[col] !== undefined ? map[col] : "—";
}

/* ── summary strip (revenue / expense / profit / balance) ── */
function _renderSummary(data) {
  const rev  = data.reduce((s, o) => s + (o.payments?.totalPackage || 0), 0);
  const exp  = data.reduce((s, o) => s + getTotalExpenses(o), 0);
  const bal  = data.reduce((s, o) => s + _pendingAmount(o), 0);
  const prof = rev - exp;
  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:0.75rem;margin-bottom:1.25rem">
      ${[
        ["Revenue",    formatCurrency(rev),  "var(--gold)"],
        ["Expense",    formatCurrency(exp),  "var(--wine)"],
        ["Profit",     formatCurrency(prof), prof >= 0 ? "var(--green)" : "var(--red)"],
        ["Outstanding",formatCurrency(bal),  "var(--warm)"],
      ].map(([label, val, color]) => `
        <div style="background:var(--cream);border-radius:10px;padding:0.75rem;border:1px solid var(--blush)">
          <div style="font-size:0.65rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--warm);margin-bottom:0.3rem">${label}</div>
          <div style="font-size:1.05rem;font-weight:700;color:${color}">${val}</div>
        </div>`).join("")}
    </div>`;
}

/* ── scope pills ─────────────────────────────────────────── */
function _renderScopePills(active) {
  return ["month","year","all"].map(s => {
    const label = s === "all" ? "All time" : s === "year" ? "This year" : "This month";
    const isAct = s === active;
    return `<button type="button" class="kpi-scope-btn"
      data-scope="${s}"
      style="padding:0.35rem 0.9rem;border-radius:20px;font-size:0.8rem;font-weight:500;cursor:pointer;border:1px solid var(--blush);
             background:${isAct ? "var(--gold)" : "var(--paper)"};
             color:${isAct ? "#fff" : "var(--warm)"}">
      ${label}
    </button>`;
  }).join("");
}

/* ── main render ─────────────────────────────────────────── */
function renderKpiDialog(metricType, scope, year, month) {
  const metric = _getMetric(metricType, scope, year, month);
  if (!metric) return `<p>Unknown metric.</p>`;

  const label = _scopeLabel(scope, year, month);
  const rows = metric.data.map(o => `
    <tr class="kpi-detail-row" data-order-id="${o.id}"
      style="cursor:pointer;transition:background 0.15s"
      onmouseover="this.style.background='var(--cream)'"
      onmouseout="this.style.background=''"
    >
      ${metric.cols.map(col => {
        const val = _cellValue(col, o);
        const isNeg = col === "Profit" && val.startsWith("-");
        const color = isNeg ? "var(--red)" : col === "Profit" ? "var(--green)" : col === "Pending" && val !== "₹0" ? "var(--wine)" : "inherit";
        return `<td style="padding:0.6rem 0.75rem;color:${color};white-space:nowrap">${escapeHtml(String(val))}</td>`;
      }).join("")}
    </tr>`).join("");

  return `
    <!-- header -->
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem">
      <div>
        <h3 style="margin:0;font-family:var(--font-display);font-size:1.4rem">${metric.title}</h3>
        <p style="margin:0.25rem 0 0;color:var(--warm);font-size:0.85rem">${metric.desc}</p>
      </div>
      <span style="font-size:0.8rem;color:var(--warm);white-space:nowrap;margin-top:0.25rem">
        ${label} &nbsp;·&nbsp; <strong style="color:var(--charcoal)">${metric.data.length}</strong> record${metric.data.length !== 1 ? "s" : ""}
      </span>
    </div>

    <!-- scope pills -->
    <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:1.25rem">
      ${_renderScopePills(scope)}
    </div>

    <!-- summary strip (for financial metrics) -->
    ${metric.summary ? _renderSummary(metric.data) : ""}

    <!-- table -->
    <div style="overflow-x:auto;max-height:55vh;overflow-y:auto;border-radius:8px;border:1px solid var(--blush)">
      <table style="width:100%;font-size:0.85rem;border-collapse:collapse">
        <thead>
          <tr style="background:var(--cream);position:sticky;top:0;z-index:1">
            ${metric.cols.map(col => `<th style="text-align:left;padding:0.65rem 0.75rem;font-weight:600;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.04em;color:var(--warm);white-space:nowrap;border-bottom:1px solid var(--blush)">${col}</th>`).join("")}
          </tr>
        </thead>
        <tbody>
          ${rows || `<tr><td colspan="${metric.cols.length}" style="text-align:center;padding:2.5rem;color:var(--warm)">No records found</td></tr>`}
        </tbody>
      </table>
    </div>
    <p style="margin:0.5rem 0 0;font-size:0.75rem;color:var(--warm);text-align:right">Click any row to view or edit that booking</p>
  `;
}

/* ── open / close ────────────────────────────────────────── */
function openKpiDetail(metricType) {
  // inherit current dashboard scope
  kpiDetailMetric = metricType;
  kpiDetailScope  = dashboardScope || "month";
  kpiDetailYear   = dashboardPickYear  || new Date().getFullYear();
  kpiDetailMonth  = dashboardPickMonth !== undefined ? dashboardPickMonth : new Date().getMonth();

  _drawKpiDialog();

  const modal = document.getElementById("kpi-detail-modal");
  if (modal) {
    modal.hidden = false;
    // Click outside the dialog (on the backdrop) closes it
    modal.onclick = (e) => {
      if (e.target === modal) closeKpiDetail();
    };
  }

  // Esc key closes it too
  document.addEventListener("keydown", _kpiEscHandler);
}

function _kpiEscHandler(e) {
  if (e.key === "Escape") closeKpiDetail();
}

function _drawKpiDialog() {
  const content = document.getElementById("kpi-detail-content");
  if (!content) return;
  content.innerHTML = renderKpiDialog(kpiDetailMetric, kpiDetailScope, kpiDetailYear, kpiDetailMonth);

  // scope pill listeners
  content.querySelectorAll(".kpi-scope-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      kpiDetailScope = btn.dataset.scope;
      _drawKpiDialog();
    });
  });

  // row click → open order detail panel
  content.querySelectorAll(".kpi-detail-row").forEach(row => {
    row.addEventListener("click", () => {
      const orderId = row.dataset.orderId;
      if (!orderId) return;
      closeKpiDetail();
      if (typeof showOrderDetail === "function") {
        showOrderDetail(orderId);
      }
    });
  });
}

function closeKpiDetail() {
  const modal = document.getElementById("kpi-detail-modal");
  if (modal) modal.hidden = true;
  document.removeEventListener("keydown", _kpiEscHandler);
}

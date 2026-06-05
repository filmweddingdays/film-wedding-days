/* Business dashboard — premium layout */

/* Compact Indian-currency label for charts (₹1.2L, ₹85K, ₹2Cr) */
function formatCompactInr(val) {
  const num = Number(val) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (abs >= 1e7) return `${sign}₹${(abs / 1e7).toFixed(abs % 1e7 === 0 ? 0 : 2)}Cr`;
  if (abs >= 1e5) return `${sign}₹${(abs / 1e5).toFixed(abs % 1e5 === 0 ? 0 : 1)}L`;
  if (abs >= 1e3) return `${sign}₹${Math.round(abs / 1e3)}K`;
  return `${sign}₹${abs}`;
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

function bindDashboardEvents() {
  // KPI card click handlers
  $$(".kpi-card[data-metric]").forEach((card) => {
    card.addEventListener("click", () => {
      const metricType = card.dataset.metric;
      if (metricType) {
        openKpiDetail(metricType);
      }
    });
  });

  // Month picker
  $$(".month-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const month = parseInt(btn.dataset.pickMonth);
      dashboardPickMonth = month;
      saveAppData();
      render();
    });
  });

  // Scope toggle
  $$(".scope-toggle button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const scope = btn.dataset.scope;
      dashboardScope = scope;
      dashboardExportScope = scope;
      saveAppData();
      render();
    });
  });
}

function getDashboardScopeLabel(scope) {
  if (scope === "month") {
    return new Date(dashboardPickYear, dashboardPickMonth, 1).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
  }
  if (scope === "year") return String(new Date().getFullYear());
  return "All time";
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

function renderStatCard(icon, label, value, sub, valueClass, metricType) {
  return `
    <div class="card kpi-card stat-card" data-metric="${metricType || ""}" style="cursor:pointer;transition:transform 0.2s,box-shadow 0.2s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='var(--shadow-lg)'" onmouseout="this.style.transform='none';this.style.boxShadow='var(--shadow)'">
      <span class="stat-icon" aria-hidden="true">${icon}</span>
      <div class="kpi-label">${escapeHtml(label)}</div>
      <div class="kpi-value ${valueClass || ""}">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ""}
    </div>`;
}

function renderBarChart(stats, valueKey = "count") {
  if (!stats.length) {
    return `<p class="meta" style="padding:1rem 0">No data yet</p>`;
  }
  const isMoney = valueKey === "profit" || valueKey === "revenue" || valueKey === "expenses";
  const max = Math.max(...stats.map((s) => Math.abs(Number(s[valueKey]) || 0)), 1);
  return `
    <div class="chart-bars">
      ${stats
        .map((s) => {
          const val = Number(s[valueKey]) || 0;
          const h = Math.max((Math.abs(val) / max) * 80, val ? 6 : 1.5);
          const display = isMoney ? formatCompactInr(val) : val;
          const fullTitle = isMoney ? formatCurrency(val) : String(val);
          const barStyle = val < 0 ? "background:var(--red)" : "";
          return `
        <div class="chart-col">
          <span class="count" title="${fullTitle}">${display}</span>
          <div class="bar" style="height:${h}%;${barStyle}"></div>
          <span class="label">${escapeHtml(s.label)}</span>
        </div>`;
        })
        .join("")}
    </div>`;
}

function renderDualBarChart(stats) {
  if (!stats.length) {
    return `<p class="meta" style="padding:1rem 0">No data yet</p>`;
  }
  const max = Math.max(...stats.flatMap((s) => [s.revenue || 0, s.expenses || 0]), 1);
  return `
    <div class="chart-bars chart-bars-dual">
      ${stats
        .map((s) => {
          const rev = s.revenue || 0;
          const exp = s.expenses || 0;
          const revH = Math.max((rev / max) * 100, rev ? 6 : 2);
          const expH = Math.max((exp / max) * 100, exp ? 6 : 2);
          return `
        <div class="chart-col chart-col-dual">
          <div class="dual-bar-group">
            <div class="bar bar-revenue" style="height:${revH}%" title="Revenue"></div>
            <div class="bar bar-expense" style="height:${expH}%" title="Expense"></div>
          </div>
          <span class="label">${escapeHtml(s.label)}</span>
        </div>`;
        })
        .join("")}
    </div>
    <div class="chart-legend" style="display:flex;gap:1rem;margin-top:0.75rem;font-size:0.75rem;color:var(--warm)">
      <span><span style="display:inline-block;width:0.65rem;height:0.65rem;background:var(--gold);border-radius:2px;margin-right:0.25rem"></span>Revenue</span>
      <span><span style="display:inline-block;width:0.65rem;height:0.65rem;background:var(--warm);border-radius:2px;margin-right:0.25rem"></span>Expense</span>
    </div>`;
}

function renderTypeChart(counts) {
  if (!counts.length) {
    return `<p class="meta" style="padding:1rem 0">No events yet</p>`;
  }
  const max = Math.max(...counts.map((c) => c.count), 1);
  return `
    <div class="type-chart">
      ${counts
        .map((t) => {
          const pctW = Math.max((t.count / max) * 100, t.count ? 8 : 2);
          return `
        <div class="type-chart-row">
          <span class="type-chart-label">${escapeHtml(t.label)}</span>
          <div class="type-chart-track">
            <div class="type-chart-bar" style="width:${pctW}%;background:${t.color}"></div>
          </div>
          <span class="type-chart-count">${t.count}</span>
        </div>`;
        })
        .join("")}
    </div>`;
}

function renderTodaySchedule() {
  const today = getTodaySchedule();
  if (!today.length) {
    return `<p class="empty-state">No events scheduled for today.</p>`;
  }
  return `
    <ul class="upcoming-list">
      ${today
        .map((o) => {
          const slot = (o.scheduleTimes || []).find((s) => s.date === toIsoDate(new Date())) || o.scheduleTimes?.[0];
          const time = slot ? `${slot.startTime}${slot.endTime ? " – " + slot.endTime : ""}` : "—";
          return `
        <li>
          <div>
            <div class="name">${escapeHtml(o.customerName)} ${eventTypeBadge(o.eventType)}</div>
            <div class="meta">${formatDateRange(o)} · Day ${getEventDayOnDate(o, new Date())}/${getEventDays(o)}</div>
            <div class="crew">${escapeHtml(crewSummary(o))}</div>
          </div>
          <div class="meta" style="text-align:right">
            <div>${escapeHtml(time)}</div>
            <strong>${formatCurrency(o.payments?.totalPackage || o.budget || 0)}</strong>
            ${statusBadge(o.status)}
          </div>
        </li>`;
        })
        .join("")}
    </ul>`;
}

function getEventDayOnDate(order, date) {
  const start = parseDate(order.startDate);
  const d = parseDate(toIsoDate(date));
  return Math.max(1, Math.round((d - start) / 86400000) + 1);
}

function renderUpcomingSection() {
  const upcoming = getUpcoming(orders, 7);
  if (!upcoming.length) {
    return `<p class="empty-state">No upcoming events. <a href="#/orders" class="link-gold">Add a booking</a></p>`;
  }
  return `
    <ul class="upcoming-list">
      ${upcoming
        .map((o) => `
        <li>
          <div>
            <div class="name">${escapeHtml(o.customerName)} ${eventTypeBadge(o.eventType)}</div>
            <div class="meta">${formatDateRange(o)} · ${getEventDays(o)} days</div>
            <div class="crew">${escapeHtml(crewSummary(o))}</div>
          </div>
          <div class="meta" style="text-align:right">
            <div>${formatDate(parseDate(o.startDate), { weekday: "short", day: "numeric", month: "short" })}</div>
            <strong>${formatCurrency(o.payments?.totalPackage || o.budget || 0)}</strong>
            ${statusBadge(o.status)}
          </div>
        </li>`)
        .join("")}
    </ul>`;
}

function renderPendingPaymentsTable() {
  const pending = getPendingPayments();
  if (!pending.length) {
    return `<p class="empty-state">All payments collected — great work!</p>`;
  }
  const rows = pending
    .map((o) => {
      const bal = getBalance(o);
      const due = o.payments?.dueDate
        ? formatDate(parseDate(o.payments.dueDate), { day: "numeric", month: "short", year: "numeric" })
        : "—";
      return `
        <tr>
          <td><strong>${escapeHtml(o.customerName)}</strong></td>
          <td>${formatDateRange(o)}</td>
          <td>${eventTypeBadge(o.eventType)}</td>
          <td class="profit-neg">${formatCurrency(bal)}</td>
          <td>${escapeHtml(due)}</td>
          <td>${statusBadge(o.status)}</td>
        </tr>`;
    })
    .join("");
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Dates</th>
            <th>Type</th>
            <th>Balance</th>
            <th>Due</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderDeliveryPendingSection() {
  const editing = getEditingPendingOrders();
  const album = getAlbumPendingOrders();
  if (!editing.length && !album.length) {
    return `<p class="empty-state">No pending editing or album deliveries.</p>`;
  }
  const renderList = (list, title) => {
    if (!list.length) return "";
    return `
      <div style="margin-bottom:1.25rem">
        <h4 style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em;color:var(--warm);margin:0 0 0.5rem">${escapeHtml(title)} (${list.length})</h4>
        <ul class="upcoming-list">
          ${list
            .map(
              (o) => `
            <li>
              <div>
                <div class="name">${escapeHtml(o.customerName)} ${eventTypeBadge(o.eventType)}</div>
                <div class="meta">${formatDateRange(o)} · ${getDeliverableProgress(o)}% deliverables</div>
              </div>
              <div class="meta" style="text-align:right">
                ${statusBadge(o.status)}
                <div><strong>${formatCurrency(o.payments?.totalPackage || o.budget || 0)}</strong></div>
              </div>
            </li>`
            )
            .join("")}
        </ul>
      </div>`;
  };
  return renderList(editing, "Editing pending") + renderList(album, "Album delivery pending");
}

function renderCollectionsHero() {
  const totals = getTotals(orders);
  const revenue = totals.revenue;
  const collected = totals.paid;
  const outstanding = totals.balance;
  const rate = revenue ? Math.round((collected / revenue) * 100) : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pending = getPendingPayments()
    .slice()
    .sort((a, b) => getBalance(b) - getBalance(a));

  const isOverdue = (o) => {
    const dd = o.payments?.dueDate ? parseDate(o.payments.dueDate) : null;
    return dd && dd < today;
  };
  const overdueCount = pending.filter(isOverdue).length;

  const rows = pending
    .map((o) => {
      const bal = getBalance(o);
      const pkg = o.payments?.totalPackage || o.budget || 0;
      const paidPct = pkg ? Math.round(((pkg - bal) / pkg) * 100) : 0;
      const dd = o.payments?.dueDate ? parseDate(o.payments.dueDate) : null;
      const overdue = dd && dd < today;
      const dueLabel = dd ? formatDate(dd, { day: "numeric", month: "short", year: "numeric" }) : "No due date";
      return `
        <li class="collect-row${overdue ? " is-overdue" : ""}" data-id="${o.id}">
          <div class="collect-row-info">
            <span class="collect-name">${escapeHtml(o.customerName)}</span>
            <span class="collect-due${overdue ? " overdue" : ""}">${overdue ? "⚠ Overdue · " : ""}${escapeHtml(dueLabel)}</span>
          </div>
          <div class="collect-bar" title="${paidPct}% collected"><span style="width:${paidPct}%"></span></div>
          <div class="collect-row-amt">
            <span class="collect-bal">${formatCurrency(bal)}</span>
            <span class="collect-paidpct">${paidPct}% paid</span>
          </div>
        </li>`;
    })
    .join("");

  return `
    <div class="card collections-hero">
      <div class="collections-head">
        <div class="collections-headline">
          <div class="collections-eyebrow">Outstanding from clients</div>
          <div class="collections-amount">${formatCurrency(outstanding)}</div>
          <div class="collections-sub">${pending.length} open ${pending.length === 1 ? "invoice" : "invoices"}${overdueCount ? ` · <span class="overdue">${overdueCount} overdue</span>` : ""}</div>
        </div>
        <div class="collections-meter">
          <div class="collections-meter-track"><span style="width:${rate}%"></span></div>
          <div class="collections-meter-label"><strong>${rate}%</strong> collected — ${formatCurrency(collected)} of ${formatCurrency(revenue)}</div>
        </div>
      </div>
      <ul class="collections-ledger">${rows || '<li class="collect-empty">All payments collected — great work!</li>'}</ul>
    </div>`;
}

/* ── Production pipeline: macro-stages from the status flow ── */
const PIPELINE_STAGES = [
  { key: "lead", label: "Lead", statuses: ["new-lead", "quotation-sent"] },
  { key: "booked", label: "Booked", statuses: ["advance-paid", "confirmed"] },
  { key: "production", label: "Production", statuses: ["shoot-scheduled", "shoot-completed"] },
  { key: "post", label: "Post-production", statuses: ["editing", "album-design"] },
  { key: "delivered", label: "Delivered", statuses: ["delivered", "closed"] },
];

function renderProductionFunnel() {
  const active = orders.filter((o) => o.status !== "cancelled");
  const pkg = (o) => o.payments?.totalPackage || o.budget || 0;

  const stageData = PIPELINE_STAGES.map((st) => {
    const list = active.filter((o) => st.statuses.includes(o.status));
    return { ...st, count: list.length, value: list.reduce((s, o) => s + pkg(o), 0) };
  });
  const maxCount = Math.max(...stageData.map((s) => s.count), 1);

  const funnelBars = stageData
    .map((s) => {
      const w = Math.max((s.count / maxCount) * 100, s.count ? 10 : 3);
      return `
        <div class="funnel-row">
          <span class="funnel-label">${s.label}</span>
          <div class="funnel-track">
            <div class="funnel-bar funnel-${s.key}" style="width:${w}%">
              <span class="funnel-count">${s.count}</span>
            </div>
          </div>
          <span class="funnel-value">${formatCurrency(s.value)}</span>
        </div>`;
    })
    .join("");

  // At-risk: money committed, work owed (booked/production/post), biggest first
  const committed = ["advance-paid", "confirmed", "shoot-scheduled", "shoot-completed", "editing", "album-design"];
  const atRisk = active
    .filter((o) => committed.includes(o.status))
    .sort((a, b) => pkg(b) - pkg(a))
    .slice(0, 6);

  const riskRows = atRisk
    .map((o) => {
      const prog = getDeliverableProgress(o);
      const low = prog < 40;
      return `
        <li class="risk-row${low ? " is-low" : ""}" data-id="${o.id}">
          <div class="risk-info">
            <span class="risk-name">${escapeHtml(o.customerName)}</span>
            <span class="risk-status">${statusBadge(o.status)}</span>
          </div>
          <div class="risk-prog" title="${prog}% deliverables complete">
            <div class="risk-prog-track"><span style="width:${prog}%"></span></div>
            <span class="risk-prog-pct">${prog}%</span>
          </div>
          <span class="risk-value">${formatCurrency(pkg(o))}</span>
        </li>`;
    })
    .join("");

  return `
    <div class="card section-card production-funnel">
      <div class="section-card-header">
        <h2>Production Pipeline</h2>
        <span class="meta">${active.length} active jobs</span>
      </div>
      <div class="funnel-chart">${funnelBars}</div>
      <div class="risk-header">Work in progress — by value, completion shown</div>
      <ul class="risk-list">${riskRows || '<li class="collect-empty">No jobs in active production.</li>'}</ul>
    </div>`;
}

/* ── Data integrity checks: status vs reality mismatches ── */
function getDataAnomalies() {
  const out = [];
  orders.forEach((o) => {
    if (o.status === "cancelled") return;
    const prog = getDeliverableProgress(o);
    const bal = getBalance(o);
    if ((o.status === "delivered" || o.status === "closed") && prog < 100) {
      out.push({
        id: o.id,
        name: o.customerName,
        msg: `Marked <strong>${getStatusMeta(o.status).label}</strong> but only ${prog}% of deliverables are ticked`,
      });
    }
    if (o.status === "closed" && bal > 0) {
      out.push({
        id: o.id,
        name: o.customerName,
        msg: `Marked <strong>Closed</strong> with ${formatCurrency(bal)} still outstanding`,
      });
    }
  });
  return out;
}

function renderAnomalies() {
  const anomalies = getDataAnomalies();
  if (!anomalies.length) return "";
  const rows = anomalies
    .map(
      (a) => `
      <li class="anomaly-row" data-id="${a.id}">
        <span class="anomaly-icon" aria-hidden="true">⚠</span>
        <span class="anomaly-text"><strong class="anomaly-name">${escapeHtml(a.name)}</strong> — ${a.msg}</span>
      </li>`
    )
    .join("");
  return `
    <div class="card section-card anomaly-card">
      <div class="section-card-header">
        <h2>Needs Attention</h2>
        <span class="meta">${anomalies.length} check${anomalies.length === 1 ? "" : "s"}</span>
      </div>
      <ul class="anomaly-list">${rows}</ul>
    </div>`;
}

/* ── Profit grouped by pipeline stage (reports) ── */
function renderProfitByStage() {
  const active = orders.filter((o) => o.status !== "cancelled");
  const stats = PIPELINE_STAGES.map((st) => {
    const list = active.filter((o) => st.statuses.includes(o.status));
    const profit = list.reduce((s, o) => s + getProfit(o), 0);
    return { label: st.label, profit };
  });
  return renderBarChart(stats, "profit");
}

function renderDashboard() {
  const scope = dashboardScope;
  const scopedOrders = getOrdersForScope(scope);
  const scopeLabel = getDashboardScopeLabel(scope);
  const monthStats = getMonthWiseStats(12);
  const typeCounts = getEventTypeCounts();

  // All KPI numbers reflect the selected scope (Month / Year / All time)
  const scopedTotals = getTotals(scopedOrders);
  const netProfit = scopedTotals.revenue - scopedTotals.expenses;
  const shootCompleted = scopedOrders.filter((o) => isShootCompleted(o)).length;
  const editingPending = scopedOrders.filter((o) => isEditingPending(o)).length;
  const albumPending = scopedOrders.filter((o) => isAlbumPending(o) && o.status !== "cancelled").length;
  const upcomingCount = getUpcoming(scopedOrders, 9999).length;

  // Sub-labels describe what the period is
  const periodSub =
    scope === "month" ? scopeLabel : scope === "year" ? `Year ${scopeLabel}` : "All time";
  const eventsLabel =
    scope === "month" ? "Events This Month" : scope === "year" ? "Events This Year" : "Events All Time";

  const kpiCards = [
    renderStatCard("📋", "Total Bookings", scopedOrders.length, periodSub, "", "total-bookings"),
    renderStatCard("📅", eventsLabel, scopedOrders.length, "By start date", "", "this-month-events"),
    renderStatCard("⏭", "Upcoming Events", upcomingCount, "From today onward", "", "upcoming-events"),
    renderStatCard("✓", "Shoot Completed", shootCompleted, "Post-shoot pipeline", "", "shoot-completed"),
    renderStatCard("✂️", "Editing Pending", editingPending, "Awaiting edit", "", "editing-pending"),
    renderStatCard("📖", "Album Pending", albumPending, "Design / delivery", "", "album-pending"),
    renderStatCard("₹", "Total Revenue", formatCurrency(scopedTotals.revenue), "Package value", "", "total-revenue"),
    renderStatCard("💸", "Total Expense", formatCurrency(scopedTotals.expenses), "Ops + crew payouts", "", "total-expense"),
    renderStatCard(
      "📈",
      "Net Profit",
      formatCurrency(netProfit),
      "Revenue − expenses",
      netProfit >= 0 ? "profit-pos" : "profit-neg",
      "net-profit"
    ),
    renderStatCard("⚠", "Pending Balance", formatCurrency(scopedTotals.balance), "Outstanding from clients", "", "pending-balance"),
  ].join("");

  return `
    <div class="page-header">
      <div>
        <h1>Business Dashboard</h1>
        <p>Premium overview of bookings, production pipeline, and finances</p>
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

    <div class="kpi-grid">${kpiCards}</div>

    ${renderCollectionsHero()}

    ${renderAnomalies()}

    ${renderProductionFunnel()}

    <div class="card section-card">
      <div class="section-card-header">
        <h2>Today's Schedule</h2>
        <span class="meta">${formatDate(new Date(), { weekday: "long", day: "numeric", month: "long" })}</span>
      </div>
      ${renderTodaySchedule()}
    </div>

    <div class="card section-card">
      <div class="section-card-header">
        <h2>Upcoming 7 Events</h2>
        <a href="#/calendar" class="link-gold">View calendar →</a>
      </div>
      ${renderUpcomingSection()}
    </div>

    <div class="card section-card">
      <div class="section-card-header">
        <h2>Editing &amp; Album Delivery Pending</h2>
      </div>
      ${renderDeliveryPendingSection()}
    </div>

    <div class="charts-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-bottom:2rem">
      <div class="card chart-card">
        <h3>Monthly Events</h3>
        ${renderBarChart(monthStats, "count")}
      </div>
      <div class="card chart-card">
        <h3>Revenue vs Expense</h3>
        ${renderDualBarChart(monthStats)}
      </div>
      <div class="card chart-card">
        <h3>Profit by Month</h3>
        ${renderBarChart(monthStats, "profit")}
      </div>
      <div class="card chart-card">
        <h3>Profit by Stage</h3>
        ${renderProfitByStage()}
      </div>
      <div class="card chart-card">
        <h3>Event Type Count</h3>
        ${renderTypeChart(typeCounts)}
      </div>
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

function bindDashboardEvents() {
  $$("[data-scope]").forEach((btn) => {
    btn.onclick = () => {
      dashboardScope = btn.dataset.scope;
      if (dashboardScope === "month") {
        const now = new Date();
        dashboardPickYear = now.getFullYear();
        dashboardPickMonth = now.getMonth();
      }
      if (typeof render === "function") render();
    };
  });

  $$(".month-tab").forEach((btn) => {
    btn.onclick = () => {
      dashboardPickMonth = Number(btn.dataset.pickMonth);
      if (typeof render === "function") render();
    };
  });

  $("#dash-year-prev")?.addEventListener("click", () => {
    dashboardPickYear--;
    if (typeof render === "function") render();
  });
  $("#dash-year-next")?.addEventListener("click", () => {
    dashboardPickYear++;
    if (typeof render === "function") render();
  });

  $$("[data-export-scope]").forEach((btn) => {
    btn.onclick = () => {
      dashboardExportScope = btn.dataset.exportScope;
      if (typeof render === "function") render();
    };
  });

  $$("[data-export]").forEach((btn) => {
    btn.onclick = () => {
      const format = btn.dataset.export;
      if (format === "pdf" && typeof exportDashboardPdf === "function") {
        exportDashboardPdf(dashboardExportScope);
      } else if (format === "excel" && typeof exportDashboardExcel === "function") {
        exportDashboardExcel(dashboardExportScope);
      }
    };
  });

  $$(".collect-row[data-id], .risk-row[data-id], .anomaly-row[data-id]").forEach((row) => {
    row.style.cursor = "pointer";
    row.onclick = () => {
      if (typeof showOrderDetail === "function") showOrderDetail(row.dataset.id);
    };
  });
}

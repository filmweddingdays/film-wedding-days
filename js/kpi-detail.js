/* KPI Detail Dialogs — click any KPI card to see detailed breakdown */

let kpiDetailScope = "month"; // month, year, all

function getKpiMetricData(metricType, scope) {
  const scopedOrders = scope === "all" ? orders : scope === "year" ? getOrdersThisYear() : getOrdersForMonth(dashboardPickYear, dashboardPickMonth);

  const metrics = {
    "total-bookings": () => ({
      title: "Total Bookings",
      data: orders,
      columns: ["Customer", "Type", "Date", "Status", "Revenue"]
    }),
    "this-month-events": () => ({
      title: "This Month Events",
      data: getOrdersThisMonth(),
      columns: ["Customer", "Type", "Date", "Status", "Revenue"]
    }),
    "upcoming-events": () => ({
      title: "Upcoming Events",
      data: getUpcoming(orders, 999),
      columns: ["Customer", "Type", "Date", "Days Away", "Status"]
    }),
    "shoot-completed": () => ({
      title: "Shoot Completed",
      data: orders.filter(o => isShootCompleted(o)),
      columns: ["Customer", "Type", "Shoot Date", "Status", "Revenue"]
    }),
    "editing-pending": () => ({
      title: "Editing Pending",
      data: getEditingPendingOrders(),
      columns: ["Customer", "Type", "Date", "Progress", "Revenue"]
    }),
    "album-pending": () => ({
      title: "Album Pending",
      data: getAlbumPendingOrders(),
      columns: ["Customer", "Type", "Date", "Status", "Revenue"]
    }),
    "total-revenue": () => ({
      title: "Total Revenue",
      data: orders,
      summary: getTotals(orders),
      columns: ["Customer", "Type", "Date", "Package", "Received"]
    }),
    "total-expense": () => ({
      title: "Total Expense",
      data: orders,
      summary: getTotals(orders),
      columns: ["Customer", "Type", "Date", "Expense", "Paid"]
    }),
    "net-profit": () => ({
      title: "Net Profit",
      data: orders,
      summary: getTotals(orders),
      columns: ["Customer", "Type", "Date", "Revenue", "Expense"]
    }),
    "pending-balance": () => ({
      title: "Pending Balance",
      data: orders.filter(o => {
        const paid = (o.payments?.advancePaid || 0) + (o.payments?.secondPayment || 0) + (o.payments?.finalPayment || 0);
        const pending = (o.payments?.totalPackage || 0) - paid;
        return pending > 0;
      }),
      columns: ["Customer", "Type", "Date", "Total", "Paid", "Pending"]
    })
  };

  return metrics[metricType] ? metrics[metricType]() : null;
}

function renderKpiDetailModal(metricType) {
  const metric = getKpiMetricData(metricType, kpiDetailScope);
  if (!metric) return "";

  const scopeLabel = kpiDetailScope === "year" ? new Date().getFullYear() :
                     kpiDetailScope === "all" ? "All time" :
                     new Date(dashboardPickYear, dashboardPickMonth, 1).toLocaleDateString("en-IN", {month: "long", year: "numeric"});

  const rows = (metric.data || []).map(order => {
    const startDate = parseDate(order.startDate);
    const paid = (order.payments?.advancePaid || 0) + (order.payments?.secondPayment || 0) + (order.payments?.finalPayment || 0);
    const pending = (order.payments?.totalPackage || 0) - paid;

    const cells = {
      "Customer": order.customerName || "—",
      "Type": order.eventType || "—",
      "Date": formatDate(startDate, {month: "short", day: "numeric", year: "2-digit"}),
      "Status": order.status ? ucfirst(order.status.replace(/-/g, " ")) : "—",
      "Revenue": formatCurrency(order.payments?.totalPackage || 0),
      "Package": formatCurrency(order.payments?.totalPackage || 0),
      "Received": formatCurrency(paid),
      "Pending": formatCurrency(pending),
      "Progress": `${getDeliverableProgress(order)}%`,
      "Days Away": Math.ceil((startDate - new Date()) / (1000 * 60 * 60 * 24)),
      "Expense": formatCurrency(getTotalExpense(order)),
      "Shoot Date": formatDate(startDate, {month: "short", day: "numeric"}),
      "Paid": formatCurrency(getTotalCrewPayout(order))
    };

    return `
      <tr class="kpi-detail-row" data-order-id="${order.id}" style="cursor:pointer;border-bottom:1px solid var(--blush);padding:0.75rem 0">
        ${metric.columns.map(col => `<td style="padding:0.5rem 0.75rem">${escapeHtml(String(cells[col] || "—"))}</td>`).join("")}
      </tr>`;
  }).join("");

  const summaryHtml = metric.summary ? `
    <div class="kpi-summary card" style="margin-bottom:1rem;padding:1rem;background:var(--blush)">
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem">
        <div><strong>Total Revenue</strong><br>${formatCurrency(metric.summary.revenue)}</div>
        <div><strong>Total Expense</strong><br>${formatCurrency(metric.summary.expenses)}</div>
        <div><strong>Net Profit</strong><br>${formatCurrency(metric.summary.revenue - metric.summary.expenses)}</div>
        <div><strong>Outstanding</strong><br>${formatCurrency(metric.summary.balance)}</div>
      </div>
    </div>
  ` : "";

  return `
    <div class="kpi-detail-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
        <h3 style="margin:0">${metric.title}</h3>
        <span style="color:var(--warm);font-size:0.9rem">${scopeLabel} • ${metric.data.length} record${metric.data.length !== 1 ? "s" : ""}</span>
      </div>

      ${summaryHtml}

      <div style="display:flex;gap:0.5rem;margin-bottom:1rem">
        <button type="button" class="kpi-scope-btn ${kpiDetailScope === "month" ? "active" : ""}" data-scope="month" style="padding:0.4rem 0.8rem;border:1px solid var(--blush);background:${kpiDetailScope === "month" ? "var(--gold)" : "transparent"};color:${kpiDetailScope === "month" ? "white" : "var(--warm)"};border-radius:6px;cursor:pointer;font-size:0.85rem">Month</button>
        <button type="button" class="kpi-scope-btn ${kpiDetailScope === "year" ? "active" : ""}" data-scope="year" style="padding:0.4rem 0.8rem;border:1px solid var(--blush);background:${kpiDetailScope === "year" ? "var(--gold)" : "transparent"};color:${kpiDetailScope === "year" ? "white" : "var(--warm)"};border-radius:6px;cursor:pointer;font-size:0.85rem">Year</button>
        <button type="button" class="kpi-scope-btn ${kpiDetailScope === "all" ? "active" : ""}" data-scope="all" style="padding:0.4rem 0.8rem;border:1px solid var(--blush);background:${kpiDetailScope === "all" ? "var(--gold)" : "transparent"};color:${kpiDetailScope === "all" ? "white" : "var(--warm)"};border-radius:6px;cursor:pointer;font-size:0.85rem">All time</button>
      </div>

      <div style="overflow-x:auto">
        <table style="width:100%;font-size:0.85rem;border-collapse:collapse">
          <thead style="background:var(--cream);border-bottom:2px solid var(--blush)">
            <tr>
              ${metric.columns.map(col => `<th style="text-align:left;padding:0.75rem;font-weight:600;color:var(--warm)">${col}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="${metric.columns.length}" style="text-align:center;padding:2rem;color:var(--warm)">No data</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function openKpiDetail(metricType) {
  const modal = document.getElementById("kpi-detail-modal");
  if (!modal) return;

  const content = document.getElementById("kpi-detail-content");
  if (content) {
    content.innerHTML = renderKpiDetailModal(metricType);
    content.dataset.metricType = metricType;
  }

  modal.hidden = false;

  // Attach scope button listeners
  setTimeout(() => {
    document.querySelectorAll(".kpi-scope-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        kpiDetailScope = e.target.dataset.scope;
        const content = document.getElementById("kpi-detail-content");
        if (content) {
          content.innerHTML = renderKpiDetailModal(metricType);
        }
      });
    });

    // Attach row click handlers
    document.querySelectorAll(".kpi-detail-row").forEach(row => {
      row.addEventListener("click", () => {
        const orderId = row.dataset.orderId;
        goToOrderDetail(orderId);
        modal.hidden = true;
      });
    });
  }, 0);
}

function closeKpiDetail() {
  const modal = document.getElementById("kpi-detail-modal");
  if (modal) modal.hidden = true;
}

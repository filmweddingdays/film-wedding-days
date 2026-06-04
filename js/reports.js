/* Reports & export */

let reportsExportScope = "month";

function getYearWiseStats() {
  if (orders.length === 0) return [];
  const years = [...new Set(orders.map((o) => parseDate(o.startDate).getFullYear()))].sort((a, b) => a - b);
  return years.map((year) => {
    const period = orders.filter((o) => parseDate(o.startDate).getFullYear() === year);
    const totals = getTotals(period);
    return {
      key: String(year),
      label: String(year),
      count: period.length,
      revenue: totals.revenue,
      expenses: totals.expenses,
      profit: totals.revenue - totals.expenses,
      paid: totals.paid,
      balance: totals.balance,
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
      revenue: totals.revenue,
      expenses: totals.expenses,
      profit: totals.revenue - totals.expenses,
      paid: totals.paid,
      balance: totals.balance,
    },
  ];
}

function getExportStats(kind) {
  if (kind === "month") return getMonthWiseStats(12);
  if (kind === "year") return getYearWiseStats();
  return getAllTimeStats();
}

function summaryExportTotals(stats) {
  return stats.reduce(
    (acc, s) => ({
      count: acc.count + s.count,
      revenue: acc.revenue + s.revenue,
      expenses: acc.expenses + s.expenses,
      paid: acc.paid + (s.paid || 0),
      balance: acc.balance + (s.balance || 0),
    }),
    { count: 0, revenue: 0, expenses: 0, paid: 0, balance: 0 }
  );
}

function exportReportTitle(kind) {
  if (kind === "month") return "Film Wedding Days — Month-wise report";
  if (kind === "year") return "Film Wedding Days — Year-wise report";
  return "Film Wedding Days — All-time report";
}

function exportFilename(kind, ext) {
  const date = new Date().toISOString().slice(0, 10);
  const slug = kind === "all" ? "all-time" : `${kind}-wise`;
  return `fwds-report-${slug}-${date}.${ext}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getJsPDFClass() {
  if (window.jspdf && typeof window.jspdf.jsPDF === "function") return window.jspdf.jsPDF;
  if (typeof window.jsPDF === "function") return window.jsPDF;
  return null;
}

function createPdfDoc() {
  const JsPDF = getJsPDFClass();
  if (!JsPDF) throw new Error("PDF library missing. Load vendor/jspdf.umd.min.js first.");
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
  throw new Error("PDF table plugin missing.");
}

function lastAutoTableY(doc, fallback = 44) {
  return doc.lastAutoTable?.finalY || fallback;
}

function orderExportRows() {
  return orders.map((o) => [
    o.customerName,
    o.eventType || "Wedding",
    formatDateRange(o),
    getEventDays(o),
    o.status,
    o.payments?.totalPackage || o.budget,
    getTotalExpenses(o),
    getProfit(o),
    getBalance(o),
  ]);
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

  doc.setFontSize(16);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated ${new Date().toLocaleString("en-IN")}`, 14, 26);
  doc.setTextColor(0);
  doc.setFontSize(11);
  doc.text(
    `Events: ${totals.count} · Revenue ${formatCurrency(totals.revenue)} · Expenses ${formatCurrency(totals.expenses)} · Profit ${formatCurrency(totals.revenue - totals.expenses)}`,
    14,
    36
  );

  try {
    pdfAutoTable(doc, {
      startY: 44,
      head: [["Period", "Events", "Revenue", "Expenses", "Profit", "Collected", "Balance"]],
      body: stats.map((s) => [
        s.label,
        s.count,
        formatCurrency(s.revenue),
        formatCurrency(s.expenses),
        formatCurrency(s.profit),
        formatCurrency(s.paid || 0),
        formatCurrency(s.balance || 0),
      ]),
      foot: [
        [
          "Total",
          totals.count,
          formatCurrency(totals.revenue),
          formatCurrency(totals.expenses),
          formatCurrency(totals.revenue - totals.expenses),
          formatCurrency(totals.paid),
          formatCurrency(totals.balance),
        ],
      ],
      theme: "striped",
      headStyles: { fillColor: [184, 149, 106] },
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
      head: [["Customer", "Type", "Dates", "Days", "Status", "Revenue", "Expenses", "Profit", "Balance"]],
      body: orderExportRows().map((row) =>
        row.map((cell, i) => (i >= 5 && typeof cell === "number" ? formatCurrency(cell) : cell))
      ),
      theme: "striped",
      headStyles: { fillColor: [184, 149, 106] },
      styles: { fontSize: 7 },
    });
  } catch (err) {
    alert(err.message);
    return;
  }

  doc.save(exportFilename(kind, "pdf"));
}

function exportDashboardExcel(kind) {
  if (!window.XLSX) {
    alert("Excel library missing. Load vendor/xlsx.full.min.js first.");
    return;
  }
  const stats = getExportStats(kind);
  const totals = summaryExportTotals(stats);
  const wb = XLSX.utils.book_new();

  const summarySheet = XLSX.utils.aoa_to_sheet([
    [exportReportTitle(kind)],
    [`Generated ${new Date().toLocaleString("en-IN")}`],
    [],
    ["Period", "Events", "Revenue", "Expenses", "Profit", "Collected", "Balance"],
    ...stats.map((s) => [s.label, s.count, s.revenue, s.expenses, s.profit, s.paid || 0, s.balance || 0]),
    ["Total", totals.count, totals.revenue, totals.expenses, totals.revenue - totals.expenses, totals.paid, totals.balance],
  ]);
  XLSX.utils.book_append_sheet(wb, summarySheet, kind === "month" ? "Month summary" : kind === "year" ? "Year summary" : "All time");

  const detailSheet = XLSX.utils.aoa_to_sheet([
    ["Customer", "Type", "Dates", "Days", "Status", "Revenue", "Expenses", "Profit", "Balance"],
    ...orderExportRows(),
  ]);
  XLSX.utils.book_append_sheet(wb, detailSheet, "Orders");

  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    exportFilename(kind, "xlsx")
  );
}

function renderStatsTable(stats, title) {
  const totals = summaryExportTotals(stats);
  const rows = stats
    .map(
      (s) => `
    <tr>
      <td><strong>${escapeHtml(s.label)}</strong></td>
      <td>${s.count}</td>
      <td>${formatCurrency(s.revenue)}</td>
      <td>${formatCurrency(s.expenses)}</td>
      <td class="${s.profit >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(s.profit)}</td>
      <td>${formatCurrency(s.paid || 0)}</td>
      <td>${formatCurrency(s.balance || 0)}</td>
    </tr>`
    )
    .join("");

  return `
    <div class="card section-card">
      <div class="section-card-header"><h2>${escapeHtml(title)}</h2></div>
      <div class="table-wrap" style="border:none;box-shadow:none">
        <table>
          <thead><tr>
            <th>Period</th><th>Events</th><th>Revenue</th><th>Expenses</th><th>Profit</th><th>Collected</th><th>Balance</th>
          </tr></thead>
          <tbody>${rows}
            <tr class="total-row" style="font-weight:600;background:rgba(250,246,240,0.8)">
              <td>Total</td><td>${totals.count}</td>
              <td>${formatCurrency(totals.revenue)}</td>
              <td>${formatCurrency(totals.expenses)}</td>
              <td class="${totals.revenue - totals.expenses >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(totals.revenue - totals.expenses)}</td>
              <td>${formatCurrency(totals.paid)}</td>
              <td>${formatCurrency(totals.balance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
}

function renderReports() {
  const monthStats = getMonthWiseStats(12);
  const yearStats = getYearWiseStats();
  const allStats = getAllTimeStats();
  const typeCounts = getEventTypeCounts();

  const typeBars = typeCounts.length
    ? typeCounts
        .map((t) => {
          const max = Math.max(...typeCounts.map((x) => x.count), 1);
          return `
        <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.5rem">
          <span style="min-width:7rem;font-size:0.8rem">${escapeHtml(t.label)}</span>
          <div style="flex:1;background:var(--blush);border-radius:4px;height:1.25rem;overflow:hidden">
            <div style="width:${(t.count / max) * 100}%;height:100%;background:${t.color};border-radius:4px"></div>
          </div>
          <span style="font-weight:600;font-size:0.85rem;min-width:1.5rem">${t.count}</span>
        </div>`;
        })
        .join("")
    : "<p class='meta'>No events yet</p>";

  return `
    <div class="page-header">
      <div>
        <h1>Reports</h1>
        <p>Monthly stats, revenue analysis &amp; exports</p>
      </div>
    </div>

    ${renderStatsTable(monthStats, "Last 12 months")}
    ${yearStats.length > 1 ? renderStatsTable(yearStats, "Year-wise summary") : ""}

    <div class="card section-card">
      <div class="section-card-header"><h2>Event types</h2></div>
      <div style="padding:1rem 1.25rem">${typeBars}</div>
    </div>

    <div class="card section-card dashboard-export">
      <div class="section-card-header">
        <div>
          <h2>Export reports</h2>
          <p class="meta">Download PDF or Excel for accounting</p>
        </div>
      </div>
      <div class="dashboard-export-body">
        <div class="export-scope-scroll" role="tablist">
          <div class="export-scope-tabs">
            <button type="button" role="tab" class="export-scope-tab ${reportsExportScope === "month" ? "active" : ""}" data-report-scope="month">Month wise</button>
            <button type="button" role="tab" class="export-scope-tab ${reportsExportScope === "year" ? "active" : ""}" data-report-scope="year">Year wise</button>
            <button type="button" role="tab" class="export-scope-tab ${reportsExportScope === "all" ? "active" : ""}" data-report-scope="all">All time</button>
          </div>
        </div>
        <div class="dashboard-export-actions">
          <button type="button" class="btn-secondary" data-report-export="pdf">Export PDF</button>
          <button type="button" class="btn-secondary" data-report-export="excel">Export Excel</button>
        </div>
      </div>
    </div>`;
}

function bindReportsEvents() {
  $$("[data-report-scope]").forEach((btn) => {
    btn.onclick = () => {
      reportsExportScope = btn.dataset.reportScope;
      render();
    };
  });

  $$("[data-report-export]").forEach((btn) => {
    btn.onclick = () => {
      const format = btn.dataset.reportExport;
      if (format === "pdf") exportDashboardPdf(reportsExportScope);
      else exportDashboardExcel(reportsExportScope);
    };
  });
}

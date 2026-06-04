/* Orders list — filters, mobile cards, desktop table */

function getPaymentStatus(order) {
  const balance = getBalance(order);
  const paid = getTotalPaid(order);
  if (balance <= 0) return "paid";
  if (paid > 0) return "partial";
  return "pending";
}

function paymentStatusBadge(order) {
  const status = getPaymentStatus(order);
  const labels = { paid: "Paid", partial: "Partial", pending: "Pending" };
  const colors = { paid: "#059669", partial: "#d97706", pending: "#b91c1c" };
  return `<span class="badge" style="--badge:${colors[status]}">${labels[status]}</span>`;
}

function filterOrdersList(list) {
  const f = orderFilters || {};
  let result = [...list];

  if (f.search?.trim()) {
    const q = f.search.trim().toLowerCase();
    result = result.filter(
      (o) =>
        o.customerName.toLowerCase().includes(q) ||
        (o.phone || "").includes(q) ||
        (o.city || "").toLowerCase().includes(q) ||
        (o.brideName || "").toLowerCase().includes(q) ||
        (o.groomName || "").toLowerCase().includes(q)
    );
  }

  if (f.month) {
    const [y, m] = f.month.split("-").map(Number);
    result = result.filter((o) => {
      const d = parseDate(o.startDate);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }

  if (f.status) {
    result = result.filter((o) => o.status === f.status);
  }

  if (f.paymentStatus && f.paymentStatus !== "all") {
    result = result.filter((o) => getPaymentStatus(o) === f.paymentStatus);
  }

  if (f.eventType) {
    result = result.filter((o) => o.eventType === f.eventType);
  }

  const sortBy = f.sortBy || "date";
  result.sort((a, b) => {
    if (sortBy === "customer") return a.customerName.localeCompare(b.customerName);
    if (sortBy === "budget") {
      return (b.payments?.totalPackage || b.budget) - (a.payments?.totalPackage || a.budget);
    }
    if (sortBy === "status") return a.status.localeCompare(b.status);
    return a.startDate.localeCompare(b.startDate);
  });

  return result;
}

function renderOrderTableRow(o) {
  const profit = getProfit(o);
  const revenue = o.payments?.totalPackage || o.budget;
  return `
    <tr>
      <td>
        <a href="#/customer?id=${escapeAttr(o.id)}" class="link-gold"><strong>${escapeHtml(o.customerName)}</strong></a>
        <div class="meta" style="font-size:0.75rem;margin-top:0.15rem">${escapeHtml(o.city || "")}</div>
      </td>
      <td>${eventTypeBadge(o.eventType)}</td>
      <td>${formatDateRange(o)}</td>
      <td>${statusBadge(o.status)}</td>
      <td>${paymentStatusBadge(o)}</td>
      <td>${formatCurrency(revenue)}</td>
      <td class="${profit >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(profit)}</td>
      <td>
        <div class="table-actions">
          <button type="button" class="btn-view" data-view-id="${o.id}">View</button>
          <button type="button" class="btn-edit" data-edit-id="${o.id}">Edit</button>
          <button type="button" class="btn-delete" data-delete-id="${o.id}">Delete</button>
        </div>
      </td>
    </tr>`;
}

function renderOrderCard(o) {
  const profit = getProfit(o);
  const revenue = o.payments?.totalPackage || o.budget;
  return `
    <article class="card order-card" data-order-id="${o.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:0.5rem;margin-bottom:0.75rem">
        <div>
          <a href="#/customer?id=${escapeAttr(o.id)}" class="link-gold" style="font-weight:600;font-size:1rem">${escapeHtml(o.customerName)}</a>
          <div class="meta" style="font-size:0.8rem;margin-top:0.2rem">${escapeHtml(o.city || "")} · ${getEventDays(o)} day${getEventDays(o) !== 1 ? "s" : ""}</div>
        </div>
        ${eventTypeBadge(o.eventType)}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:0.75rem">
        ${statusBadge(o.status)}
        ${paymentStatusBadge(o)}
      </div>
      <dl style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;font-size:0.85rem;margin:0 0 0.75rem">
        <div><dt class="meta" style="font-size:0.65rem">Dates</dt><dd style="margin:0.15rem 0 0;font-weight:500">${formatDateRange(o)}</dd></div>
        <div><dt class="meta" style="font-size:0.65rem">Revenue</dt><dd style="margin:0.15rem 0 0;font-weight:500">${formatCurrency(revenue)}</dd></div>
        <div><dt class="meta" style="font-size:0.65rem">Profit</dt><dd style="margin:0.15rem 0 0;font-weight:500" class="${profit >= 0 ? "profit-pos" : "profit-neg"}">${formatCurrency(profit)}</dd></div>
        <div><dt class="meta" style="font-size:0.65rem">Balance</dt><dd style="margin:0.15rem 0 0;font-weight:500">${formatCurrency(getBalance(o))}</dd></div>
      </dl>
      <p class="meta" style="font-size:0.75rem;margin:0 0 0.75rem">${escapeHtml(crewSummary(o))}</p>
      <div class="table-actions">
        <button type="button" class="btn-view" data-view-id="${o.id}">View</button>
        <button type="button" class="btn-edit" data-edit-id="${o.id}">Edit</button>
        <button type="button" class="btn-delete" data-delete-id="${o.id}">Delete</button>
      </div>
    </article>`;
}

function renderOrdersFilterBar() {
  const f = orderFilters || {};
  const statusOpts = ORDER_STATUSES.map(
    (s) => `<option value="${s.id}" ${f.status === s.id ? "selected" : ""}>${escapeHtml(s.label)}</option>`
  ).join("");
  const typeOpts = EVENT_TYPES.map(
    (t) => `<option value="${t.id}" ${f.eventType === t.id ? "selected" : ""}>${escapeHtml(t.label)}</option>`
  ).join("");

  return `
    <div class="toolbar orders-toolbar">
      <input type="search" id="order-search" placeholder="Search customer, phone, city…" value="${escapeAttr(f.search || "")}" />
      <input type="month" id="order-filter-month" value="${escapeAttr(f.month || "")}" title="Filter by month" />
      <select id="order-filter-status">
        <option value="">All statuses</option>
        ${statusOpts}
      </select>
      <select id="order-filter-payment">
        <option value="">All payments</option>
        <option value="pending" ${f.paymentStatus === "pending" ? "selected" : ""}>Pending</option>
        <option value="partial" ${f.paymentStatus === "partial" ? "selected" : ""}>Partial</option>
        <option value="paid" ${f.paymentStatus === "paid" ? "selected" : ""}>Paid</option>
      </select>
      <select id="order-filter-type">
        <option value="">All event types</option>
        ${typeOpts}
      </select>
      <select id="order-sort">
        <option value="date" ${f.sortBy === "date" ? "selected" : ""}>Sort by date</option>
        <option value="customer" ${f.sortBy === "customer" ? "selected" : ""}>Sort by customer</option>
        <option value="budget" ${f.sortBy === "budget" ? "selected" : ""}>Sort by revenue</option>
        <option value="status" ${f.sortBy === "status" ? "selected" : ""}>Sort by status</option>
      </select>
      <button type="button" class="btn-secondary btn-sm" id="order-clear-filters">Clear</button>
    </div>`;
}

function renderOrders() {
  const list = filterOrdersList(orders);
  const f = orderFilters || {};

  const tableRows = list.map(renderOrderTableRow).join("");
  const cards = list.map(renderOrderCard).join("");

  const emptyState = `<div class="empty-state card" style="border-style:dashed">No orders match your filters.<br><button type="button" class="text-link" id="btn-add-first">Add your first wedding order</button></div>`;

  const desktopTable =
    list.length === 0
      ? emptyState
      : `<div class="table-wrap orders-desktop"><table style="min-width:960px">
        <thead><tr>
          <th>Customer</th><th>Type</th><th>Dates</th><th>Status</th><th>Payment</th>
          <th>Revenue</th><th>Profit</th><th>Actions</th>
        </tr></thead>
        <tbody>${tableRows}</tbody>
      </table></div>`;

  const mobileCards =
    list.length === 0
      ? emptyState
      : `<div class="orders-mobile" style="display:grid;gap:1rem">${cards}</div>`;

  return `
    <style>
      .badge-outline { background:transparent;border:1px solid var(--badge); }
      .orders-mobile { display: grid; }
      .orders-desktop { display: none; }
      @media (min-width: 768px) {
        .orders-mobile { display: none !important; }
        .orders-desktop { display: block !important; }
      }
    </style>
    <div class="page-header">
      <div>
        <h1>Orders</h1>
        <p>Bookings, workflow status, payments &amp; crew</p>
      </div>
      <button type="button" class="btn-primary" id="btn-new-order">+ New order</button>
    </div>
    ${renderOrdersFilterBar()}
    <p class="meta" style="margin-bottom:1rem">${list.length} of ${orders.length} order${orders.length !== 1 ? "s" : ""}${f.month ? ` · ${f.month}` : ""}</p>
    ${mobileCards}
    ${desktopTable}`;
}

function bindOrdersEvents() {
  const syncFilter = (key, value) => {
    if (!orderFilters) return;
    orderFilters[key] = value;
    render();
  };

  $("#btn-new-order")?.addEventListener("click", () => openOrderForm());
  $("#btn-add-first")?.addEventListener("click", () => openOrderForm());

  $("#order-search")?.addEventListener("input", (e) => syncFilter("search", e.target.value));
  $("#order-filter-month")?.addEventListener("change", (e) => syncFilter("month", e.target.value));
  $("#order-filter-status")?.addEventListener("change", (e) => syncFilter("status", e.target.value));
  $("#order-filter-payment")?.addEventListener("change", (e) => syncFilter("paymentStatus", e.target.value));
  $("#order-filter-type")?.addEventListener("change", (e) => syncFilter("eventType", e.target.value));
  $("#order-sort")?.addEventListener("change", (e) => syncFilter("sortBy", e.target.value));

  $("#order-clear-filters")?.addEventListener("click", () => {
    if (!orderFilters) return;
    orderFilters.search = "";
    orderFilters.month = "";
    orderFilters.status = "";
    orderFilters.paymentStatus = "";
    orderFilters.eventType = "";
    orderFilters.sortBy = "date";
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
        saveAppData({
          history: { action: "delete", label: `Deleted booking: ${o.customerName}` },
        });
        render();
      }
    };
  });
}
